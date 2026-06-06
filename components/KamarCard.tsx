import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pasien, StatusInfus } from '@/constants/types';

interface Props {
  pasien: Pasien;
  onPress: () => void;
}

function badgeConfig(status?: StatusInfus) {
  switch (status) {
    case 'habis':
      return { label: 'Habis', bg: '#FFEDED', text: '#C0392B' };
    case 'terganggu':
      return { label: 'Posisi Infus Terganggu', bg: '#FFF8E1', text: '#F39C12' };
    default:
      return { label: 'Lancar', bg: '#E8F5E9', text: '#27AE60' };
  }
}

function formatEstimasi(menit?: number): string {
  if (menit === undefined) return '—';
  if (menit < 60) return `${menit} Menit`;
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return sisaMenit > 0 ? `${jam} Jam ${sisaMenit} Menit` : `${jam} Jam`;
}

export default function KamarCard({ pasien, onPress }: Props) {
  const badge = badgeConfig(pasien.statusInfus);
  const persen = pasien.persen ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.kamar}>Kamar {pasien.nomorKamar}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      <Text style={styles.nama}>{pasien.namaPasien}</Text>

      <View style={styles.progressBg}>
        <View style={[
          styles.progressFill,
          {
            width: `${persen}%`,
            backgroundColor: persen <= 20 ? '#E74C3C' : persen <= 50 ? '#F39C12' : '#27AE60',
          }
        ]} />
      </View>

      <View style={styles.row}>
        <Text style={styles.estimasi}>Estimasi Habis: {formatEstimasi(pasien.estimasiMenit)}</Text>
        <Text style={styles.persen}>{persen}%</Text>
      </View>

      <Text style={styles.lihatDetail}>Lihat Detail</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kamar: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nama: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#ECECEC',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  estimasi: {
    fontSize: 13,
    color: '#777',
  },
  persen: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  lihatDetail: {
    fontSize: 13,
    color: '#1B7A4A',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 6,
  },
});
