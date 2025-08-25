// src/screens/SmartWorkout.tsx
import { useNavigation } from '@react-navigation/native'
import { addDays, format, isValid, parse } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'

import { NativeModulesProxy } from 'expo-modules-core'

// AdMob interstitials are optional. In Expo Go the native module is missing; we guard using NativeModulesProxy.

import {
  generateNutrition,
  generateSchedule,
  generateWorkout,
  supabase,
} from '../lib/api'

// ───────────────────────────────────────────────────────────────────────────────
// Profile + membership helpers
async function getUserProfile() {
  // We try to read the plan/tier and fitness context. Unknown fields are optional.
  const { data, error } = await supabase
    .from('profiles')
    .select('age, gender, goals, fitness_level, weight_kg, height_cm, plan, membership_tier')
    .single()
  if (error) throw error
  return data as Partial<{
    age: number
    gender: string
    goals: string
    fitness_level: string
    weight_kg: number
    height_cm: number
    plan: string
    membership_tier: string
  }>
}

type Workout = { warmUp: string[]; mainSet: string[]; coolDown: string[]; description?: string }

type ScheduleDay = {
  date: string
  warmUp: string[]
  mainSet: string[]
  coolDown: string[]
  type?: 'Gym' | 'Run' | 'Swim' | 'Cycle' | 'Other'
  time?: string // minutes or HH:MM for endurance sessions
  distance?: string // km for run/cycle, m for swim
  done?: boolean
}

type NutritionPlan = {
  breakfast?: { name: string; protein_g: number; fat_g: number; carbs_g: number; notes: string }[]
  lunch?: { name: string; protein_g: number; fat_g: number; carbs_g: number; notes: string }[]
  dinner?: { name: string; protein_g: number; fat_g: number; carbs_g: number; notes: string }[]
  ingredients?: string[]
  answer?: string
}

type Tier = 'free' | 'premium' | 'premium_plus'

type GenerationHistoryItem = {
  id: number
  type: 'Workout' | 'Schedule' | 'Nutrition'
  prompt: string
  payload: any
  created_at: string
  expires_at?: string | null
}

const TABS = [
  { key: 'Workout', icon: 'barbell-outline' as const, label: 'Workout' },
  { key: 'Schedule', icon: 'calendar-outline' as const, label: 'Schedule' },
  { key: 'Nutrition', icon: 'fast-food-outline' as const, label: 'Nutrition' },
] as const

// Replace with your real Ad Unit ID
const ADMOB_INTERSTITIAL_ID =
  Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/ios_interstitial_id',
    android: 'ca-app-pub-xxxxxxxxxxxxxxxx/android_interstitial_id',
    default: '',
  }) || ''

export default function SmartWorkout() {
  const [view, setView] = useState<'Workout' | 'Schedule' | 'Nutrition'>('Workout')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [schedule, setSchedule] = useState<ScheduleDay[]>([])
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null)
  const [fadeAnim] = useState(new Animated.Value(0))

  // Schedule controls
  const [scheduleStart, setScheduleStart] = useState(format(new Date(), 'yyyy-MM-dd'))

  const [tier, setTier] = useState<Tier>('free')
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null)

  // History (only visible/persisted for Premium+; others auto-expire in ~20 min)
  const [history, setHistory] = useState<GenerationHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)

  // Build a rolling list of dates (today + next 29 days) for a British-formatted, scrollable picker
  const dateOptions = useMemo(() => {
    const start = new Date()
    const out: Date[] = []
    for (let i = 0; i < 30; i++) {
      out.push(addDays(start, i))
    }
    return out
  }, [])

  const selectedStartDate = useMemo(() => {
    const d = new Date(scheduleStart)
    return isNaN(d.getTime()) ? new Date() : d
  }, [scheduleStart])

  function setStartDateFromDate(d: Date) {
    // Keep internal ISO (yyyy-MM-dd) while showing GB formatting in UI
    setScheduleStart(format(d, 'yyyy-MM-dd'))
  }

  const suggestions = useMemo(() => {
    if (view === 'Workout') {
      return [
        '45‑min push day at home',
        '3‑day strength split',
        'Dumbbell full‑body blast',
        'Hypertrophy legs + core',
        '20‑min hotel room workout',
      ]
    }
    if (view === 'Schedule') {
      return [
        '2‑week 5k tune‑up (3 runs/wk)',
        '2‑week beginner full‑body split',
        '2‑week mobility + core focus',
        '2‑week strength + conditioning (4 sessions)',
        '2‑week deload with active recovery',
      ]
    }
    // Nutrition
    return [
      'High‑protein vegetarian day (~1800 kcal)',
      'Cutting meal plan for 2 weeks',
      'Low‑FODMAP day plan',
      'Muscle gain 2500 kcal day',
      'Simple grocery list for week',
    ]
  }, [view])
  const [showSkeleton, setShowSkeleton] = useState(false)

  const navigation = useNavigation()

  // ── UI entrance fade between tabs
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [view])

  // ── Load user profile + tier
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const p = await getUserProfile()
        if (!isMounted) return
        setProfile(p)
        const raw = (p?.membership_tier || p?.plan || 'free').toString().toLowerCase()
        const resolved: Tier =
          raw.includes('plus') || raw === 'premium_plus' || raw === 'pro_plus'
            ? 'premium_plus'
            : raw.includes('premium')
            ? 'premium'
            : 'free'
        setTier(resolved)
      } catch (e) {
        // default remains 'free'
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  // ── Fetch history for Premium+
  useEffect(() => {
    if (tier !== 'premium_plus') {
      setHistory([])
      return
    }
    let active = true
    ;(async () => {
      try {
        setHistoryLoading(true)
        const { data, error } = await supabase
          .from('ai_generations')
          .select('id, type, prompt, payload, created_at, expires_at')
          .order('created_at', { ascending: false })
          .limit(20)
        if (!active) return
        if (error) throw error
        setHistory((data || []) as any)
      } catch {}
      finally {
        if (active) setHistoryLoading(false)
      }
    })()
    return () => { active = false }
  }, [tier])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function parseScheduleTextToDays(text: string): { warmUp: string[]; mainSet: string[]; coolDown: string[] }[] {
    // Very forgiving parser for LLM plaintext schedules.
    // Splits by blank lines into "days", then looks for section headers;
    // otherwise treats all lines as main set.
    if (!text || typeof text !== 'string') return []
    const blocks = text
      .split(/\n\s*\n/g)
      .map(b => b.split('\n').map(l => l.trim()).filter(Boolean))
      .filter(arr => arr.length > 0)

    const days: { warmUp: string[]; mainSet: string[]; coolDown: string[] }[] = []

    for (const lines of blocks) {
      const warmUp: string[] = []
      const mainSet: string[] = []
      const coolDown: string[] = []

      let section: 'warm' | 'main' | 'cool' = 'main'
      lines.forEach(line => {
        const lower = line.toLowerCase()
        if (/^warm[-\s]?up/.test(lower) || /warm ?up:?/i.test(line)) {
          section = 'warm'
          return
        }
        if (/^cool[-\s]?down/.test(lower) || /cool ?down:?/i.test(line)) {
          section = 'cool'
          return
        }
        if (/^main/.test(lower) || /workout:?/i.test(line) || /session:?/i.test(line)) {
          section = 'main'
          return
        }
        // strip bullets
        const clean = line.replace(/^[•\-\*\d\.\)]\s*/,'').trim()
        if (!clean) return
        if (section === 'warm') warmUp.push(clean)
        else if (section === 'cool') coolDown.push(clean)
        else mainSet.push(clean)
      })

      if (warmUp.length + mainSet.length + coolDown.length > 0) {
        days.push({ warmUp, mainSet, coolDown })
      }
    }

    return days
  }

  function extractScheduleDays(raw: any): { warmUp: string[]; mainSet: string[]; coolDown: string[] }[] {
    // Accepts multiple shapes from the AI: array, object with schedule/days/plan, or plaintext.
    if (Array.isArray(raw)) {
      return raw.map((d: any) => ({
        warmUp: Array.isArray(d?.warmUp) ? d.warmUp : [],
        mainSet: Array.isArray(d?.mainSet) ? d.mainSet : [],
        coolDown: Array.isArray(d?.coolDown) ? d.coolDown : [],
      }))
    }
    if (raw && typeof raw === 'object') {
      const maybe = (raw.schedule || raw.days || raw.plan || raw.week || raw.result) as any
      if (Array.isArray(maybe)) {
        return maybe.map((d: any) => ({
          warmUp: Array.isArray(d?.warmUp) ? d.warmUp : [],
          mainSet: Array.isArray(d?.mainSet) ? d.mainSet : [],
          coolDown: Array.isArray(d?.coolDown) ? d.coolDown : [],
        }))
      }
      // Sometimes models return a big string inside an object.
      const text = (raw.text || raw.answer || raw.content || raw.output) as string
      if (typeof text === 'string') return parseScheduleTextToDays(text)
    }
    if (typeof raw === 'string') {
      return parseScheduleTextToDays(raw)
    }
    return []
  }

  // Try to infer duration (minutes) and distance (km or m) from a set of lines
  function inferTimeAndDistance(lines: string[]): { time?: string; distance?: string } {
    const hay = (lines || []).join(' ').toLowerCase()

    // Duration patterns (minutes or mm:ss)
    const m1 = hay.match(/(\b\d{1,3})\s?(min|minutes?)\b/)
    const m2 = hay.match(/\b(\d{1,2}:\d{2})\b/) // mm:ss or hh:mm

    // Distance patterns
    // km first
    const d1 = hay.match(/(\b\d{1,3}(?:\.\d+)?)\s?(km|kilometers?)\b/)
    // meters for swim
    const d2 = hay.match(/(\b\d{2,4})\s?(m|meters?)\b/)

    const time = m1 ? m1[1] : m2 ? m2[1] : undefined
    const distance = d1 ? d1[1] : d2 ? d2[1] : undefined

    return { time, distance }
  }
  function sectionHeader() {
    switch (view) {
      case 'Workout': return 'Smart Workout'
      case 'Schedule': return 'Schedule Planner'
      case 'Nutrition': return 'Nutrition Coach'
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

  // Detect activity type from text lines (auto-detect main/fallback for schedule/workout)
  function detectActivityTypeFromLines(lines: string[]): 'Gym' | 'Run' | 'Swim' | 'Cycle' | 'Other' | null {
    const hay = (lines || []).join(' ').toLowerCase();

    // Strong swim cues
    const swimWords = ['swim', 'pool', 'freestyle', 'butterfly', 'backstroke', 'breaststroke', 'laps in pool', 'kickboard', 'pull buoy'];
    if (swimWords.some(w => hay.includes(w))) return 'Swim';

    // Strong run cues
    const runWords = ['run', 'jog', 'tempo', 'intervals', 'track workout', 'easy run', 'long run', '5k', '10k', 'half marathon', 'marathon'];
    if (runWords.some(w => hay.includes(w))) return 'Run';

    // Strong cycle cues
    const cycleWords = ['cycle', 'bike', 'bicycle', 'spindown', 'spin class', 'watt', 'cadence', 'peloton', 'ftp'];
    if (cycleWords.some(w => hay.includes(w))) return 'Cycle';

    // Gym / resistance cues
    const gymWords = [
      'bench press','deadlift','squat','overhead press','shoulder press','lat pulldown','row','curl','triceps','dumbbell','barbell','machine',
      'reps','sets','superset','hypertrophy','strength','leg press','lunges','hip thrust','hamstring curl','cable','smith machine','rack'
    ];
    if (gymWords.some(w => hay.includes(w))) return 'Gym';

    // Fallback "Other" if it's active wording but no clear category
    const activeWords = ['workout','session','warm-up','cool down','mobility','yoga','pilates','stretch','core','hiit','cardio'];
    if (activeWords.some(w => hay.includes(w))) return 'Other';

    return null;
  }

  function importToLog(dayOrWorkout: ScheduleDay | Workout, from: 'schedule' | 'workout', exercise?: string) {
    const isSchedule = from === 'schedule'
    const date = isSchedule ? (dayOrWorkout as ScheduleDay).date : format(new Date(), 'yyyy-MM-dd')
    const entryType = isSchedule
      ? ((dayOrWorkout as ScheduleDay).type || 'Gym')
      : (detectActivityTypeFromLines((dayOrWorkout as Workout).mainSet || []) || 'Gym');

    const entry: any = {
      date,
      type: entryType,
      notes: exercise
        ? exercise
        : isSchedule
          ? (dayOrWorkout as ScheduleDay).mainSet?.join(', ')
          : (dayOrWorkout as Workout).mainSet?.join(', '),
      exercises: [],
      segments: [],
    }

    entry.exercises = (exercise
      ? [exercise]
      : isSchedule
        ? (dayOrWorkout as ScheduleDay).mainSet || []
        : (dayOrWorkout as Workout).mainSet || []
    ).map(parseExerciseDetails)

    navigation.navigate('Log' as never, { entry } as never)
  }

  function importScheduleToPlanner(days: ScheduleDay[]) {
    // Expects your Schedule screen to handle `importedSchedule`
    navigation.navigate('Schedule' as never, { importedSchedule: days } as never)
  }

  const premiumPlusContext = useMemo(() => {
    if (!profile) return {}
    return {
      age: profile.age,
      gender: profile.gender,
      fitnessLevel: profile.fitness_level,
      goals: profile.goals,
      weightKg: profile.weight_kg,
      heightCm: profile.height_cm,
    }
  }, [profile])

  // ── Ad logic ─────────────────────────────────────────────────────────────────
  async function maybeShowInterstitial() {
    if (tier === 'premium_plus') return
    try {
      if (!ADMOB_INTERSTITIAL_ID) return

      // Only attempt to use AdMob when the native module is available
      const hasAdMobNative = !!(NativeModulesProxy as any)?.ExpoAdsAdMobInterstitialManager
      if (!hasAdMobNative) {
        // Running in Expo Go or a build without AdMob – skip showing ads
        return
      }

      // Lazy require so bundling the JS module doesn't run unless available
       
      const { AdMobInterstitial } = require('expo-ads-admob')
      if (!AdMobInterstitial?.setAdUnitID) return

      await AdMobInterstitial.setAdUnitID(ADMOB_INTERSTITIAL_ID)
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true })
      await AdMobInterstitial.showAdAsync()
    } catch {
      // Never block generation if an ad fails
    }
  }

  // ── History persistence ──────────────────────────────────────────────────────
  async function saveGeneration(kind: GenerationHistoryItem['type'], promptStr: string, payload: any) {
    try {
      const expiresAt =
        tier === 'premium_plus'
          ? null
          : new Date(Date.now() + 20 * 60 * 1000).toISOString() // auto-expire for non-premium+
      const insert = {
        type: kind,
        prompt: promptStr,
        payload,
        expires_at: expiresAt,
      }
      const { error } = await supabase.from('ai_generations').insert(insert as any)
      if (error) throw error
      // Refresh history only for Premium+
      if (tier === 'premium_plus') {
        const { data } = await supabase
          .from('ai_generations')
          .select('id, type, prompt, payload, created_at, expires_at')
          .order('created_at', { ascending: false })
          .limit(20)
        setHistory((data || []) as any)
      }
    } catch (e) {
      // non-fatal
    }
  }

  // ── Generate handler ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!prompt.trim()) return
    setLoading(true)
    setShowSkeleton(true)
    try {
      setError('')
      await maybeShowInterstitial()

      // Build user context by tier:
      // - free & premium (ad tiers): minimal / generic context (doesn't consider age/weight/etc.)
      // - premium_plus: full context for best personalization
      const ctx = tier === 'premium_plus' ? premiumPlusContext : {}

      if (view === 'Workout') {
        const result = await generateWorkout(prompt, ctx as any)
        const enriched: Workout = {
          ...result,
          description:
            result.description ||
            (tier === 'premium_plus'
              ? 'Your plan leverages progressive overload, balances compound/isolation moves, and accounts for recovery and mobility based on your profile.'
              : 'A balanced session focusing on effort and consistency.'),
        }
        setWorkout(enriched)
        setSchedule([])
        setNutrition(null)
        await saveGeneration('Workout', prompt, enriched)
      } else if (view === 'Schedule') {
        // Constrain the model to a max of 14 days and a simple shape we can parse
        const scheduleConstraints =
          '\n\nPlease create a schedule for no more than 14 days. ' +
          'Return ONLY one of the following: ' +
          '(1) a JSON array where each element has "warmUp", "mainSet", "coolDown" fields (arrays of short strings), ' +
          'OR (2) plain text split into days separated by blank lines with section headers like Warm-up / Main / Cool-down. ' +
          'Do NOT include absolute calendar dates. Keep bullets short.';
        const schedulePrompt = prompt + scheduleConstraints

        let raw = await generateSchedule(schedulePrompt, ctx as any)

        // Normalize and extract days from many potential shapes
        let extracted = extractScheduleDays(raw)

        // If nothing parsed, try a stricter second attempt:
        if (!extracted.length) {
          const stricter =
            '\n\nSTRICT FORMAT: Return ONLY a JSON array of 7-14 objects. ' +
            'Each object must have "warmUp", "mainSet", "coolDown" arrays of short strings. No extra keys.';
          raw = await generateSchedule(prompt + stricter, ctx as any)
          extracted = extractScheduleDays(raw)
        }

        // Final local fallback so the user always sees something
        if (!extracted.length) {
          const fallbackType =
            detectActivityTypeFromLines([prompt]) || 'Other'
          const makeDay = (idx: number) => {
            if (fallbackType === 'Run') {
              return {
                warmUp: ['5–10 min easy jog', 'Dynamic leg swings'],
                mainSet: idx % 7 === 5
                  ? ['Long easy run 45–60 min']
                  : idx % 3 === 0
                  ? ['Intervals: 6 × 2 min hard / 2 min easy']
                  : ['Steady run 25–35 min'],
                coolDown: ['5–10 min walk', 'Light calf stretch'],
              }
            }
            if (fallbackType === 'Swim') {
              return {
                warmUp: ['200m easy swim', '4 × 25m drill'],
                mainSet: idx % 3 === 0
                  ? ['8 × 50m moderate, 20s rest']
                  : ['6 × 100m aerobic, 30s rest'],
                coolDown: ['100m easy backstroke'],
              }
            }
            if (fallbackType === 'Cycle') {
              return {
                warmUp: ['10 min easy spin'],
                mainSet: idx % 3 === 0
                  ? ['6 × 3 min at threshold, 2 min easy']
                  : ['Endurance ride 45–60 min'],
                coolDown: ['5–10 min easy spin', 'Hip mobility'],
              }
            }
            if (fallbackType === 'Gym') {
              return {
                warmUp: ['5 min light cardio', 'Dynamic mobility'],
                mainSet: idx % 2 === 0
                  ? ['Squat 3×8', 'RDL 3×10', 'Split squat 3×10/leg', 'Plank 3×30s']
                  : ['Bench press 4×6', 'Row 3×10', 'Shoulder press 3×8', 'Curl 3×12'],
                coolDown: ['Full‑body stretch 5 min'],
              }
            }
            return {
              warmUp: ['5 min easy movement', 'Breathing reset'],
              mainSet: idx % 3 === 2
                ? ['Mobility flow 15 min', 'Core circuit 10 min']
                : ['Brisk walk 30 min or light circuits'],
              coolDown: ['Gentle stretch 5 min'],
            }
          }
          extracted = Array.from({ length: 7 }, (_, i) => makeDay(i))
        }

        // Enforce max horizon of 14 days (2 weeks)
        // moved here after fallback logic
        extracted = extracted.slice(0, 14)

        // If nothing was parsed, throw to show user-friendly error
        if (!extracted.length) {
          throw new Error('EMPTY_SCHEDULE')
        }

        // Apply starting date offset, add date + detected activity type
        let base = new Date(scheduleStart)
        if (isNaN(base.getTime())) base = new Date()

        const sanitized = extracted.map((d, idx) => {
          const adjusted = new Date(base)
          adjusted.setDate(adjusted.getDate() + idx)
          const allLines = [ ...(d.warmUp || []), ...(d.mainSet || []), ...(d.coolDown || []) ]
          const detected = detectActivityTypeFromLines(allLines)
          const metrics = detected && detected !== 'Gym' ? inferTimeAndDistance(allLines) : {}
          return {
            date: format(adjusted, 'yyyy-MM-dd'),
            warmUp: d.warmUp || [],
            mainSet: d.mainSet || [],
            coolDown: d.coolDown || [],
            type: detected || 'Gym',
            ...(metrics?.time ? { time: metrics.time } : {}),
            ...(metrics?.distance ? { distance: metrics.distance } : {}),
          } as ScheduleDay
        })

        setSchedule(sanitized)
        setWorkout(null)
        setNutrition(null)
        await saveGeneration('Schedule', prompt, sanitized)
      } else {
        const result = await generateNutrition(prompt, ctx as any)
        setNutrition(result)
        setWorkout(null)
        setSchedule([])
        await saveGeneration('Nutrition', prompt, result)
      }
    } catch (e) {
      if ((e as any)?.message === 'EMPTY_SCHEDULE') {
        setError('Couldn’t parse a schedule from that description. Try being a bit more specific (e.g., “3-day split with runs on Tue/Thu”).')
      } else {
        setError('Could not generate—please try again in a moment.')
      }
    } finally {
      setShowSkeleton(false)
      setLoading(false)
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  const showAdBadge = tier !== 'premium_plus'

  return (
    <SafeAreaView style={styles.screen}>
      {/* Floating header */}
      <LinearGradient
        colors={[ '#0A0A0A', '#0B0B0B', '#0E0E0E', '#111111', '#131313' ]}
        locations={[0, 0.35, 0.7, 0.9, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        {/* Subtle gold hint + sparkles */}
        <LinearGradient
          colors={[ 'transparent', 'rgba(212,175,55,0.10)', 'transparent' ]}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGoldVeil}
        />
        <View pointerEvents="none" style={styles.headerSparkles}>
          <Ionicons name="sparkles" size={14} color="#D4AF3733" style={{ position: 'absolute', top: 10, left: 26 }} />
          <Ionicons name="sparkles" size={10} color="#D4AF3726" style={{ position: 'absolute', top: 28, right: 40 }} />
          <Ionicons name="sparkles" size={8} color="#D4AF3722" style={{ position: 'absolute', bottom: 16, left: 80 }} />
        </View>
        <View style={styles.headerRow}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.headerKicker}>AI Coach</Text>
            <Text style={styles.headerTitle}>Smart Programs</Text>
            <Text style={styles.headerSubtitle}>Generate workouts, weekly schedules and nutrition</Text>
          </View>
          <View style={styles.tierPillRow}
          >
            <Ionicons name={tier === 'premium_plus' ? 'sparkles' : 'pricetag-outline'} size={14} color="#F0E6C8" />
            <Text style={styles.tierPillText}>{tier === 'premium_plus' ? 'Premium+' : tier === 'premium' ? 'Premium (ads)' : 'Free (ads)'}</Text>
          </View>
        </View>
        <LinearGradient
          colors={[ 'transparent', '#C9A74A55', 'transparent' ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerEdge}
        />
      </LinearGradient>

      <LinearGradient colors={['#FBFCFE', '#FFFFFF']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: Math.max(headerHeight - 50) }]}
          contentInsetAdjustmentBehavior="always"
          keyboardShouldPersistTaps="handled"
        >
          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => {
                  setView(t.key)
                  setPrompt('')
                  setError('')
                  setWorkout(null)
                  setSchedule([])
                  setNutrition(null)
                  fadeAnim.setValue(0)
                }}
                style={[styles.tab, view === t.key && styles.tabActive]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={view === t.key ? '#FFF' : '#61666B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={view === t.key ? styles.tabTextActive : styles.tabText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title + hint */}
          <Text style={styles.sectionTitle}>{sectionHeader()}</Text>
          <Text style={{ color: '#5E5E5E', fontSize: 13, marginBottom: 8 }}>
            Tailored suggestions powered by AI
            {showAdBadge ? '  ·  Ad-supported' : '  ·  Max detail'}
          </Text>

          {/* Prompt */}
          {view === 'Schedule' && (
            <View style={styles.scheduleControlsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Start date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateScroller}
                >
                  {dateOptions.map((d) => {
                    const isActive =
                      format(d, 'yyyy-MM-dd') === format(selectedStartDate, 'yyyy-MM-dd')
                    return (
                      <TouchableOpacity
                        key={format(d, 'yyyy-MM-dd')}
                        onPress={() => setStartDateFromDate(d)}
                        style={[styles.dateChip, isActive && styles.dateChipActive]}
                        activeOpacity={0.9}
                      >
                        <Text style={[styles.dateChipTextSmall, isActive && { color: '#111' }]}>
                          {format(d, 'EEE')}
                        </Text>
                        <Text style={[styles.dateChipTextLarge, isActive && { color: '#111' }]}>
                          {format(d, 'dd')}
                        </Text>
                        <Text style={[styles.dateChipTextSmall, isActive && { color: '#111' }]}>
                          {format(d, 'MMM')}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
                {/* Show selected in British format below for clarity */}
                <Text style={{ color: '#5E5E5E', fontSize: 12, marginTop: 6 }}>
                  Selected: {format(selectedStartDate, 'dd/MM/yyyy')}
                </Text>
              </View>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder={`Describe your ${view.toLowerCase()} goals…`}
            placeholderTextColor="#999"
            value={prompt}
            onChangeText={setPrompt}
          />

          {/* Quick suggestion chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} onPress={() => setPrompt(s)} style={styles.chip}>
                <Ionicons name="sparkles-outline" size={14} color="#111" style={{ marginRight: 6 }} />
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.footerCtaWrap}>
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#0A0A0A', '#1A1A1A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.footerCta}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="flash-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.footerCtaText}>Generate{showAdBadge ? ' (ad)' : ''}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Results */}
          <Animated.View style={{ opacity: fadeAnim }}>
            {showSkeleton && (
              <View style={styles.skeletonCard}>
                <Animated.View style={styles.skelBar} />
                <Animated.View style={[styles.skelBar, { width: '80%' }]} />
                <Animated.View style={[styles.skelBar, { width: '60%' }]} />
              </View>
            )}
            {workout && (
              <View style={styles.resultCard}>
                <LinearGradient
                  colors={['#0A0A0A', '#1A1A1A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.cardHeaderRow, { borderRadius: 10, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 10 }]}
                >
                  <Ionicons name="barbell-outline" size={18} color="#FFF" />
                  <Text style={[styles.cardHeaderText, { color: '#FFF' }]}>Workout Plan</Text>
                </LinearGradient>
                <Text style={styles.resultTitle}>Warm-up</Text>
                {workout.warmUp?.map((ex, i) => (
                  <Text key={i} style={styles.resultText}>
                    • {ex}
                  </Text>
                ))}
                <Text style={styles.resultTitle}>Main Set</Text>
                {workout.mainSet?.map((ex, i) => (
                  <Text key={i} style={styles.resultText}>
                    • {ex}
                  </Text>
                ))}
                <Text style={styles.resultTitle}>Cool Down</Text>
                {workout.coolDown?.map((ex, i) => (
                  <Text key={i} style={styles.resultText}>
                    • {ex}
                  </Text>
                ))}
                {workout.description && (
                  <Text style={[styles.resultText, { marginTop: 10, fontStyle: 'italic', color: '#5E5E5E' }]}>
                    {workout.description}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', marginTop: 14 }}>
                  <LinearGradient
                    colors={['#0A0A0A', '#1A1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 10, flex: 1, marginRight: 5 }}
                  >
                    <TouchableOpacity
                      onPress={() => importToLog(workout, 'workout')}
                      style={[styles.actionBtn, { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                    >
                      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                        <Text style={styles.actionBtnText}>Import to Log</Text>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                  {tier !== 'free'  && (<LinearGradient
                    colors={['#0A0A0A', '#1A1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 10, flex: 1, marginLeft: 5 }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        importScheduleToPlanner([
                          {
                            date: format(new Date(), 'yyyy-MM-dd'),
                            warmUp: workout.warmUp || [],
                            mainSet: workout.mainSet || [],
                            coolDown: workout.coolDown || [],
                            type: detectActivityTypeFromLines((workout.mainSet || []).concat(workout.warmUp || [], workout.coolDown || [])) || 'Gym',
                          },
                        ])
                      }
                      style={[styles.actionBtn, { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                    >
                      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                        <Text style={styles.actionBtnText}>Add to Schedule</Text>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>)}
                </View>
              </View>
            )}

            {schedule.length > 0 && (
              <View style={styles.resultCard}>
                <LinearGradient
                  colors={['#0A0A0A', '#1A1A1A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.cardHeaderRow, { borderRadius: 10, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 10 }]}
                >
                  <Ionicons name="calendar-outline" size={18} color="#FFF" />
                  <Text style={[styles.cardHeaderText, { color: '#FFF' }]}>Schedule (max 14 days)</Text>
                </LinearGradient>
                {schedule.map((day, idx) => (
                  <View key={idx} style={styles.scheduleBlock}>
                    {idx > 0 && <View style={{ height: 1, backgroundColor: '#EAEAEA', marginVertical: 10 }} />}
                    <Text style={styles.resultTitle}>{parseFlexibleDate(day.date)}</Text>
                    {day.warmUp.length + day.mainSet.length + day.coolDown.length === 0 ? (
                      <Text style={styles.resultText}>No workout set</Text>
                    ) : (
                      <>
                        {day.warmUp.map((ex, i) => (
                          <Text key={`wu-${i}`} style={styles.resultText}>
                            • Warm-up: {ex}
                          </Text>
                        ))}
                        {day.mainSet.map((ex, i) => (
                          <Text key={`ms-${i}`} style={styles.resultText}>
                            • Main: {ex}
                          </Text>
                        ))}
                        {day.coolDown.map((ex, i) => (
                          <Text key={`cd-${i}`} style={styles.resultText}>
                            • Cool-down: {ex}
                          </Text>
                        ))}
                        {/* Endurance summary if applicable */}
                        {day.type && day.type !== 'Gym' && (
                          <Text style={[styles.resultText, { marginTop: 6, color: '#5E5E5E' }]}>
                            Summary: {day.time ? `${day.time} min` : '—'}{day.distance ? ` · ${day.type === 'Swim' ? `${day.distance} m` : `${day.distance} km`}` : ''}
                          </Text>
                        )}
                        {tier === 'premium_plus' && (
                          <Text style={[styles.resultText, { marginTop: 10, fontStyle: 'italic', color: '#5E5E5E' }]}>
                            This schedule respects your training age, goals and recovery capacity for sustainable progress.
                          </Text>
                        )}
                        <View style={{ flexDirection: 'row', marginTop: 12 }}>
                          <LinearGradient
                            colors={['#0A0A0A', '#1A1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 10, flex: 1, marginRight: 5 }}
                          >
                            <TouchableOpacity
                              onPress={() => importToLog(day, 'schedule')}
                              style={[styles.actionBtn, { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                            >
                              <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                                <Text style={styles.actionBtnText}>Import Day to Log</Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                          <LinearGradient
                            colors={['#0A0A0A', '#1A1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 10, flex: 1, marginLeft: 5 }}
                          >
                            <TouchableOpacity
                              onPress={() => importScheduleToPlanner(schedule)}
                              style={[styles.actionBtn, { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                            >
                              <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                                <Text style={styles.actionBtnText}>Import All to Schedule</Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}

            {nutrition?.answer && (
              <View style={styles.resultCard}>
                <LinearGradient
                  colors={['#0A0A0A', '#1A1A1A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.cardHeaderRow, { borderRadius: 10, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 10 }]}
                >
                  <Ionicons name="fast-food-outline" size={18} color="#FFF" />
                  <Text style={[styles.cardHeaderText, { color: '#FFF' }]}>Nutrition</Text>
                </LinearGradient>
                <Text style={styles.resultTitle}>Summary</Text>
                <Text style={styles.resultText}>{nutrition.answer}</Text>
              </View>
            )}
          </Animated.View>

          {/* Premium+ history */}
          {tier === 'premium_plus' && (
            <View style={[styles.resultCard, { marginTop: -4 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.resultTitle, { marginBottom: 6 }]}>Your AI History</Text>
                {historyLoading ? <ActivityIndicator /> : null}
              </View>
              {history.length === 0 ? (
                <Text style={[styles.resultText, { color: '#666' }]}>No history yet.</Text>
              ) : (
                history.map((h) => (
                  <View key={h.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EFEFEF' }}>
                    <Text style={{ fontWeight: '700', color: '#000' }}>
                      {h.type} • {format(new Date(h.created_at), 'dd MMM, HH:mm')}
                    </Text>
                    <Text style={{ color: '#333', marginTop: 4 }} numberOfLines={2}>
                      {h.prompt}
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      {h.type === 'Workout' && (
                        <>
                          <LinearGradient
                            colors={['#0A0A0A', '#1A1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 10 }}
                          >
                            <TouchableOpacity
                              onPress={() => importToLog(h.payload as Workout, 'workout')}
                              style={[styles.historyBtn, { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                            >
                              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                                <Text style={styles.historyBtnText}>To Log</Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                          <LinearGradient
                            colors={['#0A0A0A', '#1A1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 10, marginLeft: 8 }}
                          >
                            <TouchableOpacity
                              onPress={() =>
                                importScheduleToPlanner([
                                  {
                                    date: format(new Date(), 'yyyy-MM-dd'),
                                    warmUp: (h.payload?.warmUp || []) as string[],
                                    mainSet: (h.payload?.mainSet || []) as string[],
                                    coolDown: (h.payload?.coolDown || []) as string[],
                                    type: detectActivityTypeFromLines(
                                      ((h.payload?.mainSet || []) as string[]).concat(
                                        (h.payload?.warmUp || []) as string[],
                                        (h.payload?.coolDown || []) as string[]
                                      )
                                    ) || 'Gym',
                                  },
                                ])
                              }
                              style={[styles.historyBtn, { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                            >
                              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                                <Text style={styles.historyBtnText}>To Schedule</Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                        </>
                      )}
                      {h.type === 'Schedule' && (
                        <>
                          <LinearGradient
                            colors={['#0A0A0A', '#1A1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 10 }}
                          >
                            <TouchableOpacity
                              onPress={() => importScheduleToPlanner(h.payload as ScheduleDay[])}
                              style={[styles.historyBtn, { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                            >
                              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                                <Text style={styles.historyBtnText}>Import All</Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                        </>
                      )}
                      {h.type === 'Nutrition' && (
                        <LinearGradient
                          colors={['#0A0A0A', '#1A1A1A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ borderRadius: 10 }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              setView('Nutrition')
                              setNutrition(h.payload as NutritionPlan)
                              setWorkout(null)
                              setSchedule([])
                            }}
                            style={[styles.historyBtn, { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }]}
                          >
                            <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                              <Text style={styles.historyBtnText}>Open</Text>
                            </View>
                          </TouchableOpacity>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Info note for ad tiers */}
          {showAdBadge && (
            <Text style={{ color: '#777', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
              Tip: Upgrade to Premium+ for ad-free, fully personalized plans and saved history.
            </Text>
          )}

          <View style={{ height: 120 }} />
          
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

// ——— Device-adaptive corner radius to match iPhone screen curvature ———
// Calibrated around ~10.5% of screen width in points (≈46pt on iPhone 16 Pro Max @ 440pt width)
const { width: SCREEN_W } = Dimensions.get('window')
const DEVICE_CORNER_RADIUS = Platform.OS === 'ios' ? Math.round(SCREEN_W * 0.105) : 20

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  // Sticky header (bolder hero)
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 22,
    zIndex: 20,
    borderBottomLeftRadius: DEVICE_CORNER_RADIUS,
    borderBottomRightRadius: DEVICE_CORNER_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  headerKicker: { color: '#F0E6C8', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.9 },
  headerSubtitle: { color: '#E6E2D6', marginTop: 6, fontSize: 13, lineHeight: 18, maxWidth: 280, opacity: 0.88 },
  tierPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#0E0E0EAA',
    borderWidth: 1,
    borderColor: '#C9A74A33',
  },
  tierPillText: { color: '#F0E6C8', fontWeight: '800', fontSize: 12, marginLeft: 6 },
  headerGoldVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerSparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },

  container: { padding: 18, paddingTop: 100, paddingBottom: 130 },

  // Tabs (segmented control feel)
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#F4F5F6',
    marginBottom: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center' },
  tabActive: { backgroundColor: '#111315' },
  tabText: { color: '#61666B', fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },

  // Text + input
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0D0F12', marginBottom: 12, letterSpacing: -0.2 },
  input: {
    backgroundColor: '#FBFBFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3E6EA',
    color: '#0D0F12',
    fontSize: 16,
    marginBottom: 12,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E6EAEE'
  },
  chipText: { color: '#0D0F12', fontWeight: '700', fontSize: 12 },
  scheduleControlsRow: { flexDirection: 'row', marginBottom: 8 },
  controlLabel: { fontSize: 12, fontWeight: '800', color: '#5E5E5E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  dateScroller: {
    paddingVertical: 6,
    paddingRight: 2,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E6EA',
    backgroundColor: '#FBFBFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 64,
  },
  dateChipActive: {
    backgroundColor: '#F0E6C8',
    borderColor: '#D9C58A',
  },
  dateChipTextSmall: {
    color: '#5E5E5E',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dateChipTextLarge: {
    color: '#0D0F12',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },

  skeletonCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, borderColor: '#E6EAEE', borderWidth: 1, marginBottom: 20, opacity: 0.9 },
  skelBar: { height: 14, backgroundColor: '#EEF1F5', borderRadius: 8, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardHeaderText: { marginLeft: 8, fontWeight: '900', color: '#0D0F12', fontSize: 16, letterSpacing: -0.2 },

  // Result cards (floating look + border)
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderColor: '#E6EAEE',
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  resultTitle: { fontWeight: '900', fontSize: 16, marginBottom: 8, color: '#0D0F12', letterSpacing: -0.2 },
  resultText: { fontSize: 15, color: '#1E2126', marginBottom: 6 },
  scheduleBlock: { marginBottom: 8 },

  // Action buttons inside cards
  actionBtn: {
    backgroundColor: '#0F141900', // transparent, gradient applied in render
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 10,
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800' },

  // History small buttons
  historyBtn: {
    backgroundColor: '#11131500', // transparent, gradient applied in render
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 10,
    borderWidth: 0,
    borderColor: 'transparent'
  },
  historyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  footerCtaWrap: { marginBottom: 10, marginTop: 10 },
  footerCta: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  footerCtaText: { color: '#FFF', fontWeight: '900', letterSpacing: 0.2 },
})