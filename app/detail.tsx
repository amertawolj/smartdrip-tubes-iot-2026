import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

function formatWaktu(iso: string): string {
  const d = new Date(iso);
  const jam = d.getHours().toString().padStart(2, '0');
  const menit = d.getMinutes().toString().padStart(2, '0');
  return `${jam}:${menit}`;
}

function formatEstimasi(menit?: number): string {
  if (menit === undefined) return '—';
  if (menit < 60) return `${menit} menit`;
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  return m > 0 ? `${j} jam ${m} menit` : `${j} jam`;
}

export default function DetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pasienList, hapusPasien, tandaiDitangani } = useApp();

  const pasien = pasienList.find(p => p.id === id);

  if (!pasien) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Pasien tidak ditemukan.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const persen = pasien.persen ?? 0;
  const barColor = persen <= 20 ? '#E74C3C' : persen <= 50 ? '#F39C12' : '#27AE60';

  function handleHapus() {
    Alert.alert(
      'Hapus Pasien',
      `Yakin ingin menghapus data ${pasien!.namaPasien}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => { hapusPasien(pasien!.id); router.back(); },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Detail Informasi</Text>
        </TouchableOpacity>

        {/* Grafik berat */}
        <View style={styles.grafikBox}>
          <Text style={styles.grafikLabel}>Grafik Berat IV</Text>
          <View style={styles.grafikBarBg}>
            <View style={[styles.grafikBarFill, { width: `${persen}%`, backgroundColor: barColor }]} />
          </View>
          <View style={styles.grafikRow}>
            <Text style={styles.grafikSub}>0g</Text>
            <Text style={[styles.grafikPersen, { color: barColor }]}>{persen}%</Text>
            <Text style={styles.grafikSub}>{pasien.berat ?? '—'}g tersisa</Text>
          </View>
        </View>

        {/* Info pasien */}
        <View style={styles.infoBox}>
          {([
            ['Nomor Kamar', pasien.nomorKamar],
            ['Nama Pasien', pasien.namaPasien],
            ['Obat', pasien.obat],
            ['Berat Obat Sekarang', pasien.berat !== undefined ? `${pasien.berat} gram` : '—'],
            ['Estimasi Waktu Habis', formatEstimasi(pasien.estimasiMenit)],
            ['Laju Konsumsi Obat', pasien.estimasiMenit && pasien.berat
              ? `~${Math.round(pasien.berat / pasien.estimasiMenit)} gram/menit`
              : '—'],
            ['Status Tiang', pasien.statusPosisi === 'jatuh'
              ? `🚨 JATUH! (${pasien.sudut ?? '?'}°)`
              : pasien.statusPosisi === 'terganggu'
              ? `⚠️ Terganggu (${pasien.sudut ?? '?'}°)`
              : '✅ Stabil'],
          ] as [string, string][]).map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Log */}
        {pasien.log && pasien.log.length > 0 && (
          <View style={styles.logBox}>
            <Text style={styles.logTitle}>Log Aktivitas</Text>
            {[...pasien.log].reverse().map((entry, i) => (
              <View key={i} style={styles.logRow}>
                <Text style={styles.logWaktu}>{formatWaktu(entry.waktu)}</Text>
                <Text style={[
                  styles.logPesan,
                  entry.tipe === 'warning' && { color: '#E67E22' },
                  entry.tipe === 'success' && { color: '#27AE60' },
                ]}>{entry.pesan}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.btnDitangani} onPress={() => tandaiDitangani(pasien.id)}>
          <Text style={styles.btnDitanganiText}>Sudah Ditangani</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnHapus} onPress={handleHapus}>
          <Text style={styles.btnHapusText}>Hapus</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { padding: 20, paddingBottom: 60 },
  back: { fontSize: 24, color: '#1B7A4A', fontWeight: '700', marginBottom: 20 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: '#999' },
  grafikBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  grafikLabel: { fontSize: 14, fontWeight: '700', color: '#555', textAlign: 'center', marginBottom: 12 },
  grafikBarBg: { height: 16, backgroundColor: '#ECECEC', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  grafikBarFill: { height: '100%', borderRadius: 8 },
  grafikRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grafikSub: { fontSize: 12, color: '#999' },
  grafikPersen: { fontSize: 20, fontWeight: '700' },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  infoLabel: { flex: 2, fontSize: 14, color: '#555' },
  infoColon: { width: 16, fontSize: 14, color: '#555' },
  infoValue: { flex: 2, fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  logBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  logTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10 },
  logRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  logWaktu: { fontSize: 12, color: '#999', width: 36 },
  logPesan: { flex: 1, fontSize: 13, color: '#444' },
  btnDitangani: { backgroundColor: '#F0F0F0', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnDitanganiText: { fontSize: 15, fontWeight: '600', color: '#333' },
  btnHapus: { backgroundColor: '#E74C3C', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnHapusText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
