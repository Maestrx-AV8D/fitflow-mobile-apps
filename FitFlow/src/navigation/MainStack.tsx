// navigation/MainStack.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "../screens/Dashboard";
import Fasting from "../screens/Fasting";
import Journal from "../screens/Journal";
import Log from "../screens/Log";
import NotificationSettings from "../screens/Notifications";
import Paywall from "../screens/Premium";
import Profile from "../screens/Profile";
import YourData from "../screens/YourData";
import { MainStackParamList } from "./types";

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen
        name="Fasting"
        component={Fasting}
        options={{ animation: "none" }}
      />
      <Stack.Screen
        name="Log"
        component={Log}
        options={{ animation: "none" }}
      />
      <Stack.Screen
        name="Journal"
        component={Journal}
        options={{ animation: "none" }}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ animation: "none" }}
      />
      <Stack.Screen
        name="YourData"
        component={YourData}
        options={{ animation: "none" }}
      />
      <Stack.Screen
        name="Paywall"
        component={Paywall}
        options={{ animation: "none" }}
      />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />

    </Stack.Navigator>
  );
}
