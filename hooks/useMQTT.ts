import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG, TOPICS } from '@/constants/mqttConfig';
import { BeratPayload, PosisiPayload } from '@/constants/types';

interface MQTTState {
  isConnected: boolean;
  lastBeratPayload: BeratPayload | null;
  lastPosisiPayload: PosisiPayload | null;
  newDeviceId: string | null;
}

export function useMQTT() {
  const clientRef = useRef<MqttClient | null>(null);
  const [state, setState] = useState<MQTTState>({
    isConnected: false,
    lastBeratPayload: null,
    lastPosisiPayload: null,
    newDeviceId: null,
  });

  useEffect(() => {
    const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);
    clientRef.current = client;

    client.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true }));
      client.subscribe(TOPICS.berat);
      client.subscribe(TOPICS.posisi);
      client.subscribe(TOPICS.register);
    });

    client.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false }));
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());

        if (topic === TOPICS.berat) {
          setState(prev => ({ ...prev, lastBeratPayload: payload as BeratPayload }));
        } else if (topic === TOPICS.posisi) {
          setState(prev => ({ ...prev, lastPosisiPayload: payload as PosisiPayload }));
        } else if (topic === TOPICS.register) {
          setState(prev => ({ ...prev, newDeviceId: payload.device_id }));
        }
      } catch (e) {
        console.error('MQTT parse error:', e);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    return () => {
      client.end();
    };
  }, []);

  const clearNewDevice = useCallback(() => {
    setState(prev => ({ ...prev, newDeviceId: null }));
  }, []);

  return { ...state, clearNewDevice };
}