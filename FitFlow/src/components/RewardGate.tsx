// src/components/RewardGate.tsx
import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";
import { TestIds, useRewardedAd } from "react-native-google-mobile-ads";
import { shouldShowAdsInAI, useEntitlements } from "../lib/entitlements";
import { useTheme } from "../theme/theme";

const REWARDED_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-xxxxxxxxxxxxxxxx/rrrrrrrrrrr"; // your real Rewarded unit id

/**
 * Wrap a button-like control that should reward-gate an action.
 * If user is premium -> run action immediately.
 * If free -> show rewarded ad; when reward is earned, run action.
 */
export function RewardGate({
  onRewarded,
  label = "Unlock with Ad",
}: {
  onRewarded: () => void;
  label?: string;
}) {
  const ent = useEntitlements();
  const { colors } = useTheme();

  const { isLoaded, isClosed, isEarnedReward, load, show, error } = useRewardedAd(REWARDED_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });

  useEffect(() => {
    // prime the ad
    load();
  }, [load]);

  useEffect(() => {
    if (isEarnedReward) onRewarded();
  }, [isEarnedReward, onRewarded]);

  useEffect(() => {
    // Auto-load next ad after close
    if (isClosed) load();
  }, [isClosed, load]);

  const onPress = useCallback(() => {
    if (!shouldShowAdsInAI(ent)) {
      onRewarded();
      return;
    }
    if (isLoaded) {
      show();
    } else {
      // fallback UX
      Alert.alert("Loading Ad", "Please try again in a moment.");
      load();
    }
  }, [ent, isLoaded, show, onRewarded, load]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={shouldShowAdsInAI(ent) && !isLoaded}
      style={{
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
      }}
    >
      {shouldShowAdsInAI(ent) && !isLoaded ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: "#fff", fontWeight: "700" }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
