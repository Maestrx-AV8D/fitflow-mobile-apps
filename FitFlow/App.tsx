// App.tsx
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import 'react-native-url-polyfill/auto';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';

import Purchases from 'react-native-purchases';
import { AuthProvider } from './src/hooks/useAuth';
import { EntitlementsProvider } from './src/lib/entitlements';
import { StorageProvider } from './src/lib/storage';
import AppNavigator from './src/navigation/AppNavigator';

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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <EntitlementsProvider>
        <StorageProvider>
      <AppNavigator />
      </StorageProvider>
      </EntitlementsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});