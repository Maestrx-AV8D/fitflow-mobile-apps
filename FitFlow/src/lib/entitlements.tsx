// src/lib/entitlements.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { supabase } from "./api";
import { syncEntitlementsToSupabase } from "./revenuecat";

export type Plan = "free" | "pro" | "pro_ai";

export type Entitlements = {
  plan: Plan;
  planEndsAt?: string | null;
  isPro: boolean;
  isProAI: boolean;
  showAdsApp: boolean; // app-wide (free only)
  showAdsAI: boolean;   // AI screens (free & pro)
  isLoading: boolean;
};

const DEFAULT: Entitlements = {
  plan: "pro_ai",
  planEndsAt: null,
  isPro: false,
  isProAI: true,
  showAdsApp: false,
  showAdsAI: false,
  isLoading: true,
};

const EntitlementsCtx = createContext<Entitlements>(DEFAULT);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [ent, setEnt] = useState<Entitlements>(DEFAULT);

  // The one true loader
  const hydrate = async (userId: string) => {
    try {
      // Let RevenueCat write the latest into Supabase (no-op if unchanged)
      await syncEntitlementsToSupabase(userId);
    } catch { /* ignore */ }

    const { data } = await supabase
      .from("profiles")
      .select("plan, plan_ends_at")
      .eq("id", userId)
      .maybeSingle();

    const plan = (data?.plan as Plan) ?? "free";
    setEnt({
      plan,
      planEndsAt: data?.plan_ends_at ?? null,
      isPro: plan === "pro" || plan === "pro_ai",
      isProAI: plan === "pro_ai",
      showAdsApp: plan === "free",
      showAdsAI: plan !== "pro_ai", // only Pro+AI removes AI ads
      isLoading: false,
    });
  };

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!mounted) return;
      if (userId) await hydrate(userId);
      else setEnt((e) => ({ ...e, isLoading: false }));
    })();
    return () => { mounted = false; };
  }, []);

  // Global refresh bus — fire requestEntitlementsRefresh() anywhere after purchase/restore/logout
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("entitlements:refresh", async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (userId) await hydrate(userId);
    });
    return () => { try { sub.remove(); } catch {} };
  }, []);

  const value = useMemo(() => ent, [ent]);
  return <EntitlementsCtx.Provider value={value}>{children}</EntitlementsCtx.Provider>;
}

export const useEntitlements = () => useContext(EntitlementsCtx);

// Fire this whenever purchases change (successful checkout, restore, logout, manual “pull to refresh”, etc.)
export const requestEntitlementsRefresh = () => DeviceEventEmitter.emit("entitlements:refresh");

// Friendly gates so you don’t repeat logic everywhere
export const hasPro = (e: Entitlements) => e.isPro;
export const hasProAI = (e: Entitlements) => e.isProAI;
export const shouldShowAdsAppWide = (e: Entitlements) => e.showAdsApp;
export const shouldShowAdsInAI = (e: Entitlements) => e.showAdsAI;
