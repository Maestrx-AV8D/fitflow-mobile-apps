// // src/components/GenerationHistoryList.tsx
// import { Ionicons } from "@expo/vector-icons";
// import { format } from "date-fns";
// import { LinearGradient } from "expo-linear-gradient";
// import React, { useState } from "react";
// import {
//     ActivityIndicator,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";

// import { GenerationResultModal } from "./GenerationResultModal";

// /** Keep these in sync with your app types */
// export type GenerationHistoryItem = {
//   id: number;
//   type: "Workout" | "Schedule" | "Nutrition";
//   prompt: string;
//   payload: any;
//   created_at: string;
//   expires_at?: string | null;
// };

// export type Workout = {
//   warmUp: string[];
//   mainSet: string[];
//   coolDown: string[];
//   description?: string;
// };

// export type ScheduleDay = {
//   date: string;
//   warmUp: string[];
//   mainSet: string[];
//   coolDown: string[];
//   type?: "Gym" | "Run" | "Swim" | "Cycle" | "Other";
//   time?: string;
//   distance?: string;
//   done?: boolean;
// };

// export type NutritionPlan = {
//   answer?: string;
//   breakfast?: string[];
//   lunch?: string[];
//   dinner?: string[];
//   snacks?: string[];
//   ingredients?: string[];
// };

// type Props = {
//   title?: string;
//   history: GenerationHistoryItem[];
//   loading?: boolean;

//   /** Entitlement gates provided by the parent */
//   canImport: boolean;
//   canSchedule: boolean;

//   /** Actions the modal can call back to */
//   onImportWorkoutToLog: (payload: Workout) => void;
//   onImportScheduleToPlanner: (days: ScheduleDay[]) => void;
//   onOpenNutrition: (payload: NutritionPlan) => void;
// };

// export default function GenerationHistoryList({
//   title = "Your AI History",
//   history,
//   loading,
//   canImport,
//   canSchedule,
//   onImportWorkoutToLog,
//   onImportScheduleToPlanner,
//   onOpenNutrition,
// }: Props) {
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selected, setSelected] = useState<GenerationHistoryItem | null>(null);

//   return (
//     <View style={styles.card}>
//       <View style={styles.headerRow}>
//         <Text style={styles.h2}>{title}</Text>
//         {loading ? <ActivityIndicator /> : null}
//       </View>

//       {history.length === 0 ? (
//         <Text style={[styles.text, { color: "#666" }]}>No history yet.</Text>
//       ) : (
//         history.map((h) => (
//           <View key={h.id} style={styles.itemRow}>
//             <Text style={styles.itemTitle}>
//               {h.type} • {format(new Date(h.created_at), "dd MMM, HH:mm")}
//             </Text>
//             <Text style={[styles.text, { marginTop: 4 }]} numberOfLines={2}>
//               {h.prompt}
//             </Text>

//             <View style={{ flexDirection: "row", marginTop: 8, }}>
//                 <>
//                 {h.type === "Workout" && (<LinearGradient
//                 colors={["#0A0A0A", "#1A1A1A"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={{ borderRadius: 10, marginRight: 8 }}
//               >
//                 <TouchableOpacity
//                   onPress={() => {
//                     setSelected(h);
//                     onImportWorkoutToLog(h.payload as Workout);
//                   }}
//                   style={styles.viewBtn}
//                   activeOpacity={0.9}
//                 >
//                   <Text style={styles.viewBtnText}>To Log</Text>
//                 </TouchableOpacity>
//               </LinearGradient>)}
//               {h.type !== "Nutrition" && (<LinearGradient
//                 colors={["#0A0A0A", "#1A1A1A"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={{ borderRadius: 10 , marginRight: 8  }}
//               >
//                 <TouchableOpacity
//                   onPress={() => {
//                     setSelected(h);
//                     onImportScheduleToPlanner(h.payload as ScheduleDay[]);
//                   }}
//                   style={styles.viewBtn}
//                   activeOpacity={0.9}
//                 >
//                   <Text style={styles.viewBtnText}>To Schedule</Text>
//                 </TouchableOpacity>
//               </LinearGradient>)}
//               {h.type === "Nutrition" && (<LinearGradient
//                 colors={["#0A0A0A", "#1A1A1A"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={{ borderRadius: 10 , marginRight: 8  }}
//               >
//                 <TouchableOpacity
//                   onPress={() => {
//                     setSelected(h);
//                     onOpenNutrition(h.payload as NutritionPlan);
//                   }}
//                   style={styles.viewBtn}
//                   activeOpacity={0.9}
//                 >
//                   <Text style={styles.viewBtnText}>Export</Text>
//                 </TouchableOpacity>
//               </LinearGradient>)}
//               <LinearGradient
//                 colors={["#0A0A0A", "#1A1A1A"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={{ borderRadius: 10 }}
//               >
//                 <TouchableOpacity
//                   onPress={() => {
//                     setSelected(h);
//                     setModalOpen(true);
//                   }}
//                   style={styles.viewBtn}
//                   activeOpacity={0.9}
//                 >
//                   <Ionicons
//                     name="eye-outline"
//                     size={14}
//                     color="#FFF"
//                     style={{ marginRight: 6 }}
//                   />
//                   <Text style={styles.viewBtnText}>View</Text>
//                 </TouchableOpacity>
//               </LinearGradient></>
//             </View>
//           </View>
//         ))
//       )}

//       {/* Centralized modal: opens when a “View” button is tapped */}
//       <GenerationResultModal
//         visible={modalOpen}
//         item={selected}
//         onClose={() => {
//           setModalOpen(false);
//           setSelected(null);
//         }}
//         canImport={canImport}
//         canSchedule={canSchedule}
//         onImportWorkoutToLog={(payload) => onImportWorkoutToLog(payload)}
//         onImportScheduleToPlanner={(days) => onImportScheduleToPlanner(days)}
//         onOpenNutrition={(payload) => {
//           // parent decides how to show nutrition view
//           onOpenNutrition(payload as NutritionPlan);
//           setModalOpen(false);
//           setSelected(null);
//         }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#FFFFFF",
//     padding: 18,
//     borderRadius: 16,
//     borderColor: "#E6EAEE",
//     borderWidth: 1,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.08,
//     shadowRadius: 18,
//     elevation: 5,
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   h2: {
//     fontWeight: "900",
//     fontSize: 16,
//     color: "#0D0F12",
//     letterSpacing: -0.2,
//   },
//   text: { fontSize: 15, color: "#1E2126" },
//   itemRow: {
//     paddingVertical: 10,
//     borderTopWidth: 1,
//     borderTopColor: "#EFEFEF",
//   },
//   itemTitle: { fontWeight: "700", color: "#000" },
//   viewBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 10,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   viewBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
// });

// src/components/GenerationHistoryList.tsx
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { NutritionPlan, ScheduleDay, Workout } from "../lib/utils/CoachTypes";
import { detectActivityTypeFromLines } from "../lib/utils/DetectActivityType";
import { GenerationResultModal } from "./GenerationResultModal";

/** Keep these in sync with your app types */
export type GenerationHistoryItem = {
  id: number;
  type: "Workout" | "Schedule" | "Nutrition";
  prompt: string;
  payload: any;
  created_at: string;
  expires_at?: string | null;
};

// export type Workout = {
//   warmUp: string[];
//   mainSet: string[];
//   coolDown: string[];
//   description?: string;
// };

// export type ScheduleDay = {
//   date: string;
//   warmUp: string[];
//   mainSet: string[];
//   coolDown: string[];
//   type?: "Gym" | "Run" | "Swim" | "Cycle" | "Other";
//   time?: string;
//   distance?: string;
//   done?: boolean;
// };

// export type NutritionPlan = {
//   answer?: string;
//   breakfast?: string[];
//   lunch?: string[];
//   dinner?: string[];
//   snacks?: string[];
//   ingredients?: string[];
// };

type Props = {
  title?: string;
  history: GenerationHistoryItem[];
  loading?: boolean;

  /** Entitlement gates provided by the parent */
  canImport: boolean;
  canSchedule: boolean;

  /** Actions the modal can call back to */
  onImportWorkoutToLog: (payload: Workout, type: "workout") => void;
  onImportScheduleToPlanner: (days: ScheduleDay[]) => void;
  onOpenNutrition: (payload: NutritionPlan) => void;
};

// Minimal type detector (mirror of SmartWorkout’s logic, simplified)
// function detectActivityTypeFromLines(
//   lines: string[]
// ): "Gym" | "Run" | "Swim" | "Cycle" | "Other" {
//   const hay = (lines || []).join(" ").toLowerCase();
//   if (/(swim|pool|backstroke|breaststroke|freestyle|laps)/.test(hay))
//     return "Swim";
//   if (/(run|jog|tempo|interval|5k|10k|marathon)/.test(hay)) return "Run";
//   if (/(cycle|bike|bicycle|spin|peloton|watt|cadence|ftp)/.test(hay))
//     return "Cycle";
//   if (
//     /(bench press|deadlift|squat|overhead press|lat pulldown|row|curl|reps|sets|barbell|dumbbell)/.test(
//       hay
//     )
//   )
//     return "Gym";
//   if (
//     /(workout|session|mobility|yoga|pilates|stretch|core|hiit|cardio)/.test(hay)
//   )
//     return "Other";
//   return "Gym";
// }

export default function GenerationHistoryList({
  title = "Your AI History",
  history,
  loading,
  canImport,
  canSchedule,
  onImportWorkoutToLog,
  onImportScheduleToPlanner,
  onOpenNutrition,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<GenerationHistoryItem | null>(null);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.h2}>{title}</Text>
        {loading ? <ActivityIndicator /> : null}
      </View>

      {history.length === 0 ? (
        <Text style={[styles.text, { color: "#666" }]}>No history yet.</Text>
      ) : (
        history.map((h) => (
          <View key={h.id} style={styles.itemRow}>
            <Text style={styles.itemTitle}>
              {h.type} • {format(new Date(h.created_at), "dd MMM, HH:mm")}
            </Text>
            <Text style={[styles.text, { marginTop: 4 }]} numberOfLines={2}>
              {h.prompt}
            </Text>

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {/* To Log (Workout only) */}
              {h.type === "Workout" && (
                <LinearGradient
                  colors={["#0A0A0A", "#1A1A1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 10, marginRight: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelected(h);
                      onImportWorkoutToLog(h.payload as Workout, "workout");
                    }}
                    style={styles.viewBtn}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.viewBtnText}>To Log</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {/* To Schedule (Schedule: pass days as-is; Workout: wrap into a single day) */}
              {(h.type === "Schedule" || h.type === "Workout") && (
                <LinearGradient
                  colors={["#0A0A0A", "#1A1A1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 10, marginRight: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (h.type === "Workout") {
                        // Turn workout into a one-day schedule
                        const allText = [
                          ...(h.payload?.warmUp || []),
                          ...(h.payload?.mainSet || []),
                          ...(h.payload?.coolDown || []),
                        ]
                          .join(" ")
                          .toLowerCase();

                        // ]);
                        onImportScheduleToPlanner([
                                                  {
                                                    date: format(new Date(), "yyyy-MM-dd"),
                                                    warmUp: h.payload.warmUp || [],
                                                    mainSet: h.payload.mainSet || [],
                                                    coolDown: h.payload.coolDown || [],
                                                    type:
                                                      detectActivityTypeFromLines(
                                                        (h.payload.mainSet || []).concat(
                                                          h.payload.warmUp || [],
                                                          h.payload.coolDown || []
                                                        )
                                                      ) || "Gym",
                                                  },
                                                ])
                      } else {
                        // h.type === "Schedule" — assume payload is already an array of days
                        onImportScheduleToPlanner(h.payload as ScheduleDay[]);
                      }
                    }}
                    style={styles.viewBtn}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.viewBtnText}>To Schedule</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {/* Nutrition: Export/Open */}
              {h.type === "Nutrition" && (
                <LinearGradient
                  colors={["#0A0A0A", "#1A1A1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 10, marginRight: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelected(h);
                      onOpenNutrition(h.payload as NutritionPlan);
                    }}
                    style={styles.viewBtn}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.viewBtnText}>Export</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {/* View modal */}
              <LinearGradient
                colors={["#0A0A0A", "#1A1A1A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 10 }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelected(h);
                    setModalOpen(true);
                  }}
                  style={styles.viewBtn}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color="#FFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        ))
      )}

      {/* Centralized modal: opens when a “View” button is tapped */}
      <GenerationResultModal
        visible={modalOpen}
        item={selected}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        canImport={canImport}
        canSchedule={canSchedule}
        onImportWorkoutToLog={(payload) => onImportWorkoutToLog(payload, "workout")}
        onImportScheduleToPlanner={(days) => onImportScheduleToPlanner(days)}
        onOpenNutrition={(payload) => {
          onOpenNutrition(payload as NutritionPlan);
          setModalOpen(false);
          setSelected(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    borderColor: "#E6EAEE",
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  h2: {
    fontWeight: "900",
    fontSize: 16,
    color: "#0D0F12",
    letterSpacing: -0.2,
  },
  text: { fontSize: 15, color: "#1E2126" },
  itemRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
  },
  itemTitle: { fontWeight: "700", color: "#000" },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  viewBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
});
