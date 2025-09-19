import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../theme/theme";

// ────────────────────────────────────────────────────────────────────────────────
// Steps (includes Motivation/Goals grid + Age scroller + Diet + Activity slider)
const steps = [
  "Welcome",
  "Name",
  "BasicsAndAge",
  "Experience",
  "Motivation",
  "Activity",
  "Metrics",
  "Availability",
  "Review",
] as const;

export type Step = (typeof steps)[number];

export type AgeRange =
  | "Under 18"
  | "18–24"
  | "25–34"
  | "35–44"
  | "45–54"
  | "55–64"
  | "Over 64";

type FocusPart =
  | "Full body"
  | "Arms"
  | "Belly"
  | "Butt"
  | "Thighs"
  | "Back"
  | "Chest";
type DietType = "Regular" | "Vegetarian" | "Keto" | "Vegan" | "Other";
type ActivityLevel = "Sedentary" | "Lightly active" | "Active" | "Very active";

// Profile shape saved for the AI coach to use later
export type UserProfile = {
  name?: string;
  sex?: "Male" | "Female" | "Other";
  ageRange?: AgeRange;
  ageYears?: number;
  experience?: "Beginner" | "Intermediate" | "Advanced";
  goals?: string[]; // “What brings you?” multi-select
  focusParts?: FocusPart[];
  dietType?: DietType;
  activityLevel?: ActivityLevel;
  units?: "metric" | "imperial";
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  availabilityDays?: number;
  // injuriesNote?: string;
  createdAt?: string;
};

// Helpers
const screenW = Dimensions.get("window").width;
const screenH = Dimensions.get("window").height;
const isSmall = screenH < 740; // small devices
const isTiny = screenH < 660; // very small devices
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

// Uniform vertical offset for section titles to match Stoic template
const SECTION_OFFSET = isTiny ? 24 : isSmall ? 30 : 36;

// Create an inclusive numeric range
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Map numeric age → range label (for backwards compatibility with your profile)
function ageToRange(age?: number): AgeRange | undefined {
  if (!age && age !== 0) return undefined;
  if (age < 18) return "Under 18";
  if (age <= 24) return "18–24";
  if (age <= 34) return "25–34";
  if (age <= 44) return "35–44";
  if (age <= 54) return "45–54";
  if (age <= 64) return "55–64";
  return "Over 64";
}

// ────────────────────────────────────────────────────────────────────────────────
const ROUTES = {
  UPGRADE: "Upgrade", // <- change if your screen is named differently
};

export default function Onboarding() {
  const navigation = useNavigation<any>();
  const { setHasOnboarded } = useAuth();
  const { colors, gradients, isDark, shadow, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const fonts = (typography as any).fonts ?? {
    regular: "Inter",
    medium: "InterMedium",
    semibold: "InterSemibold",
    bold: "InterBold",
    black: "InterBlack",
  };

  const PageWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View
      style={{
        width: screenW,
        alignItems: "center",
        justifyContent: "flex-start",
        flex: 1,
        paddingTop: 0,
      }}
    >
      {children}
    </View>
  );

  const VPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 0,
        paddingTop: 4,
        paddingBottom: isTiny ? 160 : isSmall ? 140 : 120, // leave room for CTA
        minHeight: screenH * 0.9,
        width: "100%",
      }}
    >
      {children}
    </View>
  );

  const topSafe = Math.max(insets.top, 20);
  const contentTopOffset = topSafe + 24;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Step>>(null);

  // Form state
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"Male" | "Female" | "Other" | "">("");
  const [ageYears, setAgeYears] = useState<number | undefined>(18);
  const [experience, setExperience] = useState<
    "Beginner" | "Intermediate" | "Advanced" | ""
  >("");

  // “What brings you” goals (cards, multi-select)
  const motivationOptions = [
    { key: "Lose weight", icon: "" },
    { key: "Gain strength", icon: "" },
    { key: "Improve stamina", icon: "" },
    { key: "Increase flexibility", icon: "" },
    { key: "Build muscle", icon: "" },
    { key: "Improve mobility", icon: "" },
    { key: "Reduce stress", icon: "" },
    { key: "Stay consistent", icon: "" },
  ] as const;
  const [goals, setGoals] = useState<string[]>([]);

  const [focusParts, setFocusParts] = useState<FocusPart[]>([]);
  const [dietType, setDietType] = useState<DietType | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");

  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [height, setHeight] = useState(""); // cm or 5'10
  const [weight, setWeight] = useState(""); // kg or lb
  const [targetWeight, setTargetWeight] = useState(""); // kg or lb

  const [availability, setAvailability] = useState<number | null>(null);

  // Navigation helpers
  const goToIndex = (idx: number) =>
    flatListRef.current?.scrollToIndex({ index: idx });

  // const goToDashboard = () => {
  //   // Prefer a plain navigate: it works across nested navigators without requiring a reset.
  //   try {
  //     // @ts-ignore
  //     navigation.navigate('Dashboard');
  //     return;
  //   } catch {}

  //   // Try parent navigators as a fallback (if wrapped in a Root / Tabs navigator)
  //   try {
  //     navigation.getParent()?.navigate('Dashboard' as never);
  //     return;
  //   } catch {}

  //   // Last resort: attempt replace, but only if the name exists in the current stack
  //   try {
  //     const state: any = (navigation as any).getState?.() ?? {};
  //     const names: string[] = Array.isArray(state?.routeNames) ? state.routeNames : [];
  //     if (names.includes('Dashboard')) {
  //       // @ts-ignore
  //       navigation.replace('Dashboard');
  //     }
  //   } catch {}
  // };

  // const handleNext = async () => {
  //   if (currentIndex < steps.length - 1) {
  //     goToIndex(currentIndex + 1);
  //     return;
  //   }
  //   const profile: UserProfile = buildProfile();
  //   try {
  //     // await saveProfile(profile);
  //     //setHasOnboarded(true);
  //    // goToDashboard();
  //    await AsyncStorage.setItem('profile', JSON.stringify(profile));
  //    await AsyncStorage.setItem('onboarding_done', 'true');

  //   // Send EVERYONE to Upgrade next
  //   navigation.reset({
  //     index: 0,
  //     routes: [{ name: ROUTES.UPGRADE }],
  //   });
  //   } catch {
  //     // Even if persisting fails, proceed to Dashboard so the user can continue
  //     //setHasOnboarded(true);
  //     console.log('Error saving profile');
  //     //goToDashboard();
  //   }
  // };

  const [submitting, setSubmitting] = useState(false);
  // Build saved profile
  const buildProfile = (): UserProfile => ({
    name: name.trim() || undefined,
    sex: sex || undefined,
    ageYears,
    ageRange: ageToRange(ageYears),
    experience: experience || undefined,
    goals,
    focusParts,
    dietType: dietType || undefined,
    activityLevel: activityLevel || undefined,
    units,
    heightCm: parseHeightToCm(height, units),
    weightKg: parseWeightToKg(weight, units),
    targetWeightKg: parseWeightToKg(targetWeight, units),
    availabilityDays: availability ?? undefined,
    createdAt: new Date().toISOString().split("T")[0],
  });

  const handleNext = useCallback(async () => {
    if (submitting) return;

    if (currentIndex < steps.length - 1) {
      goToIndex(currentIndex + 1);
      return;
    }

    setSubmitting(true);
    const profile: UserProfile = buildProfile();

    try {
      await AsyncStorage.multiSet([
        ["profile", JSON.stringify(profile)],
        ["onboarding_done", "true"],
      ]);
      // Everyone goes to Upgrade next
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.UPGRADE }], // make sure this route name exists
      });
    } catch (e) {
      console.warn("Error saving profile", e);
    }
    // no finally needed since we navigate away
  }, [submitting, currentIndex, goToIndex, navigation, buildProfile]);

  const handleBack = () => {
    if (currentIndex > 0) goToIndex(currentIndex - 1);
  };

  // ────────────────────────────────────────────────────────────────────────────────
  // Unit helpers
  function parseHeightToCm(
    text: string,
    mode: "metric" | "imperial"
  ): number | undefined {
    if (!text) return undefined;
    if (mode === "metric") {
      const cm = Number(text);
      return Number.isFinite(cm) ? cm : undefined;
    }
    const m = text.match(/(\d+)[\'\-\s]?(\d+)?/);
    if (!m) return undefined;
    const ft = parseInt(m[1] || "0", 10);
    const inch = parseInt(m[2] || "0", 10);
    return Math.round((ft * 12 + inch) * 2.54);
  }
  function parseWeightToKg(
    text: string,
    mode: "metric" | "imperial"
  ): number | undefined {
    if (!text) return undefined;
    const n = Number(text);
    if (!Number.isFinite(n)) return undefined;
    return mode === "metric" ? n : Math.round(n * 0.453592 * 10) / 10;
  }

  // Validate next
  const canNext = (): boolean => {
    const step = steps[currentIndex];
    switch (step) {
      case "Name":
        return !!name.trim();
      case "BasicsAndAge":
        return !!sex && !!ageYears;
      case "Experience":
        return !!experience;
      case "Motivation":
        return goals.length > 0;
      case "Activity":
        return !!activityLevel;
      case "Metrics":
        return !!height && !!weight; // target optional
      case "Availability":
        return availability !== null;
      default:
        return true;
    }
  };

  // ────────────────────────────────────────────────────────────────────────────────
  // Re-usable UI
  const Pill = ({
    label,
    selected,
    onPress,
    full,
  }: {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    full?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[
        pillStyles.pill,
        full && pillStyles.pillFull,
        // base color per theme
        isDark && { backgroundColor: "#2A2A2A", borderColor: "#3A3A3A" },
        // selected color per theme
        selected &&
          (isDark
            ? { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" }
            : { backgroundColor: "#0F0F0F", borderColor: "#0F0F0F" }),
        isSmall && { height: 52, borderRadius: 24 },
        isTiny && { height: 48, borderRadius: 22 },
      ]}
    >
      <Text
        style={[
          pillStyles.pillText,
          { fontFamily: fonts.semibold, color: isDark ? "#FFFFFF" : "#1A1A1A" },
          selected && (isDark ? { color: "#0F0F0F" } : { color: "#FFFFFF" }),
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const HeaderLabel: React.FC<{ label: string }> = ({ label }) => (
    <Text style={[styles.sectionLabel, { fontFamily: fonts.semibold }]}>
      {label}
    </Text>
  );

  const Section = ({
    title,
    subtitle,
    children,
    center,
    style,
  }: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    center?: boolean;
    style?: any;
  }) => (
    <View
      style={{
        width: screenW - 36,
        maxWidth: 560,
        alignSelf: "center",
        marginTop: SECTION_OFFSET,
        marginBottom: 18,
        ...(style || {}),
      }}
    >
      <Text
        style={[
          typography.h2,
          {
            color: colors.textPrimary,
            textAlign: center ? "center" : "left",
            marginBottom: 4,
            fontFamily: fonts.bold,
          },
        ]}
      >
        {title}
      </Text>
      {!!subtitle && (
        <Text
          style={{
            color: colors.textSecondary,
            textAlign: center ? "center" : "left",
            marginBottom: 10,
            fontFamily: fonts.medium,
          }}
        >
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );

  // Age scroller pieces
  const ages = useMemo(() => range(13, 80), []);
  const ageItemWidth = 44;
  const ageListRef = useRef<FlatList<number>>(null);
  const ageScrollRef = useRef<ScrollView>(null);
  const initialAgeIndex = Math.max(
    0,
    ages.findIndex((a) => a === ageYears) || 0
  );

  useEffect(() => {
    // center the initial age
    requestAnimationFrame(() => {
      ageScrollRef.current?.scrollTo({
        x: initialAgeIndex * ageItemWidth,
        y: 0,
        animated: false,
      });
    });
  }, [initialAgeIndex]);

  const renderStep = ({ item }: { item: Step }) => {
    switch (item) {
      // Welcome
      case "Welcome":
        return (
          <PageWrap>
            <Pressable
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={{ flex: 1, width: "100%" }}
            >
              <VPage>
                {/* Hero container */}
                <View
                  style={{
                    position: "relative",
                    width: screenW - 36,
                    marginTop: isTiny
                      ? topSafe + 28
                      : isSmall
                      ? topSafe + 34
                      : topSafe + 40,
                  }}
                >
                  {/* Decorative glows behind */}
                  <LinearGradient
                    colors={[colors.premiumGold, "rgba(255,214,120,0)"] as any}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      top: -40,
                      left: -40,
                      width: 180,
                      height: 180,
                      borderRadius: 120,
                      opacity: 0.22,
                    }}
                  />
                  <LinearGradient
                    colors={["#000000", "#1A1A1A"] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      right: -32,
                      bottom: -24,
                      width: 200,
                      height: 200,
                      borderRadius: 140,
                      opacity: 0.35,
                    }}
                  />

                  {/* Main card */}
                  <LinearGradient
                    colors={gradients.blackGoldSubtle as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.welcomeHero,
                      shadow("lg"),
                      isSmall && { paddingVertical: 36 },
                      isTiny && { paddingVertical: 28 },
                    ]}
                  >
                    {/* Logo */}
                    <Image
                      source={require("../../assets/images/fitflow.png")}
                      resizeMode="contain"
                      accessibilityRole="image"
                      accessibilityLabel="FitFlow logo"
                      style={{ width: 140, height: 140, marginBottom: 6 }}
                    />

                    {/* Badge */}
                    <View style={styles.welcomeBadge}>
                      <Text
                        style={[
                          styles.welcomeBadgeText,
                          { color: colors.premiumGold },
                        ]}
                      >
                        FITFLOW · AI COACH
                      </Text>
                    </View>

                    {/* Title */}
                    <Text
                      style={[styles.welcomeTitle, { fontFamily: fonts.black }]}
                    >
                      Your AI fitness companion
                    </Text>

                    {/* Subtitle */}
                    <Text
                      style={[
                        styles.welcomeSubtitle,
                        { fontFamily: fonts.medium },
                      ]}
                    >
                      Personalized plans. Adaptive workouts. Real results.
                    </Text>

                    {/* Feature chips */}
                    <View style={styles.welcomeChipsRow}>
                      <View style={styles.welcomeChip}>
                        <Text style={styles.welcomeChipText}>Personalized</Text>
                      </View>
                      <View style={styles.welcomeChip}>
                        <Text style={styles.welcomeChipText}>Adaptive</Text>
                      </View>
                      <View style={styles.welcomeChip}>
                        <Text style={styles.welcomeChipText}>Habit‑aware</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Hint */}
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 22,
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: "600",
                    fontFamily: fonts.semibold,
                  }}
                >
                  Tap anywhere to begin
                </Text>
              </VPage>
            </Pressable>
          </PageWrap>
        );

      // Name only
      case "Name":
        return (
          <PageWrap>
            <Section
              title="Your name"
              subtitle="We’ll personalize your plan with this."
              center
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  styles.inputRounded,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                  },
                  { fontFamily: fonts.semibold },
                ]}
                returnKeyType="done"
                submitBehavior="submit"
              />
            </Section>
          </PageWrap>
        );

      // Basics and Age (sex and age picker only)
      case "BasicsAndAge":
        return (
          <PageWrap>
            <VPage>
              <Section
                title="Tell us about you"
                subtitle="Select your sex and age."
                center
              >
                {/* Sex */}
                <HeaderLabel label="Biological sex" />
                <View style={pillStyles.stackList}>
                  {(["Male", "Female", "Other"] as const).map((opt) => (
                    <Pill
                      key={opt}
                      label={opt}
                      selected={sex === opt}
                      onPress={() => setSex(opt as any)}
                      full
                    />
                  ))}
                </View>
                {/* Age (horizontal picker) */}
                <HeaderLabel label="Age" />
                <View
                  style={{ alignItems: "center", width: "100%", marginTop: 2 }}
                >
                  <View
                    style={{
                      width: "100%",
                      maxWidth: 560,
                      alignSelf: "center",
                      height: isTiny ? 64 : isSmall ? 72 : 80,
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        marginLeft: -6,
                        width: 0,
                        height: 0,
                        borderLeftWidth: 6,
                        borderRightWidth: 6,
                        borderTopWidth: 8,
                        borderLeftColor: "transparent",
                        borderRightColor: "transparent",
                        borderTopColor: colors.premiumGold,
                      }}
                    />
                    <ScrollView
                      ref={ageScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={ageItemWidth}
                      decelerationRate="fast"
                      contentOffset={{
                        x: initialAgeIndex * ageItemWidth,
                        y: 0,
                      }}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(
                          e.nativeEvent.contentOffset.x / ageItemWidth
                        );
                        const val = clamp(ages[idx], 13, 80);
                        setAgeYears(val);
                        // snap exactly to the center of the chosen item
                        ageScrollRef.current?.scrollTo({
                          x: idx * ageItemWidth,
                          y: 0,
                          animated: true,
                        });
                      }}
                      contentContainerStyle={{
                        paddingHorizontal:
                          (screenW - 36) / 2 - ageItemWidth / 2,
                        alignItems: "center",
                        paddingTop: 12,
                      }}
                      keyboardShouldPersistTaps="always"
                    >
                      {ages.map((a) => {
                        const selected = a === ageYears;
                        return (
                          <View
                            key={a}
                            style={{
                              width: ageItemWidth,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 24,
                                color: selected
                                  ? colors.textPrimary
                                  : colors.textSecondary,
                                opacity: selected ? 1 : 0.45,
                                fontFamily: selected
                                  ? fonts.black
                                  : fonts.semibold,
                              }}
                            >
                              {a}
                            </Text>
                            {selected && (
                              <View
                                style={{
                                  marginTop: 6,
                                  width: 18,
                                  height: 3,
                                  borderRadius: 2,
                                  backgroundColor: colors.premiumGold,
                                }}
                              />
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Section>
            </VPage>
          </PageWrap>
        );

      // Experience
      case "Experience":
        return (
          <PageWrap>
            <VPage>
              <Section
                title="Experience level"
                subtitle="So we can set appropriate intensity and progressions."
                center
              >
                <View style={pillStyles.stackList}>
                  {(["Beginner", "Intermediate", "Advanced"] as const).map(
                    (lvl) => (
                      <Pill
                        key={lvl}
                        label={lvl}
                        selected={experience === lvl}
                        onPress={() => setExperience(lvl)}
                        full
                      />
                    )
                  )}
                </View>
              </Section>
            </VPage>
          </PageWrap>
        );

      // Motivation (stacked pill buttons)
      case "Motivation":
        return (
          <PageWrap>
            <Section
              title="What brings you to FitFlow?"
              subtitle="Select your goals."
              center
            >
              <View style={[styles.optionList, { marginTop: 0 }]}>
                {motivationOptions.map((m) => {
                  const selected = goals.includes(m.key);
                  return (
                    <Pressable
                      key={m.key}
                      accessibilityRole="button"
                      onPress={() =>
                        setGoals((prev) =>
                          prev.includes(m.key)
                            ? prev.filter((x) => x !== m.key)
                            : [...prev, m.key]
                        )
                      }
                      style={({ pressed }) => [
                        styles.optionButton,
                        // base per theme
                        isDark && {
                          backgroundColor: "#2A2A2A",
                          borderColor: "#3A3A3A",
                        },
                        // selected per theme (overrides default selected style)
                        selected && styles.optionButtonSelected,
                        selected &&
                          (isDark
                            ? {
                                backgroundColor: "#FFFFFF",
                                borderColor: "#FFFFFF",
                              }
                            : null),
                        pressed && {
                          transform: [{ scale: 0.98 }],
                          opacity: 0.95,
                        },
                        isSmall && { height: 52, borderRadius: 24 },
                        isTiny && { height: 48, borderRadius: 22 },
                        shadow("xs"),
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: isDark ? "#FFFFFF" : "#1A1A1A" },
                          selected &&
                            (isDark
                              ? { color: "#0F0F0F" }
                              : styles.optionTextSelected),
                        ]}
                      >
                        {m.key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text
                style={[
                  styles.footerNote,
                  { color: colors.textSecondary, fontFamily: fonts.medium },
                ]}
              >
                Your selections won’t limit access to any features.
              </Text>
            </Section>
          </PageWrap>
        );

      // Activity slider (4 stops)
      case "Activity":
        return (
          <PageWrap>
            <VPage>
              <Section
                title="What’s your activity level?"
                subtitle="How active are most of your days?"
                center
              >
                <View style={{ alignItems: "center", width: "100%" }}>
                  <View
                    style={{
                      width: "92%",
                      maxWidth: 520,
                      alignSelf: "center",
                      backgroundColor: colors.card ?? "#FFFFFF",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#EAEAEA",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      alignItems: "center",
                      marginBottom: 12,
                      ...shadow("xs"),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        color: colors.textPrimary,
                        marginBottom: 2,
                        fontFamily: fonts.bold,
                      }}
                    >
                      {activityLevel || "Select level"}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontFamily: fonts.medium,
                      }}
                    >
                      {activityLevel === "Sedentary"
                        ? "I spend most of my day sitting"
                        : activityLevel === "Lightly active"
                        ? "I move a bit each day"
                        : activityLevel === "Active"
                        ? "I’m on my feet or exercise often"
                        : activityLevel === "Very active"
                        ? "Training or heavy activity most days"
                        : "Pick the closest match"}
                    </Text>
                  </View>

                  {/* Slider */}
                  <View
                    style={{ width: "92%", maxWidth: 520, alignSelf: "center" }}
                  >
                    <View
                      style={{
                        height: 40,
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      {/* Track behind dots */}
                      <View
                        style={{
                          height: 5,
                          backgroundColor: "#E5E5E5",
                          borderRadius: 999,
                          zIndex: 0,
                          marginHorizontal: 20,
                        }}
                      />

                      {/* Dots layered above track */}
                      <View
                        style={{
                          position: "absolute",
                          width: "100%",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          zIndex: 1,
                        }}
                      >
                        {(
                          [
                            "Sedentary",
                            "Lightly active",
                            "Active",
                            "Very active",
                          ] as ActivityLevel[]
                        ).map((lvl) => {
                          const selected = activityLevel === lvl;
                          return (
                            <Pressable
                              key={lvl}
                              onPress={() => setActivityLevel(lvl)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: selected ? 22 : 18,
                                  height: selected ? 22 : 18,
                                  borderRadius: 999,
                                  backgroundColor: selected
                                    ? isDark
                                      ? colors.premiumGold
                                      : "#0F0F0F"
                                    : "#BDBDBD",
                                  shadowColor: selected
                                    ? isDark
                                      ? colors.premiumGold
                                      : "#000"
                                    : "transparent",
                                  shadowOpacity: selected ? 0.18 : 0,
                                  shadowRadius: selected ? 6 : 0,
                                  shadowOffset: selected
                                    ? { width: 0, height: 2 }
                                    : { width: 0, height: 0 },
                                  elevation: selected ? 3 : 0,
                                }}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <Text
                        style={[
                          styles.sliderLabel,
                          { fontFamily: fonts.semibold },
                        ]}
                      >
                        Sedentary
                      </Text>
                      <Text
                        style={[
                          styles.sliderLabel,
                          { fontFamily: fonts.semibold },
                        ]}
                      >
                        Very active
                      </Text>
                    </View>
                  </View>
                </View>
              </Section>
            </VPage>
          </PageWrap>
        );

      // Metrics (KG/LB segmented with current + target)
      case "Metrics":
        return (
          <PageWrap>
            <VPage>
              <Section
                title="Your metrics"
                subtitle="We’ll store values in metric internally."
                center
              >
                {/* Units segmented control */}
                <View style={segStyles.wrap}>
                  {(["metric", "imperial"] as const).map((u) => {
                    const selected = units === u;
                    return (
                      <Pressable
                        key={u}
                        onPress={() => setUnits(u)}
                        style={[
                          segStyles.seg,
                          selected && segStyles.segActive,
                          shadow("xs"),
                        ]}
                      >
                        <Text
                          style={[
                            segStyles.segText,
                            {
                              fontFamily: selected
                                ? fonts.bold
                                : fonts.semibold,
                            },
                            selected && segStyles.segTextActive,
                          ]}
                        >
                          {u === "metric" ? "KG" : "LB"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Inputs */}
                <KeyboardAvoidingView
                  behavior={Platform.select({
                    ios: "padding",
                    android: undefined,
                  })}
                >
                  <Text style={[styles.label, { fontFamily: fonts.semibold }]}>
                    Current weight ({units === "metric" ? "kg" : "lb"})
                  </Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    submitBehavior="submit"
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                      },
                      { fontFamily: fonts.semibold },
                    ]}
                  />
                  <Text style={[styles.label, { fontFamily: fonts.semibold }]}>
                    Target weight ({units === "metric" ? "kg" : "lb"})
                  </Text>
                  <TextInput
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    submitBehavior="submit"
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                      },
                      { fontFamily: fonts.semibold },
                    ]}
                  />
                  <Text style={[styles.label, { fontFamily: fonts.semibold }]}>
                    {units === "metric" ? "Height (cm)" : "Height (ft'in)"}
                  </Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    placeholder={units === "metric" ? "e.g. 178" : "e.g. 5'10"}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    submitBehavior="submit"
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                      },
                      { fontFamily: fonts.semibold },
                    ]}
                  />
                </KeyboardAvoidingView>
              </Section>
            </VPage>
          </PageWrap>
        );

      // Availability
      case "Availability":
        return (
          <PageWrap>
            <VPage>
              <Section
                title="How many days per week?"
                subtitle="We’ll build schedules around your availability."
                center
              >
                <View style={pillStyles.stackList}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Pill
                      key={n}
                      label={`${n} day${n > 1 ? "s" : ""}`}
                      selected={availability === n}
                      onPress={() => setAvailability(n)}
                      full
                    />
                  ))}
                </View>
              </Section>
            </VPage>
          </PageWrap>
        );

      // Review
      case "Review":
        // Review
        const profile = buildProfile();
        const section = (
          title: string,
          rows: [string, string | undefined][]
        ) => (
          <View
            style={[
              styles.reviewCard,
              {
                backgroundColor:
                  (colors as any).card ?? (isDark ? "#141414" : "#FFFFFF"),
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.reviewSectionTitle,
                { fontFamily: fonts.bold, color: colors.textPrimary },
              ]}
            >
              {title}
            </Text>
            {rows
              .filter(([_, v]) => v && String(v).length > 0)
              .map(([k, v], idx, arr) => (
                <View key={k}>
                  <View style={styles.reviewRow}>
                    <Text
                      style={[
                        styles.reviewKey,
                        {
                          color: colors.textSecondary,
                          fontFamily: fonts.semibold,
                        },
                      ]}
                    >
                      {k}
                    </Text>
                    <Text
                      style={[
                        styles.reviewValue,
                        { color: colors.textPrimary, fontFamily: fonts.bold },
                      ]}
                      numberOfLines={2}
                    >
                      {v as string}
                    </Text>
                  </View>
                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.reviewDivider,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  )}
                </View>
              ))}
          </View>
        );

        const fmtUnits = units === "metric" ? "kg" : "lb";
        const Personal = section("Personal", [
          ["Name", profile.name],
          ["Sex", profile.sex],
          [
            "Age",
            profile.ageYears
              ? String(profile.ageYears)
              : profile.ageRange || undefined,
          ],
          ["Created", profile.createdAt],
        ]);
        const GoalsSec = section("Goals", [
          [
            "Goals",
            profile.goals && profile.goals.length
              ? profile.goals.join(", ")
              : undefined,
          ],
          ["Experience", profile.experience],
          ["Activity", profile.activityLevel],
        ]);
        const MetricsSec = section("Metrics", [
          [
            "Units",
            units === "metric" ? "Metric (kg, cm)" : "Imperial (lb, ft/in)",
          ],
          [
            "Current weight",
            profile.weightKg !== undefined
              ? `${profile.weightKg}${units === "metric" ? " kg" : ""}`
              : undefined,
          ],
          [
            "Target weight",
            profile.targetWeightKg !== undefined
              ? `${profile.targetWeightKg}${units === "metric" ? " kg" : ""}`
              : undefined,
          ],
          [
            "Height",
            profile.heightCm !== undefined
              ? `${profile.heightCm} cm`
              : undefined,
          ],
        ]);
        const PrefsSec = section("Preferences", [
          [
            "Availability",
            profile.availabilityDays !== undefined
              ? `${profile.availabilityDays} day${
                  (profile.availabilityDays || 0) > 1 ? "s" : ""
                }/week`
              : undefined,
          ],
        ]);

        return (
          <PageWrap>
            <VPage>
              <Section
                title="Review"
                subtitle="You can update these later in Settings."
                center
              >
                <View style={{ width: "100%", gap: 12 }}>
                  {Personal}
                  {GoalsSec}
                  {MetricsSec}
                  {PrefsSec}
                </View>
              </Section>
            </VPage>
          </PageWrap>
        );
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / Dimensions.get("window").width
    );
    setCurrentIndex(index);
  };

  const progress = useMemo(
    () => (currentIndex <= 0 ? 0 : currentIndex / (steps.length - 1)),
    [currentIndex]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top actions */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={[
            styles.backButton,
            { top: topSafe + 14, paddingHorizontal: 10, paddingVertical: 10 },
          ]}
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={[styles.backText, { color: colors.textPrimary }]}>
            {"‹"}
          </Text>
        </TouchableOpacity>
      )}
      {currentIndex > 0 && currentIndex < steps.length - 1 && (
        <TouchableOpacity
          style={[
            styles.skipButton,
            { top: topSafe + 14, paddingHorizontal: 10, paddingVertical: 10 },
          ]}
          onPress={handleNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Gold progress bar (starts from Name) */}
      {currentIndex > 0 && (
        <View
          style={{
            height: 7,
            backgroundColor: isDark ? "#1E1E1E" : "#ECE6D7",
            borderRadius: 999,
            overflow: "hidden",
            marginHorizontal: 30,
            marginTop: topSafe + 9,
          }}
        >
          <LinearGradient
            colors={[
              colors.premiumGold,
              (colors as any).premiumGoldDark ?? colors.accent,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 999,
            }}
          />
        </View>
      )}

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={steps}
        horizontal
        pagingEnabled
        snapToInterval={screenW}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScrollToIndexFailed={({ index }) =>
          setTimeout(
            () =>
              flatListRef.current?.scrollToIndex?.({ index, animated: true }),
            50
          )
        }
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={renderStep}
        keyboardShouldPersistTaps="always"
        onMomentumScrollEnd={onScrollEnd}
        scrollEnabled
        contentContainerStyle={{
          paddingTop: topSafe + 24,
          paddingBottom: 28,
          flexGrow: 1,
        }}
        getItemLayout={(_, index) => ({
          length: screenW,
          offset: screenW * index,
          index,
        })}
        initialNumToRender={1}
        windowSize={3}
        removeClippedSubviews
      />

      {/* CTA (hidden on Welcome) */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: canNext()
                ? isDark
                  ? "#FFFFFF"
                  : "#0F0F0F"
                : isDark
                ? "#3A3A3A"
                : "#2B2B2B",
              opacity: canNext() ? 1 : 0.45,
              marginBottom: 28,
            },
            isSmall && { paddingVertical: 16 },
            isTiny && { paddingVertical: 14 },
            shadow("md"),
          ]}
          onPress={handleNext}
          disabled={!canNext()}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: isDark ? "#0F0F0F" : "#FFFFFF",
                fontFamily: fonts.black,
              },
            ]}
          >
            {currentIndex === steps.length - 1 ? "Finish" : "Next"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Styles

const pillStyles = StyleSheet.create({
  pill: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pillSelected: {
    backgroundColor: "#0F0F0F",
    borderColor: "#0F0F0F",
    shadowOpacity: 0.15,
  },
  pillText: {
    color: "#1A1A1A",
    fontSize: 18,
  },
  stackList: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  pillFull: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: "100%",
  },
});

const cardStyles = StyleSheet.create({
  grid: {
    width: "100%",
    gap: 12,
    rowGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    aspectRatio: 1.05,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardText: {
    color: "#1A1A1A",
    textAlign: "center",
    fontSize: 17,
    alignSelf: "center",
  },
});

const rowCardStyles = StyleSheet.create({
  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: { fontSize: 22, marginRight: 14 },
  rowText: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
});

const segStyles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 999,
    padding: 4,
    marginBottom: 8,
    gap: 6,
  },
  seg: {
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    alignItems: "center",
    justifyContent: "center",
  },
  segActive: { backgroundColor: "#0F0F0F", borderColor: "#0F0F0F" },
  segText: { color: "#1A1A1A" },
  segTextActive: { color: "#FFFFFF" },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAF6",
  },
  banner: {
    borderRadius: 28,
    paddingVertical: 42,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  welcomeHero: {
    borderRadius: 28,
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  welcomeBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 6,
    marginBottom: 6,
  },
  welcomeBadgeText: {
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: "900",
    color: "#EAD8A0",
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    letterSpacing: -0.4,
    textAlign: "center",
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  welcomeSubtitle: {
    color: "#E5E5E5",
    textAlign: "center",
    marginTop: 10,
    maxWidth: 360,
    fontSize: 15.5,
    lineHeight: 22,
  },
  welcomeChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  welcomeChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  welcomeChipText: {
    color: "#F1F1F1",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 7,
    color: "#8E8E8E",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#8E8E8E",
    letterSpacing: 0.2,
    marginTop: 6,
    marginBottom: 4,
    textAlign: "center",
  },
  input: {
    borderWidth: 1.2,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 6,
    marginTop: 2,
    alignSelf: "stretch",
    textAlign: "center",
  },
  inputRounded: {
    borderRadius: 28,
  },
  textArea: {
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: "top",
    marginTop: 2,
    marginBottom: 0,
    alignSelf: "stretch",
  },
  continueButton: {
    width: "88%",
    alignSelf: "center",
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 28,
    marginBottom: 18,
    marginTop: 0,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  buttonText: {
    fontSize: 17,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  skipButton: {
    position: "absolute",
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  backButton: {
    position: "absolute",
    left: 24,
    zIndex: 10,
  },
  backText: {
    fontSize: 24,
    fontWeight: "700",
  },
  sliderLabel: {
    fontSize: 12,
    color: "#8E8E8E",
  },
  optionList: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 6,
    marginTop: 6,
  },
  optionButton: {
    alignSelf: "stretch",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    height: 52,
    borderRadius: 24,
    paddingVertical: 0,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#0F0F0F",
    borderColor: "#0F0F0F",
  },
  optionText: {
    fontSize: 18,
    color: "#1A1A1A",
    textAlign: "center",
    fontFamily: "InterSemibold",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontFamily: "InterSemibold",
  },
  footerNote: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.1,
  },
  reviewCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reviewSectionTitle: {
    fontSize: 14,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  reviewKey: {
    fontSize: 13,
    maxWidth: "46%",
  },
  reviewValue: {
    fontSize: 15,
    textAlign: "right",
    maxWidth: "52%",
  },
  reviewDivider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});
