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