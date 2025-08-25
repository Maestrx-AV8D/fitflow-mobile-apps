import { CompositeNavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  add,
  addDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSchedule, saveSchedule, saveToHistory } from "../lib/api";

import { useTheme } from "../theme/theme";

import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  createdAt: string;
};

const FAV_KEY = "schedule.favorites.v1";

type ImportedScheduleParam = {
  date: string;
  warmUp?: string[];
  mainSet?: string[];
  coolDown?: string[];
  type?: 'Gym' | 'Run' | 'Swim' | 'Cycle' | 'Other';
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

  useEffect(() => {
    (async () => {
      const stored = await getSchedule();
      setPlan(stored);
    })();
  }, []);

  // Import schedule passed in from SmartWorkout ("Import All to Schedule")
  useEffect(() => {
    const imported: ImportedScheduleParam | undefined = (route as any)?.params?.importedSchedule;
    if (!imported || !Array.isArray(imported) || imported.length === 0) return;

    // Map incoming days to our local plan shape
    const mapped = imported.map((d) => ({
      date: d.date,                 // expected yyyy-MM-dd
      type: d.type || 'Gym',
      done: false,
      frozen: false,
      warmUp: (d.warmUp || []).slice(0),
      mainSet: (d.mainSet || []).slice(0),
      coolDown: (d.coolDown || []).slice(0),
      time: d.time,
      distance: d.distance,
    }));

    // Replace duplicates by (date + type), keep last occurrence
    const byKey = new Map<string, any>();
    [...plan, ...mapped].forEach((item) => {
      const key = `${item.date}::${item.type}`;
      byKey.set(key, item);
    });
    const merged = Array.from(byKey.values()).sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    (async () => {
      await persist(merged);
      try {
        Alert.alert('Imported', `Added ${mapped.length} day${mapped.length === 1 ? '' : 's'} to your schedule.`);
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

  async function completeDay(idx: number) {
    if (plan[idx]?.frozen) return;
    const updated = plan.map((d, i) => (i === idx ? { ...d, done: true } : d));
    persist(updated);

    const completedItem = updated[idx];
    const historyEntry: any = {
      date: completedItem.date,
      type: completedItem.type,
      notes: "",
      exercises: [],
      segments: [],
    };
    if (completedItem.type === "Gym") {
      historyEntry.exercises = (completedItem.mainSet || []).map(
        (s: string) => {
          const [name, rest = ""] = s.split(":");
          const sets = rest.match(/(\d+)×/)?.[1] || "";
          const reps = rest.match(/×(\d+)/)?.[1] || "";
          return { name: name.trim(), sets, reps, weight: "" };
        }
      );
    } else {
      historyEntry.segments = [
        {
          type: completedItem.type,
          time: completedItem.time || "",
          distance: completedItem.distance || "",
        },
      ];
    }
    try {
      if (typeof saveToHistory === "function") {
        await saveToHistory(historyEntry);
      } else {
        console.log("History entry:", historyEntry);
      }
    } catch (error) {
      console.log("Failed to save to history:", error);
    }
  }

  function toggleFreeze(idx: number) {
    const updated = plan.map((d, i) =>
      i === idx ? { ...d, frozen: !d.frozen } : d
    );
    persist(updated);
  }

  function removeDay(idx: number) {
    const updated = plan.filter((_, i) => i !== idx);
    persist(updated);
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

  function importToLog(day: any, exercise?: string) {
    const entry: any = {
      date: day.date,
      type: day.type || "Gym",
      notes: exercise || day.mainSet?.join(", "),
      exercises: [],
      segments: [],
    };
    if (exercise) {
      const [name, rest = ""] = exercise.split(":");
      const sets = rest.match(/(\d+)×/)?.[1] || "";
      const reps = rest.match(/×(\d+)/)?.[1] || "";
      entry.exercises = [{ name: name.trim(), sets, reps, weight: "" }];
    } else if (day.type === "Gym") {
      entry.exercises = (day.mainSet || []).map((s: string) => {
        const [name, rest = ""] = s.split(":");
        const sets = rest.match(/(\d+)×/)?.[1] || "";
        const reps = rest.match(/×(\d+)/)?.[1] || "";
        return { name: name.trim(), sets, reps, weight: "" };
      });
    } else {
      entry.segments = [
        {
          type: day.type,
          time: day.time || "",
          distance: day.distance || "",
        },
      ];
    }
    goToLog(entry);
  }

  function handleManualScheduleSubmit() {
    if (sessionType === "All") {
      Alert.alert(
        "Pick a Type",
        "Please choose a specific session type before adding."
      );
      return;
    }
    if (!selectedDate) {
      Alert.alert("Missing Date", "Please select a date.");
      return;
    }
    const today = new Date();
    const limit = addDays(today, 7);
    if (isBefore(limit, selectedDate)) {
      Alert.alert(
        "Too Far Ahead",
        "You can only schedule within 7 days from today."
      );
      return;
    }

    const isoDate = format(selectedDate, "yyyy-MM-dd");
    const newDay: any = {
      date: isoDate,
      type: sessionType,
      done: false,
      frozen: false,
    };

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
  }

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    add(startOfWeek(new Date(), { weekStartsOn: 1 }), { days: i })
  );

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

  const makeCardioTemplateFromForm = (): FavTemplate => ({
    id: `${Date.now()}`,
    name: `${sessionType} – ${duration || 0}m`,
    type: sessionType as TemplateType,
    time: duration,
    distance,
    createdAt: new Date().toISOString(),
  });

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
    } else {
      setDuration(t.time || "");
      setDistance(t.distance || "");
      setWarmUpList([{ name: "", sets: "", reps: "" }]);
      setMainSetList([{ name: "", sets: "", reps: "" }]);
      setCoolDownList([{ name: "", sets: "", reps: "" }]);
    }
  };

  // const saveCurrentFormAsTemplate = async () => {
  //   if (sessionType === "All") {
  //     Alert.alert(
  //       "Pick a Type",
  //       "Please choose a specific session type before saving."
  //     );
  //     return;
  //   }
  //   const tpl =
  //     sessionType === "Gym"
  //       ? makeGymTemplateFromForm()
  //       : makeCardioTemplateFromForm();

  //   // (Optional) ask for a name; on Android fallback to auto-name
  //   const setName = (name?: string) => {
  //     const finalName = name && name.trim() ? name.trim() : tpl.name;
  //     const next = [{ ...tpl, name: finalName }, ...favs].slice(0, 20); // keep last 20
  //     saveFavs(next);
  //   };

  //   // iOS-only prompt
  //   // @ts-ignore
  //   if (Alert.prompt) {
  //     // @ts-ignore
  //     Alert.prompt(
  //       "Save Template",
  //       "Give your template a name",
  //       [
  //         { text: "Cancel", style: "cancel" },
  //         { text: "Save", onPress: (text?: string) => setName(text) },
  //       ],
  //       "plain-text",
  //       tpl.name
  //     );
  //   } else {
  //     setName(); // Android fallback
  //     Alert.alert("Saved", "Template added to your favorites.");
  //   }
  // };

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
    name: `${item.type} – ${format(parseISO(item.date), "dd/MM")}`,
    type: item.type,
    warmUp: item.warmUp,
    mainSet: item.mainSet,
    coolDown: item.coolDown,
    time: item.time,
    distance: item.distance,
    createdAt: new Date().toISOString(),
  });

  // const toggleFavoriteFromItem = async (item: any) => {
  //   const tpl = makeTemplateFromItem(item);
  //   const existing = favs.find((f) => isSimilarTemplate(f, tpl));
  //   if (existing) {
  //     await removeTemplate(existing.id);
  //     Alert.alert("Removed", "Template removed from favorites.");
  //   } else {
  //     await saveFavs([{ ...tpl, name: tpl.name }, ...favs].slice(0, 20));
  //     Alert.alert("Saved", "Template added to your favorites.");
  //   }
  // };

  const itemIsFavorited = (item: any) => {
    const tpl = makeTemplateFromItem(item);
    return favs.some((f) => isSimilarTemplate(f, tpl));
  };
  // const startFavoriteFromForm = () => {
  //   if (sessionType === "All") {
  //     Alert.alert(
  //       "Pick a Type",
  //       "Please choose a specific session type before saving."
  //     );
  //     return;
  //   }
  //   const tpl =
  //     sessionType === "Gym"
  //       ? makeGymTemplateFromForm()
  //       : makeCardioTemplateFromForm();
  //   setPendingFav(tpl);
  //   setFavName(tpl.name);
  //   setShowFavSheet(true);
  // };

  const saveFavouriteNow = async (tpl: FavTemplate, nameOverride?: string) => {
    const finalName = (nameOverride ?? tpl.name).trim() || tpl.name;
    await saveFavs([{ ...tpl, name: finalName }, ...favs].slice(0, 20));
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
            style={[typography.h3, { color: colors.textPrimary, fontSize: 18, marginBottom: 10 }]}
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
            Schedule up to 7 days in advance
          </Text>

          {/* Date Picker */}
          <FlatList
            horizontal
            data={weekDates}
            keyExtractor={(item) => item.toISOString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 8 }}
            renderItem={({ item }) => {
              const isSelected = selectedDate && isSameDay(item, selectedDate);
              const isToday = isSameDay(item, new Date());
              const isGreyedOut = !isToday && !isSelected;
              return (
                <TouchableOpacity
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
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10, marginBottom: 10 }}>
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

          {/* Distance + Duration for non-Gym */}
          {sessionType !== "Gym" && sessionType !== "All" && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
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
                placeholder="e.g. 30 (minutes)"
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
                placeholder="e.g. 5.0 (kilometers)"
                placeholderTextColor={colors.textSecondary}
              />
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
                backgroundColor: colors.success + "22",
                alignSelf: "flex-start",
                ...cardShadow,
              }}
            >
              <Text
                style={{
                  color: colors.success,
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
                marginTop: 12,
                //marginRight: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: colors.accent + "22",
                alignSelf: "flex-start",
                ...cardShadow,
              }}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Favourites ⭐
              </Text>
            </TouchableOpacity>
          </View>

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
          keyExtractor={(item, index) => `${item.date}-${index}`}
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
              key={`${item.date}-${index}`}
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
                  <TouchableOpacity onPress={() => importToLog(item)}>
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
                    {item.type} Summary
                  </Text>
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
                </View>
              )}
              <TouchableOpacity
                onPress={() => startFavoriteFromItem(item)}
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
              Your saved templates
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
