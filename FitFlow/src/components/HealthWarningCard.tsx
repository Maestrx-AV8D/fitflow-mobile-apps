import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/theme";

const K_FASTING_HEALTH_ACK = "fastingHealthAck";

export default function HealthWarningCard() {
  const { colors, typography } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ack = await AsyncStorage.getItem(K_FASTING_HEALTH_ACK);
        setVisible(!ack); // show if not acknowledged
      } catch {
        setVisible(true);
      }
    })();
  }, []);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  const dontShowAgain = async () => {
    try {
      await AsyncStorage.setItem(K_FASTING_HEALTH_ACK, "1");
    } catch {}
    setVisible(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.warning,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: 6 }]}>
        Health & Safety
      </Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        This app does not provide medical advice. Fasting isn’t suitable for everyone
        (e.g., under 18, pregnant/breastfeeding, underweight, or with certain medical
        conditions). Speak to a healthcare professional before starting. Stop fasting if
        you feel unwell (dizziness, fainting, severe headache, chest pain). Stay hydrated
        and be cautious around high-intensity training or matches.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={dismiss}
          accessibilityRole="button"
          style={[styles.ghostBtn, { backgroundColor:colors.card, borderColor: colors.border }]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>OK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={dontShowAgain}
          accessibilityRole="button"
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.surface, fontWeight: "700" }}>Don’t show again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  text: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  ghostBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
});
