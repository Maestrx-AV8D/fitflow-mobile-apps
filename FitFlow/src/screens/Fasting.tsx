

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FastingInfoCard from "../components/FastingInfoCard";
import FastingTipsCard from "../components/FastingTipsCard";
import FastingTypePicker from "../components/FastingTypePicker";
import HealthWarningCard from "../components/HealthWarningCard";
import ProgressRing from "../components/ProgressRing";
import { supabase } from "../lib/api";
import {
  endFast,
  FastingLabel,
  startFast,
  useFastingState,
} from "../lib/fastingState";
import { useTheme } from "../theme/theme";

const FASTING_TYPES = [
  { label: "16:8", fastingHours: 16, eatingHours: 8 },
  { label: "18:6", fastingHours: 18, eatingHours: 6 },
  { label: "20:4", fastingHours: 20, eatingHours: 4 },
  { label: "OMAD", fastingHours: 23, eatingHours: 1 },
  { label: "2m", fastingHours: 2 / 60, eatingHours: 0 }, // ✅ test type (120s)
] as const;

const K_PREF_LABEL = "fastPreferredLabel";
const K_NOTE_ID = "fastNoteId"; // add this

type FastingType = (typeof FASTING_TYPES)[number];

export default function Fasting() {
  const { colors, typography } = useTheme();
  const [selectedType, setSelectedType] = useState<FastingType>(
    FASTING_TYPES[0]
  );
  const [notificationId, setNotificationId] = useState<string | null>(null);

  const hasCompletedRef = useRef(false);
  const fasting = useFastingState();

  // Load last preferred label on first mount
  useEffect(() => {
    (async () => {
      try {
        const pref = await AsyncStorage.getItem(K_PREF_LABEL);
        if (pref) {
          const t = FASTING_TYPES.find((x) => x.label === pref);
          if (t) setSelectedType(t);
        }
      } catch {}
    })();
  }, []);

  // While a fast is active, mirror the active label to the picker (read-only)
  useEffect(() => {
    if (fasting.active && fasting.label) {
      const t = FASTING_TYPES.find((x) => x.label === fasting.label);
      if (t && t.label !== selectedType.label) setSelectedType(t);
    }
  }, [fasting.active, fasting.label]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveType = fasting.active
    ? FASTING_TYPES.find((t) => t.label === fasting.label) ?? selectedType
    : selectedType;

  const fastingSeconds = Math.max(
    1,
    Math.round(effectiveType.fastingHours * 3600)
  );
  const ringProgress = Math.min(fasting.elapsed / fastingSeconds, 1);

  // Ask for notification permission once
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") await Notifications.requestPermissionsAsync();
      } catch {}
    })();
  }, []);

  const targetHours = fastingSeconds / 3600;
  const milestones = [
    { label: "Fat Burning", progress: 4 / targetHours },
    { label: "Ketosis", progress: 8 / targetHours },
    { label: "Deep Ketosis", progress: 12 / targetHours },
  ].filter((m) => m.progress < 1);

  const formatHmS = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatTargetForNote = (seconds: number) => {
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    const hrs = +(seconds / 3600).toFixed(1);
    return `${hrs} h`;
  };

  const insertFastingEntry = async ({
    label,
    startISO,
    endISO,
    durationSeconds,
    completed,
  }: {
    label: FastingLabel;
    startISO: string;
    endISO: string;
    durationSeconds: number;
    completed: boolean;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const date = endISO.split("T")[0];
    const human =
      durationSeconds < 3600
        ? `${Math.round(durationSeconds / 60)} min`
        : `${+(durationSeconds / 3600).toFixed(1)} h`;

    await supabase.from("entries").insert({
      user_id: user.id,
      type: "Fasting",
      date,
      notes: completed
        ? `Completed a ${label} fast (${human})`
        : `Ended ${label} fast early (${human})`,
      segments: [
        {
          label,
          start: startISO,
          end: endISO,
          duration_seconds: durationSeconds,
          completed,
        },
      ],
    });
  };

  const scheduleEndNotification = async (secondsFromNow: number) => {
    try {
      const triggerDate = new Date(Date.now() + secondsFromNow * 1000);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Fast Complete!",
          body: `Your ${effectiveType.label} fast has finished.`,
        },
        trigger: triggerDate,
      });
      setNotificationId(id);
      try {
        await AsyncStorage.setItem(K_NOTE_ID, id);
      } catch {}
    } catch {}
  };

  const handleFastComplete = async () => {
    // Pin the picker to the label that just finished and persist it
    const labelUsed = effectiveType.label as FastingLabel;
    const finishedSeconds = fastingSeconds;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) console.warn("Supabase user error", userError);

      if (user) {
        // Compute deterministic end time: start + target duration
        const startISO = fasting.startISO ?? new Date().toISOString();
        const endAt = new Date(
          new Date(startISO).getTime() + finishedSeconds * 1000
        ).toISOString();

        const today = new Date().toISOString().split("T")[0];
        await supabase.from("entries").insert({
          user_id: user.id,
          type: "Fasting",
          date: today,
          notes: `Completed a ${labelUsed} fast (${formatTargetForNote(
            finishedSeconds
          )})`,
          // Store structured details for the History/Log view
          segments: [
            {
              label: labelUsed,
              start: startISO,
              end: endAt,
              duration_seconds: finishedSeconds,
            },
          ],
        });
      }

      // inside handleFastComplete() just before the Alert
      const startISO = fasting.startISO ?? new Date().toISOString();
      const endAt = new Date(
        new Date(startISO).getTime() + finishedSeconds * 1000
      ).toISOString();

      await insertFastingEntry({
        label: labelUsed,
        startISO,
        endISO: endAt,
        durationSeconds: finishedSeconds,
        completed: true,
      });

      Alert.alert("🎉 Fast Complete!", `You've completed a ${labelUsed} fast.`);
    } finally {
      hasCompletedRef.current = false;

      // Ensure selectedType is set BEFORE clearing store, to avoid a brief 16:8 flash
      const t = FASTING_TYPES.find(
        (x) => x.label === (effectiveType.label as FastingLabel)
      );
      if (t) {
        setSelectedType(t);
        try {
          await AsyncStorage.setItem(K_PREF_LABEL, t.label);
        } catch {}
      }

      try {
        await endFast(); // clears shared state -> elapsed resets to 0, ring resets
      } finally {
        if (notificationId) {
          try {
            const stored = await AsyncStorage.getItem(K_NOTE_ID);
            const toCancel = notificationId ?? stored ?? null;
            if (toCancel) {
              try {
                await Notifications.cancelScheduledNotificationAsync(toCancel);
              } catch {}
            }
            await AsyncStorage.removeItem(K_NOTE_ID);
          } catch {}
          setNotificationId(null);
        }
      }
    }
  };

  // // Auto-complete watcher:
  // // IMPORTANT: we no longer gate on fasting.active because the app may resume *after* the target time.
  // useEffect(() => {
  //   if (!fasting.label) {
  //     hasCompletedRef.current = false;
  //     return;
  //   }
  //   if (!hasCompletedRef.current && fasting.elapsed >= fastingSeconds) {
  //     hasCompletedRef.current = true;
  //     handleFastComplete().catch(() => {});
  //   }
  // }, [fasting.label, fasting.elapsed, fastingSeconds]);

  const toggleFasting = async () => {
    if (fasting.active) {
      // If already reached target, treat as completion (log + reset)
      if (fasting.elapsed >= fastingSeconds) {
        await handleFastComplete();
        return;
      }

      // Otherwise confirm early end (no log)
      Alert.alert(
        "End fast early?",
        "You haven't reached the target yet. End now?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Now",
            style: "destructive",
            onPress: async () => {
              try {
                // compute actual end now
                const label = (fasting.label ??
                  selectedType.label) as FastingLabel;
                const startISO = fasting.startISO ?? new Date().toISOString();
                const endISO = new Date().toISOString();
                const elapsedSeconds = Math.max(
                  0,
                  Math.floor(
                    (new Date(endISO).getTime() -
                      new Date(startISO).getTime()) /
                      1000
                  )
                );

                await insertFastingEntry({
                  label,
                  startISO,
                  endISO,
                  durationSeconds: elapsedSeconds,
                  completed: false, // ⟵ early end
                });

                await endFast();
              } finally {
                try {
                  const stored = await AsyncStorage.getItem(K_NOTE_ID);
                  const toCancel = notificationId ?? stored ?? null;
                  if (toCancel)
                    await Notifications.cancelScheduledNotificationAsync(
                      toCancel
                    );
                  await AsyncStorage.removeItem(K_NOTE_ID);
                } catch {}
                setNotificationId(null);
              }
            },
          },
        ]
      );
    } else {
      // Start the currently selected label (including "2m"), and persist selection
      const label = selectedType.label as FastingLabel;
      try {
        await AsyncStorage.setItem(K_PREF_LABEL, label);
      } catch {}
      await startFast(label);
      await scheduleEndNotification(
        Math.max(1, Math.round(selectedType.fastingHours * 3600))
      );
    }
  };

  const remainingDisplay = fasting.active
    ? formatHmS(Math.max(0, fastingSeconds - fasting.elapsed))
    : // When idle, show the full target for the selected type (e.g., 2m => 00:02:00)
      formatHmS(fastingSeconds);

  const getFastingPhase = (): "before" | "during" | "after" => {
    if (!fasting.active) return "before";
    return fasting.elapsed >= fastingSeconds ? "after" : "during";
    // NB: while completed (after target) but before handleFastComplete clears state,
    // this returns "after", which is correct.
  };

  const getFastingState = () => {
    const e = fasting.elapsed;
    if (!fasting.active) return "Idle";
    if (e < 4 * 3600) return "🍽️ Digesting";
    if (e < 8 * 3600) return "🔥 Fat Burning";
    if (e < 12 * 3600) return "🥑 Ketosis";
    return "🧠 Deep Ketosis";
  };

  const getTimeRange = () => {
    if (!fasting.active || !fasting.startISO)
      return { start: "--:--", end: "--:--" };
    const start = new Date(fasting.startISO);
    const end = new Date(start.getTime() + fastingSeconds * 1000);
    return {
      start: start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (fasting.hydrating) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Loading your fast…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            Fasting
          </Text>

          <FastingTypePicker
            types={FASTING_TYPES}
            selected={
              (fasting.active
                ? effectiveType.label
                : selectedType.label) as string
            }
            onSelect={async (label) => {
              const t = FASTING_TYPES.find((x) => x.label === label)!;
              setSelectedType(t);
              try {
                await AsyncStorage.setItem(K_PREF_LABEL, t.label);
              } catch {}
            }}
            disabled={fasting.active}
          />

          <ProgressRing
            // Hard reset the ring when not active
            key={`${effectiveType.label}-${fasting.active ? "on" : "off"}`}
            progress={fasting.active ? ringProgress : 0}
            time={formatHmS(fasting.elapsed)}
            remaining={remainingDisplay}
            milestones={milestones}
            fastingLabel={effectiveType.label}
            started={fasting.active}
          />

          {fasting.active && (
            <View style={styles.row}>
              <View style={styles.timeBlock}>
                <Text
                  style={[styles.timeLabel, { color: colors.textSecondary }]}
                >
                  Start
                </Text>
                <Text style={[styles.text, { color: colors.textSecondary }]}>
                  {getTimeRange().start}
                </Text>
              </View>
              <View style={styles.timeBlock}>
                <Text
                  style={[styles.timeLabel, { color: colors.textSecondary }]}
                >
                  End
                </Text>
                <Text style={[styles.text, { color: colors.textSecondary }]}>
                  {getTimeRange().end}
                </Text>
              </View>
            </View>
          )}

          <Text
            style={{
              textAlign: "center",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12,
            }}
          >
            {fasting.active
              ? `${getFastingState()}`
              : "Choose a fast and begin"}
          </Text>

          <TouchableOpacity
            onPress={toggleFasting}
            style={[styles.timerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: colors.surface, fontWeight: "600" }}>
              {fasting.active
                ? "End Fast"
                : `Start ${selectedType.label} Fasting`}
            </Text>
          </TouchableOpacity>
          <HealthWarningCard />

          <FastingTipsCard phase={getFastingPhase()} />
          <FastingInfoCard
            label={effectiveType.label}
            state={getFastingState()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 100 },
  topBar: { marginTop: 70, marginBottom: 24 },
  timerButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 50,
    marginBottom: 16,
  },
  timeBlock: { alignItems: "center" },
  timeLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  text: { fontSize: 14, lineHeight: 20 },
});
