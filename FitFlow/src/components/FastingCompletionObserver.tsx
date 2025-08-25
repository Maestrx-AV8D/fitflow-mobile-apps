// components/FastingCompletionObserver.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { supabase } from "../lib/api";
import { endFast, FastingLabel, hoursForLabel, useFastingState } from "../lib/fastingState";

const K_NOTE_ID = "fastNoteId";

export default function FastingCompletionObserver() {
  const fast = useFastingState();
  const lock = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (!fast.active || !fast.label || !fast.startISO) return;
      const target = Math.round(hoursForLabel(fast.label as FastingLabel) * 3600);
      if (fast.elapsed < target) return;
      if (lock.current) return;
      lock.current = true;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Build log payload
        const startISO = fast.startISO;
        const endISO = new Date(new Date(startISO).getTime() + target * 1000).toISOString();

        if (user) {
          const today = new Date().toISOString().split("T")[0];
          await supabase.from("entries").insert({
            user_id: user.id,
            type: "Fasting",
            date: today,
            notes: `Completed a ${fast.label} fast (${target >= 3600 ? `${(target/3600).toFixed(1)} h` : `${Math.round(target/60)} min`})`,
            segments: [{ label: fast.label, start: startISO, end: endISO, duration_seconds: target, completed: true }],
          });
        }

        // Cancel any scheduled local notification if we persisted it
        try {
          const nid = await AsyncStorage.getItem(K_NOTE_ID);
          if (nid) {
            await Notifications.cancelScheduledNotificationAsync(nid);
            await AsyncStorage.removeItem(K_NOTE_ID);
          }
        } catch {}

        // End the fast globally (resets ring everywhere)
        await endFast();

        // Lightweight UI feedback anywhere in the app
        Alert.alert("🎉 Fast Complete!", `You've completed a ${fast.label} fast.`);
      } finally {
        // Release lock shortly after to protect against quick re-renders
        setTimeout(() => { lock.current = false; }, 500);
      }
    };

    run();
  }, [fast.active, fast.label, fast.startISO, fast.elapsed]);

  return null;
}
