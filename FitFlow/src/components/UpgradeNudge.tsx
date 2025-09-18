// src/components/UpgradeNudge.tsx
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/theme";

type Props = {
  title?: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void; // if omitted, defaults to navigation → "Premium"
  style?: any;
};

export const UpgradeNudge: React.FC<Props> = ({
  title = "You're out of AI credits",
  subtitle = "Get unlimited AI with Premium + AI.",
  cta = "See options",
  onPress,
  style,
}) => {
  const nav = useNavigation<any>();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) return onPress();
    try {
      nav.navigate("Premium"); // assumes you have a "Premium" route
    } catch {
      // ignore
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        style,
      ]}
    >
      <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 16 }}>{title}</Text>
      {!!subtitle && (
        <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 13 }}>{subtitle}</Text>
      )}

      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", alignSelf: "flex-start" }}>
        <LinearGradient colors={[colors.primary, "#4A6C6F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{cta}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};
