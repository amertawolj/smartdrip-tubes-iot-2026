export type StatusInfus = 'lancar' | 'habis' | 'terganggu';

export interface BeratPayload {
  device_id: string;
  berat: number;
  persen: number;
  estimasi_menit: number;
}

export interface PosisiPayload {
  device_id: string;
  sudut: number;
  magnitude?: number;
  status: 'stabil' | 'terganggu' | 'jatuh';
}

export interface Pasien {
  id: string;
  nomorKamar: string;
  namaPasien: string;
  obat: string;
  deviceIdBerat: string;
  deviceIdPosisi: string;
  berat?: number;
  persen?: number;
  estimasiMenit?: number;
  statusPosisi?: 'stabil' | 'terganggu' | 'jatuh';
  sudut?: number;
  statusInfus?: StatusInfus;
  log?: LogEntry[];
}

export interface LogEntry {
  waktu: string;
  pesan: string;
  tipe: 'info' | 'warning' | 'success';
}