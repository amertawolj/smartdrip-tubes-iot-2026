// ============================================================
// SmartDrip — Modul B: MPU6050 + Display + Buzzer + WiFi + MQTT
// I2C Bus: SDA = GPIO 21, SCL = GPIO 22
// MPU6050 address: 0x68
// Display address: 0x3C
// Buzzer: GPIO 4
// ============================================================

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===================== KONFIGURASI =====================
const char* WIFI_SSID  = "POCO F5";
const char* WIFI_PASS  = "haihaihai";

const char* MQTT_HOST  = "f7a9cc4d020f4a209a93ea35c1653715.s1.eu.hivemq.cloud";
const int   MQTT_PORT  = 8883;
const char* MQTT_USER  = "amertut";
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++const char* MQTT_PASS  = "Lambelu!1101";
const char* MQTT_TOPIC = "smartdrip/posisi";

// ── Pin definitions ─────────────────────────────────────────
#define BUZZER_PIN 4

// ── Display setup ───────────────────────────────────────────
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

// ── MPU6050 ─────────────────────────────────────────────────
Adafruit_MPU6050 mpu;

// ── MQTT & WiFi ─────────────────────────────────────────────
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
String deviceId = "";

// ── State variables ─────────────────────────────────────────
float ax, ay, az;
float gx, gy, gz;
float magnitude;
float sudut;

const float SHAKE_THRESHOLD = 12.5;
const float FALL_AZ_MIN     = 3.0;
const float FALL_AXY_MIN    = 6.0;

bool isShaking  = false;
bool isFalling  = false;
bool anyAlert   = false;
String alertMsg = "";

unsigned long timerPublish = 0;

// ===================== FUNGSI WIFI =====================
void connectWifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
  deviceId = WiFi.macAddress();
  Serial.println("Device ID (MAC): " + deviceId);
}

// ===================== FUNGSI MQTT =====================
void connectMQTT() {
  espClient.setInsecure();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);

  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "smartdrip-posisi-" + deviceId;
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected!");
      JsonDocument regDoc;
      regDoc["device_id"] = deviceId;
      regDoc["tipe"]      = "posisi";
      regDoc["status"]    = "online";
      char regBuf[128];
      serializeJson(regDoc, regBuf);
      mqttClient.publish("smartdrip/register", regBuf);
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      delay(3000);
    }
  }
}

// ===================== FUNGSI PUBLISH =====================
void publishData() {
  if (!mqttClient.connected()) connectMQTT();

  String status = "";
  if (isFalling)      status = "jatuh";
  else if (isShaking) status = "terganggu";
  else                status = "stabil";

  JsonDocument doc;
  doc["device_id"] = deviceId;
  doc["sudut"]     = round(sudut * 10) / 10.0;
  doc["magnitude"] = round(magnitude * 100) / 100.0;
  doc["ax"]        = round(ax * 100) / 100.0;
  doc["ay"]        = round(ay * 100) / 100.0;
  doc["az"]        = round(az * 100) / 100.0;
  doc["status"]    = status;

  char buf[256];
  serializeJson(doc, buf);
  mqttClient.publish(MQTT_TOPIC, buf);

  Serial.println("[MQTT] Published: " + String(buf));
}

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH); // HIGH = mati (active low)

  u8g2.begin();
  u8g2.setFont(u8g2_font_6x10_tf);

  u8g2.clearBuffer();
  u8g2.drawStr(0, 12, "SmartDrip Modul B");
  u8g2.drawStr(0, 28, "Connecting WiFi...");
  u8g2.sendBuffer();

  connectWifi();

  u8g2.clearBuffer();
  u8g2.drawStr(0, 12, "WiFi OK!");
  u8g2.drawStr(0, 28, "Init MPU6050...");
  u8g2.sendBuffer();

  if (!mpu.begin()) {
    Serial.println("[ERROR] MPU6050 tidak ditemukan!");
    u8g2.clearBuffer();
    u8g2.drawStr(0, 12, "ERROR: MPU6050");
    u8g2.drawStr(0, 28, "not found!");
    u8g2.sendBuffer();
    while (1) delay(10);
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  Serial.println("[OK] MPU6050 ready");

  connectMQTT();

  // Buzzer test
  digitalWrite(BUZZER_PIN, LOW);
  delay(200);
  digitalWrite(BUZZER_PIN, HIGH);
  Serial.println("[OK] Buzzer OK");

  Serial.printf("[INFO] Shake threshold : %.1f m/s^2\n", SHAKE_THRESHOLD);
  Serial.printf("[INFO] Fall az min     : %.1f m/s^2\n", FALL_AZ_MIN);
  Serial.printf("[INFO] Fall axy min    : %.1f m/s^2\n", FALL_AXY_MIN);

  u8g2.clearBuffer();
  u8g2.drawStr(0, 12, "SmartDrip Ready!");
  u8g2.drawStr(0, 28, "Monitoring...");
  u8g2.sendBuffer();
  delay(800);

  timerPublish = millis();
}

// ===================== LOOP =====================
void loop() {
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  ax = a.acceleration.x;
  ay = a.acceleration.y;
  az = a.acceleration.z;
  gx = g.gyro.x;
  gy = g.gyro.y;
  gz = g.gyro.z;

  magnitude = sqrt(ax*ax + ay*ay + az*az);
  sudut     = atan2(sqrt(ax*ax + ay*ay), az) * 180.0 / PI;

  // ── Deteksi getaran ───────────────────────────────────────
  isShaking = magnitude > SHAKE_THRESHOLD;

  // ── Deteksi jatuh ─────────────────────────────────────────
  bool azLow   = abs(az) < FALL_AZ_MIN;
  bool axyHigh = (abs(ax) > FALL_AXY_MIN || abs(ay) > FALL_AXY_MIN);
  isFalling    = azLow && axyHigh;

  anyAlert = isShaking || isFalling;

  if (isFalling)      alertMsg = "TIANG JATUH!";
  else if (isShaking) alertMsg = "IS SHAKING!";
  else                alertMsg = "";

  // ── Buzzer ────────────────────────────────────────────────
  digitalWrite(BUZZER_PIN, anyAlert ? LOW : HIGH);

  // ── Serial log ────────────────────────────────────────────
  Serial.printf("[ACCEL] X:%.2f Y:%.2f Z:%.2f | Mag:%.2f | Sudut:%.1f°\n",
                ax, ay, az, magnitude, sudut);
  if (isShaking) Serial.println("[ALERT] GETARAN TERDETEKSI!");
  if (isFalling) Serial.println("[ALERT] TIANG JATUH TERDETEKSI!");
  Serial.println();

  // ── Display ───────────────────────────────────────────────
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tf);

  if (isFalling)      u8g2.drawStr(0, 10, "!! TIANG JATUH !!");
  else if (isShaking) u8g2.drawStr(0, 10, "!! GETARAN !!");
  else                u8g2.drawStr(0, 10, "Modul B - Posisi");
  u8g2.drawHLine(0, 13, 128);

  char buf[32];
  snprintf(buf, sizeof(buf), "aX: %.2f m/s2", ax);
  u8g2.drawStr(0, 26, buf);

  snprintf(buf, sizeof(buf), "aY: %.2f m/s2", ay);
  u8g2.drawStr(0, 38, buf);

  snprintf(buf, sizeof(buf), "Sudut: %.1f deg", sudut);
  u8g2.drawStr(0, 50, buf);

  if (anyAlert) {
    snprintf(buf, sizeof(buf), "Mag:%.1f (%s)", magnitude, alertMsg.c_str());
  } else {
    snprintf(buf, sizeof(buf), "Stabil | Mag:%.1f", magnitude);
  }
  u8g2.drawStr(0, 62, buf);

  u8g2.sendBuffer();

  // ── Publish setiap 5 detik ────────────────────────────────
  if (millis() - timerPublish >= 5000) {
    timerPublish = millis();
    publishData();
  }

  delay(500);
}