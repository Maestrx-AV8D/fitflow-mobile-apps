// // theme/theme.ts
// import { useColorScheme } from "react-native";

// export const lightColors = {
//   background: "#FDFCF9",
//   surface: "#FFFFFF",
//   primary: "#4A6C6F",
//   secondary: "#7D9E99",
//   accent: "#D6BFA8",
//   textPrimary: "#1A1A1A",
//   textSecondary: "#5E5E5E",
//   border: "#E5E5E5",
//   success: "#4C9A75",
//   warning: "#D8A24C",
//   error: "#B85C5C",
//   card: "#FAFAFA",
//   inputBackground: "#F2F2F2",
//   shadow: "rgba(0, 0, 0, 0.05)",
// };

// export const darkColors = {
//   background: "#0E0E0E",
//   surface: "#1A1A1A",
//   primary: "#4A6C6F",
//   secondary: "#7D9E99",
//   accent: "#D6BFA8",
//   textPrimary: "#FFFFFF",
//   textSecondary: "#CCCCCC",
//   border: "#333333",
//   success: "#4C9A75",
//   warning: "#D8A24C",
//   error: "#B85C5C",
//   card: "#1E1E1E",
//   inputBackground: "#2A2A2A",
//   shadow: "rgba(255, 255, 255, 0.05)",
// };

// export const spacing = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 40,
// };

// export const typography = {
//   h1: { fontSize: 32, fontWeight: "700" as const },
//   h2: { fontSize: 24, fontWeight: "600" as const },
//   h3: { fontSize: 20, fontWeight: "600" as const },
//   body: { fontSize: 16, fontWeight: "400" as const },
//   caption: { fontSize: 12, fontWeight: "400" as const },
// };

// export function useTheme() {
//   const scheme = useColorScheme();
//   const colors = scheme === "dark" ? darkColors : lightColors;
//   return { colors, spacing, typography };
// }


import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F8F8F8',       // subtle warm white
  surface: '#FFFFFF',          // pure white card/surface
  primary: '#000000',          // used for core action (text/buttons/icons)
  secondary: '#EDEDED',        // pale gray secondary background
  accent: '#D6BFA8',           // optional soft accent
  textPrimary: '#1A1A1A',      // almost-black text
  textSecondary: '#6E6E6E',    // muted subtitle text
  border: '#E5E5E5',           // light borders
  success: '#4C9A75',
  warning: '#D8A24C',
  error: '#B85C5C',
  card: '#FAFAFA',
  inputBackground: '#F2F2F2',
  shadow: 'rgba(0, 0, 0, 0.05)',
};

export const darkColors = {
  background: '#0F0F0F',       // pitch black
  surface: '#1A1A1A',          // neutral gray-black card
  primary: '#FFFFFF',          // text/icon contrast on dark
  secondary: '#2A2A2A',        // muted secondary background
  accent: '#D6BFA8',
  textPrimary: '#FFFFFF',
  textSecondary: '#A9A9A9',
  border: '#2F2F2F',
  success: '#4C9A75',
  warning: '#D8A24C',
  error: '#B85C5C',
  card: '#1E1E1E',
  inputBackground: '#2C2C2C',
  shadow: 'rgba(255, 255, 255, 0.05)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '600' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, spacing, typography };
}