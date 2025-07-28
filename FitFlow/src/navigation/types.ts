import { NavigatorScreenParams } from "@react-navigation/native"

export type MainStackParamList = {
  Dashboard: undefined
  Fasting: undefined
  Log: undefined
  Journal: undefined
  Profile: undefined
  YourData: undefined
  Paywall: undefined
  
}

export type RootTabParamList = {
  Home: NavigatorScreenParams<MainStackParamList>;
  // other tabs...
};