import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { G, Circle as SvgCircle } from "react-native-svg";
import { useTheme } from "../theme/theme";
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

interface ProgressRingProps {
  progress: number; // 0 to 1
  time: string;
  remaining: string;
  startTime?: string;
  endTime?: string;
  milestones?: { label: string; progress: number }[];
  fastingLabel?: string;
  stateInfo?: string;
  started: boolean;
}

export default function ProgressRing({
  progress,
  time,
  remaining,
  startTime,
  endTime,
  milestones = [],
  fastingLabel,
  stateInfo,
  started = false,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const padding = 12;
  const fullSize = size + padding * 2;
  const center = fullSize / 2;

  // Keep a ref array of Animated.Values that matches the current milestones length.
  const radiiRef = useRef<Animated.Value[]>([]);

  // Rebuild (or extend) the radii array whenever `milestones` changes.
  useEffect(() => {
    const prev = radiiRef.current;
    const next = milestones.map((_, i) => prev[i] ?? new Animated.Value(6));
    radiiRef.current = next;
  }, [milestones]);

  // Grow milestones that have been reached (guard against undefined).
  useEffect(() => {
    if (!started) return;
    milestones.forEach((m, i) => {
      const rv = radiiRef.current[i];
      if (rv && progress >= m.progress) {
        Animated.timing(rv, {
          toValue: 12,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false, // radius isn't transformable on native driver
        }).start();
      }
    });
  }, [progress, milestones, started]);

  // When not started, shrink all milestone dots safely.
  useEffect(() => {
    if (started) return;
    milestones.forEach((_, i) => {
      const rv = radiiRef.current[i];
      if (rv) {
        Animated.timing(rv, {
          toValue: 6,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false,
        }).start();
      }
    });
  }, [started, milestones]);

  return (
    <View style={styles.container}>
      <Svg width={fullSize} height={fullSize} style={{ overflow: "visible" }}>
        <G rotation="-90" origin={`${fullSize / 2}, ${fullSize / 2}`}>
          <SvgCircle
            stroke={colors.border}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <SvgCircle
            stroke={colors.primary}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />

          {milestones.map((m, index) => {
            const angle = m.progress * 360;
            const rad = (angle * Math.PI) / 180;
            const x = center + radius * Math.cos(rad);
            const y = center + radius * Math.sin(rad);
            const r = radiiRef.current[index] ?? 6; // safe fallback

            return (
              <AnimatedCircle
                key={`${m.label}-${index}`}
                cx={x}
                cy={y}
                r={r as unknown as number} // Animated.Value is supported by AnimatedCircle
                fill={colors.accent}
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.textContainer}>
        {started && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>Time Left</Text>
        )}
        <Text style={[styles.time, { color: colors.textPrimary }]}>{remaining}</Text>

        {started && fastingLabel && (
          <View style={styles.infoBox}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>Fasting Type</Text>
            <Text style={[styles.infoText, { color: colors.textPrimary }]}>{fastingLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", marginBottom: 32 },
  textContainer: { position: "absolute", alignItems: "center" },
  time: { fontSize: 24, fontWeight: "bold", marginVertical: 2 },
  label: { fontSize: 14, fontWeight: "500" },
  caption: { fontSize: 12, marginTop: 2 },
  infoBox: { marginTop: 8, alignItems: "center" },
  infoTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  infoText: { fontSize: 13, textAlign: "center" },
});
