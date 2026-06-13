import { useState, useCallback } from 'react';
import { Pasien, BeratPayload, PosisiPayload, LogEntry, StatusInfus } from '@/constants/types';
import { sendLocalNotification } from '@/hooks/useNotifications';

const LAJU_ABNORMAL_THRESHOLD = 50; // persen perubahan laju dianggap abnormal

function hitungStatus(persen?: number, statusPosisi?: 'stabil' | 'terganggu' | 'jatuh'): StatusInfus {
  if (statusPosisi === 'jatuh') return 'terganggu';
  if (statusPosisi === 'terganggu') return 'terganggu';
  if (persen !== undefined && persen <= 20) return 'habis';
  return 'lancar';
}

function buatLogEntry(pesan: string, tipe: LogEntry['tipe']): LogEntry {
  return { waktu: new Date().toISOString(), pesan, tipe };
}

function hitungPerubahanLaju(lajuBaru: number, lajuLama: number): number {
  if (lajuLama <= 0) return 0;
  return Math.abs((lajuBaru - lajuLama) / lajuLama) * 100;
}

export function usePasienStore() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);

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
      deviceIdBerat: deviceIdBerat.trim().toUpperCase(),
      deviceIdPosisi: deviceIdPosisi.trim().toUpperCase(),
      log: [buatLogEntry('Pasien ditambahkan ke sistem', 'info')],
    };
    setPasienList(prev => [...prev, pasienBaru]);
  }, []);

  const hapusPasien = useCallback((id: string) => {
    setPasienList(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateBerat = useCallback((payload: BeratPayload) => {
    setPasienList(prev => prev.map(p => {
      if (p.deviceIdBerat.toUpperCase() !== payload.device_id.toUpperCase()) return p;

      const statusBaru = hitungStatus(payload.persen, p.statusPosisi);
      const logBaru: LogEntry[] = [...(p.log ?? [])];

      // ── Notifikasi infus hampir habis ──
      if (payload.persen <= 20 && (p.persen ?? 100) > 20) {
        logBaru.push(buatLogEntry(
          `⚠️ Infus tersisa ${payload.persen}% — segera tangani`, 'warning'
        ));
        sendLocalNotification(
          '⚠️ Infus Hampir Habis',
          `Kamar ${p.nomorKamar} — ${p.namaPasien}\nSisa ${payload.persen}% (${payload.berat}g)`,
          { pasienId: p.id, nomorKamar: p.nomorKamar }
        );
      }

      // ── Deteksi laju abnormal ──
      const lajuSebelumnya = p.laju;
      const lajuBaru = payload.laju;

      if (
        lajuSebelumnya !== undefined &&  // sudah ada data laju sebelumnya
        lajuSebelumnya > 0 &&            // laju sebelumnya valid
        lajuBaru >= 0                    // laju baru valid
      ) {
        const perubahan = hitungPerubahanLaju(lajuBaru, lajuSebelumnya);

        if (perubahan > LAJU_ABNORMAL_THRESHOLD) {
          const arahPerubahan = lajuBaru > lajuSebelumnya ? 'naik' : 'turun';
          const pesanLog = `⚠️ Laju infus ${arahPerubahan} drastis: ${lajuSebelumnya.toFixed(1)} → ${lajuBaru.toFixed(1)} g/mnt (${perubahan.toFixed(0)}%)`;

          // Cek apakah log terakhir sudah ada warning laju (hindari spam)
          const logTerakhir = logBaru[logBaru.length - 1];
          const sudahAdaWarningLaju = logTerakhir?.pesan.includes('Laju infus');

          if (!sudahAdaWarningLaju) {
            logBaru.push(buatLogEntry(pesanLog, 'warning'));
            sendLocalNotification(
              '⚠️ Laju Infus Tidak Normal',
              `Kamar ${p.nomorKamar} — ${p.namaPasien}\nLaju ${arahPerubahan} drastis: ${lajuSebelumnya.toFixed(1)} → ${lajuBaru.toFixed(1)} g/mnt`,
              { pasienId: p.id, nomorKamar: p.nomorKamar }
            );
          }
        }

        // Laju tiba-tiba 0 padahal bag masih ada
        if (lajuBaru === 0 && lajuSebelumnya > 0 && payload.persen > 20) {
          const sudahAdaWarningBerhenti = logBaru[logBaru.length - 1]?.pesan.includes('berhenti');
          if (!sudahAdaWarningBerhenti) {
            logBaru.push(buatLogEntry(
              '⚠️ Infus berhenti menetes — cek selang!', 'warning'
            ));
            sendLocalNotification(
              '⚠️ Infus Berhenti!',
              `Kamar ${p.nomorKamar} — ${p.namaPasien}\nCairan berhenti menetes, cek selang segera!`,
              { pasienId: p.id, nomorKamar: p.nomorKamar }
            );
          }
        }
      }

      return {
        ...p,
        berat: payload.berat,
        persen: payload.persen,
        estimasiMenit: payload.estimasi_menit,
        laju: lajuBaru,
        lajuSebelumnya: lajuSebelumnya,
        statusInfus: statusBaru,
        log: logBaru,
      };
    }));
  }, []);

  const updatePosisi = useCallback((payload: PosisiPayload) => {
    setPasienList(prev => prev.map(p => {
      if (p.deviceIdPosisi.toUpperCase() !== payload.device_id.toUpperCase()) return p;

      const statusBaru = hitungStatus(p.persen, payload.status);
      const logBaru: LogEntry[] = [...(p.log ?? [])];

      if (payload.status === 'terganggu' && p.statusPosisi !== 'terganggu' && p.statusPosisi !== 'jatuh') {
        logBaru.push(buatLogEntry(`⚠️ Posisi tiang terganggu — sudut ${payload.sudut}°`, 'warning'));
        sendLocalNotification(
          '⚠️ Tiang Infus Terganggu',
          `Kamar ${p.nomorKamar} — ${p.namaPasien}\nSudut kemiringan ${payload.sudut}°`,
          { pasienId: p.id, nomorKamar: p.nomorKamar }
        );
      }

      if (payload.status === 'jatuh' && p.statusPosisi !== 'jatuh') {
        logBaru.push(buatLogEntry(`🚨 TIANG INFUS JATUH! Segera ke kamar ${p.nomorKamar}`, 'warning'));
        sendLocalNotification(
          '🚨 TIANG INFUS JATUH!',
          `Kamar ${p.nomorKamar} — ${p.namaPasien}\nSegera tangani sekarang!`,
          { pasienId: p.id, nomorKamar: p.nomorKamar }
        );
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

  const tandaiDitangani = useCallback((id: string) => {
    setPasienList(prev => prev.map(p => {
      if (p.id !== id) return p;
      const logBaru = [...(p.log ?? []), buatLogEntry('✅ Ditandai sudah ditangani oleh perawat', 'success')];
      return { ...p, statusInfus: 'lancar', statusPosisi: 'stabil', log: logBaru };
    }));
  }, []);

  return { pasienList, tambahPasien, hapusPasien, updateBerat, updatePosisi, tandaiDitangani };
}