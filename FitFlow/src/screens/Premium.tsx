

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  PACKAGE_TYPE,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";
import { useEntitlements } from "../lib/entitlements";
import {
  getOfferings,
  openManageSubscriptions,
  purchasePackage,
  restorePurchases,
} from "../lib/revenuecat";
import { useTheme } from "../theme/theme";

// ---------- Types & constants ----------
type Term = "monthly" | "yearly";
type PlanKey = "premium" | "ai"; // premium = Pro (non-AI), ai = Pro+AI

// Fallback labels if price strings aren't loaded yet
const FALLBACK_PRICING: Record<PlanKey, Record<Term, string>> = {
  premium: { monthly: "£1.49", yearly: "£12.99" },
  ai: { monthly: "£3.49", yearly: "£19.99" },
};

// Match package identifiers you defined in RevenueCat dashboard
const PKG_ID: Record<PlanKey, Record<Term, string>> = {
  premium: { monthly: "pro_monthly", yearly: "pro_yearly" },
  ai: { monthly: "proai_monthly", yearly: "proai_yearly" },
};

const FEATURE_GROUPS: Record<
  PlanKey,
  { title: string; items: string[]; icon: React.ReactNode }[]
> = {
  premium: [
    {
      title: "Progress faster",
      items: [
        "PR badges & 1RM estimates",
        "Warm-up / Main / Cool-down blocks",
        "Volume charts by muscle group",
      ],
      icon: <MaterialCommunityIcons name="rocket-launch-outline" size={18} />,
    },
    {
      title: "Save time",
      items: [
        "Quick add sets & supersets",
        "Full template library + custom packs",
        "Import to Log/Schedule",
      ],
      icon: <Ionicons name="time-outline" size={18} />,
    },
    {
      title: "See your wins",
      items: [
        "Unlimited history & insights",
        "Day-of-week heatmap",
        "Ad-free across the app (AI pages may show ads)",
      ],
      icon: <Ionicons name="trophy-outline" size={18} />,
    },
  ],
  ai: [
    {
      title: "Progress faster",
      items: [
        "AI SmartWorkouts auto-progress sets, reps & weight",
        "Personalised Warm-up / Main / Cool-down blocks",
        "Deload & recovery suggestions",
      ],
      icon: <MaterialCommunityIcons name="rocket-launch-outline" size={18} />,
    },
    {
      title: "Save time",
      items: [
        "AI auto-fill when importing to Log/Schedule",
        "Full template library + custom packs",
        "Unlimited AI credits (fast lane)",
      ],
      icon: <Ionicons name="time-outline" size={18} />,
    },
    {
      title: "See your wins",
      items: [
        "Unlimited history & insights",
        "PR badges & AI-estimated 1RMs",
        "No ads anywhere (including AI pages)",
      ],
      icon: <Ionicons name="trophy-outline" size={18} />,
    },
  ],
};

// Helper: safe JSON parse for values
const parseMaybeJSON = (v: string | null) => {
  if (v == null) return null;
  try { return JSON.parse(v); } catch { return v; }
};

// Dump AsyncStorage to console
async function logAsyncStorage(prefix = 'Upgrade') {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    const snapshot: Record<string, unknown> = {};
    for (const [k, v] of pairs) snapshot[k] = parseMaybeJSON(v);
    console.log(`[${prefix}] AsyncStorage dump (${keys.length} keys):`, snapshot);
  } catch (e) {
    console.warn('[Upgrade] Failed to read AsyncStorage', e);
  }
}

// ---------- Component ----------
export default function Paywall() {
  const navigation = useNavigation<any>();

  const { colors } = useTheme();
  const ent = useEntitlements();

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [term, setTerm] = useState<Term>("yearly");
  const [selected, setSelected] = useState<PlanKey>("ai");
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    // Log storage once on mount
    logAsyncStorage('Upgrade:mount');
  }, []);

  const refreshDebug = useCallback(() => {
    logAsyncStorage('Upgrade:refresh');
  }, []);


  const continueFree = async () => {
    await AsyncStorage.multiSet([
      ["tier", "free"],
      ["signedIn", "false"],
      // sb_user_id intentionally omitted for free users
    ]);
    // Straight into the app, local-only
    navigation.reset({
      index: 0,
      routes: [{ name: "AppTabs" }], // <- change to your main app navigator
    });
  };

  const goPro = async (tier: "pro" | "pro_ai") => {
    // It's okay to set tier now; costs are gated by signedIn === 'true'
    await AsyncStorage.setItem("tier", tier);
    navigation.navigate("Auth", {
      screen: "SignUp",
      params: { postSignInTarget: "AppTabs" }, // where to land after signup
    });
  };

  // Load current offerings from RevenueCat
  useEffect(() => {
    (async () => {
      try {
        const o = await getOfferings(); // returns PurchasesOfferings
        setOfferings(o);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? String(e));
      }
    })();
  }, []);

  // Flatten all packages from offerings (current + all)
  const allPackages: PurchasesPackage[] = useMemo(() => {
    if (!offerings) return [];
    const currentPkgs = offerings.current?.availablePackages ?? [];
    const others = offerings.all
      ? Object.values(offerings.all).flatMap(
          (off) => off?.availablePackages ?? []
        )
      : [];
    // de-dup by identifier
    const byId = new Map<string, PurchasesPackage>();
    [...currentPkgs, ...others].forEach((p) => byId.set(p.identifier, p));
    return [...byId.values()];
  }, [offerings]);

  // Find a package by our custom identifier mapping
  // Fallback finder that tolerates different setups
  const findPackage = (
    plan: PlanKey,
    t: Term,
    packages: PurchasesPackage[],
    offs: PurchasesOfferings | null
  ): PurchasesPackage | undefined => {
    // 1) exact match by identifier (your dashboard “package identifier”)
    const custom = packages.find((p) => p.identifier === PKG_ID[plan][t]);
    if (custom) return custom;

    // 2) fallback by package type (most common)
    const byType = packages.find((p) =>
      t === "monthly"
        ? p.packageType === PACKAGE_TYPE.MONTHLY
        : p.packageType === PACKAGE_TYPE.ANNUAL
    );
    if (byType) return byType;

    // 3) worst case: first available in current offering
    return offs?.current?.availablePackages?.[0];
  };

  // Price text honoring plan + term args
  const displayPrice = (plan: PlanKey, t: Term) => {
    const pkg = findPackage(plan, t, allPackages, offerings);
    return pkg?.product.priceString ?? FALLBACK_PRICING[plan][t];
  };

  const youAreOn = useMemo(() => {
    switch (ent.plan) {
      case "pro_ai":
        return "Pro + AI";
      case "pro":
        return "Pro";
      default:
        return "Free";
    }
  }, [ent.plan]);

  const subscribe = async (plan: PlanKey) => {
    try {
      setLoadingPlan(plan);
      const pkg = findPackage(plan, term, allPackages, offerings);
      if (!pkg) {
        Alert.alert(
          "Not available",
          "This plan/term isn't available in your store region yet."
        );
        return;
      }
      const newPlan = await purchasePackage(pkg); // helper emits refresh to entitlements
      Alert.alert(
        "Success",
        `You're on ${
          newPlan === "pro_ai" ? "Pro + AI" : newPlan === "pro" ? "Pro" : "Free"
        } 🎉`
      );
    } catch (e: any) {
      Alert.alert("Purchase failed", e?.message ?? String(e));
    } finally {
      setLoadingPlan(null);
    }
  };

  const restore = async () => {
    try {
      setRestoring(true);
      const newPlan = await restorePurchases();
      Alert.alert(
        "Restored",
        `You're on ${
          newPlan === "pro_ai" ? "Pro + AI" : newPlan === "pro" ? "Pro" : "Free"
        }.`
      );
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? String(e));
    } finally {
      setRestoring(false);
    }
  };

  // ---------- UI subcomponents ----------
  const TermToggle = () => (
    <View
      style={[styles.toggleWrap, { backgroundColor: colors.inputBackground }]}
    >
      <TouchableOpacity
        onPress={() => setTerm("monthly")}
        style={[
          styles.toggleBtn,
          term === "monthly" && {
            backgroundColor: colors.surface,
            shadowOpacity: 0.12,
          },
        ]}
        activeOpacity={0.9}
      >
        <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
          Monthly
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setTerm("yearly")}
        style={[
          styles.toggleBtn,
          term === "yearly" && {
            backgroundColor: colors.surface,
            shadowOpacity: 0.12,
          },
        ]}
        activeOpacity={0.9}
      >
        <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
          Yearly
        </Text>
        <Text style={[styles.toggleBadge, { color: colors.textSecondary }]}>
          2 months free
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Header = () => (
    <LinearGradient
      colors={[colors.primary, "#6EA6FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Text style={styles.hEyebrow}>
        You’re on {youAreOn} {selected === "ai" ? "• AI ready" : ""}
      </Text>
      <Text style={styles.hTitle}>
        Train smarter with AI-powered progressions
      </Text>
      <Text style={styles.hSub}>
        Faster gains, less guesswork. Unlock auto-progressions, deeper insights,
        and an ad-free experience.
      </Text>
    </LinearGradient>
  );

  const Feature = ({
    icon,
    title,
    items,
  }: {
    icon: React.ReactNode;
    title: string;
    items: string[];
  }) => (
    <View style={[styles.featureBlock, { backgroundColor: colors.surface }]}>
      <View style={styles.featureHeader}>
        <View
          style={[styles.featureIcon, { backgroundColor: "rgba(0,0,0,0.06)" }]}
        >
          {React.cloneElement(icon as any, { color: colors.textPrimary })}
        </View>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      {items.map((t, i) => (
        <View key={`${title}-${i}`} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            {t}
          </Text>
        </View>
      ))}
    </View>
  );

  const PlanCard = ({
    planKey,
    title,
    subtitle,
    highlight,
    includesAI,
  }: {
    planKey: PlanKey;
    title: string;
    subtitle: string;
    highlight?: string;
    includesAI?: boolean;
  }) => {
    const price = displayPrice(planKey, term);
    const isActive =
      (ent.plan === "pro" && planKey === "premium") ||
      (ent.plan === "pro_ai" && planKey === "ai");

    return (
      <View
        style={[
          styles.planCard,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.planHead}>
          <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {highlight ? (
            <View style={[styles.badge, { backgroundColor: "#00000020" }]}>
              <Text style={styles.badgeText}>{highlight}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.planSub, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            {price}
          </Text>
          <Text style={[styles.per, { color: colors.textSecondary }]}>
            {" "}
            / {term === "yearly" ? "year" : "month"}
          </Text>
        </View>

        {includesAI ? (
          <View style={styles.aiRow}>
            <MaterialCommunityIcons
              name="robot-happy"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>
              Includes AI Coach
            </Text>
          </View>
        ) : (
          <View style={styles.aiRow}>
            <MaterialCommunityIcons
              name="robot-confused"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>
              AI Coach not included (ads may show on AI pages)
            </Text>
          </View>
        )}

        <TouchableOpacity
          disabled={isActive || loadingPlan === planKey}
          onPress={() => subscribe(planKey)}
          activeOpacity={0.9}
          style={{ borderRadius: 12, overflow: "hidden", marginTop: 12 }}
        >
          <LinearGradient
            colors={
              isActive ? ["#9AA0A6", "#9AA0A6"] : [colors.primary, "#4A6C6F"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            {loadingPlan === planKey ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                {isActive
                  ? "Active"
                  : planKey === "ai"
                  ? "Upgrade to Pro + AI"
                  : "Upgrade to Pro"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.smallPrint, { color: colors.textSecondary }]}>
          Cancel anytime • Secure checkout
        </Text>
      </View>
    );
  };

  // ---------- Render ----------
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <Header />

        <View style={{ paddingHorizontal: 16, marginTop: -30 }}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Plan toggle */}
            <View
              style={[
                styles.planToggleWrap,
                { backgroundColor: colors.inputBackground },
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelected("premium")}
                style={[
                  styles.planToggleBtn,
                  selected === "premium" && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color:
                      selected === "premium"
                        ? colors.textPrimary
                        : colors.textSecondary,
                  }}
                >
                  Pro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelected("ai")}
                style={[
                  styles.planToggleBtn,
                  selected === "ai" && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color:
                      selected === "ai"
                        ? colors.textPrimary
                        : colors.textSecondary,
                  }}
                >
                  Pro + AI
                </Text>
              </TouchableOpacity>
            </View>

            {/* Term toggle */}
            <TermToggle />

            {/* Features driven by selected plan */}
            {FEATURE_GROUPS[selected].map((block, idx) => (
              <Feature
                key={`${selected}-block-${idx}`}
                icon={block.icon}
                title={block.title}
                items={block.items}
              />
            ))}
          </View>

          {/* Plans (selected plan first) */}
          {selected === "premium" ? (
            <>
              <PlanCard
                planKey="premium"
                title="Pro"
                subtitle="All features, no ads (AI pages may still show ads)."
                highlight="Best value"
                includesAI={false}
              />
              {/* <PlanCard
                planKey="ai"
                title="Pro + AI"
                subtitle="Everything in Pro, plus unlimited AI with fast lane."
                includesAI
              /> */}
            </>
          ) : (
            <>
              <PlanCard
                planKey="ai"
                title="Pro + AI"
                subtitle="Everything in Pro, plus unlimited AI with fast lane."
                includesAI
              />
              {/* <PlanCard
                planKey="premium"
                title="Pro"
                subtitle="All features, no ads (AI pages may still show ads)."
                highlight="Best value"
                includesAI={false}
              /> */}
            </>
          )}

          {/* Restore / Footer */}
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <TouchableOpacity
              onPress={restore}
              style={styles.restoreBtn}
              disabled={restoring}
              activeOpacity={0.8}
            >
              {restoring ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={colors.textPrimary}
                  />
                  <Text
                    style={[styles.restoreTxt, { color: colors.textPrimary }]}
                  >
                    Restore purchases
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openManageSubscriptions}
              style={{ paddingVertical: 6 }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  textDecorationLine: "underline",
                }}
              >
                Manage subscriptions
              </Text>
            </TouchableOpacity>

            <Text style={[styles.legal, { color: colors.textSecondary }]}>
              Prices shown are examples. Your local store pricing may differ.
              Subscriptions auto-renew. Cancel anytime in your App Store / Play
              Store settings.
            </Text>
          </View>
        </View>
        <View
        style={{ flex: 1, padding: 24, justifyContent: "center", 
            backgroundColor: colors.warning, elevation: 5, marginBottom: 36
             }}
      >
        <Text style={{ fontSize: 24, marginBottom: 16 }}>Upgrade</Text>
        <Text style={{ opacity: 0.7, marginBottom: 24 }}>
          Choose Free (local only) or unlock sync & AI with Pro.
        </Text>

        <TouchableOpacity
          onPress={continueFree}
          style={{
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: colors.background,
          }}
        >
          <Text style={{ textAlign: "center" }}>Continue Free</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>{" "}
      {/* Continue free button for logged-out users */}
      
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  hEyebrow: {
    color: "#FFFFFFD0",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  hTitle: { color: "#fff", fontSize: 24, fontWeight: "800", lineHeight: 30 },
  hSub: { color: "#FFFFFFD0", marginTop: 8, fontSize: 14, lineHeight: 20 },

  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },

  // plan toggle
  planToggleWrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 6,
    marginBottom: 10,
  },
  planToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // term toggle
  toggleWrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 6,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  toggleText: { fontWeight: "800", fontSize: 14 },
  toggleBadge: { fontSize: 11, marginTop: 2 },

  // features
  featureBlock: { borderRadius: 12, padding: 12, marginTop: 10 },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  featureTitle: { fontWeight: "800", fontSize: 15 },
  featureRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  featureText: { marginLeft: 6, fontSize: 13 },

  // plan card
  planCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
  },
  planHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planTitle: { fontSize: 18, fontWeight: "800" },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  planSub: { fontSize: 13, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  price: { fontSize: 26, fontWeight: "900", letterSpacing: -0.2 },
  per: { marginLeft: 6, fontSize: 13 },

  aiRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  aiText: { marginLeft: 6, fontSize: 13 },

  cta: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  smallPrint: { textAlign: "center", marginTop: 8, fontSize: 12 },

  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  restoreTxt: { marginLeft: 6, fontWeight: "700" },

  legal: {
    textAlign: "center",
    fontSize: 12,
    paddingHorizontal: 16,
    marginTop: 6,
  },
});
