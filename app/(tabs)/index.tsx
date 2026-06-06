import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import KamarCard from '@/components/KamarCard';

export default function Homepage() {
  const router = useRouter();
  const { isConnected, newDeviceId, clearNewDevice, pasienList, tambahPasien } = useApp();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [form, setForm] = React.useState({
    nomorKamar: '',
    namaPasien: '',
    obat: '',
    deviceIdBerat: '',
    deviceIdPosisi: '',
  });

  useEffect(() => {
    if (newDeviceId) {
      Alert.alert(
        'Device Baru Ditemukan!',
        `Device ID: ${newDeviceId}\nAssign ke pasien sekarang?`,
        [
          { text: 'Nanti', onPress: clearNewDevice },
          {
            text: 'Assign',
            onPress: () => {
              setForm(prev => ({ ...prev, deviceIdBerat: newDeviceId }));
              setModalVisible(true);
              clearNewDevice();
            },
          },
        ]
      );
    }
  }, [newDeviceId]);

  function handleSimpan() {
    if (!form.nomorKamar || !form.namaPasien || !form.obat) {
      Alert.alert('Lengkapi form', 'Nomor kamar, nama pasien, dan obat wajib diisi.');
      return;
    }
    tambahPasien(form.nomorKamar, form.namaPasien, form.obat, form.deviceIdBerat, form.deviceIdPosisi);
    setForm({ nomorKamar: '', namaPasien: '', obat: '', deviceIdBerat: '', deviceIdPosisi: '' });
    setModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.halo}>Halo, Perawat 👋</Text>
          <View style={[styles.dot, { backgroundColor: isConnected ? '#27AE60' : '#E74C3C' }]} />
        </View>

        <TouchableOpacity style={styles.btnTambah} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnTambahText}>+ Assign Pasien Baru</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Aktivitas</Text>

        {pasienList.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Belum ada pasien terdaftar.</Text>
            <Text style={styles.emptyText}>Tap tombol di atas untuk menambahkan.</Text>
          </View>
        ) : (
          pasienList.map(pasien => (
            <KamarCard
              key={pasien.id}
              pasien={pasien}
              onPress={() => router.push(`/detail?id=${pasien.id}` as any)}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.back}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assign Pasien</Text>

            {(['nomorKamar', 'namaPasien', 'obat', 'deviceIdBerat', 'deviceIdPosisi'] as const).map(field => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{labelMap[field]}</Text>
                <TextInput
                  style={styles.input}
                  value={form[field]}
                  onChangeText={val => setForm(prev => ({ ...prev, [field]: val }))}
                  placeholder={placeholderMap[field]}
                  placeholderTextColor="#aaa"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.btnSimpan} onPress={handleSimpan}>
              <Text style={styles.btnSimpanText}>Simpan</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const labelMap = {
  nomorKamar: 'Nomor Kamar',
  namaPasien: 'Nama Pasien',
  obat: 'Obat',
  deviceIdBerat: 'Device ID Modul Berat',
  deviceIdPosisi: 'Device ID Modul Posisi',
};

const placeholderMap = {
  nomorKamar: 'cth. 204',
  namaPasien: 'cth. Budi Santoso',
  obat: 'cth. NaCl 0.9%',
  deviceIdBerat: 'MAC address ESP32 berat',
  deviceIdPosisi: 'MAC address ESP32 posisi',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  halo: { fontSize: 24, fontWeight: '700', color: '#1B7A4A' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  btnTambah: { backgroundColor: '#1B7A4A', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 20 },
  btnTambahText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionLabel: { fontSize: 24, fontWeight: '700', color: '#1B7A4A', marginBottom: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 14, marginBottom: 4 },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalScroll: { padding: 24, paddingBottom: 60 },
  back: { fontSize: 15, color: '#1B7A4A', fontWeight: '600', marginBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#1B7A4A', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#F0F0F0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1A1A1A' },
  btnSimpan: { backgroundColor: '#1B7A4A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnSimpanText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
