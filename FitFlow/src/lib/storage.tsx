// src/lib/storage.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './api';
import { useEntitlements } from './entitlements';

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────
export interface StorageEngine {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  listKeys(prefix?: string): Promise<string[]>;
}

type StorageCtx = {
  storage: StorageEngine;
  ready: boolean;
  mode: 'local' | 'cloud';
  userId?: string | null;
  refreshAuth: () => Promise<void>;
};

const StorageContext = createContext<StorageCtx | null>(null);

// ─────────────────────────────────────────────────────────────
// Local Engine (AsyncStorage)
// ─────────────────────────────────────────────────────────────
const LocalStorageEngine: StorageEngine = {
  async get<T>(key: string) {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  async listKeys(prefix?: string) {
    const keys = await AsyncStorage.getAllKeys();
    return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
  },
};

// ─────────────────────────────────────────────────────────────
// Cloud Engine (Supabase)
// Table suggestion: app_kv(user_id uuid, key text, value jsonb,
//                         PRIMARY KEY (user_id, key))
// RLS: user_id = auth.uid()
// ─────────────────────────────────────────────────────────────
function CloudStorageEngine(userId: string): StorageEngine {
  return {
    async get<T>(key: string) {
      const { data, error } = await supabase
        .from('app_kv')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116: No rows found
        console.warn('[CloudStorage.get] error', error);
      }
      return (data?.value as T) ?? null;
    },

    async set<T>(key: string, value: T) {
      const { error } = await supabase
        .from('app_kv')
        .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' });

      if (error) {
        console.error('[CloudStorage.set] error', error);
        throw error;
      }
    },

    async remove(key: string) {
      const { error } = await supabase
        .from('app_kv')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);

      if (error) {
        console.error('[CloudStorage.remove] error', error);
        throw error;
      }
    },

    async listKeys(prefix?: string) {
      const base = supabase.from('app_kv').select('key').eq('user_id', userId);
      const { data, error } = prefix ? await base.like('key', `${prefix}%`) : await base;

      if (error) {
        console.warn('[CloudStorage.listKeys] error', error);
        return [];
      }
      return (data ?? []).map((r: any) => r.key as string);
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Provider — selects engine from your Entitlements + Auth state
// Rule:
//   - FREE or no auth user → Local
//   - PRO / PRO_AI AND signed in → Cloud
// No Supabase calls are made for free users.
// ─────────────────────────────────────────────────────────────
export function StorageProvider({ children }: { children: React.ReactNode }) {
  const ent = useEntitlements();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Only check auth when the plan can use cloud (pro/pro_ai).
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (ent.isPro || ent.isProAI) {
        const { data } = await supabase.auth.getUser();
        if (mounted) setUserId(data?.user?.id ?? null);
      } else {
        // Free users: do not touch Supabase, force local
        if (mounted) setUserId(null);
      }
      if (mounted) setAuthChecked(true);
    }

    init();

    // Subscribe to auth changes ONLY for pro tiers
    let unsub: (() => void) | undefined;
    if (ent.isPro || ent.isProAI) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setUserId(session?.user?.id ?? null);
      });
      unsub = () => sub.subscription?.unsubscribe?.();
    }

    return () => {
      mounted = false;
      try { unsub?.(); } catch {}
    };
  }, [ent.isPro, ent.isProAI]);

  // Decide engine
  const storage = useMemo<StorageEngine>(() => {
    // If free, always local (no Supabase usage)
    if (!ent.isPro && !ent.isProAI) return LocalStorageEngine;
    // Pro tiers but not signed in yet → still local until they complete auth
    if (!userId) return LocalStorageEngine;
    // Pro tiers with a session → cloud
    return CloudStorageEngine(userId);
  }, [ent.isPro, ent.isProAI, userId]);

  const mode: 'local' | 'cloud' =
    (!ent.isPro && !ent.isProAI) || !userId ? 'local' : 'cloud';

  const ready = !ent.isLoading && authChecked;

  const refreshAuth = async () => {
    if (ent.isPro || ent.isProAI) {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    }
  };

  const value: StorageCtx = { storage, ready, mode, userId, refreshAuth };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useAppStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useAppStorage must be used within StorageProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────
// Optional: one-time migration when a pro user signs in
// Call this right after successful sign-up/sign-in.
// ─────────────────────────────────────────────────────────────
export async function migrateLocalToCloud(userId: string) {
  const cloud = CloudStorageEngine(userId);
  const keys = await LocalStorageEngine.listKeys();
  for (const key of keys) {
    const val = await LocalStorageEngine.get(key);
    if (val !== null) {
      await cloud.set(key, val);
    }
  }
}