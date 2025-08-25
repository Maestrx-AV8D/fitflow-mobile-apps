// src/screens/History.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getEntries, supabase } from "../lib/api";

type DistanceSegment = { distance?: string; laps?: number; time?: string };
type FastingSegment = {
  label?: string;
  start?: string;
  end?: string;
  duration_seconds?: number;
  completed?: boolean;
};

type Entry = {
  id: number;
  date: string;
  type: string;
  exercises?: { name: string; sets: number; reps: number; weight?: number }[];
  segments?: (DistanceSegment | FastingSegment)[];
  notes?: string;
};

export default function History() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState<{
    gym: boolean;
    fasting: boolean;
    other: boolean;
    insights: boolean;
  }>({
    gym: false,
    fasting: false,
    other: false,
    insights: false,
  });
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Entry>>({});
  const { dark } = useTheme();

  // Insights week-by-week pager
  const [insightsWeekIndex, setInsightsWeekIndex] = useState(0);
  const weekPagerRef = useRef<ScrollView>(null);
  const screenW = Dimensions.get("window").width;
  const horizontalPad = 18;
  const pageW = screenW - horizontalPad * 2;

  const fmtDurHM = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // YYYY-MM-DD in *local* time
  };

  useEffect(() => {
    if (!modalVisible.insights) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // First and last visible days in the month view (Mon .. Sun slabs)
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    const firstWeekStart = (() => {
      const d = new Date(firstOfMonth);
      const dow = d.getDay(); // 0 Sun..6 Sat
      const daysToMonday = (dow + 6) % 7;
      d.setDate(d.getDate() - daysToMonday);
      return d;
    })();

    const lastWeekEnd = (() => {
      const d = new Date(lastOfMonth);
      const dow = d.getDay();
      const daysToSunday = (7 - dow) % 7;
      d.setDate(d.getDate() + daysToSunday);
      return d;
    })();

    // Find the week index containing "today"
    let idx = 0;
    let found = 0;
    for (
      let cursor = new Date(firstWeekStart);
      cursor <= lastWeekEnd;
      cursor.setDate(cursor.getDate() + 7)
    ) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + 6);
      if (today >= start && today <= end) {
        found = idx;
        break;
      }
      idx++;
    }

    setInsightsWeekIndex(found);

    // Scroll after layout so the pager lands on today's week immediately
    setTimeout(() => {
      weekPagerRef.current?.scrollTo({ x: found * pageW, animated: false });
    }, 0);
  }, [modalVisible.insights, pageW]);

  const getFastingInfo = (entry: Entry) => {
    const seg =
      (entry.segments?.find(
        (s) => (s as FastingSegment)?.start && (s as FastingSegment)?.end
      ) as FastingSegment | undefined) ??
      (entry.segments?.[0] as FastingSegment | undefined) ??
      {};
    const label = seg.label ?? "Fast";
    const start = seg.start ? new Date(seg.start) : undefined;
    const end = seg.end ? new Date(seg.end) : undefined;
    const durationSeconds =
      typeof seg.duration_seconds === "number"
        ? seg.duration_seconds
        : start && end
        ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
        : 0;
    const completed = seg.completed === false ? false : true; // default true if missing

    return {
      label,
      start,
      end,
      durationSeconds,
      durationText: fmtDurHM(durationSeconds),
      completed,
    };
  };

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEntries();
      setEntries(data);

      // Broadcast to other screens
      DeviceEventEmitter.emit("fitflow:entrySaved", {
        reason: "history:refresh",
      });
      DeviceEventEmitter.emit("fitflow:entriesChanged", {
        reason: "history:refresh",
      });
      DeviceEventEmitter.emit("fitflow:dashboard:refresh", {
        reason: "history:refresh",
      });
    } catch (e) {
      console.log("History.refresh error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Shared bottom-sheet swipe-to-dismiss state (used by all modals)
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const resetSheet = () => sheetTranslateY.setValue(0);
  const springBack = () => {
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };
  const dismissSheet = (key: keyof typeof modalVisible) => {
    Animated.timing(sheetTranslateY, {
      toValue: 400,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible((prev) => ({ ...prev, [key]: false }));
      resetSheet();
    });
  };

  // PanResponder: start tracking on downward swipes; release closes if far/fast enough
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6 && g.dy > 0,
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) sheetTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        // default behavior; per-modal override will close the correct sheet
        if (g.dy <= 120 && g.vy <= 0.8) springBack();
      },
      onPanResponderTerminate: () => springBack(),
    })
  ).current;

  const handleReleaseFor =
    (key: keyof typeof modalVisible) => (_e: any, g: any) => {
      if (g.dy > 120 || g.vy > 0.8) dismissSheet(key);
      else springBack();
    };

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      refresh();
      return undefined;
    }, [refresh])
  );

  // Listen for changes from other screens (Log, Dashboard, etc.)
  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener(
      "fitflow:entrySaved",
      (payload?: any) => {
        if (payload?.reason === "history:refresh") return;
        refresh();
      }
    );
    const sub2 = DeviceEventEmitter.addListener(
      "fitflow:entriesChanged",
      refresh
    );
    const sub3 = DeviceEventEmitter.addListener(
      "fitflow:dashboard:refresh",
      refresh
    );

    return () => {
      try {
        sub1.remove();
        sub2.remove();
        sub3.remove();
      } catch {}
    };
  }, [refresh]);

  async function handleDelete(id: number) {
    Alert.alert("Delete entry?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("entries")
            .delete()
            .eq("id", id);
          if (error) {
            Alert.alert("Error", error.message);
          } else {
            setEntries((prev) => prev.filter((e) => e.id !== id));
            DeviceEventEmitter.emit("fitflow:entrySaved", {
              id,
              reason: "history:mutation:delete",
            });
            DeviceEventEmitter.emit("fitflow:entriesChanged", {
              id,
              reason: "history:mutation:delete",
            });
            DeviceEventEmitter.emit("fitflow:dashboard:refresh", {
              id,
              reason: "history:mutation:delete",
            });
          }
        },
      },
    ]);
  }

  function handleEdit(entry: Entry) {
    setExpandedEntryId(entry.id);
    setEditingEntryId(entry.id);
    setDrafts((prev) => {
      if (prev[entry.id]) return prev;
      const copy: Entry = {
        ...entry,
        exercises: entry.exercises
          ? entry.exercises.map((e) => ({ ...e }))
          : undefined,
        segments: entry.segments
          ? entry.segments.map((s) => ({ ...s }))
          : undefined,
      };
      return { ...prev, [entry.id]: copy };
    });
  }

  function cancelEdit(id: number) {
    setEditingEntryId((prev) => (prev === id ? null : prev));
    setDrafts((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  }

  async function saveEdit(id: number) {
    const draft = drafts[id];
    if (!draft) return;

    let payload: Partial<Entry>;
    if (draft.type === "Fasting") {
      payload = { notes: draft.notes ?? "" }; // fasting is notes-only
    } else {
      payload = {
        type: draft.type,
        notes: draft.notes ?? "",
        exercises: draft.type === "Gym" ? draft.exercises ?? [] : undefined,
        segments: draft.type !== "Gym" ? draft.segments ?? [] : undefined,
        date: draft.date,
      };
    }

    const { error } = await supabase
      .from("entries")
      .update(payload)
      .eq("id", id);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? ({ ...e, ...payload } as Entry) : e))
    );
    setEditingEntryId(null);
    setDrafts((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
    DeviceEventEmitter.emit("fitflow:entrySaved", {
      id,
      reason: "history:mutation:edit",
    });
    DeviceEventEmitter.emit("fitflow:entriesChanged", {
      id,
      reason: "history:mutation:edit",
    });
    DeviceEventEmitter.emit("fitflow:dashboard:refresh", {
      id,
      reason: "history:mutation:edit",
    });
  }

  const gym = entries.filter((e) => e.type === "Gym");
  const fasts = entries.filter((e) => e.type === "Fasting");
  const other = entries.filter((e) => e.type !== "Gym" && e.type !== "Fasting");
  const thisMonth = new Date().toLocaleString("en-US", { month: "long" });
  const thisMonthEntries = entries.filter(
    (entry) => new Date(entry.date).getMonth() === new Date().getMonth()
  );

  const calculateVolume = (
    exercises?: { sets: number; reps: number; weight?: number }[]
  ) => {
    if (!exercises) return 0;
    return exercises.reduce((sum, ex) => {
      const repsTotal = ex.sets * ex.reps;
      return (
        sum +
        (typeof ex.weight === "number" ? repsTotal * ex.weight : repsTotal)
      );
    }, 0);
  };

  const renderEntry = (entry: Entry) => {
    const isExpanded = expandedEntryId === entry.id;
    const isEditing = editingEntryId === entry.id;
    const draft = drafts[entry.id];

    const badgeColor =
      {
        Gym: "#AC6AFF",
        Run: "#43E97B",
        Swim: "#5DA5FF",
        Cycle: "#FFC300",
        Fasting: "#FF6A6A",
      }[entry.type] ?? "#AAA";

    const prCount = 0;
    const volume =
      entry.type === "Gym" ? calculateVolume(entry.exercises) : null;
    const fastingInfo = entry.type === "Fasting" ? getFastingInfo(entry) : null;

    const toggleExpand = () =>
      setExpandedEntryId((prev) => (prev === entry.id ? null : entry.id));

    return (
      <TouchableOpacity
        key={entry.id}
        activeOpacity={0.8}
        onPress={toggleExpand}
        style={[styles.whiteCard, { backgroundColor: "#fff" }]}
      >
        {/* Summary Card */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {entry.type === "Fasting" ? (
                <MaterialIcons
                  name="timer"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
              ) : entry.type === "Gym" ? (
                <MaterialIcons
                  name="fitness-center"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
              ) : entry.type === "Run" ? (
                <Ionicons
                  name="walk"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
              ) : entry.type === "Swim" ? (
                <Ionicons
                  name="water"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
              ) : entry.type === "Cycle" ? (
                <MaterialIcons
                  name="directions-bike"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
              ) : null}
              <Text style={styles.badgeText}>{entry.type}</Text>
            </View>
          </View>
          <Text style={[styles.date, { color: dark ? "#fff" : "#1A1A1A" }]}>
            {new Date(entry.date).toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* Summary Row */}
        {entry.type === "Fasting" ? (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "600" },
                ]}
              >
                Type
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: "#FF6A6A", fontWeight: "700" },
                ]}
              >
                {fastingInfo?.label ?? "—"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "600" },
                ]}
              >
                Duration
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "700" },
                ]}
              >
                {fastingInfo?.durationText ?? "—"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "600" },
                ]}
              >
                Status
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    fontWeight: "800",
                    color: fastingInfo?.completed ? "#2E7D32" : "#B26A00",
                  },
                ]}
              >
                {fastingInfo?.completed ? "Completed" : "Ended Early"}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "600" },
                ]}
              >
                Details
              </Text>
              {entry.type === "Gym" ? (
                <Text
                  style={[
                    styles.summaryValue,
                    { color: dark ? "#000" : "#1A1A1A", fontWeight: "700" },
                  ]}
                >
                  {entry.exercises?.length ?? 0} exercises
                </Text>
              ) : (
                <Text
                  style={[
                    styles.summaryValue,
                    { color: dark ? "#000" : "#1A1A1A", fontWeight: "700" },
                  ]}
                >
                  {(entry.segments?.[0] as DistanceSegment | undefined)
                    ?.distance
                    ? `${(entry.segments?.[0] as DistanceSegment).distance}`
                    : (entry.segments?.[0] as DistanceSegment | undefined)
                        ?.laps != null
                    ? `${(entry.segments?.[0] as DistanceSegment).laps} laps`
                    : "—"}
                </Text>
              )}
            </View>

            {entry.type === "Gym" && (
              <View style={styles.summaryItem}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: dark ? "#000" : "#1A1A1A", fontWeight: "600" },
                  ]}
                >
                  Volume
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: dark ? "#000" : "#1A1A1A", fontWeight: "700" },
                  ]}
                >
                  {volume}
                </Text>
              </View>
            )}

            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "600" },
                ]}
              >
                PRs
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: dark ? "#000" : "#1A1A1A", fontWeight: "700" },
                ]}
              >
                {prCount}
              </Text>
            </View>
          </View>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.detailsSection}>
            {isEditing ? (
              <View>
                {/* Editable form */}
                {entry.type === "Gym" ? (
                  <View style={styles.section}>
                    {(draft?.exercises ?? []).map((ex, i) => (
                      <View key={i} style={{ marginBottom: 8 }}>
                        <TextInput
                          value={ex.name}
                          onChangeText={(t) =>
                            setDrafts((prev) => {
                              const d = { ...(prev[entry.id] as Entry) };
                              if (!d.exercises) d.exercises = [];
                              d.exercises[i] = { ...d.exercises[i], name: t };
                              return { ...prev, [entry.id]: d };
                            })
                          }
                          placeholder="Exercise name"
                          style={inputStyle(dark, { marginBottom: 6 })}
                          placeholderTextColor="#999"
                        />
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TextInput
                            value={String(ex.sets ?? "")}
                            onChangeText={(t) =>
                              setDrafts((prev) => {
                                const d = { ...(prev[entry.id] as Entry) };
                                if (!d.exercises) d.exercises = [];
                                const sets = Number(t) || 0;
                                d.exercises[i] = { ...d.exercises[i], sets };
                                return { ...prev, [entry.id]: d };
                              })
                            }
                            keyboardType="numeric"
                            placeholder="Sets"
                            style={[inputStyle(dark), { flex: 1 }]}
                            placeholderTextColor="#999"
                          />
                          <TextInput
                            value={String(ex.reps ?? "")}
                            onChangeText={(t) =>
                              setDrafts((prev) => {
                                const d = { ...(prev[entry.id] as Entry) };
                                if (!d.exercises) d.exercises = [];
                                const reps = Number(t) || 0;
                                d.exercises[i] = { ...d.exercises[i], reps };
                                return { ...prev, [entry.id]: d };
                              })
                            }
                            keyboardType="numeric"
                            placeholder="Reps"
                            style={[inputStyle(dark), { flex: 1 }]}
                            placeholderTextColor="#999"
                          />
                          <TextInput
                            value={ex.weight != null ? String(ex.weight) : ""}
                            onChangeText={(t) =>
                              setDrafts((prev) => {
                                const d = { ...(prev[entry.id] as Entry) };
                                if (!d.exercises) d.exercises = [];
                                const weight = t === "" ? undefined : Number(t);
                                d.exercises[i] = { ...d.exercises[i], weight };
                                return { ...prev, [entry.id]: d };
                              })
                            }
                            keyboardType="numeric"
                            placeholder="kg"
                            style={[inputStyle(dark), { flex: 1 }]}
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={() =>
                        setDrafts((prev) => {
                          const d = { ...(prev[entry.id] as Entry) };
                          d.exercises = [
                            ...(d.exercises ?? []),
                            { name: "", sets: 0, reps: 0, weight: undefined },
                          ];
                          return { ...prev, [entry.id]: d };
                        })
                      }
                      style={{ marginTop: 6 }}
                    >
                      <Text style={{ color: "#AC6AFF", fontWeight: "700" }}>
                        + Add Exercise
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : entry.type === "Fasting" ? (
                  <View style={[styles.section, { marginBottom: 0 }]}>
                    <Text
                      style={{ color: "#888", fontSize: 13, marginBottom: 8 }}
                    >
                      Fasting details are read-only. You can edit the note
                      below.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.section}>
                    {/* Edit first segment's distance/laps; time editable for legacy entries */}
                    <TextInput
                      value={
                        (draft?.segments?.[0] as DistanceSegment | undefined)
                          ?.distance ?? ""
                      }
                      onChangeText={(t) =>
                        setDrafts((prev) => {
                          const d = { ...(prev[entry.id] as Entry) };
                          d.segments = d.segments?.length
                            ? d.segments.map((s, idx) =>
                                idx === 0
                                  ? { ...(s as DistanceSegment), distance: t }
                                  : s
                              )
                            : [{ distance: t }];
                          return { ...prev, [entry.id]: d };
                        })
                      }
                      placeholder="Distance (e.g. 5 km)"
                      style={inputStyle(dark, { marginBottom: 8 })}
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      value={
                        (draft?.segments?.[0] as DistanceSegment | undefined)
                          ?.laps != null
                          ? String(
                              (draft?.segments?.[0] as DistanceSegment).laps
                            )
                          : ""
                      }
                      onChangeText={(t) =>
                        setDrafts((prev) => {
                          const d = { ...(prev[entry.id] as Entry) };
                          const laps = t === "" ? undefined : Number(t) || 0;
                          d.segments = d.segments?.length
                            ? d.segments.map((s, idx) =>
                                idx === 0
                                  ? { ...(s as DistanceSegment), laps }
                                  : s
                              )
                            : [{ laps }];
                          return { ...prev, [entry.id]: d };
                        })
                      }
                      keyboardType="numeric"
                      placeholder="Laps"
                      style={inputStyle(dark, { marginBottom: 8 })}
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      value={
                        (draft?.segments?.[0] as DistanceSegment | undefined)
                          ?.time ?? ""
                      }
                      onChangeText={(t) =>
                        setDrafts((prev) => {
                          const d = { ...(prev[entry.id] as Entry) };
                          d.segments = d.segments?.length
                            ? d.segments.map((s, idx) =>
                                idx === 0
                                  ? { ...(s as DistanceSegment), time: t }
                                  : s
                              )
                            : [{ time: t }];
                          return { ...prev, [entry.id]: d };
                        })
                      }
                      placeholder="Time (optional)"
                      style={inputStyle(dark, { marginBottom: 8 })}
                      placeholderTextColor="#999"
                    />
                  </View>
                )}

                {/* Notes */}
                <TextInput
                  value={draft?.notes ?? ""}
                  onChangeText={(t) =>
                    setDrafts((prev) => {
                      const d = { ...(prev[entry.id] as Entry) };
                      d.notes = t;
                      return { ...prev, [entry.id]: d };
                    })
                  }
                  placeholder="Notes"
                  style={inputStyle(dark)}
                  placeholderTextColor="#999"
                  multiline
                />

                {/* Save / Cancel */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginTop: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => cancelEdit(entry.id)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: "#888", fontWeight: "600" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => saveEdit(entry.id)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: "#1A1A1A",
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {entry.type === "Gym" && entry.exercises?.length ? (
                  <View style={styles.section}>
                    {entry.exercises.map((ex, i) => (
                      <View key={i} style={{ marginBottom: 6 }}>
                        <Text
                          style={[
                            styles.bold,
                            {
                              fontSize: 16,
                              marginBottom: 2,
                              color: dark ? "#000" : "#1A1A1A",
                            },
                          ]}
                        >
                          {ex.name}
                        </Text>
                        {[...Array(ex.sets).keys()].map((setIndex) => (
                          <Text
                            key={setIndex}
                            style={[
                              styles.line,
                              { color: dark ? "#000" : "#1A1A1A" },
                            ]}
                          >
                            Set {setIndex + 1}:{" "}
                            {typeof ex.weight === "number"
                              ? `${ex.weight}kg × `
                              : ""}
                            {ex.reps} reps
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}

                {entry.type === "Fasting" && entry.segments?.length ? (
                  <View style={[styles.section, { marginBottom: 0 }]}>
                    <Text
                      style={{ color: "#888", fontSize: 13, marginBottom: 8 }}
                    >
                      Fasting details are read-only. You can edit the note
                      below.
                    </Text>
                  </View>
                ) : null}

                {entry.type === "Fasting" && fastingInfo && (
                  <View style={styles.section}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          backgroundColor: "#FFECEC",
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#D94B4B",
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          {fastingInfo.label}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: fastingInfo.completed ? "#2E7D32" : "#B26A00",
                          fontWeight: "700",
                        }}
                      >
                        {fastingInfo.completed ? "Completed" : "Ended Early"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.line,
                        { color: dark ? "#000" : "#1A1A1A" },
                      ]}
                    >
                      Duration:{" "}
                      <Text style={{ fontWeight: "700" }}>
                        {fastingInfo.durationText}
                      </Text>
                    </Text>
                    {fastingInfo.start && (
                      <Text
                        style={[
                          styles.line,
                          { color: dark ? "#000" : "#1A1A1A" },
                        ]}
                      >
                        Start: {fastingInfo.start.toLocaleString()}
                      </Text>
                    )}
                    {fastingInfo.end && (
                      <Text
                        style={[
                          styles.line,
                          { color: dark ? "#000" : "#1A1A1A" },
                        ]}
                      >
                        End: {fastingInfo.end.toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}

                {entry.type !== "Gym" &&
                entry.type !== "Fasting" &&
                entry.segments?.length ? (
                  <View style={styles.section}>
                    {(entry.segments as DistanceSegment[]).map((seg, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.line,
                          { color: dark ? "#000" : "#1A1A1A" },
                        ]}
                      >
                        {seg.distance
                          ? `${seg.distance}`
                          : seg.laps
                          ? `${seg.laps} laps`
                          : ""}
                        {seg.distance || seg.laps ? " - " : ""}
                        {seg.time ?? ""}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {entry.notes ? (
                  <Text
                    style={[
                      styles.notes,
                      entry.type === "Fasting" && {
                        color: "#FF6A6A",
                        fontWeight: "600",
                      },
                      { color: dark ? "#000" : "#1A1A1A" },
                    ]}
                  >
                    {entry.notes}
                  </Text>
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(entry)}
                    style={{ marginRight: 12 }}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={20}
                      color={dark ? "#ccc" : "#444"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={dark ? "#ccc" : "#444"}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: dark ? "#1A1A1A" : "#FDFCF9" },
        ]}
      >
        <Text style={[styles.empty, { color: dark ? "#EEE" : "#999" }]}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, { backgroundColor: dark ? "#1A1A1A" : "#FDFCF9" }]}
    >
      {/* Persistent Header */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 20,
          backgroundColor: dark ? "#1A1A1A" : "#FDFCF9",
        }}
      >
        <Text style={[styles.title, { color: dark ? "#fff" : "#1A1A1A" }]}>
          History
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          ...styles.container,
          paddingTop: 0,
          paddingBottom: 30,
        }}
      >
        {/* Insights header card */}
        {dark ? (
          <View style={[styles.insightsCard, { backgroundColor: "#fff" }]}>
            <View>
              <Text style={[styles.insightsTitle, { color: "#1A1A1A" }]}>
                {thisMonth}
                {"\n"}Insights
              </Text>
              <Text style={[styles.insightsCountLabel, { color: "#666" }]}>
                Entries
              </Text>
              <Text style={[styles.insightsCountValue, { color: "#1A1A1A" }]}>
                {thisMonthEntries.length}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.insightsSeeAllButton, { borderColor: "#666" }]}
              onPress={() => {
                resetSheet();
                setModalVisible((prev) => ({ ...prev, insights: true }));
              }}
            >
              <Text style={[styles.insightsSeeAllText, { color: "#666" }]}>
                See All {">"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LinearGradient
            colors={["#1A1A1A", "#2A2A2A"]}
            style={styles.insightsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View>
              <Text style={styles.insightsTitle}>
                {thisMonth}
                {"\n"}Insights
              </Text>
              <Text style={styles.insightsCountLabel}>Entries</Text>
              <Text style={styles.insightsCountValue}>
                {thisMonthEntries.length}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.insightsSeeAllButton}
              onPress={() => {
                resetSheet();
                setModalVisible((prev) => ({ ...prev, insights: true }));
              }}
            >
              <Text style={styles.insightsSeeAllText}>See All {">"}</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Section: Gym Workouts */}
        <SectionButton
          dark={dark}
          icon={
            <Ionicons
              name="barbell-outline"
              size={22}
              color={dark ? "#fff" : "#1A1A1A"}
              style={{ marginRight: 8 }}
            />
          }
          title="Gym Workouts"
          totalLabel={`Total: ${gym.length} logs`}
          onPress={() => {
            resetSheet();
            setModalVisible((prev) => ({ ...prev, gym: true }));
          }}
        />
        <SheetModal
          visible={modalVisible.gym}
          onClose={() => dismissSheet("gym")}
          dark={dark}
          titleIcon={
            <Ionicons
              name="barbell-outline"
              size={22}
              color={dark ? "#fff" : "#1A1A1A"}
              style={{ marginRight: 8 }}
            />
          }
          title="Gym Workouts"
          panHandlers={{
            ...panResponder.panHandlers,
            onPanResponderRelease: handleReleaseFor("gym"),
          }}
        >
          {gym.length ? (
            gym.map(renderEntry)
          ) : (
            <Text style={[styles.empty, { color: dark ? "#EEE" : "#999" }]}>
              No gym workouts logged.
            </Text>
          )}
        </SheetModal>

        {/* Section: Fasting Logs */}
        <SectionButton
          dark={dark}
          icon={
            <Ionicons
              name="timer-outline"
              size={22}
              color={dark ? "#fff" : "#1A1A1A"}
              style={{ marginRight: 8 }}
            />
          }
          title="Fasting Logs"
          totalLabel={`Total: ${fasts.length} logs`}
          onPress={() => {
            resetSheet();
            setModalVisible((prev) => ({ ...prev, fasting: true }));
          }}
        />
        <SheetModal
          visible={modalVisible.fasting}
          onClose={() => dismissSheet("fasting")}
          dark={dark}
          titleIcon={
            <Ionicons
              name="timer-outline"
              size={22}
              color={dark ? "#fff" : "#1A1A1A"}
              style={{ marginRight: 8 }}
            />
          }
          title="Fasting Logs"
          panHandlers={{
            ...panResponder.panHandlers,
            onPanResponderRelease: handleReleaseFor("fasting"),
          }}
        >
          {fasts.length ? (
            fasts.map(renderEntry)
          ) : (
            <Text style={[styles.empty, { color: dark ? "#EEE" : "#999" }]}>
              No fasting logs yet.
            </Text>
          )}
        </SheetModal>

        {/* Section: Other Activities */}
        <SectionButton
          dark={dark}
          icon={
            <Ionicons
              name="bicycle-outline"
              size={22}
              color={dark ? "#fff" : "#1A1A1A"}
              style={{ marginRight: 8 }}
            />
          }
          title="Other Activities"
          totalLabel={`Total: ${other.length} logs`}
          onPress={() => {
            resetSheet();
            setModalVisible((prev) => ({ ...prev, other: true }));
          }}
        />
        <SheetModal
          visible={modalVisible.other}
          onClose={() => dismissSheet("other")}
          dark={dark}
          titleIcon={
            <Ionicons
              name="bicycle-outline"
              size={22}
              color={dark ? "#fff" : "#1A1A1A"}
              style={{ marginRight: 8 }}
            />
          }
          title="Other Activities"
          panHandlers={{
            ...panResponder.panHandlers,
            onPanResponderRelease: handleReleaseFor("other"),
          }}
        >
          {other.length ? (
            other.map(renderEntry)
          ) : (
            <Text style={[styles.empty, { color: dark ? "#EEE" : "#999" }]}>
              No other activities logged.
            </Text>
          )}
        </SheetModal>

        {/* Insights Modal */}
        <SheetModal
          visible={modalVisible.insights}
          onClose={() => dismissSheet("insights")}
          dark={dark}
          title="Insights"
          titleIcon={null}
          panHandlers={{
            ...panResponder.panHandlers,
            onPanResponderRelease: handleReleaseFor("insights"),
          }}
          maxHeight="85%"
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 0 }}
          >
            {/* Summary metrics */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 20,
                backgroundColor: dark ? "#23222B" : "#F5F5F8",
                borderRadius: 18,
                paddingVertical: 22,
                paddingHorizontal: 8,
                marginHorizontal: 18,
              }}
            >
              <Metric
                label="Total Logs"
                value={String(entries.length)}
                color={dark ? "#fff" : "#1A1A1A"}
                subColor={dark ? "#bbb" : "#555"}
              />
              <Metric
                label="Gym"
                value={String(gym.length)}
                color="#AC6AFF"
                subColor={dark ? "#bbb" : "#555"}
              />
              <Metric
                label="Fasts"
                value={String(fasts.length)}
                color="#FF6A6A"
                subColor={dark ? "#bbb" : "#555"}
              />
              <Metric
                label="Other"
                value={String(other.length)}
                color="#5DA5FF"
                subColor={dark ? "#bbb" : "#555"}
              />
            </View>

            {/* Monthly Activity Overview */}
            <View
              style={{
                backgroundColor: dark ? "#23222B" : "#F5F5F8",
                borderRadius: 18,
                padding: 18,
                marginBottom: 16,
                marginHorizontal: 18,
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  color: dark ? "#fff" : "#1A1A1A",
                  fontWeight: "700",
                  fontSize: 22,
                  marginBottom: 8,
                  lineHeight: 28,
                  alignSelf: "center",
                }}
              >
                Monthly Activity Overview
              </Text>
              <Text
                style={{
                  color: dark ? "#fff" : "#1A1A1A",
                  fontSize: 17,
                  lineHeight: 24,
                  alignSelf: "center",
                }}
              >
                <Text style={{ fontWeight: "bold" }}>Gym:</Text> {gym.length}{" "}
                &nbsp;&nbsp;
                <Text style={{ fontWeight: "bold" }}>Fasting:</Text>{" "}
                {fasts.length} &nbsp;&nbsp;
                <Text style={{ fontWeight: "bold" }}>Other:</Text>{" "}
                {other.length}
              </Text>
            </View>

            {/* Month Pager (Mon–Sun per page, swipeable) */}
            {(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth();

              const asYMD = (d: Date) =>
                new Date(d.getFullYear(), d.getMonth(), d.getDate());
              const sameDay = (a: Date, b: Date) =>
                asYMD(a).getTime() === asYMD(b).getTime();

              const firstOfMonth = new Date(year, month, 1);
              const lastOfMonth = new Date(year, month + 1, 0);

              const firstWeekStart = (() => {
                const d = new Date(firstOfMonth);
                const dow = d.getDay(); // 0 Sun..6 Sat
                const daysToMonday = (dow + 6) % 7;
                d.setDate(d.getDate() - daysToMonday);
                return d;
              })();

              const lastWeekEnd = (() => {
                const d = new Date(lastOfMonth);
                const dow = d.getDay();
                const daysToSunday = (7 - dow) % 7;
                d.setDate(d.getDate() + daysToSunday);
                return d;
              })();

              const weeks: Date[][] = [];
              let cursor = new Date(firstWeekStart);
              while (cursor <= lastWeekEnd) {
                const week: Date[] = [];
                for (let i = 0; i < 7; i++) {
                  week.push(new Date(cursor));
                  cursor.setDate(cursor.getDate() + 1);
                }
                weeks.push(week);
              }

              const onMomentumEnd = (e: any) => {
                const x = e.nativeEvent.contentOffset.x;
                const page = Math.round(x / pageW);
                setInsightsWeekIndex(page);
              };

              const goToPage = (idx: number) => {
                const clamped = Math.max(0, Math.min(idx, weeks.length - 1));
                weekPagerRef.current?.scrollTo({
                  x: clamped * pageW,
                  animated: true,
                });
                setInsightsWeekIndex(clamped);
              };

              const countForDate = (d: Date) => {
                const key = toLocalYMD(d);
                return entries.filter(
                  (e) => toLocalYMD(new Date(e.date)) === key
                ).length;
              };

              const inThisMonth = (d: Date) =>
                d.getMonth() === month && d.getFullYear() === year;

              return (
                <View
                  style={{
                    backgroundColor: dark ? "#23222B" : "#F5F5F8",
                    borderRadius: 18,
                    paddingVertical: 14,
                    marginBottom: 16,
                    marginHorizontal: horizontalPad,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      paddingHorizontal: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => goToPage(insightsWeekIndex - 1)}
                      disabled={insightsWeekIndex === 0}
                      style={{
                        padding: 6,
                        opacity: insightsWeekIndex === 0 ? 0.4 : 1,
                      }}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={22}
                        color={dark ? "#fff" : "#1A1A1A"}
                      />
                    </TouchableOpacity>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "center",
                        color: dark ? "#fff" : "#1A1A1A",
                        fontWeight: "700",
                        fontSize: 18,
                      }}
                    >
                      Weekly Breakdown
                    </Text>
                    <TouchableOpacity
                      onPress={() => goToPage(insightsWeekIndex + 1)}
                      disabled={insightsWeekIndex === weeks.length - 1}
                      style={{
                        padding: 6,
                        opacity:
                          insightsWeekIndex === weeks.length - 1 ? 0.4 : 1,
                      }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={dark ? "#fff" : "#1A1A1A"}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    ref={weekPagerRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumEnd}
                    snapToInterval={pageW}
                    decelerationRate="fast"
                    snapToAlignment="start"
                  >
                    {weeks.map((week, wi) => (
                      <View
                        key={wi}
                        style={{ width: pageW, paddingHorizontal: 6 }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          {week.map((d, di) => {
                            const cnt = countForDate(d);
                            const isToday = sameDay(d, today);
                            const muted = !inThisMonth(d);
                            return (
                              <View
                                key={`${wi}-${di}`}
                                style={{
                                  alignItems: "center",
                                  justifyContent: "center",
                                  paddingVertical: 10,
                                  paddingHorizontal: 6,
                                  borderRadius: 12,
                                  width: Math.floor((pageW - 6 * 2) / 7) - 2,
                                  backgroundColor: isToday
                                    ? dark
                                      ? "#AC6AFF22"
                                      : "#EEE5FF"
                                    : "transparent",
                                  opacity: muted ? 0.5 : 1,
                                }}
                              >
                                <Text
                                  style={{
                                    color: dark ? "#bbb" : "#555",
                                    fontSize: 13,
                                    fontWeight: "700",
                                  }}
                                >
                                  {d.toLocaleDateString("en-GB", {
                                    weekday: "short",
                                  })}
                                </Text>
                                <Text
                                  style={{
                                    color: dark ? "#bbb" : "#555",
                                    fontSize: 12,
                                    marginBottom: 2,
                                  }}
                                >
                                  {d.getDate()}
                                </Text>
                                <Text
                                  style={{
                                    fontWeight: "800",
                                    color:
                                      cnt > 0
                                        ? dark
                                          ? "#AC6AFF"
                                          : "#1A1A1A"
                                        : dark
                                        ? "#555"
                                        : "#bbb",
                                    fontSize: 20,
                                    lineHeight: 24,
                                  }}
                                >
                                  {cnt}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* page dots */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                  >
                    {weeks.map((_, i) => (
                      <View
                        key={`dot-${i}`}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginHorizontal: 4,
                          backgroundColor:
                            i === insightsWeekIndex
                              ? dark
                                ? "#fff"
                                : "#1A1A1A"
                              : dark
                              ? "#555"
                              : "#bbb",
                        }}
                      />
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* Most Active Day */}
            {(() => {
              const dowCounts: { [key: string]: number } = {};
              thisMonthEntries.forEach((e) => {
                const d = new Date(e.date);
                const dow = d.toLocaleDateString("en-US", { weekday: "long" });
                dowCounts[dow] = (dowCounts[dow] || 0) + 1;
              });
              let maxDay: string | null = null,
                maxCount = 0;
              Object.entries(dowCounts).forEach(([dow, cnt]) => {
                if (cnt > maxCount) {
                  maxDay = dow;
                  maxCount = cnt;
                }
              });
              return (
                <View
                  style={{
                    backgroundColor: dark ? "#23222B" : "#F5F5F8",
                    borderRadius: 18,
                    padding: 18,
                    marginBottom: 16,
                    marginHorizontal: 18,
                  }}
                >
                  <Text
                    style={{
                      color: dark ? "#fff" : "#1A1A1A",
                      fontWeight: "700",
                      fontSize: 22,
                      marginBottom: 8,
                      lineHeight: 28,
                    }}
                  >
                    Most Active Day
                  </Text>
                  {maxDay ? (
                    <Text
                      style={{
                        fontSize: 22,
                        lineHeight: 26,
                        fontWeight: "800",
                        color: dark ? "#AC6AFF" : "#1A1A1A",
                      }}
                    >
                      {maxDay}{" "}
                      <Text
                        style={{
                          fontWeight: "normal",
                          color: dark ? "#bbb" : "#888",
                          fontSize: 17,
                        }}
                      >
                        ({maxCount} logs)
                      </Text>
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: dark ? "#bbb" : "#888",
                        fontSize: 18,
                        lineHeight: 22,
                      }}
                    >
                      No logs this month
                    </Text>
                  )}
                </View>
              );
            })()}

            {/* Average Logs Per Week */}
            {(() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();
              function getWeekNumber(d: Date) {
                d = new Date(
                  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
                );
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                const weekNo = Math.ceil(
                  ((d as any) - (yearStart as any)) / 86400000 / 7 + 1
                );
                return weekNo;
              }
              const weeksSet = new Set<number>();
              thisMonthEntries.forEach((e) => {
                const d = new Date(e.date);
                if (d.getMonth() === month && d.getFullYear() === year) {
                  weeksSet.add(getWeekNumber(d));
                }
              });
              const numWeeks = weeksSet.size || 1;
              const avg = thisMonthEntries.length / numWeeks;
              return (
                <View
                  style={{
                    backgroundColor: dark ? "#23222B" : "#F5F5F8",
                    borderRadius: 18,
                    padding: 18,
                    marginBottom: 16,
                    marginHorizontal: 18,
                  }}
                >
                  <Text
                    style={{
                      color: dark ? "#fff" : "#1A1A1A",
                      fontWeight: "700",
                      fontSize: 22,
                      marginBottom: 8,
                      lineHeight: 28,
                    }}
                  >
                    Average Logs Per Week
                  </Text>
                  <Text
                    style={{
                      fontSize: 22,
                      lineHeight: 26,
                      fontWeight: "800",
                      color: dark ? "#43E97B" : "#1A1A1A",
                    }}
                  >
                    {avg.toFixed(1)}
                    <Text
                      style={{
                        fontWeight: "normal",
                        color: dark ? "#bbb" : "#888",
                        fontSize: 17,
                      }}
                    >
                      {" "}
                      logs/week
                    </Text>
                  </Text>
                </View>
              );
            })()}

            {/* Category Distribution */}
            {(() => {
              const total = gym.length + fasts.length + other.length;
              const perc = (n: number) =>
                total === 0 ? 0 : Math.round((n / total) * 100);
              return (
                <View
                  style={{
                    backgroundColor: dark ? "#23222B" : "#F5F5F8",
                    borderRadius: 18,
                    padding: 18,
                    marginBottom: 12,
                    marginHorizontal: 18,
                  }}
                >
                  <Text
                    style={{
                      color: dark ? "#fff" : "#1A1A1A",
                      fontWeight: "700",
                      fontSize: 22,
                      marginBottom: 12,
                      lineHeight: 28,
                    }}
                  >
                    Category Distribution
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-evenly",
                    }}
                  >
                    <Category
                      icon={
                        <MaterialIcons
                          name="fitness-center"
                          size={32}
                          color="#AC6AFF"
                          style={{ marginBottom: 4 }}
                        />
                      }
                      label="Gym"
                      value={`${perc(gym.length)}%`}
                      color="#AC6AFF"
                      subColor={dark ? "#bbb" : "#555"}
                    />
                    <Category
                      icon={
                        <MaterialIcons
                          name="timer"
                          size={32}
                          color="#FF6A6A"
                          style={{ marginBottom: 4 }}
                        />
                      }
                      label="Fasting"
                      value={`${perc(fasts.length)}%`}
                      color="#FF6A6A"
                      subColor={dark ? "#bbb" : "#555"}
                    />
                    <Category
                      icon={
                        <Ionicons
                          name="walk"
                          size={32}
                          color="#5DA5FF"
                          style={{ marginBottom: 4 }}
                        />
                      }
                      label="Other"
                      value={`${perc(other.length)}%`}
                      color="#5DA5FF"
                      subColor={dark ? "#bbb" : "#555"}
                    />
                  </View>
                </View>
              );
            })()}
          </ScrollView>
        </SheetModal>
      </ScrollView>
    </View>
  );
}

const inputStyle = (dark: boolean, extra?: object) => ({
  borderWidth: 1,
  borderColor: "#eee",
  borderRadius: 8,
  padding: 8,
  color: dark ? "#000" : "#1A1A1A",
  ...(extra || {}),
});

function SectionButton({
  dark,
  icon,
  title,
  totalLabel,
  onPress,
}: {
  dark: boolean;
  icon: React.ReactNode;
  title: string;
  totalLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 0,
          marginBottom: 6,
        }}
      >
        {icon}
        <Text
          style={[
            styles.sectionTitle,
            { color: dark ? "#fff" : "#1A1A1A", marginTop: 0, marginBottom: 0 },
          ]}
        >
          {title}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.sectionCardButton, { backgroundColor: "#fff" }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View
          style={{ alignItems: "center", flex: 1, justifyContent: "center" }}
        >
          <Text
            style={[
              styles.sectionCardButtonText,
              { color: "#1A1A1A", textAlign: "center" },
            ]}
          >
            View {title}
          </Text>
          <Text style={[styles.sectionCardButtonSubText, { color: "#1A1A1A" }]}>
            {totalLabel}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function SheetModal({
  visible,
  onClose,
  dark,
  title,
  titleIcon,
  panHandlers,
  children,
  maxHeight,
}: {
  visible: boolean;
  onClose: () => void;
  dark: boolean;
  title: string;
  titleIcon: React.ReactNode;
  panHandlers: any;
  children: React.ReactNode;
  maxHeight?: string;
}) {
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Reset internal translate when the modal shows
    if (visible) sheetTranslateY.setValue(0);
  }, [visible, sheetTranslateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)" },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: dark ? "#1A1A1A" : "#FDFCF9",
              transform: [{ translateY: sheetTranslateY }],
              ...(maxHeight ? { maxHeight } : {}),
            },
          ]}
          // Override the release handler to close the correct modal
          {...panHandlers}
        >
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {titleIcon}
              <Text
                style={[
                  styles.modalTitle,
                  { color: dark ? "#fff" : "#1A1A1A" },
                ]}
              >
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons
                name="close"
                size={28}
                color={dark ? "#fff" : "#1A1A1A"}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            nestedScrollEnabled
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            style={{ flex: 1 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Metric({
  label,
  value,
  color,
  subColor,
}: {
  label: string;
  value: string;
  color: string;
  subColor: string;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          color,
          fontWeight: "800",
          fontSize: 32,
          lineHeight: 38,
          marginBottom: 2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: subColor,
          fontSize: 16,
          fontWeight: "600",
          lineHeight: 22,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Category({
  icon,
  label,
  value,
  color,
  subColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subColor: string;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      {icon}
      <Text style={{ fontWeight: "800", color, fontSize: 22, lineHeight: 26 }}>
        {value}
      </Text>
      <Text
        style={{
          color: subColor,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingTop: 70, paddingBottom: 140 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    marginTop: 32,
  },
  insightsCard: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 56,
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightsTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  insightsCountLabel: { fontSize: 14, color: "#ccc" },
  insightsCountValue: { fontSize: 22, fontWeight: "700", color: "#fff" },
  insightsSeeAllButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  insightsSeeAllText: { color: "#ccc", fontSize: 14, fontWeight: "500" },
  whiteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: { fontSize: 14, fontWeight: "600" },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 16 },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 8,
  },
  section: { marginBottom: 12 },
  line: { fontSize: 14, marginBottom: 2 },
  bold: { fontWeight: "600" },
  notes: { fontStyle: "italic", color: "#333", marginTop: 4 },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  empty: { color: "#999", textAlign: "center", marginBottom: 12 },
  sectionCardButton: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  sectionCardButtonText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#1A1A1A",
    textAlign: "center",
  },
  sectionCardButtonSubText: {
    color: "#888",
    fontSize: 15,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    flex: 1,
    maxHeight: "95%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    transform: [{ translateY: -12 }],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 32, lineHeight: 38, fontWeight: "700" },
  modalCloseButton: { padding: 4 },
});
