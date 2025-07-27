import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/theme";

interface Props {
  state: "Digesting" | "Fat Burning" | "Ketosis" | "Deep Ketosis";
  label: string;
}

const facts: Record<string, string> = {
  "16:8": "This is one of the easiest fasting methods to start with.",
  "18:6": "This method helps with insulin sensitivity and weight control.",
  "20:4": "Also called Warrior Diet — requires high discipline.",
  OMAD: "One Meal A Day boosts growth hormone and mental clarity.",
  Digesting: "You are still using energy from your last meal.",
  "Fat Burning": "Your body is now switching to fat as its fuel source.",
  Ketosis: "Ketone production has begun, enhancing fat metabolism.",
  "Deep Ketosis": "Autophagy and deep fat burn are in full swing!",
};

export default function FastingInfoCard({ label, state }: Props) {
  const { colors, typography } = useTheme();

  const fact =
    facts[state] || facts[label] || "Fasting can improve metabolic health.";

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.accent}
        />
        <Text
          style={[typography.h3, { color: colors.textPrimary, marginLeft: 8 }]}
        >
          Did You Know?
        </Text>
      </View>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{fact}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
    marginBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
