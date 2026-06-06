import React, { createContext, useContext, useEffect } from 'react';
import { useMQTT } from '@/hooks/useMQTT';
import { usePasienStore } from '@/hooks/usePasienStore';

const AppContext = createContext<ReturnType<typeof useAppState> | null>(null);

function useAppState() {
  const mqtt = useMQTT();
  const store = usePasienStore();

  useEffect(() => {
    if (mqtt.lastBeratPayload) store.updateBerat(mqtt.lastBeratPayload);
  }, [mqtt.lastBeratPayload]);

  useEffect(() => {
    if (mqtt.lastPosisiPayload) store.updatePosisi(mqtt.lastPosisiPayload);
  }, [mqtt.lastPosisiPayload]);

  return { ...mqtt, ...store };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp harus dipakai di dalam AppProvider');
  return ctx;
}