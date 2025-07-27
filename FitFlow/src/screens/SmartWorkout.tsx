// src/screens/SmartWorkout.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { format, parse, isValid } from 'date-fns'
import {
  generateWorkout,
  generateSchedule,
  generateNutrition,
} from '../lib/api'

type Workout = { warmUp: string[]; mainSet: string[]; coolDown: string[] }

type ScheduleDay = {
  date: string
  warmUp: string[]
  mainSet: string[]
  coolDown: string[]
  done?: boolean
}

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
  const [fadeAnim] = useState(new Animated.Value(0))
  const navigation = useNavigation()

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [view])

  function sectionHeader() {
    switch (view) {
      case 'Workout': return '🏋️ Quick Workout'
      case 'Schedule': return '📅 Schedule Planner'
      case 'Nutrition': return '🥗 Nutrition Suggestions'
    }
  }

  function parseFlexibleDate(dateStr: string): string {
    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'd MMM yyyy', 'dd/MM/yy']
    for (const fmt of formats) {
      try {
        const parsed = parse(dateStr, fmt, new Date())
        if (isValid(parsed)) return format(parsed, 'dd/MM/yyyy')
      } catch {}
    }
    return dateStr
  }

  function parseExerciseDetails(str: string) {
    const [namePart, rest = ''] = str.split(':')
    const sets = rest.match(/(\d+)×/)?.[1] || ''
    const reps = rest.match(/×(\d+)/)?.[1] || ''
    const weight = rest.match(/@ ?([\d.]+)(kg|lbs)?/)?.[1] || ''
    return { name: namePart.trim(), sets, reps, weight }
  }

  function importToLog(day: ScheduleDay, exercise?: string) {
    const entry: any = {
      date: day.date,
      type: 'Gym',
      notes: exercise || day.mainSet?.join(', '),
      exercises: [],
      segments: [],
    }

    entry.exercises = (exercise ? [exercise] : day.mainSet || []).map(parseExerciseDetails)
    navigation.navigate('Log' as never, { entry } as never)
  }

  function importQuickWorkoutToLog() {
    if (!workout) return
    const entry: any = {
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Gym',
      notes: workout.mainSet.join(', '),
      exercises: workout.mainSet.map(parseExerciseDetails),
      segments: []
    }
    navigation.navigate('Log' as never, { entry } as never)
  }

  async function handleSubmit() {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      setError('')
      if (view === 'Workout') {
        const result = await generateWorkout(prompt)
        setWorkout(result)
      } else if (view === 'Schedule') {
        const raw = await generateSchedule(prompt)
        const sanitized = (Array.isArray(raw) ? raw : []).map((day: any) => ({
          date: typeof day.date === 'string' ? day.date : '',
          warmUp: Array.isArray(day.warmUp) ? day.warmUp : [],
          mainSet: Array.isArray(day.mainSet) ? day.mainSet : [],
          coolDown: Array.isArray(day.coolDown) ? day.coolDown : [],
        }))
        setSchedule(sanitized)
      } else {
        const result = await generateNutrition(prompt)
        setNutrition(result)
      }
    } catch (e) {
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
                fadeAnim.setValue(0)
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
          placeholder={`Enter ${view.toLowerCase()} prompt…`}
          placeholderTextColor="#999"
          value={prompt}
          onChangeText={setPrompt}
        />

        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <LinearGradient
            colors={['#000000', '#3f3cbb']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.gradientButton}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Generate</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Animated.View style={{ opacity: fadeAnim }}>
          {workout && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Warm-up</Text>
              {workout.warmUp?.map((ex, i) => <Text key={i} style={styles.resultText}>• {ex}</Text>)}
              <Text style={styles.resultTitle}>Main Set</Text>
              {workout.mainSet?.map((ex, i) => <Text key={i} style={styles.resultText}>• {ex}</Text>)}
              <Text style={styles.resultTitle}>Cool Down</Text>
              {workout.coolDown?.map((ex, i) => <Text key={i} style={styles.resultText}>• {ex}</Text>)}

              <TouchableOpacity onPress={importQuickWorkoutToLog} style={{ marginTop: 12 }}>
                <Text style={{ color: '#4A6C6F', fontWeight: '600' }}>+ Import to Log</Text>
              </TouchableOpacity>
            </View>
          )}

          {schedule.length > 0 && (
            <View style={styles.resultCard}>
              {schedule.map((day, idx) => (
                <View key={idx} style={styles.scheduleBlock}>
                  <Text style={styles.resultTitle}>{parseFlexibleDate(day.date)}</Text>
                  {day.warmUp.length + day.mainSet.length + day.coolDown.length === 0 ? (
                    <Text style={styles.resultText}>No workout set</Text>
                  ) : (
                    <>
                      {day.warmUp.map((ex, i) => <Text key={`wu-${i}`} style={styles.resultText}>• Warm-up: {ex}</Text>)}
                      {day.mainSet.map((ex, i) => <Text key={`ms-${i}`} style={styles.resultText}>• Main: {ex}</Text>)}
                      {day.coolDown.map((ex, i) => <Text key={`cd-${i}`} style={styles.resultText}>• Cool-down: {ex}</Text>)}
                      <TouchableOpacity onPress={() => importToLog(day)} style={{ marginTop: 6 }}>
                        <Text style={{ color: '#4A6C6F', fontWeight: '600' }}>+ Import to Log</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}

          {nutrition?.answer && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Summary</Text>
              <Text style={styles.resultText}>{nutrition.answer}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDFCF9' },
  container: { padding: 16, paddingTop: 70, paddingBottom: 100 },
  tabRow: { flexDirection: 'row', borderRadius: 12, backgroundColor: '#EFEFEF', marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#1A1A1A' },
  tabText: { color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#FFF', fontWeight: '600' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    color: '#1A1A1A',
    fontSize: 16,
    marginBottom: 12,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  error: { color: '#B85C5C', textAlign: 'center', marginBottom: 12 },
  resultCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderColor: '#EEE',
    borderWidth: 1,
    marginBottom: 20,
  },
  resultTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: '#1A1A1A' },
  resultText: { fontSize: 14, color: '#333', marginBottom: 6 },
  scheduleBlock: { marginBottom: 16 },
})