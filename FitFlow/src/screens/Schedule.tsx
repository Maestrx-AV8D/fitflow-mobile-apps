import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native'
import { format, parseISO } from 'date-fns'
import { useNavigation } from '@react-navigation/native'
import { getSchedule, saveSchedule } from '../lib/api'
import { useTheme } from '../theme/theme'

export default function Schedule() {
  const navigation = useNavigation<any>()
  const [plan, setPlan] = useState<Array<any>>([])
  const [showCompleted, setShowCompleted] = useState(true)
  const { colors, spacing, typography } = useTheme()

  useEffect(() => {
    ;(async () => {
      const stored = await getSchedule()
      setPlan(stored)
    })()
  }, [])

  const persist = async (newPlan: Array<any>) => {
    setPlan(newPlan)
    await saveSchedule(newPlan)
  }

  const filtered = plan.filter((d) => (showCompleted ? true : !d.done))

  function completeDay(idx: number) {
    const updated = plan.map((d, i) => (i === idx ? { ...d, done: true } : d))
    persist(updated)
  }

  function removeDay(idx: number) {
    const updated = plan.filter((_, i) => i !== idx)
    persist(updated)
  }

  function clearAll() {
    Alert.alert(
      'Clear Schedule',
      'This will remove your entire schedule. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear',
          style: 'destructive',
          onPress: () => persist([])
        }
      ]
    )
  }

  function importToLog(day: any, exercise?: string) {
    const entry: any = {
      date: day.date,
      type: day.mainSet?.length ? 'Gym' : 'Run',
      notes: exercise || day.mainSet?.join(', '),
      exercises: [],
      segments: []
    }
    if (exercise) {
      const [name, rest = ''] = exercise.split(':')
      const sets = rest.match(/(\d+)×/)?.[1] || ''
      const reps = rest.match(/×(\d+)/)?.[1] || ''
      entry.exercises = [{ name: name.trim(), sets, reps, weight: '' }]
    } else {
      entry.exercises = (day.mainSet || []).map((s: string) => {
        const [name, rest = ''] = s.split(':')
        const sets = rest.match(/(\d+)×/)?.[1] || ''
        const reps = rest.match(/×(\d+)/)?.[1] || ''
        return { name: name.trim(), sets, reps, weight: '' }
      })
    }
    navigation.navigate('Log', { entry })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>📅 Your Schedule</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowCompleted((s) => !s)}>
              <Text style={[styles.toggle, { color: colors.textSecondary }]}>
                {showCompleted ? 'Hide' : 'Show'} Completed
              </Text>
            </TouchableOpacity>
            {plan.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={[styles.clear, { color: colors.error }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {plan.length > 0 && (
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            Showing {filtered.length} of {plan.length} days
          </Text>
        )}

        {plan.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No schedule yet. Generate one in Coach.
          </Text>
        )}

        {filtered.map((day, i) => (
          <View
            key={day.date}
            style={[
              styles.card,
              { backgroundColor: colors.card },
              day.done && { opacity: 0.5 }
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {format(parseISO(day.date), 'dd/MM/yy')}
              </Text>
              <View style={styles.cardActions}>
                {!day.done && (
                  <TouchableOpacity onPress={() => completeDay(i)}>
                    <Text style={[styles.complete, { color: colors.success }]}>Complete</Text>
                  </TouchableOpacity>
                )}
                {day.mainSet?.length > 0 && (
                  <TouchableOpacity onPress={() => importToLog(day)}>
                    <Text style={[styles.import, { color: colors.accent }]}>Import</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeDay(i)}>
                  <Text style={[styles.remove, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(['warmUp', 'mainSet', 'coolDown'] as const).map((sec) => (
              <View key={sec} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {sec === 'warmUp'
                    ? 'Warm-Up'
                    : sec === 'mainSet'
                    ? 'Main Set'
                    : 'Cool-Down'}
                </Text>
                {(day[sec] || []).map((item: string, j: number) => (
                  <View key={j} style={styles.lineRow}>
                    <Text style={[styles.item, { color: colors.textPrimary }]}>
                      • {item}
                    </Text>
                    {sec === 'mainSet' && (
                      <TouchableOpacity onPress={() => importToLog(day, item)}>
                        <Text style={[styles.import, { color: colors.accent }]}>Import</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    padding: 16,
    paddingTop: 70,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerActions: {
    flexDirection: 'row'
  },
  toggle: {
    fontSize: 14,
    marginRight: 12
  },
  clear: {
    fontSize: 14
  },
  summary: {
    fontSize: 12,
    marginVertical: 8
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  date: { fontSize: 14 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  complete: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12
  },
  import: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12
  },
  remove: {
    fontSize: 14,
    fontWeight: '600'
  },
  section: { marginTop: 8 },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  item: {
    flex: 1,
    marginLeft: 4,
    marginBottom: 2
  }
})