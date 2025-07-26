import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/theme'
import { navigationRef } from '../navigation/AppNavigator'

const SCREEN_WIDTH = Dimensions.get('window').width

interface FloatingOverlayProps {
  onClose: () => void
}

export default function FloatingOverlay({ onClose }: FloatingOverlayProps) {
  const { colors, spacing, typography } = useTheme()

  return (
    <>
      {/* Dismiss background */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Curved overlay */}
      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => {
              onClose()
              navigationRef.current?.navigate('Log')
            }}
          >
            <Ionicons name="leaf-outline" size={24} color={colors.textPrimary} />
            <Text style={[styles.label, { color: colors.textPrimary }]}>Empty Page{'\n'}Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, styles.centerCircle]}
            onPress={onClose}
          >
            <Ionicons name="add" size={24} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Add or Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          {[
            { icon: 'sparkles-outline', label: 'Journaling Suggestions', screen: 'SmartWorkout' },
            { icon: 'document-outline', label: 'New Empty Journal', screen: 'Log' },
            { icon: 'happy-outline', label: 'Mood Check-In', screen: 'History' },
          ].map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={screen}
              style={styles.card}
              onPress={() => {
                onClose()
                navigationRef.current?.navigate(screen)
              }}
            >
              <Ionicons name={icon as any} size={24} color={colors.textPrimary} />
              <Text style={[styles.cardLabel, { color: colors.textPrimary }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Close button */}
        <TouchableOpacity style={styles.closeFab} onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 28,
  },
  circleBtn: {
    alignItems: 'center',
    gap: 6,
  },
  centerCircle: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    width: 100,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  closeFab: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
})