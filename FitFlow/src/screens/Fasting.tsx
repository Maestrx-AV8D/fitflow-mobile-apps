// import AsyncStorage from '@react-native-async-storage/async-storage'
// import React, { useEffect, useState } from 'react'
// import {
//   Alert,
//   Dimensions,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native'

// import FastingInfoCard from '../components/FastingInfoCard'
// import FastingTipsCard from '../components/FastingTipsCard'
// import FastingTypePicker from '../components/FastingTypePicker'
// import ProgressRing from '../components/ProgressRing'
// import { supabase } from '../lib/api'
// import { useTheme } from '../theme/theme'

// const FASTING_TYPES = [
//   { label: '16:8', fastingHours: 16, eatingHours: 8 },
//   { label: '18:6', fastingHours: 18, eatingHours: 6 },
//   { label: '20:4', fastingHours: 20, eatingHours: 4 },
//   { label: 'OMAD', fastingHours: 23, eatingHours: 1 },
// ]

// export default function Fasting() {
//   const { colors, typography } = useTheme()
//   const [selectedType, setSelectedType] = useState(FASTING_TYPES[0])
//   const [startTime, setStartTime] = useState<Date | null>(null)
//   const [elapsed, setElapsed] = useState(0)
//   const [celebrated, setCelebrated] = useState(false)

//   const fastingSeconds = selectedType.fastingHours * 3600
//   const progress = Math.min(elapsed / fastingSeconds, 1)

//   const milestones = [
//     { label: 'Fat Burning', progress: 4 / selectedType.fastingHours },
//     { label: 'Ketosis', progress: 8 / selectedType.fastingHours },
//     { label: 'Deep Ketosis', progress: 12 / selectedType.fastingHours },
//   ].filter(m => m.progress < 1)

//   useEffect(() => {
//     const load = async () => {
//       const stored = await AsyncStorage.getItem('fastStartTime')
//       if (stored) setStartTime(new Date(stored))
//     }
//     load()
//   }, [])

//   useEffect(() => {
//   let interval: any
//   if (startTime) {
//     interval = setInterval(async () => {
//       const now = new Date().getTime()
//       const diff = Math.floor((now - startTime.getTime()) / 1000)
//       setElapsed(diff)

//       if (diff >= fastingSeconds && !celebrated) {
//         const {
//           data: { user },
//           error: userError,
//         } = await supabase.auth.getUser()

//         if (userError || !user?.id) {
//           console.error('User fetch error:', userError)
//           return
//         }
//        const today = new Date().toISOString().split('T')[0]
//         await supabase.from('entries').insert({
//           user_id: user.id, // ✅ required for RLS
//           type: 'Fasting',
//           date: today,
//           notes: `Completed a ${selectedType.label} fast (${Math.round(
//             selectedType.fastingHours
//           )} hours)`,
//           segments: []
//         }).select()

//         setCelebrated(true)
//         Alert.alert('🎉 Fast Complete!', `You've completed a ${selectedType.label} fast.`)

//         // Reset fast state after completion
//         setStartTime(null)
//         AsyncStorage.removeItem('fastStartTime')
//       }
//     }, 1000)
//   } else {
//     setElapsed(0)
//     setCelebrated(false)
//   }

//   return () => clearInterval(interval)
// }, [startTime, selectedType, celebrated])

//   const toggleFasting = async () => {
//     if (startTime) {
//       setStartTime(null)
//       await AsyncStorage.removeItem('fastStartTime')
//     } else {
//       const now = new Date()
//       setStartTime(now)
//       await AsyncStorage.setItem('fastStartTime', now.toISOString())
//     }
//   }

//   const formatTime = (seconds: number) => {
//     const h = Math.floor(seconds / 3600)
//     const m = Math.floor((seconds % 3600) / 60)
//     const s = seconds % 60
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
//   }

//   const getFastingPhase = (): 'before' | 'during' | 'after' => {
//     if (!startTime) return 'before'
//     return elapsed >= fastingSeconds ? 'after' : 'during'
//   }

//   const getFastingState = () => {
//     if (elapsed < 4 * 3600) return '🍽️ Digesting'
//     if (elapsed < 8 * 3600) return '🔥 Fat Burning'
//     if (elapsed < 12 * 3600) return '🥑 Ketosis'
//     return '🧠 Deep Ketosis'
//   }

//   const getRemaining = () => {
//     const remaining = Math.max(fastingSeconds - elapsed, 0)
//     return formatTime(remaining)
//   }

//   const getTimeRange = () => {
//     if (!startTime) return { start: '--:--', end: '--:--' }
//     const end = new Date(startTime.getTime() + fastingSeconds * 1000)
//     return {
//       start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     }
//   }

//   return (
//     <View style={[styles.screen, { backgroundColor: colors.background }]}>
//       <ScrollView contentContainerStyle={styles.container}>
//         <View style={styles.topBar}>
//           <Text style={[typography.h2, { color: colors.textPrimary }]}>Fasting</Text>

//           <FastingTypePicker
//             types={FASTING_TYPES}
//             selected={selectedType.label}
//             onSelect={(label) =>
//               setSelectedType(FASTING_TYPES.find(t => t.label === label)!)
//             }
//           />

//           <ProgressRing
//             progress={progress}
//             time={formatTime(elapsed)}
//             remaining={getRemaining()}
//             milestones={milestones}
//             fastingLabel={selectedType.label}
//             started={!!startTime}
//           />

//           {startTime && (
//             <View style={styles.row}>
//               <View style={styles.timeBlock}>
//                 <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
//                 <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().start}</Text>
//               </View>
//               <View style={styles.timeBlock}>
//                 <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
//                 <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().end}</Text>
//               </View>
//             </View>
//           )}

//           <Text
//             style={{
//               textAlign: 'center',
//               fontSize: 14,
//               color: colors.textSecondary,
//               marginBottom: 12,
//             }}
//           >
//             {startTime ? `${getFastingState()}` : 'Choose a fast and begin'}
//           </Text>

//           <TouchableOpacity
//             onPress={toggleFasting}
//             style={[styles.timerButton, { backgroundColor: colors.primary }]}
//           >
//             <Text style={{ color: colors.surface, fontWeight: '600' }}>
//               {startTime ? 'End Fast' : `Start ${selectedType.label} Fasting`}
//             </Text>
//           </TouchableOpacity>

//           <FastingTipsCard phase={getFastingPhase()} />
//           <FastingInfoCard label={selectedType.label} state={getFastingState()} />
//         </View>
//       </ScrollView>
//     </View>
//   )
// }

// const { width } = Dimensions.get('window')

// const styles = StyleSheet.create({
//   screen: { flex: 1 },
//   container: { padding: 16, paddingBottom: 100 },
//   topBar: {
//     marginTop: 70,
//     marginBottom: 24,
//   },
//   timerButton: {
//     marginTop: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 24,
//     borderRadius: 24,
//     alignSelf: 'center',
//     marginBottom: 20,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginHorizontal: 50,
//     marginBottom: 16,
//   },
//   timeBlock: {
//     alignItems: 'center',
//   },
//   timeLabel: {
//     fontSize: 13,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   text: {
//     fontSize: 14,
//     lineHeight: 20,
//   },
// })

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
import ProgressRing from "../components/ProgressRing";
import { supabase } from "../lib/api";
import { useTheme } from "../theme/theme";

const FASTING_TYPES = [
  { label: "16:8", fastingHours: 16, eatingHours: 8 },
  { label: "18:6", fastingHours: 18, eatingHours: 6 },
  { label: "20:4", fastingHours: 20, eatingHours: 4 },
  { label: "OMAD", fastingHours: 23, eatingHours: 1 },
] as const;

type FastingType = (typeof FASTING_TYPES)[number];

export default function Fasting() {
  const { colors, typography } = useTheme();
  const [selectedType, setSelectedType] = useState<FastingType>(
    FASTING_TYPES[0]
  );
  const [activeType, setActiveType] = useState<FastingType | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  const [hydrating, setHydrating] = useState(true);
  const hasCompletedRef = useRef(false);

  const effectiveType: FastingType = activeType ?? selectedType;
  const fastingSeconds = selectedType.fastingHours * 3600;
  const progress = Math.min(elapsed / fastingSeconds, 1);

  const milestones = [
    { label: "Fat Burning", progress: 4 / selectedType.fastingHours },
    { label: "Ketosis", progress: 8 / selectedType.fastingHours },
    { label: "Deep Ketosis", progress: 12 / selectedType.fastingHours },
  ].filter((m) => m.progress < 1);

  // // Load saved fast on mount
  // useEffect(() => {
  //   (async () => {
  //     const stored = await AsyncStorage.getItem('fastStartTime');
  //     if (stored) setStartTime(new Date(stored));
  //   })();
  // }, []);

  // // Calculate elapsed time continuously using system clock
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!startTime) {
  //       setElapsed(0);
  //       return;
  //     }
  //     const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
  //     setElapsed(diff);

  //     if (diff >= fastingSeconds) {
  //       handleFastComplete();
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [startTime, selectedType]);

  // ---------- Hydration: restore any ongoing fast ----------
  useEffect(() => {
    (async () => {
      try {
        const [storedStart, storedTypeLabel] = await Promise.all([
          AsyncStorage.getItem("fastStartTime"),
          AsyncStorage.getItem("fastTypeLabel"),
        ]);

        if (storedStart) {
          const started = new Date(storedStart);
          setStartTime(started);

          // Restore the fasting type used when the fast started
          if (storedTypeLabel) {
            const found =
              FASTING_TYPES.find((t) => t.label === storedTypeLabel) ??
              FASTING_TYPES[0];
            setActiveType(found);
          } else {
            setActiveType(FASTING_TYPES[0]);
          }

          // Compute initial elapsed immediately to avoid showing max time for a frame
          const diff = Math.max(
            0,
            Math.floor((Date.now() - new Date(storedStart).getTime()) / 1000)
          );
          setElapsed(diff);
        }
      } finally {
        setHydrating(false);
      }
    })();
  }, []);

  // ---------- Timer tick (system clock based) ----------
  useEffect(() => {
    if (hydrating) return;

    const interval = setInterval(() => {
      if (!startTime) {
        setElapsed(0);
        hasCompletedRef.current = false; // reset guard when no active fast
        return;
      }
      const diff = Math.max(
        0,
        Math.floor((Date.now() - startTime.getTime()) / 1000)
      );
      setElapsed(diff);

      if (diff >= fastingSeconds && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        handleFastComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, fastingSeconds, hydrating]);

  // ---------- Complete fast ----------
  const handleFastComplete = async () => {
    if (!startTime) return;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.warn("Supabase user error", userError);
      }

      if (user) {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("entries").insert({
          user_id: user.id,
          type: "Fasting",
          date: today,
          notes: `Completed a ${effectiveType.label} fast (${effectiveType.fastingHours} hours)`,
          segments: [],
        });
      }

      Alert.alert(
        "🎉 Fast Complete!",
        `You've completed a ${effectiveType.label} fast.`
      );
    } finally {
      // Clear state and local storage
      setStartTime(null);
      setActiveType(null);
      setElapsed(0);
      await AsyncStorage.multiRemove(["fastStartTime", "fastTypeLabel"]);

      // Cancel any scheduled notification
      if (notificationId) {
        Notifications.cancelScheduledNotificationAsync(notificationId).catch(
          () => {}
        );
        setNotificationId(null);
      }
    }
  };

  // const handleFastComplete = async () => {
  //   // Only complete once
  //   if (!startTime) return;
  //   const {
  //     data: { user },
  //     error: userError,
  //   } = await supabase.auth.getUser();

  //   if (!user || userError) return;

  //   const today = new Date().toISOString().split("T")[0];
  //   await supabase.from("entries").insert({
  //     user_id: user.id,
  //     type: "Fasting",
  //     date: today,
  //     notes: `Completed a ${selectedType.label} fast (${selectedType.fastingHours} hours)`,
  //     segments: [],
  //   });

  //   Alert.alert(
  //     "🎉 Fast Complete!",
  //     `You've completed a ${selectedType.label} fast.`
  //   );

  //   // Clear state and local storage
  //   setStartTime(null);
  //   await AsyncStorage.removeItem("fastStartTime");

  //   // Cancel any scheduled notification
  //   if (notificationId) {
  //     Notifications.cancelScheduledNotificationAsync(notificationId);
  //     setNotificationId(null);
  //   }
  // };

  // const toggleFasting = async () => {
  //   if (startTime) {
  //     // End fast
  //     setStartTime(null);
  //     await AsyncStorage.removeItem("fastStartTime");
  //     if (notificationId) {
  //       Notifications.cancelScheduledNotificationAsync(notificationId);
  //       setNotificationId(null);
  //     }
  //   } else {
  //     // Start fast
  //     const now = new Date();
  //     setStartTime(now);
  //     await AsyncStorage.setItem("fastStartTime", now.toISOString());

  //     // Schedule notification for fast end
  //     const triggerDate = new Date(now.getTime() + fastingSeconds * 1000);
  //     const id = await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title: "🎉 Fast Complete!",
  //         body: `Your ${selectedType.label} fast has finished.`,
  //       },
  //       trigger: triggerDate,
  //     });
  //     setNotificationId(id);
  //   }
  // };

  // ---------- Start/stop ----------
  const toggleFasting = async () => {
    if (startTime) {
      // End fast
      hasCompletedRef.current = false;
      setStartTime(null);
      setActiveType(null);
      setElapsed(0);
      await AsyncStorage.multiRemove(["fastStartTime", "fastTypeLabel"]);
      if (notificationId) {
        Notifications.cancelScheduledNotificationAsync(notificationId).catch(
          () => {}
        );
        setNotificationId(null);
      }
    } else {
      // Start fast
      const now = new Date();
      const typeForThisFast = selectedType; // lock in the choice at start

      setStartTime(now);
      setActiveType(typeForThisFast);
      setElapsed(0);
      hasCompletedRef.current = false;

      await AsyncStorage.multiSet([
        ["fastStartTime", now.toISOString()],
        ["fastTypeLabel", typeForThisFast.label],
      ]);

      // Schedule notification for fast end
      try {
        const triggerDate = new Date(
          now.getTime() + typeForThisFast.fastingHours * 3600 * 1000
        );
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "🎉 Fast Complete!",
            body: `Your ${typeForThisFast.label} fast has finished.`,
          },
          trigger: triggerDate,
        });
        setNotificationId(id);
      } catch {
        // Notification permission may be missing; proceed without failing the fast
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getFastingPhase = (): "before" | "during" | "after" => {
    if (!startTime) return "before";
    return elapsed >= fastingSeconds ? "after" : "during";
  };

  const getFastingState = () => {
    if (elapsed < 4 * 3600) return "🍽️ Digesting";
    if (elapsed < 8 * 3600) return "🔥 Fat Burning";
    if (elapsed < 12 * 3600) return "🥑 Ketosis";
    return "🧠 Deep Ketosis";
  };

  const getRemaining = () => {
    const remaining = Math.max(fastingSeconds - elapsed, 0);
    return formatTime(remaining);
  };

  const getTimeRange = () => {
    if (!startTime) return { start: "--:--", end: "--:--" };
    const end = new Date(startTime.getTime() + fastingSeconds * 1000);
    return {
      start: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (hydrating) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
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
            selected={selectedType.label}
            onSelect={(label) =>
              setSelectedType(FASTING_TYPES.find((t) => t.label === label)!)
            }
          />

          <ProgressRing
            progress={progress}
            time={formatTime(elapsed)}
            remaining={getRemaining()}
            milestones={milestones}
            fastingLabel={selectedType.label}
            started={!!startTime}
          />

          {startTime && (
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
            {startTime ? `${getFastingState()}` : "Choose a fast and begin"}
          </Text>

          <TouchableOpacity
            onPress={toggleFasting}
            style={[styles.timerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: colors.surface, fontWeight: "600" }}>
              {startTime ? "End Fast" : `Start ${selectedType.label} Fasting`}
            </Text>
          </TouchableOpacity>

          <FastingTipsCard phase={getFastingPhase()} />
          <FastingInfoCard
            label={selectedType.label}
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
