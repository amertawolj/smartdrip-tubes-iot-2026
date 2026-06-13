export const MQTT_CONFIG = {
  brokerUrl: 'wss://f7a9cc4d020f4a209a93ea35c1653715.s1.eu.hivemq.cloud:8884/mqtt',
  options: {
    clientId: `smartdrip_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    username: 'amertut',
    password: 'Lambelu!1101',
  },
};

export const TOPICS = {
  berat: 'smartdrip/berat',
  posisi: 'smartdrip/posisi',
};