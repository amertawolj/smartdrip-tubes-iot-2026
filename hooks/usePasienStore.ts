import { useState, useCallback } from 'react';
import { Pasien, BeratPayload, PosisiPayload, LogEntry, StatusInfus } from '@/constants/types';
import { sendLocalNotification } from '@/hooks/useNotifications';

function hitungStatus(persen?: number, statusPosisi?: 'stabil' | 'terganggu' | 'jatuh'): StatusInfus {
  if (statusPosisi === 'jatuh') return 'terganggu';
  if (statusPosisi === 'terganggu') return 'terganggu';
  if (persen !== undefined && persen <= 20) return 'habis';
  return 'lancar';
}

function buatLogEntry(pesan: string, tipe: LogEntry['tipe']): LogEntry {
  return { waktu: new Date().toISOString(), pesan, tipe };
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

        // 🔴 Infus HABIS (baru nyentuh 0%)
        if (payload.persen <= 0 && (p.persen ?? 100) > 0) {
          logBaru.push(buatLogEntry(`🔴 Infus HABIS — segera ganti!`, 'warning'));
          sendLocalNotification(
            '🔴 Infus Habis!',
            `Kamar ${p.nomorKamar} — ${p.namaPasien}\nInfus sudah habis, segera ganti!`,
            { pasienId: p.id, nomorKamar: p.nomorKamar }
          );
        }
        // 🟠 Hampir habis (baru masuk ≤10%, belum habis)
        else if (payload.persen <= 10 && (p.persen ?? 100) > 10) {
          logBaru.push(buatLogEntry(`🟠 Infus tersisa ${payload.persen}% — hampir habis!`, 'warning'));
          sendLocalNotification(
            '🟠 Infus Hampir Habis',
            `Kamar ${p.nomorKamar} — ${p.namaPasien}\nSisa ${payload.persen}% (${payload.berat}g), siapkan pengganti`,
            { pasienId: p.id, nomorKamar: p.nomorKamar }
          );
        }
        // ⚠️ Zona kritis (baru masuk ≤20%, belum ≤10%)
        else if (payload.persen <= 20 && (p.persen ?? 100) > 20) {
          logBaru.push(buatLogEntry(`⚠️ Infus tersisa ${payload.persen}% — segera tangani`, 'warning'));
          sendLocalNotification(
            '⚠️ Infus Kritis',
            `Kamar ${p.nomorKamar} — ${p.namaPasien}\nSisa ${payload.persen}% (${payload.berat}g)`,
            { pasienId: p.id, nomorKamar: p.nomorKamar }
          );
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

  const updatePosisi = useCallback((payload: PosisiPayload) => {
    setPasienList(prev => prev.map(p => {
      if (p.deviceIdPosisi.toUpperCase() !== payload.device_id.toUpperCase()) return p;

      const statusBaru = hitungStatus(p.persen, payload.status);
      const logBaru: LogEntry[] = [...(p.log ?? [])];

      // Notifikasi tiang terganggu (baru terjadi)
      if (payload.status === 'terganggu' && p.statusPosisi !== 'terganggu' && p.statusPosisi !== 'jatuh') {
        logBaru.push(buatLogEntry(`⚠️ Posisi tiang terganggu — sudut ${payload.sudut}°`, 'warning'));
        sendLocalNotification(
          '⚠️ Tiang Infus Terganggu',
          `Kamar ${p.nomorKamar} — ${p.namaPasien}\nSudut kemiringan ${payload.sudut}°`,
          { pasienId: p.id, nomorKamar: p.nomorKamar }
        );
      }

      // Notifikasi tiang jatuh (prioritas tertinggi)
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