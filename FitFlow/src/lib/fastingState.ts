
// lib/fastingState.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

export type FastingLabel = '16:8' | '18:6' | '20:4' | 'OMAD' | '2m';
const HOURS: Record<FastingLabel, number> = {
  '16:8': 16,
  '18:6': 18,
  '20:4': 20,
  'OMAD' : 23,
  '2m'   : 2 / 60,
};
export const hoursForLabel = (label: FastingLabel) => HOURS[label];

const K_START = 'fastStartTime';
const K_LABEL = 'fastTypeLabel';

// Simple in-app pub/sub (works across screens in the same JS runtime)
type Listener = (s: FastingShared | null) => void;
const listeners = new Set<Listener>();
const notify = (s: FastingShared | null) => listeners.forEach(l => l(s));
export const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export type FastingShared = {
  label: FastingLabel;
  startISO: string; // ISO string
};

export const startFast = async (label: FastingLabel) => {
  const now = new Date().toISOString();
  await AsyncStorage.multiSet([[K_START, now], [K_LABEL, label]]);
  notify({ label, startISO: now });
};

export const endFast = async () => {
  await AsyncStorage.multiRemove([K_START, K_LABEL]);
  notify(null);
};

export const getSnapshot = async (): Promise<FastingShared | null> => {
  const [startISO, label] = await Promise.all([
    AsyncStorage.getItem(K_START),
    AsyncStorage.getItem(K_LABEL),
  ]);
  if (!startISO || !label) return null;
  if (!Object.hasOwn(HOURS, label as FastingLabel)) return null;
  return { label: label as FastingLabel, startISO };
};

export const useFastingState = () => {
  const [hydrating, setHydrating] = useState(true);
  const [shared, setShared] = useState<FastingShared | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const durationRef = useRef(0);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const snap = await getSnapshot();
      setShared(snap);
      setHydrating(false);
      // live updates from other screens
      unsub = subscribe((s) => setShared(s));
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!shared) {
        setElapsed(0);
        durationRef.current = 0;
        return;
      }
      const start = new Date(shared.startISO).getTime();
      const secs = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(secs);
      durationRef.current = HOURS[shared.label] * 3600;
    };

    const id = setInterval(tick, 1000);
    tick(); // immediate first paint
    return () => clearInterval(id);
  }, [shared]);

  const duration = durationRef.current;
  const completed = !!shared && duration > 0 && elapsed >= duration;

  return {
    hydrating,
    // Keep active true as long as there's a running fast; we explicitly end it on completion.
    active: !!shared,
    completed,
    label: shared?.label ?? null,
    startISO: shared?.startISO ?? null,
    elapsed,
    remaining: Math.max(0, duration - elapsed),
    duration,
    pct: duration > 0 ? Math.min(1, elapsed / duration) : 0,
  };
};
