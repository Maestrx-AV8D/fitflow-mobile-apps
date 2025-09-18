import {
  CommonActions,
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSchedule, saveSchedule, saveToHistory } from "../lib/api";

import { useTheme } from "../theme/theme";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { hasPro, hasProAI, useEntitlements } from "../lib/entitlements";
import { MainStackParamList, RootTabParamList } from "../navigation/types";

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

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
};
type ScheduleNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Schedule">,
  NativeStackNavigationProp<MainStackParamList>
>;

type SetRow = { reps: string; weight: string; completed?: boolean };
type GymEx = { name: string; setsArr: SetRow[] };

export default function Schedule() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<any[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [warmUpList, setWarmUpList] = useState<
    { name: string; sets: string; reps: string }[]
  >([{ name: "", sets: "", reps: "" }]);
  const [mainSetList, setMainSetList] = useState<
    { name: string; sets: string; reps: string }[]
  >([{ name: "", sets: "", reps: "" }]);
  const [coolDownList, setCoolDownList] = useState<
    { name: string; sets: string; reps: string }[]
  >([{ name: "", sets: "", reps: "" }]);
  const [sessionType, setSessionType] = useState("Gym");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const { colors, spacing, typography } = useTheme();
  const [customType, setCustomType] = useState("");
  // under the other useState lines
  const [laps, setLaps] = useState("");
  const [poolLength, setPoolLength] = useState("");

  const emptySet: SetRow = { reps: "", weight: "", completed: false };
  const emptyEx: GymEx = { name: "", setsArr: [{ ...emptySet }] };

  // stable id + key helpers
  const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const withId = (x: any) => (x && x.id ? x : { ...x, id: newId() });
  const stableKey = (it: any, idx: number) =>
    it?.id ?? `${it?.date ?? "na"}-${it?.type ?? "na"}-${idx}`;

  // ✅ Entitlements (single source of truth)
  const ent = useEntitlements();
  const isPro = hasPro(ent);
  const isProAI = hasProAI(ent);

  // ✅ Gates
  const canImport = isPro || isProAI;
  const canRepeat = isPro || isProAI;
  const favCap = isProAI ? 10 : isPro ? 5 : 2;
  const maxAdvanceDays = isProAI ? 14 : isPro ? 7 : 3;

  // …
  const [repeatWeekly, setRepeatWeekly] = useState(false); // ✅ new

  // ✅ Today (start of day), start of this week (Mon), and the tier horizon
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday (change to 0 for Sunday if you prefer)
  const horizonEnd = addDays(today, maxAdvanceDays);

  // ✅ Build the strip from week start → horizon (inclusive)
  const pickerDates = React.useMemo(() => {
    const arr: Date[] = [];
    for (let d = weekStart; d <= horizonEnd; d = addDays(d, 1)) {
      arr.push(d);
    }
    return arr;
  }, [weekStart.getTime(), horizonEnd.getTime()]);

  const [gymSections, setGymSections] = useState<{
    warmUp: GymEx[];
    mainSet: GymEx[];
    coolDown: GymEx[];
  }>({
    warmUp: [{ ...emptyEx }],
    mainSet: [{ ...emptyEx }],
    coolDown: [{ ...emptyEx }],
  });
  const [wasPrefilled, setWasPrefilled] = useState(false);

  // Favourites sheet
  const [showFavSheet, setShowFavSheet] = useState(false);
  const [pendingFav, setPendingFav] = useState<FavTemplate | null>(null);
  const [favs, setFavs] = useState<FavTemplate[]>([]);
  const [favName, setFavName] = useState("");

  const [headerHeight, setHeaderHeight] = useState(0);
  const EXTRA_GAP = 8;
  const listTopOffset = Math.max(0, headerHeight + EXTRA_GAP);

  const WIN_H = Dimensions.get("window").height;

  useEffect(() => {
    (async () => {
      const stored = await getSchedule(); // your existing loader
      const migrated = (stored ?? []).map(withId);
      setPlan(migrated);
      if ((stored ?? []).some((x: any) => !x?.id)) {
        await saveSchedule(migrated); // persist migration once
      }
    })();
  }, []);

  useEffect(() => {
    const p = (route as any)?.params?.importToLog;
    if (!p) return;

    setType(p.type || "Gym");
    setNotes(p.notes || "");

    if ((p.type || "Gym") === "Gym") {
      const norm = (arr: any[] = []): GymEx[] =>
        arr.map((e) => ({
          name: e.name || "",
          setsArr:
            e.setsArr ??
            (e.sets?.map?.((s: any) => ({
              reps: s.reps || "",
              weight: s.weight || "",
              completed: !!s.completed,
            })) || [{ ...emptySet }]),
        }));

      if (p.sections) {
        setGymSections({
          warmUp: norm(p.sections.warmUp),
          mainSet: norm(p.sections.mainSet),
          coolDown: norm(p.sections.coolDown),
        });
      } else if (p.exercises) {
        // Back-compat: treat a plain exercises[] as Main Set
        setGymSections({
          warmUp: [],
          mainSet: norm(p.exercises),
          coolDown: [],
        });
      }
    } else {
      // Non-gym
      setSeg(p.segments || {});
    }

    setWasPrefilled(true);
    setOpen(true);
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

  const saveFavs = async (next: FavTemplate[]) => {
    setFavs(next);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  // Import schedule passed in from SmartWorkout ("Import All to Schedule")
  useEffect(() => {
    const imported: ImportedScheduleParam | undefined = (route as any)?.params
      ?.importedSchedule;
    if (!imported || !Array.isArray(imported) || imported.length === 0) return;

    // Map incoming days to our local plan shape
    const mapped = imported.map((d) => ({
      date: d.date, // expected yyyy-MM-dd
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

    // Replace duplicates by (date + type), keep last occurrence
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
        Alert.alert(
          "Imported",
          `Added ${mapped.length} day${
            mapped.length === 1 ? "" : "s"
          } to your schedule.`
        );
      } catch {}
    })();

    // Clear the param so it won't re-import when navigating back
    try {
      (navigation as any).setParams({ importedSchedule: undefined });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.importedSchedule]);

  const persist = async (newPlan: any[]) => {
    setPlan(newPlan);
    await saveSchedule(newPlan);
  };

  const filtered = plan.filter(
    (d) =>
      (showCompleted ? true : !d.done) &&
      (sessionType === "All" ? true : d.type === sessionType)
  );
  const sortedFiltered = [...filtered].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  async function completeDay(index: number) {
    const item = plan[index];
    if (!item || item.frozen) return;

    // mark done
    const next = plan.map((d, i) => (i === index ? { ...d, done: true } : d));
    await persist(next);

    // build a history entry from the updated item
    const completed = next[index];
    const historyEntry: any = {
      date: completed.date,
      type: completed.type,
      notes: "",
      exercises: [],
      segments: [],
    };

    if (completed.type === "Gym") {
      // parse "Name: 3×10" → { name, sets, reps }
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
    const next = plan.map((d, i) =>
      i === index ? { ...d, frozen: !d.frozen } : d
    );
    persist(next);
  }

  function removeDay(index: number) {
    const next = plan.filter((_, i) => i !== index);
    persist(next);
  }

  function goToLog(entry?: any) {
    navigation.navigate("Home", {
      screen: "Log",
      params: { entry },
    });
  }

  // Robust navigation to Log
  function safeNavigateToLog(entry: any) {
    const tryNavigate = (nav: any) => {
      try {
        const state = nav?.getState?.();
        const hasRoute = state?.routeNames?.includes?.("Log");
        if (hasRoute) {
          nav.navigate("Log", { entry });
          return true;
        }
      } catch (_) {}
      return false;
    };

    if (tryNavigate(navigation)) return;

    let parent = navigation.getParent?.();
    while (parent) {
      if (tryNavigate(parent)) return;
      parent = parent.getParent?.();
    }

    const root = navigation.getParent?.() || navigation;
    try {
      root.navigate("Home", { screen: "Log", params: { entry } });
    } catch (_) {
      try {
        navigation.navigate({
          name: "Log",
          params: { entry },
          merge: true,
        } as any);
      } catch (_) {}
    }
  }

  function toExercises(list: string[] = []) {
    return list.map((s) => {
      const [name, rest = ""] = s.split(":");
      const reps = rest.match(/×(\d+)/)?.[1] || ""; // 3×10  -> "10"
      return { name: (name || "").trim(), sets: [{ reps, weight: "" }] };
    });
  }

  // Robustly navigate to the "Log" screen anywhere in ancestor navs
  function navigateToLog(params: any) {
    // If your tabs container is named "MainTabs", use that:
    navigation.dispatch(
      CommonActions.navigate({
        name: "Home", // <-- your tab navigator route name
        params: {
          screen: "Log", // <-- the tab/screen inside MainTabs
          params, //     { importToLog: ..., _ts: ... }
        },
      })
    );
  }

  // Map free-text to a Log type when user picked "Other" with a custom label.
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

  // Replace your current importToLog with this
  function importToLog(day: any, exercise?: string) {
    // If user entered a custom name when type === "Other", try to map it
    const effectiveType =
      day.type === "Other" ? guessLogType(day.customType) : day.type || "Other";

    const importPayload: any = {
      type: effectiveType,
      notes: exercise ? exercise : day.customType ? day.customType : "",
      // keep the label visible if it remains Other
      customType: effectiveType === "Other" ? day.customType || "" : undefined,
    };

    if (!canImport) {
      Alert.alert("Import requires Pro", "Import to Log is available on Pro.", [
        { text: "Not now", style: "cancel" },
        {
          text: "See plans",
          onPress: () =>
            navigation.dispatch(
              CommonActions.navigate({
                name: "Home", // <-- your tab navigator route name
                params: {
                  screen: "Paywall", // <-- the tab/screen inside MainTabs
                },
              })
            ),
        },
      ]);
      return;
    }

    if (effectiveType === "Gym") {
      const toPhases = (warm: any[], main: any[], cool: any[]) => [
        { id: "Warm-Up", title: "Warm up", exercises: toExercises(warm) },
        { id: "Main Set", title: "Main set", exercises: toExercises(main) },
        { id: "Cool-Down", title: "Cool down", exercises: toExercises(cool) },
      ];

      if (exercise) {
        importPayload.phases = toPhases([], [exercise], []);
      } else {
        importPayload.phases = toPhases(day.warmUp, day.mainSet, day.coolDown);
      }
    } else {
      // Non-gym: use the exact keys Log expects per type
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
          // You said Swim should use laps + poolLength + time
          importPayload.segments = {
            laps: day.laps || "",
            poolLength: day.poolLength || "",
            time: day.time || "",
          };
          break;
        default:
          // "Other" (or anything custom we can’t map): keep it simple
          importPayload.segments = { duration: day.time || "" };
          if (day.distance) importPayload.segments.distance = day.distance;
          break;
      }
    }

    // Navigate to Log and include a timestamp so the effect always runs
    navigateToLog({ importToLog: importPayload, _ts: Date.now() });
  }
  // Inclusive bounds: [today, horizonEnd]
  const withinHorizon = (d: Date | null) => {
    if (!d) return false;
    const dd = startOfDay(d);
    const start = startOfDay(today);
    const end = startOfDay(horizonEnd);
    return !isBefore(dd, start) && !isAfter(dd, end);
  };

  // ✅ Has content checks
  const hasGymContent = React.useMemo(() => {
    const lists = [warmUpList, mainSetList, coolDownList];
    return lists.some((list) => list.some((e) => e.name?.trim()));
  }, [warmUpList, mainSetList, coolDownList]);

  const hasCardioContent = React.useMemo(() => {
    if (sessionType === "Swim") {
      // allow if *any* is provided (laps/pool/time) — tighten if you want both laps+pool
      return !!(laps.trim() || poolLength.trim() || duration.trim());
    }
    if (
      sessionType === "Run" ||
      sessionType === "Cycle" ||
      sessionType === "Other"
    ) {
      return !!(duration.trim() || distance.trim());
    }
    return false;
  }, [sessionType, duration, distance, laps, poolLength]);

  const canSubmit = React.useMemo(() => {
    if (!withinHorizon(selectedDate)) return false;
    console.log("withinHorizon", selectedDate, withinHorizon(selectedDate));
    if (sessionType === "All") return false;
    return sessionType === "Gym" ? hasGymContent : hasCardioContent;
  }, [selectedDate, sessionType, hasGymContent, hasCardioContent]);

  function handleManualScheduleSubmit() {
    if (!selectedDate) {
      Alert.alert("Missing Date", "Please select a date.");
      return;
    }
    const limit = addDays(today, maxAdvanceDays);

    const end = startOfDay(horizonEnd);
    // isAfter(dd, end)
    const after = isAfter(today, end);
    if (!canSubmit) {
      let note = "";
      let msg = "";
      if (!withinHorizon(selectedDate)) {
        note = `Too Far ${after ? "Ahead" : "Back"}`;
        msg = `You can only schedule within ${maxAdvanceDays} day${
          maxAdvanceDays === 3 ? "" : "s"
        } from today.`;
      } else if (sessionType === "All") {
        note = "Pick a Type";
        msg = "Please choose a specific session type.";
      } else if (sessionType === "Gym") {
        msg = "Add at least one exercise to Warm-Up, Main Set or Cool-Down.";
      } else if (sessionType === "Swim") {
        msg = "Enter laps, pool length or time for your swim.";
      } else {
        msg = "Enter duration or distance.";
      }
      Alert.alert(note, msg);
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
      if (label) newDay.customType = label; // keep type: "Other", add a label
    }

    if (sessionType === "Gym") {
      newDay.warmUp = warmUpList
        .filter((e) => e.name.trim() !== "")
        .map(
          (e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`
        );
      newDay.mainSet = mainSetList
        .filter((e) => e.name.trim() !== "")
        .map(
          (e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`
        );
      newDay.coolDown = coolDownList
        .filter((e) => e.name.trim() !== "")
        .map(
          (e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`
        );
    } else if (sessionType === "Swim") {
      newDay.time = duration;
      newDay.laps = laps;
      newDay.poolLength = poolLength;
    } else {
      newDay.time = duration;
      newDay.distance = distance;
    }

    const items: any[] = [newDay];
    if (repeatWeekly && canRepeat) {
      for (let plus = 7; ; plus += 7) {
        const d = addDays(selectedDate, plus);
        if (isBefore(limit, d)) break; // don't exceed horizon
        items.push({
          ...newDay,
          id: newId(),
          date: format(d, "yyyy-MM-dd"),
        });
      }
    }

    // Merge by (date + type/customType) to avoid dupes
    const byKey = new Map<string, any>();
    [...plan, ...items].forEach((item) => {
      const key = `${item.date}::${item.customType || item.type}`;
      byKey.set(key, item);
    });
    const merged = Array.from(byKey.values()).sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    persist(merged);
    setSelectedDate(null);
    setWarmUpList([{ name: "", sets: "", reps: "" }]);
    setMainSetList([{ name: "", sets: "", reps: "" }]);
    setCoolDownList([{ name: "", sets: "", reps: "" }]);
    setDuration("");
    setDistance("");
    setCustomType("");
    setLaps("");
    setPoolLength("");
    setRepeatWeekly(false);
  }

  // const weekDates = Array.from({ length: 7 }, (_, i) =>
  //   add(startOfWeek(new Date(), { weekStartsOn: 1 }), { days: i })
  // );

  // // Replace the old "startOfWeek" weekDates:
  // const pickerDates = Array.from({ length: maxAdvanceDays + 1 }, (_, i) =>
  //   // addDays(new Date(), i)
  //     addDays(startOfWeek(new Date(), { weekStartsOn: 1 }),  i)
  // );

  // inside Schedule() — keep your existing entitlements logic that sets `maxAdvanceDays`

  // Dynamic padding to push header below the status bar while letting the card color paint under it
  const headerPadTop = insets.top + 12;

  const makeGymTemplateFromForm = (): FavTemplate => ({
    id: `${Date.now()}`,
    name: `${sessionType} – ${new Date().toLocaleDateString()}`,
    type: "Gym",
    warmUp: warmUpList
      .filter((e) => e.name.trim())
      .map(
        (e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`
      ),
    mainSet: mainSetList
      .filter((e) => e.name.trim())
      .map(
        (e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`
      ),
    coolDown: coolDownList
      .filter((e) => e.name.trim())
      .map(
        (e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ""}`
      ),
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
      // map strings back to inputs (best-effort parsing)
      const parse = (s: string) => {
        const [name, rest = ""] = s.split(":");
        const sets = rest.match(/(\d+)×/)?.[1] || "";
        const reps = rest.match(/×(\d+)/)?.[1] || "";
        return { name: name.trim(), sets, reps };
      };
      setWarmUpList(
        (t.warmUp || []).map(parse).concat({ name: "", sets: "", reps: "" })
      );
      setMainSetList(
        (t.mainSet || []).map(parse).concat({ name: "", sets: "", reps: "" })
      );
      setCoolDownList(
        (t.coolDown || []).map(parse).concat({ name: "", sets: "", reps: "" })
      );
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

  const removeTemplate = async (id: string) => {
    const next = favs.filter((f) => f.id !== id);
    await saveFavs(next);
  };

  const isSimilarTemplate = (a: FavTemplate, b: FavTemplate) => {
    if (a.type !== b.type) return false;
    if (a.type === "Gym") {
      const join = (xs?: string[]) => (xs || []).join("|");
      return (
        join(a.mainSet) === join(b.mainSet) &&
        join(a.warmUp) === join(b.warmUp) &&
        join(a.coolDown) === join(b.coolDown)
      );
    }
    return (
      (a.time || "") === (b.time || "") &&
      (a.distance || "") === (b.distance || "")
    );
  };

  const makeTemplateFromItem = (item: any): FavTemplate => ({
    id: `${Date.now()}`,
    name: `${item.customType || item.type} – ${format(
      parseISO(item.date),
      "dd/MM"
    )}`,
    type: (item.type ?? "Other") as TemplateType, // keep union type
    warmUp: item.warmUp,
    mainSet: item.mainSet,
    coolDown: item.coolDown,
    time: item.time,
    distance: item.distance,
    laps: item.laps,
    poolLength: item.poolLength,
    createdAt: new Date().toISOString(),
  });

  // Keep near your other fav helpers
  const uniqueName = (proposed: string, all: any[]) => {
    if (!all.some((f) => f.name?.trim() === proposed.trim())) return proposed;
    let i = 2;
    let candidate = `${proposed} (${i})`;
    while (all.some((f) => f.name?.trim() === candidate)) {
      i += 1;
      candidate = `${proposed} (${i})`;
    }
    return candidate;
  };

  const toggleFavoriteFromItem = async (item: any) => {
    const tpl = makeTemplateFromItem(item); // normalize item → favourite shape
    const existing = favs.find((f) => isSimilarTemplate(f, tpl));

    if (existing) {
      // ✅ Already a favourite → remove
      await removeTemplate(existing.id);
      Alert.alert("Removed", "Template removed from favourites.");
      return;
    }

    if (favs.length >= favCap) {
      Alert.alert(
        "Favourite limit reached",
        `You can save up to ${favCap} favourites on your plan.`,
        [
          { text: "OK" },
          {
            text: "Upgrade",
            onPress: () =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: "Home", // <-- your tab navigator route name
                  params: {
                    screen: "Paywall", // <-- the tab/screen inside MainTabs
                  },
                })
              ),
          },
        ]
      );
      return;
    }

    // ✅ First time → open naming flow (lets the user edit name)
    startFavoriteFromItem(item); // uses your existing rename modal flow
  };

  const itemIsFavorited = (item: any) => {
    const tpl = makeTemplateFromItem(item);
    return favs.some((f) => isSimilarTemplate(f, tpl));
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
      Alert.alert(
        "Pick a Type",
        "Please choose a specific session type before saving."
      );
      return;
    }
    if (favs.length >= favCap) {
      Alert.alert(
        "Favourite limit reached",
        `You can save up to ${favCap} favourites on your plan.`,
        [
          { text: "OK" },
          {
            text: "Upgrade",
            onPress: () =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: "Home", // <-- your tab navigator route name
                  params: {
                    screen: "Paywall", // <-- the tab/screen inside MainTabs
                  },
                })
              ),
          },
        ]
      );
      return;
    }
    const tpl =
      sessionType === "Gym"
        ? makeGymTemplateFromForm()
        : makeCardioTemplateFromForm();

    // iOS prompt (Android falls back to half-sheet editor)
    // @ts-ignore
    if (Alert.prompt) {
      // @ts-ignore
      Alert.prompt(
        "Save as Favourite",
        "Give this favourite a name",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: (text?: string) => saveFavouriteNow(tpl, text),
          },
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

    // @ts-ignore
    if (Alert.prompt) {
      // @ts-ignore
      Alert.prompt(
        "Save as Favourite",
        "Give this favourite a name",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: (text?: string) => saveFavouriteNow(tpl, text),
          },
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
    if (favs.length >= favCap) {
      Alert.alert(
        "Favourite limit reached",
        `You can save up to ${favCap} favourites on your plan.`,
        [
          { text: "OK" },
          {
            text: "Upgrade",
            onPress: () =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: "Home", // <-- your tab navigator route name
                  params: {
                    screen: "Paywall", // <-- the tab/screen inside MainTabs
                  },
                })
              ),
          },
        ]
      );
      return;
    }
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      {/* Fixed Header */}
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: colors.card,
          paddingTop: headerPadTop,
          paddingBottom: 0,
          paddingHorizontal: 12,
        }}
      >
        {/* Background underlay (card color) that paints to the very top */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0, // paint from very top of the screen
            left: 0,
            right: 0,
            bottom: 0, // line up exactly with the list container
            backgroundColor: colors.card,
          }}
        />
        <Text
          style={[
            typography.h2,
            { color: colors.textPrimary, marginBottom: 8, fontSize: 28 },
          ]}
        >
          Schedule
        </Text>

        {/* Create Session */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            minHeight: 200,
            justifyContent: "flex-start",
            ...cardShadow,
          }}
        >
          <Text
            style={[
              typography.h3,
              { color: colors.textPrimary, fontSize: 18, marginBottom: 10 },
            ]}
          >
            Create a Session
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            Schedule up to {maxAdvanceDays} day{maxAdvanceDays === 3 ? "" : "s"}{" "}
            in advance
          </Text>

          {/* Date Picker */}
          {/* Date Picker */}
          <FlatList
            horizontal
            data={pickerDates}
            keyExtractor={(item) => item.toISOString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 8 }}
            renderItem={({ item }) => {
              const disabled =
                isBefore(item, today) || isAfter(item, horizonEnd);
              const isSelected = selectedDate && isSameDay(item, selectedDate);
              const isToday = isSameDay(item, new Date());
              const isGreyedOut = !isToday && !isSelected;

              return (
                <TouchableOpacity
                  // disabled={disabled}
                  // onPress={() => {
                  //   if (!disabled) setSelectedDate(item);
                  // }}
                  onPress={() => setSelectedDate(item)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    marginRight: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.inputBackground,
                    alignItems: "center",
                    opacity: disabled ? 0.45 : 1,
                    ...cardShadow,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? "#FFF"
                        : isGreyedOut
                        ? "#A0A0A0"
                        : colors.textPrimary,
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: 14,
                    }}
                  >
                    {format(item, "EEE")}
                  </Text>
                  <Text
                    style={{
                      color: isSelected
                        ? "#FFF"
                        : isGreyedOut
                        ? "#A0A0A0"
                        : colors.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    {format(item, "dd MMM")}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Session Type */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            Type of session
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
            style={{ marginBottom: 8 }}
          >
            {["All", "Gym", "Run", "Swim", "Cycle", "Other"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSessionType(type)}
                style={{
                  backgroundColor:
                    sessionType === type
                      ? colors.surface
                      : colors.inputBackground,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor:
                    sessionType === type ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      sessionType === type
                        ? colors.textPrimary
                        : colors.textSecondary,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Repeat weekly (Pro & Pro+AI) */}
          {sessionType !== "All" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Switch
                value={repeatWeekly}
                onValueChange={(v) => {
                  if (!canRepeat) {
                    Alert.alert(
                      "Upgrade to repeat",
                      "Weekly repeating is available on Pro.",
                      [
                        { text: "Not now", style: "cancel" },
                        {
                          text: "See plans",
                          onPress: () =>
                            navigation.dispatch(
                              CommonActions.navigate({
                                name: "Home", // <-- your tab navigator route name
                                params: {
                                  screen: "Paywall", // <-- the tab/screen inside MainTabs
                                },
                              })
                            ),
                        },
                      ]
                    );
                    return;
                  }
                  setRepeatWeekly(v);
                }}
              />
              <Text style={{ marginLeft: 8, color: colors.textSecondary }}>
                Repeat weekly
                {!canRepeat ? " (Pro)" : ""}
              </Text>
            </View>
          )}

          {/* Distance + Duration for non-Gym */}
          {/* Distance + Duration for non-Gym */}
          {sessionType !== "Gym" && sessionType !== "All" && (
            <View style={{ marginBottom: 8 }}>
              {/* Only for "Other": optional custom label */}
              {sessionType === "Other" && (
                <>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Activity name (optional)
                  </Text>
                  <TextInput
                    value={customType}
                    onChangeText={setCustomType}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 8,
                      borderRadius: 7,
                      marginTop: 2,
                      color: colors.textPrimary,
                    }}
                    placeholder="e.g. Pickleball, Hiking, Pilates..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}

              {sessionType === "Swim" ? (
                <>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginTop: 8,
                    }}
                  >
                    Laps
                  </Text>
                  <TextInput
                    value={laps}
                    keyboardType="numeric"
                    onChangeText={setLaps}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 8,
                      borderRadius: 7,
                      marginTop: 2,
                      color: colors.textPrimary,
                    }}
                    placeholder="e.g. 20"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginTop: 8,
                    }}
                  >
                    Pool length (m)
                  </Text>
                  <TextInput
                    value={poolLength}
                    keyboardType="numeric"
                    onChangeText={setPoolLength}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 8,
                      borderRadius: 7,
                      marginTop: 2,
                      color: colors.textPrimary,
                    }}
                    placeholder="e.g. 25"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginTop: 8,
                    }}
                  >
                    Time (min)
                  </Text>
                  <TextInput
                    value={duration}
                    keyboardType="numeric"
                    onChangeText={setDuration}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 8,
                      borderRadius: 7,
                      marginTop: 2,
                      color: colors.textPrimary,
                    }}
                    placeholder="e.g. 45"
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginTop: 8,
                    }}
                  >
                    Duration (min)
                  </Text>
                  <TextInput
                    value={duration}
                    keyboardType="numeric"
                    onChangeText={setDuration}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 8,
                      borderRadius: 7,
                      marginTop: 2,
                      color: colors.textPrimary,
                    }}
                    placeholder="e.g. 30"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text
                    style={{
                      fontSize: 12,
                      marginTop: 5,
                      color: colors.textSecondary,
                    }}
                  >
                    Distance (km)
                  </Text>
                  <TextInput
                    value={distance}
                    keyboardType="numeric"
                    onChangeText={setDistance}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 8,
                      borderRadius: 7,
                      marginTop: 2,
                      color: colors.textPrimary,
                    }}
                    placeholder="e.g. 5.0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}
            </View>
          )}

          {/* Gym Inputs */}
          {sessionType === "Gym" && (
            <ScrollView
              style={{ maxHeight: 230, marginVertical: 4 }}
              contentContainerStyle={{ paddingBottom: 6 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Warm-Up
              </Text>
              {warmUpList.map((exercise, idx) => (
                <View
                  key={`warm-${idx}`}
                  style={{ marginTop: 2, flexDirection: "row", gap: 4 }}
                >
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={exercise.name}
                      placeholder="Exercise"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...warmUpList];
                        updated[idx] = { ...updated[idx], name: text };
                        setWarmUpList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.sets}
                      placeholder="Sets"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...warmUpList];
                        updated[idx] = { ...updated[idx], sets: text };
                        setWarmUpList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.reps}
                      placeholder="Reps"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...warmUpList];
                        updated[idx] = { ...updated[idx], reps: text };
                        setWarmUpList(updated);
                      }}
                    />
                  </View>
                  {warmUpList.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setWarmUpList(warmUpList.filter((_, i) => i !== idx))
                      }
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 2,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 12 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() =>
                  setWarmUpList([
                    ...warmUpList,
                    { name: "", sets: "", reps: "" },
                  ])
                }
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontWeight: "600",
                    marginVertical: 4,
                    fontSize: 14,
                  }}
                >
                  Add Warm-Up
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Main Set
              </Text>
              {mainSetList.map((exercise, idx) => (
                <View
                  key={`main-${idx}`}
                  style={{ marginTop: 2, flexDirection: "row", gap: 4 }}
                >
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={exercise.name}
                      placeholder="Exercise"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...mainSetList];
                        updated[idx] = { ...updated[idx], name: text };
                        setMainSetList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.sets}
                      placeholder="Sets"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...mainSetList];
                        updated[idx] = { ...updated[idx], sets: text };
                        setMainSetList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.reps}
                      placeholder="Reps"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...mainSetList];
                        updated[idx] = { ...updated[idx], reps: text };
                        setMainSetList(updated);
                      }}
                    />
                  </View>
                  {mainSetList.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setMainSetList(mainSetList.filter((_, i) => i !== idx))
                      }
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 2,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 12 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() =>
                  setMainSetList([
                    ...mainSetList,
                    { name: "", sets: "", reps: "" },
                  ])
                }
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontWeight: "600",
                    marginVertical: 4,
                    fontSize: 14,
                  }}
                >
                  Add Main Set
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Cool-Down
              </Text>
              {coolDownList.map((exercise, idx) => (
                <View
                  key={`cool-${idx}`}
                  style={{ marginTop: 2, flexDirection: "row", gap: 4 }}
                >
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={exercise.name}
                      placeholder="Exercise"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...coolDownList];
                        updated[idx] = { ...updated[idx], name: text };
                        setCoolDownList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.sets}
                      placeholder="Sets"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...coolDownList];
                        updated[idx] = { ...updated[idx], sets: text };
                        setCoolDownList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.reps}
                      placeholder="Reps"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...coolDownList];
                        updated[idx] = { ...updated[idx], reps: text };
                        setCoolDownList(updated);
                      }}
                    />
                  </View>
                  {coolDownList.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setCoolDownList(
                          coolDownList.filter((_, i) => i !== idx)
                        )
                      }
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 2,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 12 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() =>
                  setCoolDownList([
                    ...coolDownList,
                    { name: "", sets: "", reps: "" },
                  ])
                }
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontWeight: "600",
                    marginVertical: 4,
                    fontSize: 14,
                  }}
                >
                  Add Cool-Down
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {sessionType !== "All" && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              {/* Submit */}
              <TouchableOpacity
                onPress={handleManualScheduleSubmit}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: canSubmit
                    ? colors.success + "22"
                    : colors.border,
                  alignSelf: "flex-end",
                  left: 170,
                  ...cardShadow,
                }}
              >
                <Text
                  style={{
                    color: canSubmit ? colors.success : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Add to Schedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // open sheet to browse favourites or save current form as a new favourite
                  setPendingFav(null); // browsing mode by default
                  setFavName("");
                  setShowFavSheet(true);
                }}
                style={{
                  position: "absolute",
                  marginTop: 12,
                  //marginRight: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  alignContent: "flex-end",
                  right: 0,
                  ...cardShadow,
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {/* <Text
                style={{
                  color: colors.accent,
                  opacity: 0.95,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Favourites ⭐
              </Text> */}
                <Ionicons name="heart" size={20} color={colors.background} />
              </TouchableOpacity>

              {/* <TouchableOpacity
                onPress={() => toggleFavoriteFromItem(item)}
                onLongPress={() => startFavoriteFromItem(item)}
                style={{
                  position: "absolute",
                  top: 55,
                  right: 15,
                  padding: 6,
                  borderRadius: 16,
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={itemIsFavorited(item) ? "star" : "star-border"}
                  size={18}
                  color={
                    itemIsFavorited(item) ? colors.accent : colors.textSecondary
                  }
                />
              </TouchableOpacity> */}
            </View>
          )}

          {/* Upcoming Heading */}
          {/* <Text
            style={[
              typography.h3,
              {
                color: colors.textPrimary,
                marginTop: 14,
                paddingBottom: 6,
                paddingHorizontal: 2,
                fontSize: 18,
                fontWeight: "800",
              },
            ]}
          >
            Upcoming Schedule
          </Text> */}
        </View>
      </View>

      {/* List below header */}
      <View
        style={{
          flex: 1,
          paddingTop: listTopOffset,
          backgroundColor: colors.card,
          marginTop: 0,
        }}
      >
        <Text
          style={[
            typography.h3,
            {
              color: colors.textPrimary,
              marginTop: 5,
              marginBottom: 10,
              paddingBottom: 6,
              paddingHorizontal: 15,
              fontSize: 18,
              fontWeight: "800",
            },
          ]}
        >
          Upcoming Schedule
        </Text>
        <FlatList
          style={{ backgroundColor: colors.card }}
          data={sortedFiltered}
          keyExtractor={(item, index) => String(stableKey(item, index))}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 140,
            paddingTop: 0,
          }}
          ListFooterComponent={<View style={{ height: insets.bottom + 24 }} />}
          renderItem={({ item, index }) => (
            <View
              // key={`${item.date}-${index}`}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 12,
                marginBottom: 12,
                opacity: item.done ? 0.5 : 1,
                ...cardShadow,
              }}
            >
              {item.frozen && (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: colors.warning,
                    marginBottom: 2,
                    marginLeft: 2,
                  }}
                >
                  Frozen
                </Text>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {format(parseISO(item.date), "dd/MM/yy")}
                </Text>
                <View style={{ flexDirection: "row" }}>
                  {!item.done && (
                    <TouchableOpacity
                      onPress={() => {
                        if (!item.frozen) completeDay(index);
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
                          color: item.frozen
                            ? colors.textSecondary
                            : colors.success,
                          marginRight: 8,
                          opacity: item.frozen ? 0.5 : 1,
                          fontSize: 15,
                        }}
                      >
                        Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      if (!canImport) {
                        Alert.alert(
                          "Import requires Pro",
                          "Import to Log is available on Pro.",
                          [
                            { text: "Not now", style: "cancel" },
                            {
                              text: "See plans",
                              onPress: () =>
                                navigation.dispatch(
                                  CommonActions.navigate({
                                    name: "Home", // <-- your tab navigator route name
                                    params: {
                                      screen: "Paywall", // <-- the tab/screen inside MainTabs
                                    },
                                  })
                                ),
                            },
                          ]
                        );
                        return;
                      }
                      importToLog(item);
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: colors.accent,
                        marginRight: 8,
                        fontSize: 15,
                      }}
                    >
                      Import
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeDay(index)}>
                    <Text
                      style={{
                        fontWeight: "600",
                        color: colors.error,
                        fontSize: 15,
                      }}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {item.type === "Gym" ? (
                ["warmUp", "mainSet", "coolDown"].map((sec) => (
                  <View key={sec} style={{ marginTop: 5 }}>
                    <Text
                      style={{
                        fontWeight: "600",
                        marginBottom: 2,
                        color: colors.textSecondary,
                        fontSize: 14,
                      }}
                    >
                      {sec === "warmUp"
                        ? "Warm-Up"
                        : sec === "mainSet"
                        ? "Main Set"
                        : "Cool-Down"}
                    </Text>
                    {(item[sec] || []).map((entry: string, j: number) => (
                      <View
                        key={j}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            marginLeft: 2,
                            marginBottom: 1,
                            color: colors.textPrimary,
                            fontSize: 14,
                          }}
                        >
                          • {entry}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={{ marginTop: 5 }}>
                  <Text
                    style={{
                      fontWeight: "600",
                      marginBottom: 2,
                      color: colors.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {item.customType || item.type} Summary
                  </Text>
                  {item.type === "Swim" ? (
                    <>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          marginBottom: 2,
                          fontSize: 14,
                        }}
                      >
                        • Laps: {item.laps || "-"}
                      </Text>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          marginBottom: 2,
                          fontSize: 14,
                        }}
                      >
                        • Pool length: {item.poolLength || "-"} m
                      </Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                        • Time: {item.time || "-"} min
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          marginBottom: 2,
                          fontSize: 14,
                        }}
                      >
                        • Time: {item.time || "-"} min
                      </Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                        • Distance: {item.distance || "-"} km
                      </Text>
                    </>
                  )}
                </View>
              )}
              <TouchableOpacity
                onPress={() => toggleFavoriteFromItem(item)}
                onLongPress={() => startFavoriteFromItem(item)}
                style={{
                  position: "absolute",
                  top: 55,
                  right: 15,
                  padding: 6,
                  borderRadius: 15,
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={itemIsFavorited(item) ? "heart" : "heart-outline"}
                  size={18}
                  color={
                    itemIsFavorited(item) ? colors.accent : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
      <Modal
        visible={showFavSheet}
        transparent
        animationType="fade"
        onRequestClose={cancelFavEdit}
      >
        {/* Backdrop */}
        <Pressable
          onPress={cancelFavEdit}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          {/* Stop propagation so taps inside content don't close */}
          <Pressable
            onPress={() => {}}
            style={{
              // height: Math.min(540, WIN_H * 0.5), // half-height modal
              backgroundColor: colors.card,
              // borderTopLeftRadius: 16,
              // borderTopRightRadius: 16,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopWidth: 1,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 8,
              paddingTop: 8,
              ...cardShadow,
            }}
          >
            {/* Grab handle */}
            <View style={{ alignItems: "center", marginBottom: 6 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            {/* Title row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 12,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                Favourites
              </Text>
              <TouchableOpacity onPress={cancelFavEdit}>
                <MaterialIcons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Existing favourites */}
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginTop: 8,
                paddingHorizontal: 12,
              }}
            >
              Your saved templates · {Math.min(favs.length, favCap)}/{favCap}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              {favs.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No favourites yet.
                </Text>
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
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {t.name}
                      </Text>
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 11 }}
                      >
                        {t.type}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeTemplate(t.id)}>
                      <MaterialIcons
                        name="close"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginHorizontal: 12,
                marginVertical: 6,
              }}
            />

            {/* Primary action: Save current as favourite */}
            <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
              <TouchableOpacity
                onPress={startFavoriteFromForm}
                style={{
                  alignSelf: "flex-start",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: colors.accent + "22",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  Save current as favourite
                </Text>
              </TouchableOpacity>

              {/* Android inline editor (shown only if we fell back and have a pending template) */}
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
                      marginBottom: 8,
                    }}
                  />
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={confirmSaveFavorite}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        backgroundColor: colors.success + "22",
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{ color: colors.success, fontWeight: "700" }}
                      >
                        Save Favourite
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={cancelFavEdit}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        backgroundColor: colors.error + "22",
                      }}
                    >
                      <Text style={{ color: colors.error, fontWeight: "700" }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
