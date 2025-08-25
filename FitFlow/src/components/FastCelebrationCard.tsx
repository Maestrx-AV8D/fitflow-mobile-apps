// 

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/theme";

type Props = {
  label: string;                 // e.g., "16:8"
  start: Date;                   // full fast start
  end: Date;                     // full fast end
  durationSeconds: number;       // total duration
  dayStart: Date;                // start of the day being rendered (00:00)
  dayEnd: Date;                  // end   of the day being rendered (24:00)
  highlightCompletion?: boolean; // true on the day the fast finishes
  completed?: boolean;            // true if the fast has fully completed (not just the slice for this day)
};

const fmtHm = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDur = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function FastCelebrationCard({
  label,
  start,
  end,
  durationSeconds,
  dayStart,
  dayEnd,
  highlightCompletion = false,
  completed = true,
}: Props) {
  const { colors } = useTheme();
  const fastLabel = label || "Fast";

  // compute the slice of the fast that falls within this day
  const visStart = Math.max(dayStart.getTime(), start.getTime());
  const visEnd = Math.min(dayEnd.getTime(), end.getTime());
  const spansLeft = start.getTime() < dayStart.getTime();
  const spansRight = end.getTime() > dayEnd.getTime();

  // subtle sparkle pulse on completion day
  const sparkle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!highlightCompletion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 900, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 900, easing: Easing.in(Easing.exp), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlightCompletion, sparkle]);
  const scale = sparkle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });


  const ribbonColor = completed ? colors.primary : (colors.warning ?? colors.primary);
  const ribbonText = completed ? "COMPLETED" : "ENDED EARLY";
  const titleText = completed ? "🎉 Fast Completed" : "⏱️ Fast Ended Early";

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {/* corner ribbon */}
      {/* <View style={styles.ribbonWrap} pointerEvents="none">
        <View style={[styles.ribbon, { backgroundColor: ribbonColor }]}>
          <Text style={[styles.ribbonText, { color: colors.surface }]}>
            {ribbonText}
          </Text>
        </View>
      </View> */}

      {/* header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {titleText}
        </Text>

        {/* prominent fast type pill */}
        <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.pillText, { color: colors.textPrimary }]}>{label || "Fast"}</Text>
        </View>
      </View>

      {/* meta row */}
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Total {fmtDur(durationSeconds)}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {fmtHm(start)} → {fmtHm(end)}
        </Text>
      </View>

      {/* “slice for this day” badges (replaces the timeline bar) */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
            Slice today: {fmtHm(new Date(visStart))} → {fmtHm(new Date(visEnd))}
          </Text>
        </View>

        {spansLeft && (
          <View style={[styles.badge, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>↞ from previous day</Text>
          </View>
        )}
        {spansRight && (
          <View style={[styles.badge, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>↠ continues tomorrow</Text>
          </View>
        )}
      </View>

      {/* tiny celebratory pulse dot on completion day */}
    
        <Animated.View
          style={[
            styles.sparkleDot,
            { backgroundColor: completed ? colors.success : colors.warning , opacity, transform: [{ scale }] },
          ]}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "800" },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: { fontSize: 12, fontWeight: "600" },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  ribbonWrap: {
    position: "absolute",
    top: 10,
    right: -34,
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
  },
  ribbon: { paddingVertical: 4, paddingHorizontal: 36, borderRadius: 6 },
  ribbonText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  sparkleDot: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
