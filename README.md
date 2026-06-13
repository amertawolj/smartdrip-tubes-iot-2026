# SmartDrip: IoT-Based Smart IV Drip Monitoring System

![Platform](https://img.shields.io/badge/platform-ESP32%20%7C%20React%20Native-orange)
![MQTT](https://img.shields.io/badge/MQTT-HiveMQ-brightgreen)

SmartDrip adalah sistem monitoring cairan infus berbasis *Internet of Things* (IoT) yang dirancang untuk membantu tenaga medis memantau kondisi kantong infus dan stabilitas tiangnya secara *real-time*. Proyek ini dikembangkan sebagai solusi inovatif berbiaya rendah untuk meningkatkan efisiensi kerja perawat, meminimalisir risiko komplikasi medis akibat kelalaian pemantauan manual, serta menyediakan log data untuk audit layanan kesehatan.

---

## 🚀 Fitur Utama

- **Real-Time Volume Tracking:** Mengukur penurunan berat kantong infus secara akurat menggunakan *load cell*.
- **Dynamic Time Estimation:** Menghitung estimasi sisa volume (mL) dan sisa waktu habis secara dinamis berdasarkan laju aliran cairan.
- **Intelligent Fall & Vibration Detection:** Mendeteksi guncangan abnormal atau kondisi tiang infus roboh menggunakan akselerometer.
- **Multi-Channel Instant Alert:** Mengirimkan *push notification* darurat ke aplikasi mobile perawat dan memicu alarm fisik (*buzzer*).
- **Glanceable Mobile Dashboard:** Antarmuka berbasis React Native dengan indikator status berbasis warna (*color-coded*) untuk pemantauan banyak pasien sekaligus[cite: 1].
- **Historical Data Logging:** Menyimpan riwayat aktivitas pemantauan ke database untuk keperluan evaluasi layanan.

---

## 🛠️ Arsitektur Sistem

Sistem SmartDrip bekerja dalam ekosistem terdistribusi yang dibagi menjadi dua modul perangkat keras dan satu aplikasi pengguna:

1. **Modul A (Unit Pasien - Sisi Infus):** Memproses data berat kantong menggunakan *load cell* + HX711.
2. **Modul B (Unit Pasien - Sisi Tiang):** Memproses data orientasi dan mendeteksi kondisi tiang jatuh menggunakan MPU6050 serta menyediakan notifikasi *buzzer* lokal.
3. **Network & Cloud:** Komunikasi data nirkabel menggunakan protokol MQTT (HiveMQ Cloud).
4. **Application:** Aplikasi mobile menggunakan React Native.

---

## 🔌 Spesifikasi Perangkat Keras (Hardware)

### Komponen Utama & Pin Mapping
Berikut adalah konfigurasi pinout antara sensor dan ESP32 NodeMCU:

#### 1. Modul A (Monitoring Berat)
* **Load Cell 5kg -> ADC HX711**[cite: 1]
  * Merah -> E+ | Hitam -> E- | Putih -> H+ | Hijau -> H-
* **ADC HX711 -> ESP32**[cite: 1]
  * VCC -> VIN (5V) | GND -> GND | DT -> GPIO 19 | SCK -> GPIO 18
* **LCD 16x2 I2C -> ESP32**
  * VCC -> VIN (5V) | GND -> GND | SDA -> GPIO 22 | SCL -> GPIO 21

#### 2. Modul B (Monitoring Posisi & Alarm)
* **MPU6050 -> ESP32**
  * VCC -> 3V3 | GND -> GND | SDA -> GPIO 22 | SCL -> GPIO 21
* **OLED 0.96" I2C -> ESP32**
  * VCC -> 3V3 | GND -> GND | SDA -> GPIO 22 | SCL -> GPIO 21
* **Passive Buzzer -> ESP32**
  * I/O -> GPIO 4 | GND -> GND
