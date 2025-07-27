import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { navigationRef } from '../navigation/navigationRef'
import { useTheme } from '../theme/theme'

const SCREEN_WIDTH = Dimensions.get('window').width

interface FloatingOverlayProps {
  onClose: () => void
}

export default function FloatingOverlay({ onClose }: FloatingOverlayProps) {
  const { colors } = useTheme()

  const buttons: { icon: string; label: string; screen: 'Journal' | 'Log' | 'Fasting' }[] = [
    { icon: 'timer', label: 'Fasting', screen: 'Fasting' },
    { icon: 'add-circle', label: 'Log', screen: 'Log' },
    { icon: 'sparkles', label: 'Journal', screen: 'Journal' },  
  ]

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel , { backgroundColor: '#F2F2F2' }]}>
        <View style={styles.bottomRow}>
          {buttons.map(({ icon, label, screen }, index) => (
            <TouchableOpacity
              key={screen}
              style={[
                styles.card,
                index === 1 && styles.middleCard,
                index > 0 && styles.overlapCard, // apply overlap margin
              ]}
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingBottom: 100,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#ffff',
    borderRadius: 20,
    paddingVertical: 44,
    paddingHorizontal: 12,
    width: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
    marginBottom: 30,
  },
  overlapCard: {
    marginLeft: -16, // tighter spacing
  },
  middleCard: {
    transform: [{ translateY: 10 }],
    zIndex: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  closeFab: {
    position: 'absolute',
    bottom: 33.5,
    width: 57,
    height: 57,
    borderRadius: 29,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
