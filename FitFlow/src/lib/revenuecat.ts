// // // // src/lib/revenuecat.ts
// // // import { Linking, Platform } from "react-native";
// // // import Purchases, { CustomerInfo, PurchasesOffering } from "react-native-purchases";

// // // // --- Optional: keep Supabase `profiles.plan` in sync on-device ----
// // // import { supabase } from "./api";

// // // // === Configure these to match your RevenueCat project ===
// // // const RC_IOS_KEY = "appl_xxx";
// // // const RC_ANDROID_KEY = "goog_xxx";

// // // // Entitlement IDs in RevenueCat (Dashboard → Entitlements)
// // // export type Plan = "free" | "pro" | "pro_ai";
// // // const ENTITLEMENT_PRO = "pro";
// // // const ENTITLEMENT_PRO_AI = "pro_ai";

// // // // Package identifiers in your Offering (Dashboard → Offerings → Packages)
// // // export type BillingTerm = "monthly" | "yearly";
// // // export const PACKAGE_IDS = {
// // //   pro: { monthly: "pro_monthly", yearly: "pro_yearly" },
// // //   pro_ai: { monthly: "proai_monthly", yearly: "proai_yearly" },
// // // } as const;

// // // export async function initPurchases(userId?: string) {
// // //   await Purchases.configure({
// // //     apiKey: Platform.select({ ios: RC_IOS_KEY, android: RC_ANDROID_KEY })!,
// // //   });
// // //   if (userId) {
// // //     try { await Purchases.logIn(userId); } catch { /* already logged in or anon */ }
// // //   }
// // // }

// // // export async function logOutPurchases() {
// // //   try { await Purchases.logOut(); } catch {}
// // // }

// // // export function planFromCustomerInfo(ci: CustomerInfo): Plan {
// // //   const active = ci.entitlements.active;
// // //   if (active[ENTITLEMENT_PRO_AI]) return "pro_ai";
// // //   if (active[ENTITLEMENT_PRO]) return "pro";
// // //   return "free";
// // // }

// // // export async function getCurrentPlan(): Promise<Plan> {
// // //   const { current } = await Purchases.getOfferings();
// // //   if (!current) {
// // //     // No offering available doesn’t mean no entitlement; still check CI
// // //   }
// // //   const ci = await Purchases.getCustomerInfo();
// // //   return planFromCustomerInfo(ci);
// // // }

// // // export async function getOfferings(): Promise<PurchasesOffering | null> {
// // //   const { current } = await Purchases.getOfferings();
// // //   return current ?? null;
// // // }

// // // export async function purchaseByIdentifier(pkgIdentifier: string): Promise<Plan> {
// // //   const offering = await getOfferings();
// // //   if (!offering) throw new Error("Store not available. Try again shortly.");
// // //   const pkg = offering.availablePackages.find(p => p.identifier === pkgIdentifier);
// // //   if (!pkg) throw new Error("Package not found.");
// // //   const { customerInfo } = await Purchases.purchasePackage(pkg);
// // //   return planFromCustomerInfo(customerInfo);
// // // }

// // // export async function restoreAndGetPlan(): Promise<Plan> {
// // //   const { customerInfo } = await Purchases.restorePurchases();
// // //   return planFromCustomerInfo(customerInfo);
// // // }

// // // // Deep link to native “Manage subscription” pages
// // // export function openManageSubscriptions() {
// // //   if (Platform.OS === "ios") {
// // //     Linking.openURL("https://apps.apple.com/account/subscriptions");
// // //   } else {
// // //     Linking.openURL("https://play.google.com/store/account/subscriptions?package=com.fitflow");
// // //   }
// // // } // adjust import if your client lives elsewhere

// // // export async function syncEntitlementsToSupabase(userId: string): Promise<Plan> {
// // //   const plan = await getCurrentPlan();
// // //   // Update your profile row; ignore errors silently
// // //   await supabase.from("profiles").update({ plan }).eq("id", userId);
// // //   return plan;
// // // }


// // // src/lib/revenuecat.ts
// // import { Platform } from "react-native";
// // import Purchases, {
// //     CustomerInfo,
// //     LOG_LEVEL,
// //     PurchasesOfferings,
// //     PurchasesPackage,
// // } from "react-native-purchases";
// // import { supabase } from "../lib/api";

// // /**
// //  * ──────────────────────────────────────────────────────────────────────────────
// //  * RevenueCat <-> Supabase bridge
// //  * - Define two entitlements in RevenueCat:  "pro"  and  "pro_ai"
// //  * - Map them to your products / packages in RC dashboard.
// //  * - We persist { plan, plan_ends_at } into profiles(id) in Supabase.
// //  * ──────────────────────────────────────────────────────────────────────────────
// //  */

// // export type Plan = "free" | "pro" | "pro_ai";

// // export const ENTITLEMENTS = {
// //   PRO: "pro",
// //   PRO_AI: "pro_ai",
// // } as const;

// // const RC_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? "";
// // const RC_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? "";

// // const RC_KEY = Platform.select({
// //   ios: RC_IOS,
// //   android: RC_ANDROID,
// //   default: RC_IOS || RC_ANDROID,
// // }) as string;

// // /** Call once after login (and on app start if you keep the session). */
// // export async function initRevenueCat(userId?: string) {
// //   if (!RC_KEY) {
// //     if (__DEV__) console.warn("[RevenueCat] API key missing. Set EXPO_PUBLIC_RC_API_KEY_*");
// //     return;
// //   }
// //   Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
// //   await Purchases.configure({ apiKey: RC_KEY, appUserID: userId || undefined });

// //   // Optional: attach attributes for support/debugging
// //   try {
// //     const { data: auth } = await supabase.auth.getUser();
// //     const uid = auth?.user?.id ?? userId;
// //     if (uid) {
// //       await Purchases.setAttributes({
// //         supabase_user_id: uid,
// //         platform: Platform.OS,
// //       });
// //     }
// //   } catch {}
// // }

// // /** Identify after login if you configured Purchases without an appUserID. */
// // export async function identifyRevenueCat(userId: string) {
// //   try {
// //     await Purchases.logIn(userId);
// //   } catch (e) {
// //     if (__DEV__) console.warn("[RevenueCat] logIn failed:", e);
// //   }
// // }

// // /** Logout on sign-out (RC switches to anonymous). */
// // export async function logoutRevenueCat() {
// //   try {
// //     await Purchases.logOut();
// //   } catch (e) {
// //     if (__DEV__) console.warn("[RevenueCat] logOut failed:", e);
// //   }
// // }

// // /** Load offerings to render your paywall. */
// // export async function getOfferings(): Promise<PurchasesOfferings | null> {
// //   try {
// //     return await Purchases.getOfferings();
// //   } catch (e) {
// //     if (__DEV__) console.warn("[RevenueCat] getOfferings failed:", e);
// //     return null;
// //   }
// // }

// // /** Purchase a package from an offering. Returns updated CustomerInfo. */
// // export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
// //   try {
// //     const { customerInfo } = await Purchases.purchasePackage(pkg);
// //     await syncEntitlementsToSupabase(); // persist plan -> Supabase
// //     return customerInfo;
// //   } catch (e: any) {
// //     // Ignore user-cancelled purchases
// //     if (e?.userCancelled) return null;
// //     if (__DEV__) console.warn("[RevenueCat] purchasePackage failed:", e);
// //     return null;
// //   }
// // }

// // /** Restore purchases (useful on reinstall or platform switch). */
// // export async function restorePurchases(): Promise<CustomerInfo | null> {
// //   try {
// //     const customerInfo = await Purchases.restorePurchases();
// //     await syncEntitlementsToSupabase();
// //     return customerInfo;
// //   } catch (e) {
// //     if (__DEV__) console.warn("[RevenueCat] restorePurchases failed:", e);
// //     return null;
// //   }
// // }

// // /**
// //  * Read active RC entitlements, map to your Plan, and upsert into Supabase.
// //  * Your EntitlementsProvider calls this on hydrate; call it after purchases too.
// //  */
// // export async function syncEntitlementsToSupabase(userIdParam?: string) {
// //   // 1) Resolve user
// //   let userId = userIdParam;
// //   if (!userId) {
// //     const { data: auth } = await supabase.auth.getUser();
// //     userId = auth?.user?.id ?? undefined;
// //   }
// //   if (!userId) return;

// //   // 2) Read RC state
// //   let info: CustomerInfo | null = null;
// //   try {
// //     info = await Purchases.getCustomerInfo();
// //   } catch (e) {
// //     if (__DEV__) console.warn("[RevenueCat] getCustomerInfo failed:", e);
// //   }

// //   // 3) Map to plan
// //   const { plan, planEndsAt } = mapCustomerInfoToPlan(info);

// //   // 4) Persist into Supabase
// //   try {
// //     // Ensure a row exists and update plan
// //     await supabase
// //       .from("profiles")
// //       .upsert(
// //         { id: userId, plan, plan_ends_at: planEndsAt ?? null },
// //         { onConflict: "id" }
// //       )
// //       .select("*"); // keep TypeScript happy and return updated row for logs if needed
// //   } catch (e) {
// //     if (__DEV__) console.warn("[RevenueCat] upsert profiles failed:", e);
// //   }
// // }

// // /** Helper: interpret RC entitlements -> { plan, planEndsAt } */
// // function mapCustomerInfoToPlan(ci: CustomerInfo | null | undefined): {
// //   plan: Plan;
// //   planEndsAt?: string | null;
// // } {
// //   if (!ci) return { plan: "free", planEndsAt: null };

// //   // If both are active, prefer PRO_AI
// //   const active = ci.entitlements.active || {};
// //   const proAI = active[ENTITLEMENTS.PRO_AI];
// //   const pro = active[ENTITLEMENTS.PRO];

// //   if (proAI) {
// //     return { plan: "pro_ai", planEndsAt: proAI.expirationDate ?? null };
// //   }
// //   if (pro) {
// //     return { plan: "pro", planEndsAt: pro.expirationDate ?? null };
// //   }
// //   return { plan: "free", planEndsAt: null };
// // }


// // lib/revenuecat.ts
// import { DeviceEventEmitter, Linking, Platform } from "react-native";
// import Purchases, {
//     CustomerInfo,
//     PurchasesOffering,
//     PurchasesPackage,
// } from "react-native-purchases";
// // If you keep plan in Supabase, uncomment next line and wire it up
// // import { supabase } from "./api";

// const RC_KEY_IOS = process.env.EXPO_PUBLIC_RC_KEY_IOS!;
// const RC_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_KEY_ANDROID!;

// // Map active RC entitlements -> your app plan
// export type AppPlan = "free" | "pro" | "pro_ai";
// export function mapActiveToPlan(active: CustomerInfo["entitlements"]["active"]): AppPlan {
//   if (active["pro_ai"]) return "pro_ai";
//   if (active["pro"]) return "pro";
//   return "free";
// }

// // Call once after login (or app start if anonymous)
// export async function configureRevenueCat(appUserId?: string) {
//   const apiKey = Platform.select({ ios: RC_KEY_IOS, android: RC_KEY_ANDROID });
//   if (!apiKey) throw new Error("RevenueCat API key missing");

//   await Purchases.configure({ apiKey, appUserID: appUserId });
//   // Optional: debugging
//   // Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
// }

// // Convenience wrappers
// export async function getOfferings(): Promise<PurchasesOffering | null> {
//   const o = await Purchases.getOfferings();
//   return o.current ?? null;
// }

// export async function purchaseByIdentifier(identifier: string): Promise<AppPlan> {
//   const offerings = await Purchases.getOfferings();
//   const pkg: PurchasesPackage | undefined = offerings.current?.availablePackages
//     .find(p => p.identifier === identifier);
//   if (!pkg) throw new Error("Package not found. Try again shortly.");

//   const { customerInfo } = await Purchases.purchasePackage(pkg);
//   const plan = mapActiveToPlan(customerInfo.entitlements.active);
//   await afterPlanChange(plan);
//   return plan;
// }

// export async function restoreAndGetPlan(): Promise<AppPlan> {
//   const { customerInfo } = await Purchases.restorePurchases();
//   const plan = mapActiveToPlan(customerInfo.entitlements.active);
//   await afterPlanChange(plan);
//   return plan;
// }

// async function afterPlanChange(plan: AppPlan) {
//   // Optional: sync to Supabase so everything else (e.g., EntitlementsProvider) reads a single source of truth.
//   // const { data: { user } } = await supabase.auth.getUser();
//   // if (user) {
//   //   await supabase.from("profiles").update({ plan }).eq("id", user.id); // <-- adjust table/column to your schema
//   // }
//   DeviceEventEmitter.emit("fitflow:entitlementsUpdated", { plan });
// }

// // Native store manage-subscription shortcut
// export function openManageSubscriptions() {
//   if (Platform.OS === "ios") {
//     Linking.openURL("https://apps.apple.com/account/subscriptions");
//   } else {
//     Linking.openURL("https://play.google.com/store/account/subscriptions");
//   }
// }


import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOfferings,
    PurchasesPackage,
} from "react-native-purchases";
import { supabase } from "./api";
import {
    Plan,
    requestEntitlementsRefresh,
} from "./entitlements";

// ---- Product/entitlement mapping -------------------------------------------------
// Use the RevenueCat *entitlement identifiers* you set in the dashboard.
// We'll prefer entitlements, but also fall back to product IDs if needed.

const ENTITLEMENT_PRO = "pro";
const ENTITLEMENT_PRO_AI = "pro_ai";

// If you use product-id-based mapping (fallback), list them here.
// Example patterns — replace with your real product IDs.
const PRO_PRODUCT_IDS = [
  "pro_monthly",
  "pro_yearly",
];
const PRO_AI_PRODUCT_IDS = [
  "proai_monthly",
  "proai_yearly",
];

export type AppPlan = "free" | "pro" | "pro_ai";
// ---- Init / Identity -------------------------------------------------------------

export const isExpoGo = Constants.appOwnership === "expo";

export async function initRevenueCat() {
  const iosKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_RC_KEY_IOS || Constants.manifest?.extra?.EXPO_PUBLIC_RC_KEY_IOS;
  const androidKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_RC_KEY_ANDROID || Constants.manifest?.extra?.EXPO_PUBLIC_RC_KEY_ANDROID;

  const apiKey = Platform.select({
    ios: iosKey,
    android: androidKey,
  });

  if (!apiKey) {
    console.warn("[RevenueCat] Missing EXPO_PUBLIC_RC_KEY_IOS / EXPO_PUBLIC_RC_KEY_ANDROID");
    return;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  await Purchases.configure({ apiKey });
}

export async function identify(appUserId: string) {
  try {
    await Purchases.logIn(appUserId);
    // After identification, refresh entitlements app-wide
    requestEntitlementsRefresh();
  } catch (e) {
    console.warn("[RevenueCat] identify failed:", e);
  }
}

export async function logout() {
  try {
    await Purchases.logOut();
    requestEntitlementsRefresh();
  } catch (e) {
    console.warn("[RevenueCat] logout failed:", e);
  }
}

// ---- Offerings / Purchase / Restore ---------------------------------------------

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (e) {
    console.warn("[RevenueCat] getOfferings failed:", e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    await Purchases.purchasePackage(pkg);
    // Let the app reload/display new gates
    requestEntitlementsRefresh();
  } catch (e: any) {
    // user cancellation is expected — don’t spam logs
    if (e?.userCancelled) return;
    console.warn("[RevenueCat] purchasePackage failed:", e);
  }
}

export async function restorePurchases() {
  try {
    await Purchases.restorePurchases();
    requestEntitlementsRefresh();
  } catch (e) {
    console.warn("[RevenueCat] restorePurchases failed:", e);
  }
}

// ---- Sync to Supabase (used by EntitlementsProvider.hydrate) ---------------------

/**
 * Reads RevenueCat customer info and writes { plan, plan_ends_at } to Supabase.
 * Your EntitlementsProvider then reads from Supabase and sets the app gates.
 */
export async function syncEntitlementsToSupabase(userId: string) {
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();

    // 1) Prefer entitlements (the cleanest signal)
    const activeEnts = info?.entitlements?.active || {};
    const hasProAIEnt = !!activeEnts[ENTITLEMENT_PRO_AI];
    const hasProEnt = !!activeEnts[ENTITLEMENT_PRO];

    let plan: Plan = "free";
    let endsAt: string | null = null;

    if (hasProAIEnt) {
      plan = "pro_ai";
      // RevenueCat gives expirationDate for subscription entitlements (string or null)
      endsAt = activeEnts[ENTITLEMENT_PRO_AI]?.expirationDate ?? null;
    } else if (hasProEnt) {
      plan = "pro";
      endsAt = activeEnts[ENTITLEMENT_PRO]?.expirationDate ?? null;
    } else {
      // 2) Fallback to product IDs (in case you didn't wire entitlements yet)
      const actives = info.activeSubscriptions || [];
      const hasProAIProduct = actives.some((id) => PRO_AI_PRODUCT_IDS.includes(id));
      const hasProProduct = actives.some((id) => PRO_PRODUCT_IDS.includes(id));

      if (hasProAIProduct) plan = "pro_ai";
      else if (hasProProduct) plan = "pro";
      else plan = "free";

      // RC doesn’t expose per-product expiry easily in this fallback path — leave null
      endsAt = null;
    }

    // 3) Persist to Supabase (profiles table, id is your auth user id)
    const { error } = await supabase
      .from("profiles")
      .update({ plan, plan_ends_at: endsAt })
      .eq("id", userId);

    if (error) {
      console.warn("[RevenueCat] Supabase update failed:", error.message);
    }
  } catch (e) {
    // In dev / simulators you may see network errors before sandbox is set up
    console.warn("[RevenueCat] syncEntitlementsToSupabase failed:", e);
  }
}

// Native store manage-subscription shortcut
export function openManageSubscriptions() {
  if (Platform.OS === "ios") {
    Linking.openURL("https://apps.apple.com/account/subscriptions");
  } else {
    Linking.openURL("https://play.google.com/store/account/subscriptions");
  }
}