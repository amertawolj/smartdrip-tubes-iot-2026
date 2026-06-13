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
    console.log('=== MQTT INIT, connecting to:', MQTT_CONFIG.brokerUrl);
    const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);
    clientRef.current = client;

    client.on('connect', () => {
      console.log('=== MQTT CONNECTED ===');
      setState(prev => ({ ...prev, isConnected: true }));
      client.subscribe(TOPICS.berat, (err) => {
        if (err) console.log('Subscribe berat error:', err);
        else console.log('Subscribed to:', TOPICS.berat);
      });
      client.subscribe(TOPICS.posisi, (err) => {
        if (err) console.log('Subscribe posisi error:', err);
        else console.log('Subscribed to:', TOPICS.posisi);
      });
      client.subscribe('smartdrip/register', (err) => {
        if (err) console.log('Subscribe register error:', err);
        else console.log('Subscribed to: smartdrip/register');
      });
    });

    client.on('message', (topic, message) => {
      console.log('=== MESSAGE MASUK ===');
      console.log('Topic:', topic);
      console.log('Raw:', message.toString());
      try {
        const payload = JSON.parse(message.toString());
        console.log('Parsed payload:', JSON.stringify(payload));

        if (topic === TOPICS.berat) {
          console.log('→ Update berat, device_id:', payload.device_id);
          setState(prev => ({ ...prev, lastBeratPayload: payload as BeratPayload }));
        } else if (topic === TOPICS.posisi) {
          console.log('→ Update posisi, device_id:', payload.device_id);
          setState(prev => ({ ...prev, lastPosisiPayload: payload as PosisiPayload }));
        } else if (topic === 'smartdrip/register') {
          console.log('→ Device baru:', payload.device_id);
          setState(prev => ({ ...prev, newDeviceId: payload.device_id }));
        }
      } catch (e) {
        console.error('MQTT parse error:', e);
      }
    });

    client.on('error', (err) => {
      console.error('=== MQTT ERROR ===', err.message);
    });

    client.on('disconnect', () => {
      console.log('=== MQTT DISCONNECTED ===');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    client.on('reconnect', () => {
      console.log('=== MQTT RECONNECTING ===');
    });

    return () => {
      console.log('=== MQTT CLEANUP ===');
      client.end();
    };
  }, []);

  const clearNewDevice = useCallback(() => {
    setState(prev => ({ ...prev, newDeviceId: null }));
  }, []);

  return { ...state, clearNewDevice };
}