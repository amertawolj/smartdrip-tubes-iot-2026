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
  status: 'stabil' | 'terganggu';
}

export interface Pasien {
  id: string;
  nomorKamar: string;
  namaPasien: string;
  obat: string;
  deviceIdBerat: string;
  deviceIdPosisi: string;
  // data realtime dari MQTT
  berat?: number;
  persen?: number;
  estimasiMenit?: number;
  statusPosisi?: 'stabil' | 'terganggu';
  sudut?: number;
  statusInfus?: StatusInfus;
  // log
  log?: LogEntry[];
}

export interface LogEntry {
  waktu: string;     
  pesan: string;
  tipe: 'info' | 'warning' | 'success';
}