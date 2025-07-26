import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { format, parseISO } from 'date-fns'
import {
  generateWorkout,
  generateSchedule,
  generateNutrition,
} from '../lib/api'

type Workout = { warmUp: string[]; mainSet: string[]; coolDown: string[] }
type ScheduleDay = { date: string; warmUp: string[]; mainSet: string[]; coolDown: string[]; done?: boolean }
type NutritionPlan = {
  breakfast?: { name: string; protein_g: number; fat_g: number; carbs_g: number; notes: string }[]
  lunch?: { name: string; protein_g: number; fat_g: number; carbs_g: number; notes: string }[]
  dinner?: { name: string; protein_g: number; fat_g: number; carbs_g: number; notes: string }[]
  ingredients?: string[]
  answer?: string
}

const TABS = ['Workout', 'Schedule', 'Nutrition'] as const

export default function SmartWorkout() {
  const [view, setView] = useState<typeof TABS[number]>('Workout')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [schedule, setSchedule] = useState<ScheduleDay[]>([])
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null)
  const navigation = useNavigation()

  function sectionHeader() {
    switch (view) {
      case 'Workout':
        return '🏋️ Quick Workout'
      case 'Schedule':
        return '📅 Schedule Planner'
      case 'Nutrition':
        return '🥗 Nutrition Suggestions'
    }
  }

//   useEffect(() => {
//   generateWorkout('15 minute full-body workout').then(console.log).catch(console.error);
// }, []);

  // helper to import into Log screen
  function importToLog(day: ScheduleDay, exercise?: string) {
    const entry: any = {
      date: day.date,
      type: day.mainSet.length ? 'Gym' : 'Run',
      notes: exercise || day.mainSet.join(', '),
      exercises: [],
      segments: [],
    }
    if (exercise) {
      const [name, rest = ''] = exercise.split(':')
      const sets = rest.match(/(\d+)×/)?.[1] || ''
      const reps = rest.match(/×(\d+)/)?.[1] || ''
      entry.exercises = [{ name: name.trim(), sets, reps, weight: '' }]
    } else {
      entry.exercises = day.mainSet.map(s => {
        const [name, rest = ''] = s.split(':')
        const sets = rest.match(/(\d+)×/)?.[1] || ''
        const reps = rest.match(/×(\d+)/)?.[1] || ''
        return { name: name.trim(), sets, reps, weight: '' }
      })
    }
    navigation.navigate('Log' as never, { entry } as never)
  }

  async function handleSubmit() {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      if (view === 'Workout') {
        const w = await generateWorkout(prompt)
        setWorkout(w)
      } else if (view === 'Schedule') {
        const s = await generateSchedule(prompt)
        setSchedule(s)
      } else {
        const n = await generateNutrition(prompt)
        setNutrition(n)
      }
    } catch {
      setError('Could not generate—try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setView(t)
                setPrompt('')
                setError('')
                setWorkout(null)
                setSchedule([])
                setNutrition(null)
              }}
              style={[styles.tab, view === t && styles.tabActive]}
            >
              <Text style={view === t ? styles.tabTextActive : styles.tabText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{sectionHeader()}</Text>

        <TextInput
          style={styles.input}
          placeholder={`Enter ${view} prompt…`}
          placeholderTextColor="#757185"
          value={prompt}
          onChangeText={setPrompt}
        />

        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Go</Text>}
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Workout Results */}
        {view === 'Workout' && workout && (
          <View style={styles.result}>
            {(['warmUp', 'mainSet', 'coolDown'] as const).map(section => (
              <View key={section} style={styles.sectionGroup}>
                <Text style={styles.subHeader}>
                  {section === 'warmUp'
                    ? 'Warm-Up'
                    : section === 'mainSet'
                    ? 'Main Set'
                    : 'Cool-Down'}
                </Text>
                {workout[section].map((item, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineText}>• {item}</Text>
                    {section === 'mainSet' && (
                      <TouchableOpacity onPress={() => importToLog({ date: format(new Date(), 'yyyy-MM-dd'), warmUp: [], mainSet: [item], coolDown: [] }, item)}>
                        <Text style={styles.importLink}>Import</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {section === 'mainSet' && workout.mainSet.length > 0 && (
                  <TouchableOpacity
                    onPress={() => importToLog(
                      { date: format(new Date(), 'yyyy-MM-dd'), warmUp: [], mainSet: workout.mainSet, coolDown: [] }
                    )}
                  >
                    <Text style={styles.importLink}>Import All</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Schedule Results */}
        {view === 'Schedule' && schedule.length > 0 && (
          <View>
            {schedule.map((day, i) => (
              <View key={i} style={[styles.card, day.done && { opacity: 0.5 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{format(parseISO(day.date), 'dd/MM/yy')}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const upd = [...schedule]
                      upd[i].done = !upd[i].done
                      setSchedule(upd)
                    }}
                  >
                    <Text style={styles.completeLink}>{day.done ? 'Undo' : 'Complete'}</Text>
                  </TouchableOpacity>
                </View>
                {(['warmUp', 'mainSet', 'coolDown'] as const).map(sec => (
                  <View key={sec} style={{ marginBottom: 8 }}>
                    <Text style={styles.subHeader}>
                      {sec === 'warmUp'
                        ? 'Warm-Up'
                        : sec === 'mainSet'
                        ? 'Main Set'
                        : 'Cool-Down'}
                    </Text>
                    {day[sec].map((item, j) => (
                      <View key={j} style={styles.lineRow}>
                        <Text style={styles.lineText}>• {item}</Text>
                        {sec === 'mainSet' && (
                          <TouchableOpacity onPress={() => importToLog(day, item)}>
                            <Text style={styles.importLink}>Import</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Nutrition Results */}
        {view === 'Nutrition' && nutrition && (
          <View style={styles.result}>
            {nutrition && (
  (['breakfast','lunch','dinner'] as const).map(meal => {
    const items = nutrition[meal]
    if (!Array.isArray(items)) return null
    return (
      <View key={meal} style={styles.sectionGroup}>
        <Text style={styles.subHeader}>
          {meal.charAt(0).toUpperCase() + meal.slice(1)}
        </Text>
        {items.map((m, idx) => (
          <Text key={idx} style={styles.lineText}>
            • {m.name} — P:{m.protein_g}g F:{m.fat_g}g C:{m.carbs_g}g{'\n'}
            <Text style={styles.notes}>{m.notes}</Text>
          </Text>
        ))}
      </View>
    )
  })
)}
            {Array.isArray(nutrition.ingredients) && (
  <View style={styles.sectionGroup}>
    <Text style={styles.subHeader}>🛒 Ingredients</Text>
    {nutrition.ingredients.map((ing, i) => (
      <Text key={i} style={styles.lineText}>• {ing}</Text>
    ))}
  </View>
)}
            {nutrition.answer && <Text style={styles.lineText}>{nutrition.answer}</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0E0C15' },
  container: { padding: 16, paddingTop: 70, backgroundColor: '#0E0C15', paddingBottom: 32 },
  tabRow: { flexDirection: 'row', marginBottom: 12 },
  tab: { flex: 1, padding: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#2E2A41' },
  tabActive: { borderBottomColor: '#AC6AFF' },
  tabText: { color: '#757185' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 },
  input: { backgroundColor: '#2E2A41', borderRadius: 8, padding: 12, color: '#FFFFFF', marginBottom: 12 },
  submitButton: { backgroundColor: '#AC6AFF', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
  submitText: { color: '#FFFFFF', fontWeight: '600' },
  error: { color: '#FF6B6B', marginBottom: 12, textAlign: 'center' },
  result: { backgroundColor: '#15131D', borderRadius: 8, padding: 12, marginBottom: 24 },
  sectionGroup: { marginBottom: 12 },
  subHeader: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lineText: { color: '#ADA8C3', flex: 1, marginRight: 8 },
  importLink: { color: '#AC6AFF', fontWeight: '600' },
  notes: { fontStyle: 'italic', color: '#757185', marginTop: 2 },
  card: { backgroundColor: '#2E2A41', borderRadius: 12, padding: 12, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardDate: { color: '#CAC6DD', fontWeight: '600' },
  completeLink: { color: '#7ADB78', fontWeight: '600' },
})