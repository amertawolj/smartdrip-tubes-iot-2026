import { useState, useCallback } from 'react';
import { Pasien, BeratPayload, PosisiPayload, LogEntry, StatusInfus } from '@/constants/types';

function hitungStatus(persen?: number, statusPosisi?: 'stabil' | 'terganggu'): StatusInfus {
  if (statusPosisi === 'terganggu') return 'terganggu';
  if (persen !== undefined && persen <= 20) return 'habis';
  return 'lancar';
}

function buatLogEntry(pesan: string, tipe: LogEntry['tipe']): LogEntry {
  return {
    waktu: new Date().toISOString(),
    pesan,
    tipe,
  };
}

export function usePasienStore() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);

  // Tambah pasien baru
  const tambahPasien = useCallback((
    nomorKamar: string,
    namaPasien: string,
    obat: string,
    deviceIdBerat: string,
    deviceIdPosisi: string,
  ) => {
    const pasienBaru: Pasien = {
      id: Date.now().toString(),
      nomorKamar,
      namaPasien,
      obat,
      deviceIdBerat,
      deviceIdPosisi,
      log: [buatLogEntry('Pasien ditambahkan ke sistem', 'info')],
    };
    setPasienList(prev => [...prev, pasienBaru]);
  }, []);

  // Hapus pasien
  const hapusPasien = useCallback((id: string) => {
    setPasienList(prev => prev.filter(p => p.id !== id));
  }, []);

  // Update data berat dari MQTT
  const updateBerat = useCallback((payload: BeratPayload) => {
    setPasienList(prev => prev.map(p => {
      if (p.deviceIdBerat !== payload.device_id) return p;

      const statusBaru = hitungStatus(payload.persen, p.statusPosisi);
      const logBaru: LogEntry[] = [...(p.log ?? [])];

      // Catat log kalau hampir habis
      if (payload.persen <= 20 && (p.persen ?? 100) > 20) {
        logBaru.push(buatLogEntry(`⚠️ Infus tersisa ${payload.persen}% — segera tangani`, 'warning'));
      }

      return {
        ...p,
        berat: payload.berat,
        persen: payload.persen,
        estimasiMenit: payload.estimasi_menit,
        statusInfus: statusBaru,
        log: logBaru,
      };
    }));
  }, []);

  // Update data posisi dari MQTT
  const updatePosisi = useCallback((payload: PosisiPayload) => {
    setPasienList(prev => prev.map(p => {
      if (p.deviceIdPosisi !== payload.device_id) return p;

      const statusBaru = hitungStatus(p.persen, payload.status);
      const logBaru: LogEntry[] = [...(p.log ?? [])];

      if (payload.status === 'terganggu' && p.statusPosisi !== 'terganggu') {
        logBaru.push(buatLogEntry(`⚠️ Posisi tiang terganggu — sudut ${payload.sudut}°`, 'warning'));
      }

      return {
        ...p,
        sudut: payload.sudut,
        statusPosisi: payload.status,
        statusInfus: statusBaru,
        log: logBaru,
      };
    }));
  }, []);

  // Tandai sudah ditangani
  const tandaiDitangani = useCallback((id: string) => {
    setPasienList(prev => prev.map(p => {
      if (p.id !== id) return p;
      const logBaru = [...(p.log ?? []), buatLogEntry('✅ Ditandai sudah ditangani oleh perawat', 'success')];
      return { ...p, statusInfus: 'lancar', log: logBaru };
    }));
  }, []);

  return { pasienList, tambahPasien, hapusPasien, updateBerat, updatePosisi, tandaiDitangani };
}