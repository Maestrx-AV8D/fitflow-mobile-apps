// ThemePreview.tsx
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../theme/theme";

export default function ThemePreview() {
  const { colors, gradients, spacing, typography, scheme } = useTheme();

  const ColorBlock = ({ name, value }: { name: string; value: string }) => (
    <View style={[styles.colorBlock, { backgroundColor: value }]}>
      <Text
        style={[
          styles.colorLabel,
          { color: scheme === "dark" ? colors.textPrimary : "#000" },
        ]}
      >
        {name} {value}
      </Text>
    </View>
  );

  const Button = ({
    title,
    backgroundColor,
    textColor = "#fff",
  }: {
    title: string;
    backgroundColor: string;
    textColor?: string;
  }) => (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );

  const Section = ({ title, children }: { title: string; children: any }) => (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={[
          typography.h2,
          { marginBottom: spacing.md, color: colors.primaryText },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      {/* Header */}
      <Text
        style={[
          typography.h1,
          { color: colors.primaryText, marginBottom: spacing.lg },
        ]}
      >
        Theme Preview ({scheme} mode)
      </Text>

      {/* Color Palette */}
      <Section title="Colors">
        {Object.entries(colors).map(([key, value]) => (
          <ColorBlock key={key} name={key} value={value as string} />
        ))}
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <Button title="Primary CTA" backgroundColor={colors.accent} />
        <Button title="AI Button" backgroundColor={colors.aiButton} />
        <Button
          title="Premium Button"
          backgroundColor={colors.premiumGold}
          textColor="#000"
        />
        <Button title="Success" backgroundColor={colors.success} />
        <Button title="Warning" backgroundColor={colors.warning} />
        <Button title="Error" backgroundColor={colors.error} />
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: colors.textPrimary }}>Card / Surface</Text>
          <Text style={{ color: colors.textSecondary }}>Secondary text</Text>
        </View>
        <View
          style={[styles.card, { backgroundColor: colors.bannerBackground }]}
        >
          <Text style={{ color: colors.textPrimary }}>Banner / Info Panel</Text>
          <Text style={{ color: colors.info }}>Info Text Example</Text>
        </View>
      </Section>
      <Section title="Gradients">
        <LinearGradient
          colors={gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[styles.toast]}
        >
          <Text style={{ color: "#fff" }}>premium</Text>
        </LinearGradient>
        <LinearGradient
          colors={gradients.ai}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[styles.toast]}
        >
          <Text style={{ color: "#fff" }}>ai</Text>
        </LinearGradient>
        <LinearGradient
          colors={gradients.test}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[styles.toast]}
        >
          <Text style={{ color: "#fff" }}>test</Text>
        </LinearGradient>
        <LinearGradient
          colors={gradients.test2}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[styles.toast]}
        >
          <Text style={{ color: "#fff" }}>test2</Text>
        </LinearGradient>
      </Section>

      {/* Toasts */}
      <Section title="Toasts">
        <View style={[styles.toast, { backgroundColor: colors.success }]}>
          <Text style={{ color: "#fff" }}>Success Toast</Text>
        </View>
        <View style={[styles.toast, { backgroundColor: colors.warning }]}>
          <Text style={{ color: "#fff" }}>Warning Toast</Text>
        </View>
        <View style={[styles.toast, { backgroundColor: colors.error }]}>
          <Text style={{ color: "#fff" }}>Error Toast</Text>
        </View>
        <View style={[styles.toast, { backgroundColor: colors.info }]}>
          <Text style={{ color: "#fff" }}>Info Toast</Text>
        </View>
      </Section>
    </ScrollView>
  );
}

//
// Styles
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  colorBlock: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toast: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
});

//-------------------------

//

// // theme.ts
// import { useColorScheme } from 'react-native';

// //
// // 🌈 1️⃣ Role-Based Color System
// //

// const lightColors = {
//   // Base
//   background: '#F8F8F8',
//   surface: '#FFFFFF',
//   primaryText: '#1A1A1A',
//   secondaryText: '#6E6E6E',
//   border: '#E5E5E5',

//   // Brand / Accent
//   accent: '#D6BFA8',        // Main CTA/FAB accent
//   iconDefault: '#1A1A1A',
//   iconInactive: '#9E9E9E',

//   // Status Colors
//   success: '#4C9A75',
//   warning: '#D8A24C',
//   error: '#B85C5C',
//   info: '#7D9E99',

//   // AI & Premium
//   aiHighlight: '#A59AD6',
//   aiButton: '#8C7BDA',
//   premiumGold: '#E3C567',

//   // Timer & Fasting
//   timerSafe: '#4C9A75',
//   timerWarning: '#FFB347',

//   // Panels / Overlays
//   bannerBackground: '#F4F1EB',
//   inputBackground: '#F2F2F2',
//   card: '#FAFAFA',
//   modalOverlay: 'rgba(0,0,0,0.35)',

//   // Shadows
//   shadow: 'rgba(0, 0, 0, 0.05)',
// };

// const darkColors = {
//   // Base
//   background: '#0F0F0F',
//   surface: '#1A1A1A',
//   primaryText: '#FFFFFF',
//   secondaryText: '#A9A9A9',
//   border: '#2F2F2F',

//   // Brand / Accent
//   accent: '#D6BFA8',
//   iconDefault: '#FFFFFF',
//   iconInactive: '#6E6E6E',

//   // Status Colors
//   success: '#4C9A75',
//   warning: '#D8A24C',
//   error: '#B85C5C',
//   info: '#9DB8B3',

//   // AI & Premium
//   aiHighlight: '#B3A8F0',
//   aiButton: '#A594F2',
//   premiumGold: '#FFD97D',

//   // Timer & Fasting
//   timerSafe: '#4C9A75',
//   timerWarning: '#FFB86B',

//   // Panels / Overlays
//   bannerBackground: '#2A2A2A',
//   inputBackground: '#2C2C2C',
//   card: '#1E1E1E',
//   modalOverlay: 'rgba(0,0,0,0.6)',

//   // Shadows
//   shadow: 'rgba(255,255,255,0.05)',
// };

// //
// // 🌈 2️⃣ Gradients
// //
// const gradients = {
//   premium: ['#E3C567', '#FFD97D'],
//   ai: ['#8C7BDA', '#B3A8F0'],
//   success: ['#4C9A75', '#6FCF97'],
//   warning: ['#D8A24C', '#FFB347'],
// };

// //
// // 🌈 3️⃣ Spacing
// //
// export const spacing = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 40,
// };

// //
// // 🌈 4️⃣ Typography
// //
// export const typography = {
//   h1: { fontSize: 32, fontWeight: '700' as const },
//   h2: { fontSize: 24, fontWeight: '600' as const },
//   h3: { fontSize: 20, fontWeight: '600' as const },
//   body: { fontSize: 16, fontWeight: '400' as const },
//   caption: { fontSize: 12, fontWeight: '400' as const },
//   monospace: { fontFamily: 'RobotoMono-Regular' }, // For timers/numbers
// };

// //
// // 🌈 5️⃣ Hook to get current theme
// //
// export function useTheme() {
//   const scheme = useColorScheme();
//   const colors = scheme === 'dark' ? darkColors : lightColors;
//   return { colors, gradients, spacing, typography, scheme };
// }

// //
// // 🌈 6️⃣ Export for non-hook usage (optional)
// //
// export const Theme = {
//   light: { colors: lightColors, gradients, spacing, typography },
//   dark: { colors: darkColors, gradients, spacing, typography },
// };
