// lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, subDays } from 'date-fns'
import Constants from 'expo-constants'
import { getCurrentUser } from './getCurrentUser'


// 1) initialize Supabase
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL as string
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY as string
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const match = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)
if (!match) throw new Error('Invalid SUPABASE_URL')
const PROJECT_REF = match[1]

// ————————————————————————————————————————————————————————————————————————————————
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
  const system = `
You’re a certified fitness coach. Always return JSON with:
{
  "warmUp": [string, …],
  "mainSet": [string, …],
  "coolDown": [string, …]
}
All values should be string arrays.
`
  const txt = await chatCompletion(system, prompt)
  const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  return json
}

export async function generateSchedule(prompt: string) {
  const system = `You’re a certified fitness coach. Return JSON { "plan": [ … ] } with date, warmUp, mainSet, coolDown.`
  const txt = await chatCompletion(system, prompt)
  const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  return obj.plan || []
}

export async function generateNutrition(prompt: string) {
  const system = `You’re a registered dietitian. Return JSON with breakfast, lunch, dinner, ingredients.`
  const txt = await chatCompletion(system, prompt)
  const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  return obj
}