// lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, subDays } from 'date-fns'
import Constants from 'expo-constants'

// 1) initialize Supabase
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL as string
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY as string
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const match = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)
if (!match) throw new Error('Invalid SUPABASE_URL')
const PROJECT_REF = match[1]

// ————————————————————————————————————————————————————————————————————————————————



export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
// Auth & Profile
export async function signIn(email: string, password: string) {
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data.user
}

export async function signUp(email: string, password: string) {
  const { error, data } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data.user
}

export async function getProfile(): Promise<{
  fullName: string
  age: string
  gender: string
  height: string
  weight: string
  goals: {
    goalType: string
    targetValue: string
    targetDate: string
  }
  is_premium: boolean
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,age,gender,height_cm,current_weight_kg, goals, is_premium')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  return {
    fullName: data.full_name || '',
    age: data.age?.toString() || '',
    gender: data.gender || '',
    height: data.height_cm?.toString() || '',
    weight: data.current_weight_kg?.toString() || '',
    goals: data.goals ?? { goalType: '', targetValue: '', targetDate: '' },
    is_premium: data.is_premium ?? false
  }
}

export async function saveProfile(payload: {
  fullName: string
  age: string
  gender: string
  height: string
  weight: string
  goals: {
    goalType: string
    targetValue: string
    targetDate: string
  }
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const updates = {
    user_id: user.id,
    full_name: payload.fullName,
    age: Number(payload.age),
    gender: payload.gender,
    height_cm: Number(payload.height),
    current_weight_kg: Number(payload.weight),
    goals: payload.goals,
    update_at: new Date()
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updates, { onConflict: 'user_id' })

  if (error) throw error
}

export async function getUserName(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) return ''
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  if (error || !data) {
    return user.name || 'User'
  }
  return data.full_name || 'User'
}

// ————————————————————————————————————————————————————————————————————————————————
// Entries & Stats
export async function getEntryCount(): Promise<number> {
  const {
    data,
    count,
    error,
  } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function getEntries(): Promise<any[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id) // 🔐 filter by current user
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}


/** Total number of exercises completed across all entries */
export async function getExercisesCompleted(): Promise<number> {
  const { data, error } = await supabase.from('entries').select('exercises')
  if (error || !data) throw error || new Error('Failed to load entries')
  return data.reduce((sum, entry) => sum + (entry.exercises?.length || 0), 0)
}

export async function getLatestWorkoutDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  if (error) throw error
  return data?.date ?? null
}

export async function getLast7DaysWorkouts(): Promise<
  { day: string; Gym: number; Cycle: number; Other: number }[]
> {
  const entries = await getEntries()
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i)
    return {
      day: format(d, 'EEE'),
      Gym: 0,
      Cycle: 0,
      Other: 0,
    }
  })

  entries.forEach((e: any) => {
    const label = format(new Date(e.date), 'EEE')
    const slot = week.find(w => w.day === label)
    if (!slot) return
    if (e.type === 'Gym') slot.Gym++
    else if (e.type === 'Cycle') slot.Cycle++
    else slot.Other++
  })

  return week
}

// ————————————————————————————————————————————————————————————————————————————————
// Schedule
export async function getSchedule(): Promise<
  { date: string; warmUp: string[]; mainSet: string[]; coolDown: string[]; done?: boolean }[]
> {
  try {
    const raw = await AsyncStorage.getItem('smartSchedule')
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('Failed to load schedule', e)
    return []
  }
}

export async function saveSchedule(
  plan: { date: string; warmUp: string[]; mainSet: string[]; coolDown: string[]; done?: boolean }[]
): Promise<void> {
  try {
    await AsyncStorage.setItem('smartSchedule', JSON.stringify(plan))
  } catch (e) {
    console.warn('Failed to save schedule', e)
  }
}

// ————————————————————————————————————————————————————————————————————————————————
// ——— Activity detection & JSON helpers ———
type Activity = 'Gym' | 'Run' | 'Swim' | 'Cycle' | 'Other'

function detectActivity(prompt: string): Activity {
  const p = prompt.toLowerCase()
  if (/\b(run|jog|intervals?|tempo|marathon|5k|10k|track)\b/.test(p)) return 'Run'
  if (/\b(swim|pool|laps?|freestyle|butterfly|breaststroke)\b/.test(p)) return 'Swim'
  if (/\b(cycle|bike|bicycle|spin|watt|cadence)\b/.test(p)) return 'Cycle'
  if (/\b(gym|strength|weights?|hypertrophy|deadlifts?|squats?|bench)\b/.test(p)) return 'Gym'
  return 'Other'
}

function clampTo14Days<T extends { date?: string }>(items: T[], startISO?: string): T[] {
  if (!items?.length) return []
  // Ensure we don't exceed 14 days from the first date (or provided start date)
  const start = startISO ? new Date(startISO) : new Date(items[0].date ?? Date.now())
  const limit = new Date(start)
  limit.setDate(limit.getDate() + 13)
  return items.filter(it => {
    const d = it.date ? new Date(it.date) : start
    return d <= limit
  })
}

function safeExtractJSON(text: string): any | null {
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

// OpenAI-powered “SmartWorkout”
const OPENAI_KEY = Constants.expoConfig?.extra?.OPENAI_KEY as string

async function chatCompletion(system: string, user: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const { choices } = await res.json()
  return choices[0].message.content
}

export async function generateWorkout(prompt: string) {
  const activity = detectActivity(prompt)
  const system = `
You’re a certified fitness coach.
Tailor the workout for activity: "${activity}".
Always return JSON with:
{
  "activity": "Gym|Run|Swim|Cycle|Other",
  "warmUp": [string, …],
  "mainSet": [string, …],
  "coolDown": [string, …]
}
All values must be present. Keep lists concise (3–8 items each).`
  const txt = await chatCompletion(system, prompt)
  const obj = safeExtractJSON(txt)
  if (obj) {
    // Ensure activity is set
    obj.activity = obj.activity || activity
    return obj
  }
  // Minimal fallback
  return {
    activity,
    warmUp: ['5–10 min easy prep'],
    mainSet: ['20–30 min steady work'],
    coolDown: ['5–10 min easy finish']
  }
}

export async function generateSchedule(prompt: string) {
  const activity = detectActivity(prompt)
  const system = `
You’re a certified fitness coach.
Create a schedule for activity: "${activity}" only.
HARD RULES:
- Maximum length: 14 days total.
- Output strictly valid JSON with this shape:
  {
    "plan": [
      {
        "date": "YYYY-MM-DD",
        "activity": "Gym|Run|Swim|Cycle|Other",
        "warmUp": [string, ...],
        "mainSet": [string, ...],
        "coolDown": [string, ...],
        "notes": string
      }
    ]
  }
- "date" must be calendar dates in ISO "YYYY-MM-DD" (British users will see local format later).
- "activity" MUST be "${activity}" for every item.
- Keep items concise and actionable.`
  const userPrompt = `${prompt}

Please generate at most 14 days. If the request exceeds 14 days, summarise to fit within 14 days.`

  // First attempt
  let txt = await chatCompletion(system, userPrompt)
  let obj = safeExtractJSON(txt)

  // Retry once with stricter instruction if needed
  if (!obj?.plan) {
    const strictSystem = system + '\nReturn ONLY the JSON. No prose.'
    txt = await chatCompletion(strictSystem, userPrompt)
    obj = safeExtractJSON(txt)
  }

  // Fallback if still no plan
  if (!obj?.plan) {
    const today = new Date()
    const iso = (d: Date) => d.toISOString().slice(0,10)
    const fallback = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return {
        date: iso(d),
        activity,
        warmUp: ['5–10 min easy prep'],
        mainSet: ['20–30 min steady work'],
        coolDown: ['5–10 min easy finish'],
        notes: 'Auto-generated fallback'
      }
    })
    return clampTo14Days(fallback)
  }

  // Normalise
  const plan = Array.isArray(obj.plan) ? obj.plan : []
  const normalised = plan.map((it: any, idx: number) => {
    const d = it?.date ? new Date(it.date) : new Date()
    const iso = isNaN(+d) ? new Date() : d
    return {
      date: new Date(iso).toISOString().slice(0,10),
      activity: (it?.activity as Activity) || activity,
      warmUp: Array.isArray(it?.warmUp) ? it.warmUp : [],
      mainSet: Array.isArray(it?.mainSet) ? it.mainSet : [],
      coolDown: Array.isArray(it?.coolDown) ? it.coolDown : [],
      notes: typeof it?.notes === 'string' ? it.notes : ''
    }
  })

  return clampTo14Days(normalised)
}

export async function generateNutrition(prompt: string) {
  const system = `You’re a registered dietitian. Return JSON with breakfast, lunch, dinner, ingredients.`
  const txt = await chatCompletion(system, prompt)
  const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  return obj
}

export function inferActivityFromText(text: string): 'Gym' | 'Run' | 'Swim' | 'Cycle' | 'Other' {
  return detectActivity(text)
}

export async function generateAIInsights(entryText: string, userName: string, userGoals: string) {
  const systemPrompt = `You are a journaling coach helping ${userName} achieve their goal: "${userGoals}".`;
  const userPrompt = `Entry: "${entryText}"`;

  const responseText = await chatCompletion(systemPrompt, userPrompt);
  return responseText;
}

export async function summarizeMoodAndTags(chatLog: string[]) {
  const systemPrompt = `You're a mood analysis assistant. Given a journal session log, return plain text summarizing the emotional tone and focus areas. summarise as a personal journal`;
  const userPrompt = chatLog.join("\n");

  const summary = await chatCompletion(systemPrompt, userPrompt);
  return summary;
}
