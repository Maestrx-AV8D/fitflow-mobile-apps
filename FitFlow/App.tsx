import * as Notifications from 'expo-notifications'; // ✅ IMPORTANT
import React from 'react';
import 'react-native-url-polyfill/auto';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // ✅ New in SDK 49+
    shouldShowList: true,   // ✅ New in SDK 49+
  }),
});


export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
