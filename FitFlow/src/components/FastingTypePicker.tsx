import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/theme';

interface FastingPickerProps {
  types: { label: string; fastingHours: number; eatingHours: number }[]
  selected: string
  onSelect: (label: string) => void
}

export default function FastingTypePicker({ types, selected, onSelect }: FastingPickerProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.row}>
      {types.map((type) => (
        <TouchableOpacity
          key={type.label}
          onPress={() => onSelect(type.label)}
          style={[
            styles.option,
            {
              backgroundColor: selected === type.label ? colors.primary : colors.card,
            },
          ]}
        >
          <Text
            style={{
              color: selected === type.label ? colors.surface : colors.textPrimary,
              fontWeight: '600',
            }}
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
})
