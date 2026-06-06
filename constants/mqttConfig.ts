export const MQTT_CONFIG = {
  brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
  options: {
    clientId: `smartdrip_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  },
};

export const TOPICS = {
  berat: 'smartdrip/berat',
  posisi: 'smartdrip/posisi',
  register: 'smartdrip/register',
};