// src/components/CreditsPill.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
// use your theme hook (you’ve been importing from ../theme/theme)
import { useEntitlements } from "../lib/entitlements";
import { useTheme } from "../theme/theme";

type Props = {
  style?: any;
  showProgressBar?: boolean;
};

export const CreditsPill: React.FC<Props> = ({ style, showProgressBar = true }) => {
  const { colors } = useTheme();
  const ent = useEntitlements();

  const { label, progress } = useMemo(() => {
    const total = ent.ai.dailyCredits ?? 0;
    const used = ent.ai.usedToday ?? 0;

    // Treat very high totals as “unlimited”
    const unlimited = total >= 900;
    const remaining = Math.max(0, total - used);

    return {
      label: unlimited ? "AI: ∞" : `AI: ${remaining}/${total}`,
      progress: unlimited ? 1 : Math.max(0, Math.min(1, used / Math.max(1, total))),
    };
  }, [ent]);

  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          backgroundColor: colors.inputBackground,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        style,
      ]}
    >
      <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>{label}</Text>
      {showProgressBar && (
        <View style={{ height: 6, width: 100, backgroundColor: colors.border, borderRadius: 4, marginTop: 6 }}>
          <LinearGradient
            colors={[colors.primary, "#4A6C6F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 6,
              width: `${Math.round(progress * 100)}%`,
              borderRadius: 4,
            }}
          />
        </View>
      )}
    </View>
  );
};
