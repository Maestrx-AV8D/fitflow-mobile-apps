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
  const { colors, typography } = useTheme();
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const padding = 12;
  const fullSize = size + padding * 2;
  const center = fullSize / 2;

  const animatedMilestoneRadius = useRef(
    milestones.map(() => new Animated.Value(6))
  ).current;

  useEffect(() => {
    if (started) {
      milestones.forEach((m, i) => {
        if (progress >= m.progress) {
          Animated.timing(animatedMilestoneRadius[i], {
            toValue: 12, // Target radius
            duration: 600,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false, // radius is not transformable on native driver
          }).start();
        }
      });
    }
  }, [progress, milestones, started]);

  useEffect(() => {
    if (!started) {
      milestones.forEach((_, i) => {
        Animated.timing(animatedMilestoneRadius[i], {
          toValue: 6,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false,
        }).start();
      });
    }
  }, [started]);

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

            return (
              <AnimatedCircle
                key={index}
                cx={x}
                cy={y}
                r={animatedMilestoneRadius[index]}
                fill={colors.accent}
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.textContainer}>
        {started && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Time Left
          </Text>
        )}
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {remaining}
        </Text>

        {started && fastingLabel && (
          <View style={styles.infoBox}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>
              Fasting Type
            </Text>
            <Text style={[styles.infoText, { color: colors.textPrimary }]}>
              {fastingLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  textContainer: {
    position: "absolute",
    alignItems: "center",
  },
  time: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  caption: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    marginTop: 8,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    textAlign: "center",
  },
});
