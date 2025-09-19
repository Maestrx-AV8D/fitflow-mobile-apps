import { NavigatorScreenParams } from "@react-navigation/native";

export type MainStackParamList = {
  Dashboard: undefined
  Fasting: undefined
  Log: { entry?: any } | undefined;
  Journal: undefined
  Profile: undefined
  YourData: undefined
  Paywall: undefined
  NotificationSettings: undefined
  
}

export type RootTabParamList = {
  Home: NavigatorScreenParams<MainStackParamList>;
  Schedule: undefined;
  Star: undefined;
  Coach: undefined;
  History: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<RootTabParamList>;
  SignIn: undefined;
  Onboarding: undefined;
  Upgrade: undefined;
  Premium: undefined;
};