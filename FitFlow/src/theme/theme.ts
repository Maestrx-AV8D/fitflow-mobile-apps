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

// import { useColorScheme } from "react-native";

// export const lightColors = {
//   // Base
//   background: "#F8F8F8", // subtle warm white
//   surface: "#FFFFFF", // pure white card/surface
//   textPrimary: "#1A1A1A", // almost-black text
//   textSecondary: "#6E6E6E", // muted subtitle text
//   border: "#E5E5E5", // light borders

//   // Brand / Accent
//   accent: "#D6BFA8", // Main CTA/FAB accent // optional soft accent
//   iconDefault: "#1A1A1A",
//   iconInactive: "#9E9E9E",

//   // Status Colors
//   success: "#4C9A75",
//   warning: "#D8A24C",
//   error: "#B85C5C",
//   info: "#7D9E99",

//   // AI & Premium
//   aiHighlight: "#A59AD6",
//   aiButton: "#8C7BDA",
//   premiumGold: "#E3C567",

//   // Panels / Overlays
//   bannerBackground: "#F4F1EB",
//   inputBackground: "#F2F2F2",
//   card: "#FAFAFA",
//   modalOverlay: "rgba(0,0,0,0.35)",

//   // Shadows
//   shadow: "rgba(0, 0, 0, 0.05)",

//   primary: "#000000", // used for core action (text/buttons/icons)
//   secondary: "#EDEDED", // pale gray secondary background
// };

// export const darkColors = {
//   // Base
//   background: "#0F0F0F", // pitch black
//   surface: "#1A1A1A", // neutral gray-black card
//   textPrimary: "#FFFFFF",
//   textSecondary: "#A9A9A9",
//   border: "#2F2F2F",

//   // Brand / Accent
//   accent: "#D6BFA8",
//   iconDefault: "#FFFFFF",
//   iconInactive: "#6E6E6E",

//   // Status Colors
//   success: "#4C9A75",
//   warning: "#D8A24C",
//   error: "#B85C5C",
//   info: "#9DB8B3",

//   // AI & Premium
//   aiHighlight: "#B3A8F0",
//   aiButton: "#A594F2",
//   premiumGold: "#FFD97D",

//   // Timer & Fasting
//   timerSafe: "#4C9A75",
//   timerWarning: "#FFB86B",

//   // Panels / Overlays
//   bannerBackground: "#2A2A2A",
//   inputBackground: "#2C2C2C",
//   card: "#1E1E1E",
//   modalOverlay: "rgba(0,0,0,0.6)",

//   // Shadows
//   shadow: "rgba(255,255,255,0.05)",

//   primary: "#FFFFFF", // text/icon contrast on dark
//   secondary: "#2A2A2A", // muted secondary background
// };

// const gradients = {
//   // premium: ['#E3C567', '#FFD97D'],
//   //ai: ["#8C7BDA", "#B3A8F0"],
//   success: ["#4C9A75", "#6FCF97"],
//   warning: ["#D8A24C", "#FFB347"],
//   ai: ["#E5E5E5", "#4A6C6F"],
//   test: ["#2C2C2C", "#4A6C6F"],
//   test2: ["#2C2C2C", "#9DB8B3"],
//   premium: ['#B3A8F0', '#9DB8B3'],
// };

// export const spacing = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 40,
//   xxxl: 50,
// };

// export const typography = {
//   h1: { fontSize: 32, fontWeight: "700" as const },
//   h2: { fontSize: 24, fontWeight: "600" as const },
//   h3: { fontSize: 20, fontWeight: "600" as const },
//   body: { fontSize: 16, fontWeight: "400" as const },
//   caption: { fontSize: 12, fontWeight: "400" as const },
//   monospace: { fontFamily: "RobotoMono-Regular" },
// };

// export function useTheme() {
//   const scheme = useColorScheme();
//   const colors = scheme === "dark" ? darkColors : lightColors;
//   return { colors, gradients, spacing, typography };
// }


// src/theme/theme.ts

/**
 * STOIC THEME
 * - Calm neutrals, strong typography contrast
 * - Subtle gold accents for premium/weekly progress
 * - Coherent light/dark palettes across all screens
 */

// src/theme/theme.ts
import { useColorScheme } from 'react-native';

/**
 * STOIC THEME
 * - Calm neutrals, strong typography contrast
 * - Subtle gold accents for premium/weekly progress
 * - Coherent light/dark palettes across all screens
 * - Global typography mapped to Inter (Stoic-style) fonts
 */

/** If you load different font names (e.g. via expo-google-fonts),
 *  just change these four strings to match your loaded names. */
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  monospace: 'RobotoMono-Regular',
};

export const lightColors = {
  // Base
  background: '#F7F6F3', // soft paper white
  surface: '#FFFFFF',     // cards/surfaces
  card: '#FAFAFA',
  inputBackground: '#F1F1F1',
  bannerBackground: '#F4F1EB',
  modalOverlay: 'rgba(0,0,0,0.28)',

  // Text
  textPrimary: '#151515',
  textSecondary: '#6E6E6E',
  iconDefault: '#151515',
  iconInactive: '#9E9E9E',

  // Lines
  border: '#E6E4E0',

  // Brand / Accent (muted gold/bronze)
  accent: '#CCB88A',
  primary: '#151515',
  secondary: '#ECEBE7',

  // Status
  success: '#3F8F6B',
  warning: '#D19A43',
  error:   '#B85C5C',
  info:    '#6E8F8B',

  // AI & Premium
  aiHighlight: '#9E94D9',
  aiButton:    '#8476D8',
  premiumGold: '#E4C76B',
  premiumGoldMuted: '#D6C17A',

  // Shadows
  shadow: 'rgba(0,0,0,0.06)',
};

export const darkColors = {
  // Base (true-black background + contrasting greys)
  background: '#000000', // pure black like your screenshots
  surface:    '#121212', // main card grey
  card:       '#141414', // tiles/cards
  inputBackground: '#1A1A1A',
  bannerBackground: '#161616',
  modalOverlay: 'rgba(0,0,0,0.6)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A9A9A9',
  iconDefault: '#FFFFFF',
  iconInactive: '#707070',

  // Lines
  border: '#262626',

  // Brand / Accent (gold tuned for dark)
  accent: '#D6C17A',
  primary: '#FFFFFF',
  secondary: '#1E1E1E',

  // Status
  success: '#49A17A',
  warning: '#E0AE54',
  error:   '#C86A6A',
  info:    '#9CB6B1',

  // AI & Premium
  aiHighlight: '#B2A7F2',
  aiButton:    '#9C8DF2',
  premiumGold: '#E8CF7A',
  premiumGoldMuted: '#D9C874',

  // Shadows (very subtle on dark)
  shadow: 'rgba(255,255,255,0.04)',
};

/**
 * Gradients used across the app.
 * - blackGoldSubtle: near-black with a hint of gold (headers)
 * - onyxSheen: neutral dark sheen for buttons/cards
 * - paperSheen: soft light sheen for light mode
 * - premium: tasteful premium accent
 */
const gradients = {
  blackGoldSubtle: ['#0B0B0B', '#101010', '#11100C'], // whisper of gold in last stop
  onyxSheen: ['#141414', '#1A1A1A'],
  paperSheen: ['#FFFFFF', '#F5F5F5'],

  // Feedback
  success: ['#3F8F6B', '#6CCF97'],
  warning: ['#D19A43', '#F6B35A'],

  // AI / Premium
  ai: ['#8C7BDA', '#B3A8F0'],
  premium: ['#B8AA6A', '#E4C76B'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 50,
};

/** Typography tokens (Inter/SF-like, Stoic vibe) */
export const typography = {
  h1: {
    fontSize: 32,
    fontFamily: fonts.bold,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontFamily: fonts.semibold,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontFamily: fonts.regular,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  monospace: { fontFamily: fonts.monospace },
};

type ShadowLevel = 'none' | 'sm' | 'md' | 'lg';
function makeShadow(isDarkMode: boolean, level: ShadowLevel) {
  if (level === 'none') return {};
  if (isDarkMode) {
    switch (level) {
      case 'sm':
        return {
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        };
      case 'md':
        return {
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        };
      case 'lg':
        return {
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 16 },
          elevation: 10,
        };
    }
  } else {
    switch (level) {
      case 'sm':
        return {
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        };
      case 'md':
        return {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        };
      case 'lg':
        return {
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 12 },
          elevation: 7,
        };
    }
  }
}

/**
 * Hook: useTheme
 * - Keeps existing return shape so current screens continue to work.
 * - Adds `isDark` and `shadow()` helpers for consistent UI.
 */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    gradients,
    spacing,
    typography,
    isDark,
    shadow: (level: ShadowLevel = 'sm') => makeShadow(isDark, level),
  };
}