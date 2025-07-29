import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  FlatList
} from 'react-native'
import { format, parseISO, isBefore, addDays, startOfToday, add, isSameDay } from 'date-fns'
import { useNavigation } from '@react-navigation/native'
import { getSchedule, saveSchedule } from '../lib/api'
import { useTheme } from '../theme/theme'

export default function Schedule() {
  const navigation = useNavigation<any>()
  const [plan, setPlan] = useState<Array<any>>([])
  const [showCompleted, setShowCompleted] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [exerciseList, setExerciseList] = useState<string[]>([''])
  const [sessionType, setSessionType] = useState<'Gym' | 'Run' | 'Swim'>('Gym')
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
    Alert.alert('Clear Schedule', 'This will remove your entire schedule. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Clear',
        style: 'destructive',
        onPress: () => persist([])
      }
    ])
  }

  function importToLog(day: any, exercise?: string) {
    const entry: any = {
      date: day.date,
      type: day.type || 'Gym',
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

  const handleManualScheduleSubmit = () => {
    if (!selectedDate) {
      Alert.alert('Missing Date', 'Please select a date.')
      return
    }

    const today = new Date()
    const limit = addDays(today, 7)

    if (isBefore(limit, selectedDate)) {
      Alert.alert('Too Far Ahead', 'You can only schedule within 7 days from today.')
      return
    }

    const isoDate = format(selectedDate, 'yyyy-MM-dd')

    const newDay = {
      date: isoDate,
      warmUp: [],
      mainSet: exerciseList.filter(e => e.trim() !== ''),
      coolDown: [],
      done: false,
      type: sessionType
    }

    persist([...plan, newDay])
    setExerciseList([''])
    setSelectedDate(null)
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => add(startOfToday(), { days: i }))

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container]}>
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 12 }]}>
          🧠 Schedule
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, marginBottom: 24 }]}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>🛠️ Create a Session</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
            Schedule up to 7 days in advance
          </Text>

          {/* DATE SELECTOR */}
          <FlatList
            horizontal
            data={weekDates}
            keyExtractor={(item) => item.toISOString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 12 }}
            renderItem={({ item }) => {
              const isSelected = selectedDate && isSameDay(item, selectedDate)
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(item)}
                  style={[
                    styles.dateBox,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                      borderColor: isSelected ? colors.primary : colors.border
                    }
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFF' : colors.textPrimary,
                      fontWeight: '600'
                    }}
                  >
                    {format(item, 'EEE')}
                  </Text>
                  <Text style={{ color: isSelected ? '#FFF' : colors.textSecondary }}>
                    {format(item, 'dd MMM')}
                  </Text>
                </TouchableOpacity>
              )
            }}
          />

          {/* SESSION TYPE */}
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
            Type of session
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['Gym', 'Run', 'Swim'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSessionType(type as any)}
                style={{
                  backgroundColor: sessionType === type ? colors.primary : colors.inputBackground,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  marginRight: 8
                }}
              >
                <Text style={{ color: sessionType === type ? '#FFF' : colors.textPrimary }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* EXERCISE LIST */}
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
            Exercises
          </Text>
          {exerciseList.map((exercise, idx) => (
            <TextInput
              key={idx}
              value={exercise}
              placeholder={`Exercise ${idx + 1}`}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              onChangeText={(text) => {
                const updated = [...exerciseList]
                updated[idx] = text
                setExerciseList(updated)
              }}
            />
          ))}
          <TouchableOpacity onPress={() => setExerciseList([...exerciseList, ''])} style={{ marginVertical: 8 }}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>➕ Add Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleManualScheduleSubmit} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.success, fontWeight: '600' }}>✅ Add to Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Upcoming Schedule */}
        <View style={styles.header}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>📅 Upcoming</Text>
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

        {plan.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No schedule yet. Generate one in Coach or add manually.
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
                {(() => {
                  try {
                    return format(parseISO(day.date), 'dd/MM/yy')
                  } catch {
                    return day.date || 'Invalid Date'
                  }
                })()}
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
                  {sec === 'warmUp' ? 'Warm-Up' : sec === 'mainSet' ? 'Main Set' : 'Cool-Down'}
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
    alignItems: 'center',
    marginBottom: 12
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
  },
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    fontSize: 14
  },
  dateBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center'
  }
})