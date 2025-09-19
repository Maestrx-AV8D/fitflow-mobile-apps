// src/navigation/AppNavigator.tsx
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, useColorScheme } from "react-native";

import FastingCompletionObserver from "../components/FastingCompletionObserver";
import { useAuth } from "../hooks/useAuth";
import Onboarding from "../screens/Onboarding";
import Paywall from "../screens/Premium";
import SignIn from "../screens/SignIn";
import Upgrade from "../screens/Upgrade";
import MainTabs from "./MainTabs";
import { navigationRef } from "./navigationRef";
import { RootStackParamList } from "./types";

// const Stack = createNativeStackNavigator();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading, hasOnboarded } = useAuth();
  const scheme = useColorScheme();

  if (loading) return null;

  return (
    <NavigationContainer
      theme={scheme === "dark" ? DarkTheme : DefaultTheme}
      ref={navigationRef}
    >
      <FastingCompletionObserver />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : hasOnboarded ? (
          <>
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="Upgrade" component={Upgrade} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="Premium" component={Paywall} />
          </>

        ) : (
         <Stack.Screen name="Main" component={MainTabs} />
        )}

        {/* Always register SignIn so it can be navigated to when upgrading */}
        <Stack.Screen name="SignIn" component={SignIn} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    //top: -28,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  overlayContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  overlayGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  overlayButton: {
    alignItems: "center",
    gap: 8,
  },
  overlayText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
});
