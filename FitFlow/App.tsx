import * as Notifications from "expo-notifications"; // ✅ IMPORTANT
import React from "react";
import { Platform } from "react-native";
//import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";
import "react-native-url-polyfill/auto";
import { AuthProvider } from "./src/hooks/useAuth";
import { EntitlementsProvider } from "./src/lib/entitlements";
import AppNavigator from "./src/navigation/AppNavigator";


import Purchases from "react-native-purchases";
// import { configureRevenueCat } from "./src/lib/revenuecat";

const RC_IOS_KEY = "appl_xxx";
const RC_ANDROID_KEY = "goog_xxx";

export async function initPurchases(userId?: string) {
  await Purchases.configure({
    apiKey: Platform.select({ ios: RC_IOS_KEY, android: RC_ANDROID_KEY })!,
    appUserID: userId, // use your Supabase user.id
  });
}


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // ✅ New in SDK 49+
    shouldShowList: true, // ✅ New in SDK 49+
  }),
});

export default function App() {

//   useEffect(() => {
//   (async () => {
//     const { data: { user } } = await supabase.auth.getUser();
//     await configureRevenueCat(user?.id); // null/undefined is OK if you want anonymous
//   })();
// }, []);
  // useEffect(() => {
  //   (async () => {
  //     if (Platform.OS === "ios") {
  //       await Tracking.requestTrackingPermissionsAsync();
  //     }
  //     await mobileAds().setRequestConfiguration({
  //       maxAdContentRating: MaxAdContentRating.T,
  //       tagForChildDirectedTreatment: false,
  //       tagForUnderAgeOfConsent: false,
  //       testDeviceIdentifiers: [], // add IDs if needed
  //     });
  //     await mobileAds().initialize();
  //   })();
  // }, []);

  return (
    <AuthProvider>
      <EntitlementsProvider>
        <AppNavigator />
      </EntitlementsProvider>
    </AuthProvider>
  );
}
