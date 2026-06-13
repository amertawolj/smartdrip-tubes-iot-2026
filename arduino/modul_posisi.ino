// ============================================================
// SmartDrip — MPU6050 + GME12864 Display + Buzzer
// I2C Bus: SDA = GPIO 21, SCL = GPIO 22
// MPU6050 address: 0x68
// Display address: 0x3C
// Buzzer: GPIO 4
// ============================================================

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <U8g2lib.h>

// ── Pin definitions ───────────────────────────────────────────
#define BUZZER_PIN 4

// ── Display setup ─────────────────────────────────────────────
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

// ── MPU6050 setup ─────────────────────────────────────────────
Adafruit_MPU6050 mpu;

// ── State variables ───────────────────────────────────────────
float ax, ay, az;
float gx, gy, gz;
float temperature;
float magnitude;
const float SHAKE_THRESHOLD = 15.0;
bool isShaking = false;

// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  u8g2.begin();
  u8g2.setFont(u8g2_font_6x10_tf);

  u8g2.clearBuffer();
  u8g2.drawStr(0, 12, "SmartDrip");
  u8g2.drawStr(0, 28, "Modul B Init...");
  u8g2.sendBuffer();
  delay(1000);

  Serial.println("============================================");
  Serial.println("  SmartDrip — MPU6050 + Display + Buzzer");
  Serial.println("============================================");

  if (!mpu.begin()) {
    Serial.println("[ERROR] MPU6050 tidak ditemukan!");
    u8g2.clearBuffer();
    u8g2.drawStr(0, 12, "ERROR:");
    u8g2.drawStr(0, 28, "MPU6050 not found");
    u8g2.drawStr(0, 44, "Cek wiring!");
    u8g2.sendBuffer();
    while (1) delay(10);
  }

  Serial.println("[OK] MPU6050 ditemukan!");
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("[OK] Konfigurasi selesai");
  Serial.printf("[INFO] Shake threshold : %.1f m/s^2\n", SHAKE_THRESHOLD);
  Serial.printf("[INFO] Buzzer pin      : GPIO %d\n", BUZZER_PIN);
  Serial.println("--------------------------------------------");

  // Buzzer test singkat saat startsp
  Serial.println("[INFO] Buzzer test...");
  digitalWrite(BUZZER_PIN, LOW);
  delay(200);
  digitalWrite(BUZZER_PIN, HIGH);
  Serial.println("[OK] Buzzer OK!");

  u8g2.clearBuffer();
  u8g2.drawStr(0, 12, "MPU6050 OK!");
  u8g2.drawStr(0, 28, "Buzzer OK!");
  u8g2.drawStr(0, 44, "Starting...");
  u8g2.sendBuffer();
  delay(800);
}

// ─────────────────────────────────────────────────────────────
void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  ax = a.acceleration.x;
  ay = a.acceleration.y;
  az = a.acceleration.z;
  gx = g.gyro.x;
  gy = g.gyro.y;
  gz = g.gyro.z;
  temperature = temp.temperature;

  magnitude = sqrt(ax*ax + ay*ay + az*az);
  isShaking = magnitude > SHAKE_THRESHOLD;

  // ── Buzzer logic ─────────────────────────────────────────
  if (isShaking) {
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("[BUZZ ] ON — shaking terdeteksi!");
  } else {
    digitalWrite(BUZZER_PIN, HIGH);
  }

  // ── Serial log ───────────────────────────────────────────
  Serial.printf("[ACCEL] X: %6.2f  Y: %6.2f  Z: %6.2f m/s^2\n", ax, ay, az);
  Serial.printf("[GYRO ] X: %6.2f  Y: %6.2f  Z: %6.2f rad/s\n", gx, gy, gz);
  Serial.printf("[TEMP ] %.1f degC\n", temperature);
  Serial.printf("[MAG  ] %.2f m/s^2 %s\n", magnitude, isShaking ? "⚠ IS SHAKING!" : "");
  Serial.println();

  // ── Update display ───────────────────────────────────────
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tf);

  // Header — berubah kalau shaking
  if (isShaking) {
    u8g2.drawStr(0, 10, "!! GETARAN TERDETEKSI");
  } else {
    u8g2.drawStr(0, 10, "Modul B - Movement");
  }
  u8g2.drawHLine(0, 13, 128);

  // Accelerometer values
  char buf[32];
  snprintf(buf, sizeof(buf), "aX: %.2f m/s2", ax);
  u8g2.drawStr(0, 26, buf);

  snprintf(buf, sizeof(buf), "aY: %.2f m/s2", ay);
  u8g2.drawStr(0, 38, buf);

  snprintf(buf, sizeof(buf), "aZ: %.2f m/s2", az);
  u8g2.drawStr(0, 50, buf);

  // Baris terakhir: magnitude + status
  if (isShaking) {
    snprintf(buf, sizeof(buf), "Mag:%.1f (IS SHAKING!)", magnitude);
  } else {
    snprintf(buf, sizeof(buf), "Mag: %.2f m/s2", magnitude);
  }
  u8g2.drawStr(0, 62, buf);

  u8g2.sendBuffer();
  delay(500);
}