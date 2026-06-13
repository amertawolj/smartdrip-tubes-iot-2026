#include "HX711.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
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
const char* MQTT_PASS  = "Lambelu!1101";
const char* MQTT_TOPIC = "smartdrip/berat";

// ===================== PIN =====================
const int LOADCELL_DOUT_PIN = 19;
const int LOADCELL_SCK_PIN  = 18;

// ===================== OBJEK =====================
HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// ===================== KALIBRASI =====================
float calibration_factor = 400.0;
const float MIN_BERAT_VALID = 5.0;

// ===================== VARIABEL =====================
float beratAwal      = 0.0;
float beratSekarang  = 0.0;
float beratMenitLalu = 0.0;
float lajuPermenit   = 0.0;
String deviceId      = "";

unsigned long timerDetik   = 0;
unsigned long timerMenit   = 0;
unsigned long timerLCD     = 0;
unsigned long timerPublish = 0;

// ===================== WIFI =====================
void connectWifi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  Serial.print("Connecting WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  deviceId = WiFi.macAddress();
  Serial.println("\nWiFi OK | MAC: " + deviceId);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi OK!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP().toString());
  delay(1500);
}

// ===================== MQTT =====================
void connectMQTT() {
  espClient.setInsecure();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting MQTT");

  while (!mqttClient.connected()) {
    Serial.print("MQTT connecting...");
    String cid = "smartdrip-berat-" + deviceId;
    if (mqttClient.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("OK!");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("MQTT OK!");
      delay(1000);
      StaticJsonDocument<128> reg;
      reg["device_id"] = deviceId;
      reg["tipe"]      = "berat";
      reg["status"]    = "online";
      char buf[128];
      serializeJson(reg, buf);
      mqttClient.publish("smartdrip/register", buf);
    } else {
      Serial.println("gagal rc=" + String(mqttClient.state()));
      lcd.setCursor(0, 1);
      lcd.print("Retry...");
      delay(3000);
    }
  }
}

// ===================== PUBLISH =====================
void publishData() {
  if (!mqttClient.connected()) connectMQTT();

  int persen = 0;
  if (beratAwal > 0) {
    persen = (int)((beratSekarang / beratAwal) * 100);
    persen = constrain(persen, 0, 100);
  }

  int estimasiMenit = 0;
  if (lajuPermenit > 0.5) {
    estimasiMenit = (int)(beratSekarang / lajuPermenit);
  }

  StaticJsonDocument<256> doc;
  doc["device_id"]      = deviceId;
  doc["berat"]          = (int)beratSekarang;
  doc["persen"]         = persen;
  doc["estimasi_menit"] = estimasiMenit;
  doc["laju"]           = lajuPermenit;

  char buf[256];
  serializeJson(doc, buf);
  mqttClient.publish(MQTT_TOPIC, buf);
  Serial.println("Published: " + String(buf));
}

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("SmartDrip v2");
  lcd.setCursor(0, 1);
  lcd.print("Init sensor...");
  delay(1500);

  // Init HX711
  Serial.print("Waiting HX711");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  int retry = 0;
  while (!scale.is_ready() && retry < 20) {
    delay(200); Serial.print("."); retry++;
  }

  if (!scale.is_ready()) {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("ERROR: HX711");
    lcd.setCursor(0, 1); lcd.print("Cek wiring!");
    Serial.println("\nERROR: HX711!");
    while (true) delay(1000);
  }

  Serial.println(" OK!");
  scale.set_scale(calibration_factor);
  scale.tare();

  // Tunggu IV bag ditaruh
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Taruh IV bag...");
  lcd.setCursor(0, 1);
  lcd.print("Menunggu beban");
  Serial.println("Taruh IV bag...");

  while (true) {
    float cek = scale.get_units(5);
    Serial.print("Baca: "); Serial.print(cek, 1); Serial.println("g");
    if (cek >= MIN_BERAT_VALID) {
      delay(500);
      beratAwal = scale.get_units(10);
      if (beratAwal < MIN_BERAT_VALID) continue;
      beratMenitLalu = beratAwal;
      lcd.clear();
      lcd.setCursor(0, 0); lcd.print("Berat awal:");
      lcd.setCursor(0, 1);
      lcd.print(beratAwal, 0); lcd.print("g = 100%");
      Serial.print("Berat awal: "); Serial.print(beratAwal, 1); Serial.println("g");
      delay(2000);
      break;
    }
    delay(500);
  }

  connectWifi();
  connectMQTT();

  timerDetik   = millis();
  timerMenit   = millis();
  timerLCD     = millis();
  timerPublish = millis();

  Serial.println("=== Monitoring dimulai ===");
}

// ===================== LOOP =====================
void loop() {
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  // Baca berat tiap 1 detik
  if (millis() - timerDetik >= 1000) {
    timerDetik = millis();
    float baca = scale.get_units(5);
    beratSekarang = (baca < 0) ? 0 : baca;
  }

  // Hitung laju tiap 1 menit
  if (millis() - timerMenit >= 60000) {
    timerMenit = millis();
    float laju = beratMenitLalu - beratSekarang;
    lajuPermenit = (laju < 0) ? 0 : laju;
    beratMenitLalu = beratSekarang;
    Serial.print("[Laju] "); Serial.print(lajuPermenit, 1); Serial.println(" g/mnt");
  }

  // Update LCD tiap 500ms
  if (millis() - timerLCD >= 500) {
    timerLCD = millis();

    int persen = 0;
    if (beratAwal > 0) {
      persen = (int)((beratSekarang / beratAwal) * 100);
      persen = constrain(persen, 0, 100);
    }

    lcd.setCursor(0, 0);
    lcd.print("Vol:");
    lcd.print((int)beratSekarang);
    lcd.print("g ");
    if (persen < 10)       lcd.print("  ");
    else if (persen < 100) lcd.print(" ");
    lcd.print(persen);
    lcd.print("%  ");

    lcd.setCursor(0, 1);
    lcd.print("Laju:");
    lcd.print(lajuPermenit, 1);
    lcd.print(" g/mnt  ");

    Serial.print("Vol: "); Serial.print(beratSekarang, 1);
    Serial.print("g | "); Serial.print(persen);
    Serial.print("% | Laju: "); Serial.print(lajuPermenit, 1);
    Serial.println(" g/mnt");
  }

  // Publish tiap 5 detik
  if (millis() - timerPublish >= 5000) {
    timerPublish = millis();
    publishData();
  }
}
