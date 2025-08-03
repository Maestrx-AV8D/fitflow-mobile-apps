// src/screens/SmartWorkout.tsx
import { useNavigation } from '@react-navigation/native'
import { format, isValid, parse } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  generateNutrition,
  generateSchedule,
  generateWorkout,
} from '../lib/api'

import { supabase } from '../lib/api'

async function getUserProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('age, gender, fitness_level, goals')
    .single()
  if (error) throw error
  return data
}

type Workout = { warmUp: string[]; mainSet: string[]; coolDown: string[]; description?: string }

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
      case 'Workout': return 'Quick Workout'
      case 'Schedule': return 'Schedule Planner'
      case 'Nutrition': return 'Nutrition Suggestions'
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
      const user = await getUserProfile(); // Fetch user profile from Supabase or context
      const userContext = {
        age: user.age,
        gender: user.gender,
        fitnessLevel: user.fitness_level,
        goals: user.goals,
      };
      if (view === 'Workout') {
        const result = await generateWorkout(prompt, userContext)
        setWorkout({ ...result, description: result.description || "This personalized workout is crafted to push your limits while keeping things enjoyable. Expect a progression that builds strength, improves endurance, and leaves you feeling accomplished. Listen to your body, and don’t forget to breathe through each rep." })
      } else if (view === 'Schedule') {
        const raw = await generateSchedule(prompt, userContext)
        const sanitized = (Array.isArray(raw) ? raw : []).map((day: any) => ({
          date: typeof day.date === 'string' ? day.date : '',
          warmUp: Array.isArray(day.warmUp) ? day.warmUp : [],
          mainSet: Array.isArray(day.mainSet) ? day.mainSet : [],
          coolDown: Array.isArray(day.coolDown) ? day.coolDown : [],
        }))
        setSchedule(sanitized)
      } else {
        const result = await generateNutrition(prompt, userContext)
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
      {/* Header fixed at the top */}
      <View style={{ position: 'absolute', top: 80, left: 20, zIndex: 10 }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: '#000' }}>Coach</Text>
      </View>
      <LinearGradient
        colors={['#FDFCF9', '#FFFFFF']}
        style={{ flex: 1 }}
      >
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
          <Text style={{ color: '#5E5E5E', fontSize: 13, marginBottom: 8 }}>
            Tailored suggestions powered by AI
          </Text>

          <TextInput
            style={styles.input}
            placeholder={`Enter ${view.toLowerCase()} prompt…`}
            placeholderTextColor="#999"
            value={prompt}
            onChangeText={setPrompt}
          />

          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <LinearGradient
              colors={['#000000', '#4A6C6F']}
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
                {workout.description && (
                  <Text style={[styles.resultText, { marginTop: 10, fontStyle: 'italic', color: '#5E5E5E' }]}>
                    {workout.description}
                  </Text>
                )}

                <TouchableOpacity onPress={importQuickWorkoutToLog} style={{ marginTop: 10, backgroundColor: '#4A6C6F', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Import to Log</Text>
                </TouchableOpacity>
              </View>
            )}

            {schedule.length > 0 && (
              <View style={styles.resultCard}>
                {schedule.map((day, idx) => (
                  <View key={idx} style={styles.scheduleBlock}>
                    {idx > 0 && <View style={{ height: 1, backgroundColor: '#EAEAEA', marginVertical: 12 }} />}
                    <Text style={styles.resultTitle}>{parseFlexibleDate(day.date)}</Text>
                    {day.warmUp.length + day.mainSet.length + day.coolDown.length === 0 ? (
                      <Text style={styles.resultText}>No workout set</Text>
                    ) : (
                      <>
                        {day.warmUp.map((ex, i) => <Text key={`wu-${i}`} style={styles.resultText}>• Warm-up: {ex}</Text>)}
                        {day.mainSet.map((ex, i) => <Text key={`ms-${i}`} style={styles.resultText}>• Main: {ex}</Text>)}
                        {day.coolDown.map((ex, i) => <Text key={`cd-${i}`} style={styles.resultText}>• Cool-down: {ex}</Text>)}
                        <Text style={[styles.resultText, { marginTop: 10, fontStyle: 'italic', color: '#5E5E5E' }]}>
                          Each session is carefully aligned with your goals and structured to build momentum throughout the week. Recovery and variety are baked in to keep you consistent, motivated, and injury-free.
                        </Text>
                        <TouchableOpacity onPress={() => importToLog(day)} style={{ marginTop: 10, backgroundColor: '#4A6C6F', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start' }}>
                          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Import to Log</Text>
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
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, paddingTop: 130, paddingBottom: 120 },
  tabRow: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    backgroundColor: '#F2F2F2', 
    marginBottom: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#000000' },
  tabText: { color: '#5E5E5E', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: '#000000', marginBottom: 20 },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DADADA',
    color: '#000000',
    fontSize: 16,
    marginBottom: 12,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  error: { color: '#B85C5C', textAlign: 'center', marginBottom: 12 },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderColor: '#DADADA',
    borderWidth: 1.2,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  resultTitle: { fontWeight: '700', fontSize: 17, marginBottom: 10, color: '#000000' },
  resultText: { fontSize: 15, color: '#1A1A1A', marginBottom: 8 },
  scheduleBlock: { marginBottom: 16 },
})