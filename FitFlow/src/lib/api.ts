// lib/api.ts
import Constants from 'expo-constants'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { subDays, format } from 'date-fns'
import AsyncStorage from '@react-native-async-storage/async-storage'


// 1) initialize Supabase
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL as string
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY as string
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const match = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)
if (!match) throw new Error('Invalid SUPABASE_URL')
const PROJECT_REF = match[1]

// send the one-time code row and email it
export async function sendLoginCode(email: string) {
  const res = await fetch(
    `https://${PROJECT_REF}.functions.supabase.co/send-login-code`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        apikey:           SUPABASE_ANON_KEY,
        Authorization:   `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Error ${res.status}: ${text}`)
  }

  return
}

// verify code and sign in via RPC
export async function verifyLoginCode(email: string, code: string) {
  // check code table
  const { data: entry, error } = await supabase
    .from('login_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error || !entry) throw new Error('Invalid or expired code');

  // delete to prevent reuse
  await supabase.from('login_codes').delete().eq('id', entry.id);

  // mint session via RPC
  const { data, error: rpcErr } = await supabase.rpc('login_with_code', { p_email: email });
  if (rpcErr || !data?.session) throw rpcErr ?? new Error('Login failed');

  await supabase.auth.setSession(data.session);
}

console.log("Hitting Supabase at out", SUPABASE_URL)
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

export async function getUserName(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'Guest'
  // try profile table:
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()
  return profile?.full_name ?? user.email!.split('@')[0]
}

export async function getProfile(): Promise<{
  fullName: string
  age: string
  gender: string
  height: string
  weight: string
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,age,gender,height_cm,current_weight_kg')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  return {
    fullName: data.full_name || '',
    age: data.age?.toString() || '',
    gender: data.gender || '',
    height: data.height_cm?.toString() || '',
    weight: data.current_weight_kg?.toString() || '',
  }
}

export async function saveProfile(payload: {
  fullName: string
  age: string
  gender: string
  height: string
  weight: string
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
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updates, { onConflict: 'user_id' })

  if (error) throw error
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
    data,
    error,
  } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Total number of exercises completed across all entries */
export async function getExercisesCompleted(): Promise<number> {
  const { data, error } = await supabase
    .from('entries')
    .select('exercises')
  if (error || !data) throw error || new Error('Failed to load entries')
  return data.reduce((sum, entry) => sum + (entry.exercises?.length || 0), 0)
}

/** ISO date string of the most recent workout, or null if none */
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

// build last-7-days stacked data
export async function getLast7DaysWorkouts(): Promise<
  { day: string; Gym: number; Cycle: number; Other: number }[]
> {
  const entries = await getEntries()
  // prefill
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
// Read the schedule from device storage
export async function getSchedule(): Promise<
  Array<{ date: string; warmUp: string[]; mainSet: string[]; coolDown: string[]; done?: boolean }>
> {
  try {
    const raw = await AsyncStorage.getItem('smartSchedule')
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('Failed to load schedule', e)
    return []
  }
}

// Write the schedule back to device storage
export async function saveSchedule(
  plan: Array<{ date: string; warmUp: string[]; mainSet: string[]; coolDown: string[]; done?: boolean }>
): Promise<void> {
  try {
    await AsyncStorage.setItem('smartSchedule', JSON.stringify(plan))
  } catch (e) {
    console.warn('Failed to save schedule', e)
  }
}
// ————————————————————————————————————————————————————————————————————————————————
// OpenAI‐powered “SmartWorkout”
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

// export async function generateWorkout(prompt: string) {
//   const system = `You’re a certified fitness coach. Return JSON with keys "warmUp","mainSet","coolDown".`
//   const txt = await chatCompletion(system, prompt)
//   const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
//   return json as { warmUp: string[]; mainSet: string[]; coolDown: string[] };
// }

export async function generateWorkout(prompt: string) {
  const system = `
You’re a certified fitness coach.  When asked for a workout routine,
always reply with valid JSON **only**, and use this exact shape:
{
  "warmUp": [string, …],
  "mainSet": [string, …],
  "coolDown": [string, …]
}
Make sure each value is an array of strings—even if there’s only one item.
`;
  const txt = await chatCompletion(system, prompt);
  const json = JSON.parse(
    txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)
  ) as { warmUp: string[]; mainSet: string[]; coolDown: string[] };
  return json;
}

export async function generateSchedule(prompt: string) {
  const system = `You’re a certified fitness coach. Return JSON { "plan": [ … ] } each with date,warmUp,mainSet,coolDown.`
  const txt = await chatCompletion(system, prompt)
  const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  return obj.plan || []
}

export async function generateNutrition(prompt: string) {
  const system = `You’re a registered dietitian. Return JSON with breakfast,lunch,dinner,ingredients.`
  const txt = await chatCompletion(system, prompt)
  const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  return obj
}