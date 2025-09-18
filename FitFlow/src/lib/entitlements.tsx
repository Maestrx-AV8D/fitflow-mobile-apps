// // // //

// // // // src/lib/entitlements.tsx
// // // import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
// // // import { DeviceEventEmitter } from "react-native";
// // // // import { supabase } from "../lib/api"; // uncomment if you later fetch real entitlements

// // // export type Plan = "free" | "premium" | "premium_ai" | "lifetime";

// // // export type Entitlements = {
// // //   plan: Plan;
// // //   ai: { dailyCredits: number; usedToday: number };
// // //   isLoading: boolean;
// // // };

// // // const defaultValue: Entitlements = {
// // //   plan: "free",
// // //   ai: { dailyCredits: 3, usedToday: 0 },
// // //   isLoading: true,
// // // };

// // // export function shouldShowAdsInAI(ent: Entitlements): boolean {
// // //   return ent.plan === "free" || ent.plan === "lifetime";
// // // }

// // // const EntitlementsCtx = createContext<Entitlements>(defaultValue);

// // // export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
// // //   const [plan, setPlan] = useState<Plan>("free");
// // //   const [dailyCredits, setDailyCredits] = useState<number>(3);
// // //   const [usedToday, setUsedToday] = useState<number>(0);
// // //   const [isLoading, setLoading] = useState<boolean>(true);

// // //   useEffect(() => {
// // //     let mounted = true;
// // //     (async () => {
// // //       try {
// // //         // TODO: load entitlements from backend or storage
// // //         // const { data } = await supabase.from("entitlements").select(...)

// // //         // Simple demo logic:
// // //         const p: Plan = "free"; // or "premium_ai", etc.
// // //         if (!mounted) return;

// // //         setPlan(p);
// // //         setDailyCredits(p === "premium_ai" || p === "lifetime" ? 999 : 3);
// // //         setUsedToday(0);
// // //       } finally {
// // //         if (mounted) setLoading(false);
// // //       }
// // //     })();
// // //     return () => {
// // //       mounted = false;
// // //     };
// // //   }, []);

// // //   // Example: listen for credit usage events from your AI screen
// // //   useEffect(() => {
// // //     const sub = DeviceEventEmitter.addListener("ai:creditUsed", () => {
// // //       setUsedToday(u => u + 1);
// // //     });
// // //     return () => sub.remove();
// // //   }, []);

// // //   const value = useMemo<Entitlements>(() => ({
// // //     plan,
// // //     ai: { dailyCredits, usedToday },
// // //     isLoading,
// // //   }), [plan, dailyCredits, usedToday, isLoading]);

// // //   return (
// // //     <EntitlementsCtx.Provider value={value}>
// // //       {children}
// // //     </EntitlementsCtx.Provider>
// // //   );
// // // }

// // // export const useEntitlements = () => useContext(EntitlementsCtx);

// // // export const canUseAI = (ent: Entitlements) =>
// // //   ent.ai.dailyCredits >= 900 || (ent.ai.dailyCredits - ent.ai.usedToday > 0);

// // // src/lib/entitlements.tsx
// // import React, {
// //   createContext,
// //   useContext,
// //   useEffect,
// //   useMemo,
// //   useState,
// // } from "react";
// // import { DeviceEventEmitter } from "react-native";
// // import { supabase } from "../lib/api";
// // import { syncEntitlementsToSupabase } from "./revenuecat";
// // // at the top

// // export type Plan = "free" | "pro" | "pro_ai";
// // export type Entitlements = {
// //   plan: Plan;
// //   planEndsAt?: string | null;
// //   isPro: boolean;
// //   isProAI: boolean;
// //   showAdsApp: boolean; // app-wide (free only)
// //   showAdsAI: boolean; // AI screens (free & pro)
// // };

// // const EntitlementsCtx = createContext<Entitlements>({
// //   plan: "free",
// //   planEndsAt: null,
// //   isPro: false,
// //   isProAI: false,
// //   showAdsApp: true,
// //   showAdsAI: true,
// // });

// // export function EntitlementsProvider({
// //   children,
// // }: {
// //   children: React.ReactNode;
// // }) {
// //   const [ent, setEnt] = useState<Entitlements>({
// //     plan: "free",
// //     planEndsAt: null,
// //     isPro: false,
// //     isProAI: false,
// //     showAdsApp: true,
// //     showAdsAI: true,
// //   });

// //   // when you have access to `user?.id`
// //   useEffect(() => {
// //     if (user?.id) syncEntitlementsToSupabase(user.id).catch(() => {});
// //   }, [user?.id]);

// //   useEffect(() => {
// //     let mounted = true;
// //     (async () => {
// //       const {
// //         data: { user },
// //       } = await supabase.auth.getUser();
// //       if (!user) return;
// //       const { data } = await supabase
// //         .from("profiles")
// //         .select("plan, plan_ends_at")
// //         .eq("id", user.id)
// //         .maybeSingle();
// //       const plan: Plan = (data?.plan ?? "free") as Plan;
// //       if (!mounted) return;
// //       const next: Entitlements = {
// //         plan,
// //         planEndsAt: data?.plan_ends_at ?? null,
// //         isPro: plan === "pro" || plan === "pro_ai",
// //         isProAI: plan === "pro_ai",
// //         showAdsApp: plan === "free",
// //         showAdsAI: plan !== "pro_ai", // only Pro+AI removes AI-page ads
// //       };
// //       setEnt(next);
// //     })();
// //     return () => {
// //       mounted = false;
// //     };
// //   }, []);

// //   // (Optional) listen for app-wide refresh events you already emit
// //   useEffect(() => {
// //     const sub = (DeviceEventEmitter as any)?.addListener?.(
// //       "fitflow:entitlementsUpdated",
// //       () => {
// //         // re-run the fetch
// //         (async () => {
// //           const {
// //             data: { user },
// //           } = await supabase.auth.getUser();
// //           if (!user) return;
// //           const { data } = await supabase
// //             .from("profiles")
// //             .select("plan, plan_ends_at")
// //             .eq("id", user.id)
// //             .maybeSingle();
// //           const plan: Plan = (data?.plan ?? "free") as Plan;
// //           const next: Entitlements = {
// //             plan,
// //             planEndsAt: data?.plan_ends_at ?? null,
// //             isPro: plan === "pro" || plan === "pro_ai",
// //             isProAI: plan === "pro_ai",
// //             showAdsApp: plan === "free",
// //             showAdsAI: plan !== "pro_ai",
// //           };
// //           setEnt(next);
// //         })();
// //       }
// //     );
// //     return () => sub?.remove?.();
// //   }, []);

// //   const value = useMemo(() => ent, [ent]);
// //   return (
// //     <EntitlementsCtx.Provider value={value}>
// //       {children}
// //     </EntitlementsCtx.Provider>
// //   );
// // }

// // export const useEntitlements = () => useContext(EntitlementsCtx);

// // // Small helpers so your imports won't be undefined:
// // export const shouldShowAdsInAI = (e: Entitlements) => e.showAdsAI;
// // export const shouldShowAdsAppWide = (e: Entitlements) => e.showAdsApp;

// // src/lib/entitlements.tsx
// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import { DeviceEventEmitter } from "react-native";
// import { supabase } from "../lib/api";
// import { syncEntitlementsToSupabase } from "./revenuecat";

// export type Plan = "free" | "pro" | "pro_ai";

// export type Entitlements = {
//   plan: Plan;
//   planEndsAt?: string | null;
//   isPro: boolean;
//   isProAI: boolean;
//   showAdsApp: boolean; // app-wide (free only)
//   showAdsAI: boolean; // AI screens (free & pro)
//   isLoading: boolean;
// };

// const DEFAULT: Entitlements = {
//   plan: "free",
//   planEndsAt: null,
//   isPro: false,
//   isProAI: false,
//   showAdsApp: true,
//   showAdsAI: true,
//   isLoading: true,
// };

// const EntitlementsCtx = createContext<Entitlements>(DEFAULT);

// export function EntitlementsProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [ent, setEnt] = useState<Entitlements>(DEFAULT);

//   const hydrate = async (userId: string) => {
//     // Let RevenueCat write back the truth first (no-op if unchanged).
//     try {
//       await syncEntitlementsToSupabase(userId);
//     } catch {}
//     const { data } = await supabase
//       .from("profiles")
//       .select("plan, plan_ends_at")
//       .eq("id", userId)
//       .maybeSingle();

//     const plan = ((data?.plan as Plan) ?? "free") as Plan;
//     setEnt({
//       plan,
//       planEndsAt: data?.plan_ends_at ?? null,
//       isPro: plan === "pro" || plan === "pro_ai",
//       isProAI: plan === "pro_ai",
//       showAdsApp: plan === "free",
//       showAdsAI: plan !== "pro_ai", // only Pro+AI removes AI-page ads
//       isLoading: false,
//     });
//   };

//   // lib/entitlements.tsx (inside EntitlementsProvider)
//   useEffect(() => {
//     const sub = DeviceEventEmitter.addListener(
//       "fitflow:entitlementsUpdated",
//       refetch
//     );
//     return () => sub.remove();
//   }, [refetch]);

//   // Initial load
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       const { data: auth } = await supabase.auth.getUser();
//       const userId = auth?.user?.id;
//       if (!mounted) return;
//       if (userId) await hydrate(userId);
//       else setEnt((e) => ({ ...e, isLoading: false }));
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // Global refresh hook (call requestEntitlementsRefresh() after checkout/restores)
//   useEffect(() => {
//     const sub = DeviceEventEmitter.addListener(
//       "entitlements:refresh",
//       async () => {
//         const { data: auth } = await supabase.auth.getUser();
//         const userId = auth?.user?.id;
//         if (userId) await hydrate(userId);
//       }
//     );
//     return () => {
//       try {
//         sub.remove();
//       } catch {}
//     };
//   }, []);

//   const value = useMemo(() => ent, [ent]);
//   return (
//     <EntitlementsCtx.Provider value={value}>
//       {children}
//     </EntitlementsCtx.Provider>
//   );
// }

// export const useEntitlements = () => useContext(EntitlementsCtx);

// // Fire this whenever purchases change (successful checkout, restore, logout, etc.)
// export const requestEntitlementsRefresh = () =>
//   DeviceEventEmitter.emit("entitlements:refresh");

// // Friendly gates your screens can use
// export const hasPro = (e: Entitlements) => e.isPro;
// export const hasProAI = (e: Entitlements) => e.isProAI;
// export const shouldShowAdsAppWide = (e: Entitlements) => e.showAdsApp;
// export const shouldShowAdsInAI = (e: Entitlements) => e.showAdsAI;


// src/lib/entitlements.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { supabase } from "../lib/api";
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
