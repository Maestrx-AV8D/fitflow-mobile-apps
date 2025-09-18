// // src/components/NativeAdCard.tsx
// import { useTheme } from "@react-navigation/native";
// import React from "react";
// import { Text, TouchableOpacity, View } from "react-native";
// import { shouldShowAdsInAI, useEntitlements } from "../lib/entitlements";

// export function NativeAdCard({ onPress }: { onPress?: () => void }) {
//   const ent = useEntitlements();
//   const { colors } = useTheme();

//   if (!shouldShowAdsInAI(ent)) return null; // don’t render for AI plan

//   return (
//     <View
//       style={{
//         borderWidth: 1,
//         borderColor: colors.border,
//         backgroundColor: colors.card,
//         borderRadius: 12,
//         padding: 12,
//         marginTop: 6,
//       }}
//     >
//       <Text
//         style={{
//           color: colors.textSecondary,
//           fontSize: 11,
//           marginBottom: 6,
//         }}
//       >
//         Sponsored • Ad
//       </Text>

//       {/* Replace this block with your ad network component later */}
//       <Text style={{ color: colors.textPrimary, fontWeight: "700", marginBottom: 4 }}>
//         Smarter recovery starts tonight
//       </Text>
//       <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
//         Track sleep with ZZZ Pro. Free 30-day trial.
//       </Text>

//       <TouchableOpacity
//         onPress={onPress}
//         style={{
//           alignSelf: "flex-start",
//           paddingHorizontal: 12,
//           paddingVertical: 8,
//           borderRadius: 10,
//           backgroundColor: colors.primary,
//           marginTop: 10,
//         }}
//       >
//         <Text style={{ color: "#fff", fontWeight: "700" }}>Learn more</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }


// src/components/NativeAdCard.tsx
import React, { useCallback, useRef } from "react";
import { View } from "react-native";
import {
    AdEventType,
    AdvertiserView,
    CallToActionView,
    HeadlineView,
    IconView,
    MediaView,
    NativeAdView,
    StarRatingView,
    TaglineView,
    TestIds,
} from "react-native-google-mobile-ads";
import { shouldShowAdsInAI, useEntitlements } from "../lib/entitlements";
import { useTheme } from "../theme/theme";

const NATIVE_UNIT_ID = __DEV__
  ? TestIds.NATIVE_ADVANCED
  : "ca-app-pub-4020157509999759~2070890689"; // your real Native Advanced unit id

export function NativeAdCard({ onPress }: { onPress?: () => void }) {
  const ent = useEntitlements();
  const { colors } = useTheme();
  const ref = useRef<NativeAdView>(null);

  if (!shouldShowAdsInAI(ent)) return null;

  const onAdFailedToLoad = useCallback(() => {
    // Hide silently if load fails
    // (You could set local state to not render)
  }, []);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: (colors as any).border || "rgba(0,0,0,0.06)",
        marginHorizontal: 16,
        marginBottom: 16,
      }}
    >
      <NativeAdView
        ref={ref}
        adUnitID={NATIVE_UNIT_ID}
        onAdLoaded={() => {}}
        onAdFailedToLoad={onAdFailedToLoad}
        onAdEvent={(type) => {
          if (type === AdEventType.CLICKED && onPress) onPress();
        }}
        style={{ width: "100%" }}
      >
        <MediaView style={{ height: 140, width: "100%" }} />
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <IconView style={{ width: 36, height: 36, borderRadius: 8, marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <HeadlineView style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }} />
              <AdvertiserView style={{ fontSize: 12, color: colors.textSecondary }} />
            </View>
            <StarRatingView style={{ marginLeft: 8 }} />
          </View>
          <TaglineView
            numberOfLines={2}
            style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}
          />
          <CallToActionView
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: colors.primary,
            }}
            textStyle={{ color: "#fff", fontWeight: "700" }}
          />
        </View>
      </NativeAdView>
    </View>
  );
}
