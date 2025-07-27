// components/FastingTipsCard.tsx
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/theme'

interface FastingTipsCardProps {
  phase: 'before' | 'during' | 'after'
}

const tips = {
  before: 'Stay hydrated and eat a high-fiber, high-protein meal.',
  during: 'Drink water, black coffee, or tea to stay full.',
  after: 'Break your fast with something light and nutritious.',
}

export default function FastingTipsCard({ phase }: FastingTipsCardProps) {
  const { colors, typography } = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: 8 }]}>
          Fasting Tips
        </Text>
      </View>
      <Text style={[styles.tip, { color: colors.textSecondary }]}>{tips[phase]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
  },
})
