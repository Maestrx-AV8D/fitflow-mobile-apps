// src/components/GenerationResultModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../theme/theme";

type Kind = "Workout" | "Schedule" | "Nutrition";

export type GenerationItem = {
  id?: number;
  type: Kind;
  prompt: string;
  payload: any;
  created_at?: string;
};

export function GenerationResultModal({
  visible,
  item,        // show the latest item in focus
  onClose,
  onImportWorkoutToLog,
  onImportScheduleToPlanner,
  onOpenNutrition,
  canImport,
  canSchedule,
}: {
  visible: boolean;
  item: GenerationItem | null;
  onClose: () => void;

  // parent provides these (they can enforce entitlements & navigation)
  onImportWorkoutToLog?: (payload: any) => void;
  onImportScheduleToPlanner?: (days: any[]) => void;
  onOpenNutrition?: (payload: any) => void;

  // feature gates
  canImport?: boolean;
  canSchedule?: boolean;
}) {
    const { colors, spacing, typography } = useTheme();
  if (!item) return null;

  const isWorkout = item.type === "Workout";
  const isSchedule = item.type === "Schedule";
  const isNutrition = item.type === "Nutrition";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={["#0A0A0A", "#1A1A1A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Ionicons
              name={
                isWorkout
                  ? "barbell-outline"
                  : isSchedule
                  ? "calendar-outline"
                  : "fast-food-outline"
              }
              size={18}
              color="#FFF"
            />
            <Text style={styles.headerText}>
              {isWorkout ? "Workout Generated" : isSchedule ? "Schedule Generated" : "Nutrition Plan"}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ marginLeft: "auto" }}>
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Minimal, friendly preview */}
            <Text style={[styles.title, {color: colors.textSecondary}]}>Prompt</Text>
            <Text style={styles.body}>{item.prompt}</Text>

            {isWorkout && (
              <>
                <Text style={styles.title}>Warm-up</Text>
                {(item.payload?.warmUp || []).map((l: string, i: number) => (
                  <Text key={`wu-${i}`} style={styles.body}>• {l}</Text>
                ))}
                <Text style={styles.title}>Main Set</Text>
                {(item.payload?.mainSet || []).map((l: string, i: number) => (
                  <Text key={`ms-${i}`} style={styles.body}>• {l}</Text>
                ))}
                <Text style={styles.title}>Cool Down</Text>
                {(item.payload?.coolDown || []).map((l: string, i: number) => (
                  <Text key={`cd-${i}`} style={styles.body}>• {l}</Text>
                ))}
              </>
            )}

            {isSchedule && (
              <>
                <Text style={styles.title}>Days</Text>
                {(item.payload || []).slice(0, 7).map((d: any, i: number) => (
                  <View key={`day-${i}`} style={{ marginBottom: 8 }}>
                    <Text style={[styles.body, { fontWeight: "800" }]}>
                      {d.date || `Day ${i + 1}`}
                    </Text>
                    {(d.warmUp || []).map((l: string, j: number) => (
                      <Text key={`swu-${i}-${j}`} style={styles.body}>• Warm-up: {l}</Text>
                    ))}
                    {(d.mainSet || []).map((l: string, j: number) => (
                      <Text key={`sms-${i}-${j}`} style={styles.body}>• Main: {l}</Text>
                    ))}
                    {(d.coolDown || []).map((l: string, j: number) => (
                      <Text key={`scd-${i}-${j}`} style={styles.body}>• Cool-down: {l}</Text>
                    ))}
                  </View>
                ))}
              </>
            )}

            {isNutrition && (
              <>
                <Text style={styles.title}>Nutrition</Text>
                <Text style={styles.body}>
                  {(item.payload?.answer as string) ||
                    "Plan generated. Open to view details."}
                </Text>
              </>
            )}
          </ScrollView>

          {/* Actions */}
          {/* <View style={styles.ctaRow}>
            {isWorkout && (
              <>
                <PrimaryBtn
                  label="Import to Log"
                  onPress={() => onImportWorkoutToLog(item.payload)}
                  disabled={!canImport}
                />
                <PrimaryBtn
                  label="Add to Schedule"
                  onPress={() =>
                    onImportScheduleToPlanner([
                      {
                        date: new Date().toISOString().slice(0, 10),
                        warmUp: item.payload?.warmUp || [],
                        mainSet: item.payload?.mainSet || [],
                        coolDown: item.payload?.coolDown || [],
                      },
                    ])
                  }
                  disabled={!canSchedule}
                />
              </>
            )}

            {isSchedule && (
              <PrimaryBtn
                label="Import All to Schedule"
                onPress={() => onImportScheduleToPlanner(item.payload || [])}
                disabled={!canSchedule}
                full
              />
            )}

            {isNutrition && (
              <PrimaryBtn
                label="Open Nutrition"
                onPress={() => onOpenNutrition(item.payload)}
                full
              />
            )}
          </View> */}
          {/* </View> */}
        </View>
      </View>
    </Modal>
  );
}

function PrimaryBtn({
  label,
  onPress,
  disabled,
  full,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <LinearGradient
      colors={disabled ? ["#D6D9DE", "#D6D9DE"] : ["#0A0A0A", "#1A1A1A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.btnWrap, full && { flex: 1 }]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={styles.btn}
        activeOpacity={0.9}
      >
        <Text style={[styles.btnText, disabled && { color: "#888" }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "90%",
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 19,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: "#FFF",
    fontWeight: "900",
    marginLeft: 8,
    fontSize: 15,
  },
  title: { fontWeight: "900", marginBottom: 6, fontSize: 16 },
  body: { color: "#1E2126", marginBottom: 6, fontSize: 15 },
  ctaRow: {
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom:10,
    justifyContent: "center",
  },
  btnWrap: { borderRadius: 12, overflow: "hidden" },
  btn: { paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "900" },
});
