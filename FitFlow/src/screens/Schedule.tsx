// src/screens/Schedule.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  CommonActions,
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  add,
  addDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSchedule, saveSchedule, saveToHistory } from "../lib/api";
import { MainStackParamList, RootTabParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ✨ Design tokens (new)
const RADIUS = 14;
const CARD_RADIUS = 16;
const SECTION_GAP = 12;

// Contrast helper to ensure readable text on any primary color
const getContrastText = (bg: string) => {
  try {
    let r = 0, g = 0, b = 0, a = 1;
    if (bg.startsWith("#")) {
      const hex = bg.slice(1);
      const toInt = (h: string) => parseInt(h, 16);
      if (hex.length === 3) {
        r = toInt(hex[0] + hex[0]); g = toInt(hex[1] + hex[1]); b = toInt(hex[2] + hex[2]);
      } else if (hex.length === 6 || hex.length === 8) {
        r = toInt(hex.slice(0, 2)); g = toInt(hex.slice(2, 4)); b = toInt(hex.slice(4, 6));
        if (hex.length === 8) a = toInt(hex.slice(6, 8)) / 255;
      }
    } else if (bg.startsWith("rgb")) {
      const nums = bg.replace(/rgba?\(/, "").replace(")", "").split(",").map((n) => parseFloat(n.trim()));
      [r, g, b, a] = [nums[0] || 0, nums[1] || 0, nums[2] || 0, nums[3] ?? 1];
    }
    if (a < 0.35) return "#000";
    const toLinear = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return L > 0.45 ? "#000" : "#fff";
  } catch {
    return "#fff";
  }
};

type TemplateType = "Gym" | "Run" | "Swim" | "Cycle" | "Other";
type FavTemplate = {
  id: string;
  name: string;
  type: TemplateType;
  warmUp?: string[];
  mainSet?: string[];
  coolDown?: string[];
  time?: string;
  distance?: string;
  laps?: string;
  poolLength?: string;
  createdAt: string;
};

const FAV_KEY = "schedule.favorites.v1";

type ImportedScheduleParam = {
  date: string;
  warmUp?: string[];
  mainSet?: string[];
  coolDown?: string[];
  type?: "Gym" | "Run" | "Swim" | "Cycle" | "Other";
  time?: string;
  distance?: string;
}[];

type ScheduleNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Schedule">,
  NativeStackNavigationProp<MainStackParamList>
>;

type SetRow = { reps: string; weight: string; completed?: boolean };
type GymEx = { name: string; setsArr: SetRow[] };


export default function Schedule() {
  const navigation = useNavigation<ScheduleNav>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colors, typography, gradients, shadow, isDark } = useTheme();

  // Core schedule state
  const [plan, setPlan] = useState<any[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessionType, setSessionType] = useState("Gym");

  // Non-gym inputs
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [customType, setCustomType] = useState("");
  const [laps, setLaps] = useState("");
  const [poolLength, setPoolLength] = useState("");

  // Gym inputs
  const [warmUpList, setWarmUpList] = useState([{ name: "", sets: "", reps: "" }]);
  const [mainSetList, setMainSetList] = useState([{ name: "", sets: "", reps: "" }]);
  const [coolDownList, setCoolDownList] = useState([{ name: "", sets: "", reps: "" }]);

  // Legacy import-to-log compatibility
  const [type, setType] = useState("Gym");
  const [notes, setNotes] = useState("");
  const [seg, setSeg] = useState<any>({});
  const [open, setOpen] = useState(false);

  // Favourites
  const [showFavSheet, setShowFavSheet] = useState(false);
  const [pendingFav, setPendingFav] = useState<FavTemplate | null>(null);
  const [favs, setFavs] = useState<FavTemplate[]>([]);
  const [favName, setFavName] = useState("");

  // Layout helpers
  const WIN_H = Dimensions.get("window").height;
  const SMALL = WIN_H < 700;
  const INPUT_H = SMALL ? 42 : 48; // slightly taller inputs
  const [composerOpen, setComposerOpen] = useState(false); // minimized by default ✅

  // id helpers
  const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const withId = (x: any) => (x && x.id ? x : { ...x, id: newId() });
  const stableKey = (it: any, idx: number) => it?.id ?? `${it?.date ?? "na"}-${it?.type ?? "na"}-${idx}`;

  // Icons
  const TypeIcon = ({ type, color }: { type: string; color: string }) => {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
      Gym: "barbell",
      Run: "walk",
      Walk: "walk",
      Cycle: "bicycle",
      Swim: "water",
      Row: "boat",
      Yoga: "leaf",
      Football: "football",
      HIIT: "flash",
      Other: "ellipse",
    } as const;
    const name = map[type] ?? "ellipse";
    return <Ionicons name={name as any} size={20} color={color} />;
  };

  // ——— Effects
  useEffect(() => {
    (async () => {
      const stored = await getSchedule();
      const migrated = (stored ?? []).map(withId);
      setPlan(migrated);
      if ((stored ?? []).some((x: any) => !x?.id)) {
        await saveSchedule(migrated);
      }
    })();
  }, []);

  useEffect(() => {
    const p = (route as any)?.params?.importToLog;
    if (!p) return;

    setType(p.type || "Gym");
    setNotes(p.notes || "");

    if ((p.type || "Gym") === "Gym") {
      setOpen(true);
    } else {
      setSeg(p.segments || {});
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(route as any)?.params?._ts]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAV_KEY);
        setFavs(raw ? JSON.parse(raw) : []);
      } catch {
        setFavs([]);
      }
    })();
  }, []);

  // Import schedule ("Import All to Schedule")
  useEffect(() => {
    const imported: ImportedScheduleParam | undefined = (route as any)?.params?.importedSchedule;
    if (!imported || !Array.isArray(imported) || imported.length === 0) return;

    const mapped = imported.map((d) => ({
      date: d.date,
      type: d.type || "Gym",
      done: false,
      frozen: false,
      warmUp: (d.warmUp || []).slice(0),
      mainSet: (d.mainSet || []).slice(0),
      coolDown: (d.coolDown || []).slice(0),
      time: d.time,
      distance: d.distance,
      laps: (d as any).laps,
      poolLength: (d as any).poolLength,
    }));

    const byKey = new Map<string, any>();
    [...plan, ...mapped].forEach((item) => {
      const key = `${item.date}::${item.customType || item.type}`;
      byKey.set(key, item);
    });
    const merged = Array.from(byKey.values()).sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    (async () => {
      await persist(merged);
      try {
        Alert.alert("Imported", `Added ${mapped.length} day${mapped.length === 1 ? "" : "s"} to your schedule.`);
      } catch {}
    })();

    try {
      (navigation as any).setParams({ importedSchedule: undefined });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.importedSchedule]);

  // ——— Derived + persistence
  const persist = async (newPlan: any[]) => {
    setPlan(newPlan);
    await saveSchedule(newPlan);
  };

  const filtered = plan.filter(
    (d) => (showCompleted ? true : !d.done) && (sessionType === "All" ? true : d.type === sessionType)
  );
  const sortedFiltered = useMemo(
    () => [...filtered].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()),
    [filtered]
  );

  // ——— Actions
  async function completeDay(index: number) {
    const item = plan[index];
    if (!item || item.frozen) return;

    const next = plan.map((d, i) => (i === index ? { ...d, done: true } : d));
    await persist(next);

    const completed = next[index];
    const historyEntry: any = {
      date: completed.date,
      type: completed.type,
      notes: "",
      exercises: [],
      segments: [],
    };

    if (completed.type === "Gym") {
      const parse = (s: string) => {
        const [name, rest = ""] = s.split(":");
        const sets = rest.match(/(\d+)×/)?.[1] || "";
        const reps = rest.match(/×(\d+)/)?.[1] || "";
        return { name: name.trim(), sets, reps, weight: "" };
      };
      historyEntry.exercises = [
        ...(completed.warmUp || []).map(parse),
        ...(completed.mainSet || []).map(parse),
        ...(completed.coolDown || []).map(parse),
      ];
    } else if (completed.type === "Swim") {
      historyEntry.segments = [
        {
          type: "Swim",
          time: completed.time || "",
          laps: completed.laps || "",
          poolLength: completed.poolLength || "",
        },
      ];
    } else {
      historyEntry.segments = [
        {
          type: completed.type,
          time: completed.time || "",
          distance: completed.distance || "",
        },
      ];
    }

    try {
      if (typeof saveToHistory === "function") {
        await saveToHistory(historyEntry);
      }
    } catch (err) {
      console.log("Failed to save to history:", err);
    }
  }

  function toggleFreeze(index: number) {
    const next = plan.map((d, i) => (i === index ? { ...d, frozen: !d.frozen } : d));
    persist(next);
  }

  function removeDay(index: number) {
    const next = plan.filter((_, i) => i !== index);
    persist(next);
  }

  function navigateToLog(params: any) {
    navigation.dispatch(
      CommonActions.navigate({
        name: "Home",
        params: { screen: "Log", params },
      })
    );
  }

  function guessLogType(input?: string) {
    const s = (input || "").trim().toLowerCase();
    const is = (...xs: string[]) => xs.includes(s);
    if (!s) return "Other";
    if (is("run", "running", "jog", "jogging")) return "Run";
    if (is("walk", "walking")) return "Walk";
    if (is("cycle", "cycling", "bike", "biking", "bicycle")) return "Cycle";
    if (is("swim", "swimming")) return "Swim";
    if (is("row", "rowing", "erg")) return "Row";
    if (is("hike", "hiking")) return "Hike";
    if (is("yoga")) return "Yoga";
    if (is("football", "soccer")) return "Football";
    if (is("hiit", "intervals")) return "HIIT";
    if (is("gym", "weights", "lift", "lifting", "strength")) return "Gym";
    return "Other";
  }

  function toExercises(list: string[] = []) {
    return list.map((s) => {
      const [name, rest = ""] = s.split(":");
      const reps = rest.match(/×(\d+)/)?.[1] || "";
      return { name: (name || "").trim(), sets: [{ reps, weight: "" }] };
    });
  }

  function importToLog(day: any, exercise?: string) {
    const effectiveType =
      day.type === "Other" ? guessLogType(day.customType) : day.type || "Other";

    const importPayload: any = {
      type: effectiveType,
      notes: exercise ? exercise : day.customType ? day.customType : "",
      customType: effectiveType === "Other" ? day.customType || "" : undefined,
    };

    if (effectiveType === "Gym") {
      const toPhases = (warm: any[], main: any[], cool: any[]) => [
        { id: "Warm-Up", title: "Warm up", exercises: toExercises(warm) },
        { id: "Main Set", title: "Main set", exercises: toExercises(main) },
        { id: "Cool-Down", title: "Cool down", exercises: toExercises(cool) },
      ];
      importPayload.phases = exercise
        ? toPhases([], [exercise], [])
        : toPhases(day.warmUp, day.mainSet, day.coolDown);
    } else {
      switch (effectiveType) {
        case "Run":
        case "Walk":
        case "Cycle":
          importPayload.segments = {
            distance: day.distance || "",
            duration: day.time || "",
          };
          break;
        case "Swim":
          importPayload.segments = {
            laps: day.laps || "",
            poolLength: day.poolLength || "",
            time: day.time || "",
          };
          break;
        default:
          importPayload.segments = { duration: day.time || "" };
          if (day.distance) importPayload.segments.distance = day.distance;
          break;
      }
    }

    navigateToLog({ importToLog: importPayload, _ts: Date.now() });
  }

  // ——— Add (7-day limit etc.)
  function handleManualScheduleSubmit() {
    if (sessionType === "All") {
      Alert.alert("Pick a Type", "Please choose a specific session type before adding.");
      return;
    }
    if (!selectedDate) {
      Alert.alert("Missing Date", "Please select a date.");
      return;
    }
    const today = new Date();
    const limit = addDays(today, 7);
    if (isBefore(limit, selectedDate)) {
      Alert.alert("Too Far Ahead", "You can only schedule within 7 days from today.");
      return;
    }

    const isoDate = format(selectedDate, "yyyy-MM-dd");
    const newDay: any = {
      id: newId(),
      date: isoDate,
      type: sessionType,
      done: false,
      frozen: false,
    };

    if (sessionType === "Other") {
      const label = (customType || "").trim();
      if (label) newDay.customType = label;
    }

    if (sessionType === "Gym") {
      newDay.warmUp = warmUpList
        .filter((e) => e.name.trim() !== "")
        .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`);
      newDay.mainSet = mainSetList
        .filter((e) => e.name.trim() !== "")
        .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`);
      newDay.coolDown = coolDownList
        .filter((e) => e.name.trim() !== "")
        .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`);
    } else if (sessionType === "Swim") {
      newDay.time = duration;
      newDay.laps = laps;
      newDay.poolLength = poolLength;
    } else {
      newDay.time = duration;
      newDay.distance = distance;
    }

    persist([...plan, newDay]);
    setSelectedDate(null);
    setWarmUpList([{ name: "", sets: "", reps: "" }]);
    setMainSetList([{ name: "", sets: "", reps: "" }]);
    setCoolDownList([{ name: "", sets: "", reps: "" }]);
    setDuration("");
    setDistance("");
    setCustomType("");
    setLaps("");
    setPoolLength("");
  }

  // ——— Favourites helpers
  const saveFavs = async (next: FavTemplate[]) => {
    setFavs(next);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  const makeGymTemplateFromForm = (): FavTemplate => ({
    id: `${Date.now()}`,
    name: `${sessionType} – ${new Date().toLocaleDateString()}`,
    type: "Gym",
    warmUp: warmUpList
      .filter((e) => e.name.trim())
      .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`),
    mainSet: mainSetList
      .filter((e) => e.name.trim())
      .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`),
    coolDown: coolDownList
      .filter((e) => e.name.trim())
      .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`),
    createdAt: new Date().toISOString(),
  });

  const makeCardioTemplateFromForm = (): FavTemplate =>
    sessionType === "Swim"
      ? {
          id: `${Date.now()}`,
          name: `Swim – ${duration || 0}m`,
          type: "Swim",
          time: duration,
          laps,
          poolLength,
          createdAt: new Date().toISOString(),
        }
      : {
          id: `${Date.now()}`,
          name: `${sessionType} – ${duration || 0}m`,
          type: sessionType as "Run" | "Cycle" | "Other",
          time: duration,
          distance,
          createdAt: new Date().toISOString(),
        };

  const applyTemplate = (t: FavTemplate) => {
    setSessionType(t.type);
    if (t.type === "Gym") {
      const parse = (s: string) => {
        const [name, rest = ""] = s.split(":");
        const sets = rest.match(/(\d+)×/)?.[1] || "";
        const reps = rest.match(/×(\d+)/)?.[1] || "";
        return { name: name.trim(), sets, reps };
      };
      setWarmUpList((t.warmUp || []).map(parse).concat({ name: "", sets: "", reps: "" }));
      setMainSetList((t.mainSet || []).map(parse).concat({ name: "", sets: "", reps: "" }));
      setCoolDownList((t.coolDown || []).map(parse).concat({ name: "", sets: "", reps: "" }));
      setDuration("");
      setDistance("");
      setLaps("");
      setPoolLength("");
    } else if (t.type === "Swim") {
      setDuration(t.time || "");
      setLaps(t.laps || "");
      setPoolLength(t.poolLength || "");
      setDistance("");
      setWarmUpList([{ name: "", sets: "", reps: "" }]);
      setMainSetList([{ name: "", sets: "", reps: "" }]);
      setCoolDownList([{ name: "", sets: "", reps: "" }]);
    } else {
      setDuration(t.time || "");
      setDistance(t.distance || "");
      setWarmUpList([{ name: "", sets: "", reps: "" }]);
      setMainSetList([{ name: "", sets: "", reps: "" }]);
      setCoolDownList([{ name: "", sets: "", reps: "" }]);
    }
  };

  const isSimilarTemplate = (a: FavTemplate, b: FavTemplate) => {
    if (a.type !== b.type) return false;
    if (a.type === "Gym") {
      const join = (xs?: string[]) => (xs || []).join("|");
      return join(a.mainSet) === join(b.mainSet) && join(a.warmUp) === join(b.warmUp) && join(a.coolDown) === join(b.coolDown);
    }
    return (a.time || "") === (b.time || "") && (a.distance || "") === (b.distance || "");
  };

  const makeTemplateFromItem = (item: any): FavTemplate => ({
    id: `${Date.now()}`,
    name: `${item.customType || item.type} – ${format(parseISO(item.date), "dd/MM")}`,
    type: (item.type ?? "Other") as TemplateType,
    warmUp: item.warmUp,
    mainSet: item.mainSet,
    coolDown: item.coolDown,
    time: item.time,
    distance: item.distance,
    laps: item.laps,
    poolLength: item.poolLength,
    createdAt: new Date().toISOString(),
  });

  const itemIsFavorited = (item: any) => {
    const tpl = makeTemplateFromItem(item);
    return favs.some((f) => isSimilarTemplate(f, tpl));
  };

  const removeTemplate = async (id: string) => {
    const next = favs.filter((f) => f.id !== id);
    await saveFavs(next);
  };

  const saveFavouriteNow = async (tpl: FavTemplate, nameOverride?: string) => {
    const finalName = (nameOverride ?? tpl.name).trim() || tpl.name;
    const candidate = { ...tpl, name: finalName };
    const exists = favs.some((f) => isSimilarTemplate(f, candidate));
    if (exists) {
      Alert.alert("Already saved", "This favourite already exists.");
      return;
    }
    await saveFavs([candidate, ...favs].slice(0, 20));
    Alert.alert("Saved", "Template added to your favourites.");
  };

  const startFavoriteFromForm = () => {
    if (sessionType === "All") {
      Alert.alert("Pick a Type", "Please choose a specific session type before saving.");
      return;
    }
    const tpl = sessionType === "Gym" ? makeGymTemplateFromForm() : makeCardioTemplateFromForm();
    // @ts-ignore (iOS)
    if (Alert.prompt) {
      // @ts-ignore
      Alert.prompt(
        "Save as Favourite",
        "Give this favourite a name",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: (text?: string) => saveFavouriteNow(tpl, text) },
        ],
        "plain-text",
        tpl.name
      );
    } else {
      setPendingFav(tpl);
      setFavName(tpl.name);
      setShowFavSheet(true);
    }
  };

  const startFavoriteFromItem = (item: any) => {
    const tpl = makeTemplateFromItem(item);
    // @ts-ignore (iOS)
    if (Alert.prompt) {
      // @ts-ignore
      Alert.prompt(
        "Save as Favourite",
        "Give this favourite a name",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: (text?: string) => saveFavouriteNow(tpl, text) },
        ],
        "plain-text",
        tpl.name
      );
    } else {
      setPendingFav(tpl);
      setFavName(tpl.name);
      setShowFavSheet(true);
    }
  };

  const confirmSaveFavorite = async () => {
    if (!pendingFav) return;
    const finalName = favName.trim() || pendingFav.name;
    const toSave = { ...pendingFav, name: finalName };
    await saveFavs([toSave, ...favs].slice(0, 20));
    setShowFavSheet(false);
    setPendingFav(null);
    setFavName("");
    Alert.alert("Saved", "Template added to your favourites.");
  };

  const cancelFavEdit = () => {
    setShowFavSheet(false);
    setPendingFav(null);
    setFavName("");
  };

  // ——— UI atoms
  const Chip: React.FC<{ label: string; active?: boolean; onPress?: () => void }> = ({ label, active, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.primary : colors.inputBackground,
        paddingVertical: SMALL ? 7 : 9,
        paddingHorizontal: SMALL ? 12 : 14,
        borderRadius: 999,
        marginRight: 8,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text
        style={{
          color: active ? (colors.onPrimary || getContrastText(colors.primary)) : colors.textSecondary,
          fontSize: SMALL ? 12 : 13,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const CTA: React.FC<{ title: string; tone?: "accent" | "success" | "error" | "primary"; onPress?: () => void }> = ({ title, tone = "primary", onPress }) => {
    const tones: any = {
      primary: { bg: colors.primary + "22", fg: colors.primary },
      accent: { bg: colors.accent + "22", fg: colors.accent },
      success: { bg: colors.success + "22", fg: colors.success },
      error: { bg: colors.error + "22", fg: colors.error },
    };
    const t = tones[tone] || tones.primary;
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 999,
          backgroundColor: t.bg,
          alignSelf: "flex-start",
          ...shadow("sm"),
        }}
      >
        <Text style={{ color: t.fg, fontWeight: "700", fontSize: 16 }}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const Tag: React.FC<{ label: string; bg: string; fg: string }> = ({ label, bg, fg }) => (
    <View style={{ marginLeft: 8, backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );

  const inputStyle = (h: number) => ({
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: h,
    borderRadius: RADIUS,
  });

  const Phase: React.FC<{ title: string; list: any[]; setList: (v: any[]) => void }> = ({ title, list, setList }) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{title}</Text>
      {list.map((exercise, idx) => (
        <View key={`${title}-${idx}`} style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
          <View style={{ flex: 2 }}>
            <TextInput
              value={exercise.name}
              onChangeText={(t) => {
                const u = [...list];
                u[idx] = { ...u[idx], name: t };
                setList(u);
              }}
              placeholder="Exercise"
              placeholderTextColor={colors.textSecondary}
              style={inputStyle(INPUT_H)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              value={exercise.sets}
              onChangeText={(t) => {
                const u = [...list];
                u[idx] = { ...u[idx], sets: t };
                setList(u);
              }}
              keyboardType="numeric"
              placeholder="Sets"
              placeholderTextColor={colors.textSecondary}
              style={inputStyle(INPUT_H)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              value={exercise.reps}
              onChangeText={(t) => {
                const u = [...list];
                u[idx] = { ...u[idx], reps: t };
                setList(u);
              }}
              keyboardType="numeric"
              placeholder="Reps"
              placeholderTextColor={colors.textSecondary}
              style={inputStyle(INPUT_H)}
            />
          </View>
          {list.length > 1 && (
            <TouchableOpacity onPress={() => setList(list.filter((_, i) => i !== idx))} style={{ justifyContent: "center" }}>
              <Text style={{ color: colors.error, fontSize: 12 }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity onPress={() => setList([...list, { name: "", sets: "", reps: "" }])}>
        <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 14 }}>Add {title}</Text>
      </TouchableOpacity>
    </View>
  );

  // ——— Derived UI
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => add(startOfWeek(new Date(), { weekStartsOn: 1 }), { days: i })),
    []
  );

  // ——— Render
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={insets.top + 56} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={isDark ? gradients.blackGoldSubtle : gradients.paperSheen}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: CARD_RADIUS, marginBottom: 12, padding: 10 }}
          >
            <View style={{ backgroundColor: colors.surface, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: colors.border, padding: 14, ...shadow("md") }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={[typography.h2, { color: colors.textPrimary }]}>Schedule</Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: 12 }}>Plan your week at a glance</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setComposerOpen((s) => !s);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: colors.textSecondary, marginRight: 6, fontWeight: "700" }}>
                      {composerOpen ? "Hide" : "Quick Add"}
                    </Text>
                    <MaterialIcons name={composerOpen ? "expand-less" : "expand-more"} size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />

              {/* Filters row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: composerOpen ? 12 : 2, paddingHorizontal: 2 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                  {["All", "Gym", "Run", "Swim", "Cycle", "Other"].map((t) => (
                    <Chip key={t} label={t} active={sessionType === t} onPress={() => setSessionType(t)} />
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowCompleted((s) => !s)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>
                    {showCompleted ? "Hide Completed" : "Show Completed"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Collapsible composer */}
              {composerOpen && (
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>Date</Text>
                  <FlatList
                    horizontal
                    data={weekDates}
                    keyExtractor={(d) => d.toISOString()}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                    renderItem={({ item }) => {
                      const isSelected = selectedDate && isSameDay(item, selectedDate);
                      return (
                        <TouchableOpacity
                          onPress={() => setSelectedDate(item)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            marginRight: 8,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                            alignItems: "center",
                            minWidth: 64,
                            ...shadow("sm"),
                          }}
                        >
                          <Text style={{ color: isSelected ? (colors.onPrimary || getContrastText(colors.primary)) : colors.textPrimary, fontWeight: isSelected ? "800" : "700", fontSize: 13 }}>
                            {format(item, "EEE")}
                          </Text>
                          <Text style={{ color: isSelected ? (colors.onPrimary || getContrastText(colors.primary)) : colors.textSecondary, fontSize: 11 }}>
                            {format(item, "dd MMM")}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />

                  {sessionType !== "Gym" && sessionType !== "All" && (
                    <View style={{ marginTop: SECTION_GAP }}>
                      {sessionType === "Other" && (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Activity name (optional)</Text>
                          <TextInput
                            value={customType}
                            onChangeText={setCustomType}
                            placeholder="e.g. Pickleball, Hiking, Pilates..."
                            placeholderTextColor={colors.textSecondary}
                            style={inputStyle(INPUT_H)}
                          />
                        </View>
                      )}

                      {sessionType === "Swim" ? (
                        <View>
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Laps</Text>
                          <TextInput value={laps} onChangeText={setLaps} keyboardType="numeric" placeholder="e.g. 20" placeholderTextColor={colors.textSecondary} style={inputStyle(INPUT_H)} />
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Pool length (m)</Text>
                          <TextInput value={poolLength} onChangeText={setPoolLength} keyboardType="numeric" placeholder="e.g. 25" placeholderTextColor={colors.textSecondary} style={inputStyle(INPUT_H)} />
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Time (min)</Text>
                          <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="e.g. 45" placeholderTextColor={colors.textSecondary} style={inputStyle(INPUT_H)} />
                        </View>
                      ) : (
                        <View>
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Duration (min)</Text>
                          <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="e.g. 30" placeholderTextColor={colors.textSecondary} style={inputStyle(INPUT_H)} />
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Distance (km)</Text>
                          <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="e.g. 5.0" placeholderTextColor={colors.textSecondary} style={inputStyle(INPUT_H)} />
                        </View>
                      )}
                    </View>
                  )}

                  {sessionType === "Gym" && (
                    <View style={{ marginTop: SECTION_GAP }}>
                      <Phase title="Warm-Up" list={warmUpList} setList={setWarmUpList} />
                      <Phase title="Main Set" list={mainSetList} setList={setMainSetList} />
                      <Phase title="Cool-Down" list={coolDownList} setList={setCoolDownList} />
                    </View>
                  )}

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                    <CTA title="Add to Schedule" tone="success" onPress={handleManualScheduleSubmit} />
                    <CTA
                      title="Favourites"
                      tone="accent"
                      onPress={() => {
                        setPendingFav(null);
                        setFavName("");
                        setShowFavSheet(true);
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>

          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 8, marginBottom: 10, paddingHorizontal: 4, fontSize: 18, fontWeight: "800" }]}>
            Upcoming
          </Text>

          {sortedFiltered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 36 }}>
              <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Nothing scheduled yet. Add your first session above.</Text>
            </View>
          ) : (
            sortedFiltered.map((item, index) => (
              <View
                key={stableKey(item, index)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: CARD_RADIUS,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...shadow("sm"),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.inputBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginRight: 8,
                    }}
                  >
                    <TypeIcon type={item.customType || item.type} color={colors.textPrimary} />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{item.customType || item.type}</Text>
                  {isSameDay(parseISO(item.date), new Date()) && (
                    <Tag label="Today" bg={colors.primary + "22"} fg={colors.primary} />
                  )}
                  {item.frozen && <Tag label="Frozen" bg={colors.warning + "22"} fg={colors.warning} />}
                  {item.done && <Tag label="Done" bg={colors.success + "22"} fg={colors.success} />}
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{format(parseISO(item.date), "dd/MM/yy")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {!item.done && (
                      <TouchableOpacity
                        onPress={() => {
                          if (!item.frozen) completeDay(index);
                        }}
                        style={{ marginRight: 10 }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <MaterialIcons name="check-circle" size={18} color={item.frozen ? colors.textSecondary : colors.success} />
                          <Text
                            style={{
                              marginLeft: 6,
                              fontWeight: "700",
                              color: item.frozen ? colors.textSecondary : colors.success,
                              fontSize: 14,
                            }}
                          >
                            Complete
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => importToLog(item)} style={{ marginRight: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons name="file-download" size={18} color={colors.accent} />
                        <Text style={{ marginLeft: 6, fontWeight: "700", color: colors.accent, fontSize: 14 }}>Import</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeDay(index)}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons name="delete" size={18} color={colors.error} />
                        <Text style={{ marginLeft: 6, fontWeight: "700", color: colors.error, fontSize: 14 }}>Remove</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.6, marginBottom: 8 }} />

                {item.type === "Gym" ? (
                  ["warmUp", "mainSet", "coolDown"].map((sec) => (
                    <View key={sec} style={{ marginTop: 4 }}>
                      <Text style={{ fontWeight: "600", marginBottom: 2, color: colors.textSecondary, fontSize: 14 }}>
                        {sec === "warmUp" ? "Warm-Up" : sec === "mainSet" ? "Main Set" : "Cool-Down"}
                      </Text>
                      {(item[sec] || []).map((entry: string, j: number) => (
                        <Text key={j} style={{ color: colors.textPrimary, fontSize: 14, marginLeft: 4 }}>
                          • {entry}
                        </Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontWeight: "600", marginBottom: 2, color: colors.textSecondary, fontSize: 14 }}>
                      {item.customType || item.type} Summary
                    </Text>
                    {item.type === "Swim" ? (
                      <>
                        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>• Laps: {item.laps || "-"}</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>• Pool length: {item.poolLength || "-"} m</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>• Time: {item.time || "-"} min</Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>• Time: {item.time || "-"} min</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>• Distance: {item.distance || "-"} km</Text>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    const tpl = makeTemplateFromItem(item);
                    const existing = favs.find((f) => isSimilarTemplate(f, tpl));
                    if (existing) {
                      removeTemplate(existing.id);
                      Alert.alert("Removed", "Template removed from favourites.");
                    } else {
                      startFavoriteFromItem(item);
                    }
                  }}
                  onLongPress={() => startFavoriteFromItem(item)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    padding: 8,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...shadow("sm"),
                  }}
                >
                  <MaterialIcons
                    name={itemIsFavorited(item) ? "star" : "star-border"}
                    size={18}
                    color={itemIsFavorited(item) ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Favourites sheet */}
      <Modal visible={showFavSheet} transparent animationType="fade" onRequestClose={cancelFavEdit}>
        <Pressable onPress={cancelFavEdit} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 8,
              paddingTop: 12,
              maxHeight: Math.min(WIN_H * 0.8, 620),
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 6 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 16 }}>Favourites</Text>
              <TouchableOpacity onPress={cancelFavEdit}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, paddingHorizontal: 12 }}>Your saved templates</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
            >
              {favs.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No favourites yet.</Text>
              ) : (
                favs.map((t) => (
                  <View
                    key={t.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.inputBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 14,
                      marginRight: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        applyTemplate(t);
                        cancelFavEdit();
                      }}
                      style={{ marginRight: 8 }}
                    >
                      <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 13 }}>{t.name}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t.type}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeTemplate(t.id)}>
                      <MaterialIcons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 6 }} />
            <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
              <CTA title="Save current as favourite" tone="accent" onPress={startFavoriteFromForm} />
              {!!pendingFav && (
                <>
                  <TextInput
                    value={favName}
                    onChangeText={setFavName}
                    placeholder="Favourite name"
                    placeholderTextColor={colors.textSecondary}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                      padding: 10,
                      borderRadius: 10,
                      color: colors.textPrimary,
                      marginTop: 8,
                      height: INPUT_H,
                    }}
                  />
                  <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <CTA title="Save Favourite" tone="success" onPress={confirmSaveFavorite} />
                    <View style={{ width: 8 }} />
                    <CTA title="Cancel" tone="error" onPress={cancelFavEdit} />
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}