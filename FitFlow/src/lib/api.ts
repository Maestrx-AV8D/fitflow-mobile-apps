// lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, subDays } from 'date-fns'
import Constants from 'expo-constants'
import { ScheduleDay } from './utils/CoachTypes'

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

// export async function generateWorkout(prompt: string) {
//   const activity = detectActivity(prompt)
//   const system = `
// You’re a certified fitness coach.
// Tailor the workout for activity: "${activity}".
// Always return JSON with:
// {
//   "activity": "Gym|Run|Swim|Cycle|Other",
//   "warmUp": [string, …],
//   "mainSet": [string, …],
//   "coolDown": [string, …]
// }
// All values must be present. Keep lists concise (3–8 items each).`
//   const txt = await chatCompletion(system, prompt)
//   const obj = safeExtractJSON(txt)
//   if (obj) {
//     // Ensure activity is set
//     obj.activity = obj.activity || activity
//     return obj
//   }
//   // Minimal fallback
//   return {
//     activity,
//     warmUp: ['5–10 min easy prep'],
//     mainSet: ['20–30 min steady work'],
//     coolDown: ['5–10 min easy finish']
//   }
// }

// export async function generateSchedule(prompt: string) {
//   const activity = detectActivity(prompt)
//   const system = `
// You’re a certified fitness coach.
// Create a schedule for activity: "${activity}" only.
// HARD RULES:
// - Maximum length: 14 days total.
// - Output strictly valid JSON with this shape:
//   {
//     "plan": [
//       {
//         "date": "YYYY-MM-DD",
//         "activity": "Gym|Run|Swim|Cycle|Other",
//         "warmUp": [string, ...],
//         "mainSet": [string, ...],
//         "coolDown": [string, ...],
//         "notes": string
//       }
//     ]
//   }
// - "date" must be calendar dates in ISO "YYYY-MM-DD" (British users will see local format later).
// - "activity" MUST be "${activity}" for every item.
// - Keep items concise and actionable.`
//   const userPrompt = `${prompt}

// Please generate at most 14 days. If the request exceeds 14 days, summarise to fit within 14 days.`

//   // First attempt
//   let txt = await chatCompletion(system, userPrompt)
//   let obj = safeExtractJSON(txt)

//   // Retry once with stricter instruction if needed
//   if (!obj?.plan) {
//     const strictSystem = system + '\nReturn ONLY the JSON. No prose.'
//     txt = await chatCompletion(strictSystem, userPrompt)
//     obj = safeExtractJSON(txt)
//   }

//   // Fallback if still no plan
//   if (!obj?.plan) {
//     const today = new Date()
//     const iso = (d: Date) => d.toISOString().slice(0,10)
//     const fallback = Array.from({ length: 7 }).map((_, i) => {
//       const d = new Date(today)
//       d.setDate(today.getDate() + i)
//       return {
//         date: iso(d),
//         activity,
//         warmUp: ['5–10 min easy prep'],
//         mainSet: ['20–30 min steady work'],
//         coolDown: ['5–10 min easy finish'],
//         notes: 'Auto-generated fallback'
//       }
//     })
//     return clampTo14Days(fallback)
//   }

//   // Normalise
//   const plan = Array.isArray(obj.plan) ? obj.plan : []
//   const normalised = plan.map((it: any, idx: number) => {
//     const d = it?.date ? new Date(it.date) : new Date()
//     const iso = isNaN(+d) ? new Date() : d
//     return {
//       date: new Date(iso).toISOString().slice(0,10),
//       activity: (it?.activity as Activity) || activity,
//       warmUp: Array.isArray(it?.warmUp) ? it.warmUp : [],
//       mainSet: Array.isArray(it?.mainSet) ? it.mainSet : [],
//       coolDown: Array.isArray(it?.coolDown) ? it.coolDown : [],
//       notes: typeof it?.notes === 'string' ? it.notes : ''
//     }
//   })

//   return clampTo14Days(normalised)
// }

// export async function generateNutrition(prompt: string) {
//   const system = `You’re a registered dietitian. Return JSON with breakfast, lunch, dinner, ingredients.`
//   const txt = await chatCompletion(system, prompt)
//   const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
//   return obj
// }

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


//--------------------------


export type NutritionPlanRaw = {
  answer?: string;
  breakfast?: string[] | any;
  lunch?: string[] | any;
  dinner?: string[] | any;
  snacks?: string[] | any;
  ingredients?: string[] | Record<string, any>;
};

export type ProfileContext = Partial<{
  age: number;
  gender: string;
  goals: string;
  fitness_level: string;
  weight_kg: number;
  height_cm: number;
}>;

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
function safeJSON<T = any>(str: string): T | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function nonEmptyLines(arr: any): string[] {
  if (!arr) return [];
  if (Array.isArray(arr)) {
    return arr
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
  }
  return [];
}

///---
// const s = (v: any) => (v == null ? "" : String(v).trim());

// turns {name, sets, reps} into "Name: sets×reps" (e.g. "Bench Press: 3×10")
function fmtSetRow(row: any): string {
  const name = s(row?.name);
  const sets = s(row?.sets) || s(row?.set) || s(row?.setsCount);
  const reps = s(row?.reps) || s(row?.rep) || s(row?.repsCount);
  if (!name) return "";
  if (sets && reps) return `${name}: ${sets}×${reps}`;
  return name;
}

function asStringArray(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.map((v) => s(v)).filter(Boolean);
  return [s(x)].filter(Boolean);
}

function coerceNumberish(v: any): string {
  if (v == null) return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : s(v);
}

// Normalize a single day coming from the model into our ScheduleDay
function normalizeDay(d: any): ScheduleDay {
  const type: ScheduleDay["type"] =
    (s(d?.type).charAt(0).toUpperCase() + s(d?.type).slice(1)) as any;

  // Gym-style arrays may be objects; convert to "Name: S×R" strings
  const normPart = (part: any) => {
    const arr = Array.isArray(part) ? part : [];
    // Accept either ["...", "..."] or [{name, sets, reps}, ...]
    if (arr.length && typeof arr[0] === "object") {
      return arr.map(fmtSetRow).filter(Boolean);
    }
    return asStringArray(arr);
  };

  const warmUp = normPart(d?.warmUp);
  const mainSet = normPart(d?.mainSet);
  const coolDown = normPart(d?.coolDown);

  const out: ScheduleDay = {
    date: '',
    type: (type && ["Gym", "Run", "Swim", "Cycle", "Other"].includes(type) ? type : undefined) as any,
    warmUp,
    mainSet,
    coolDown,
  };

  // Cardio metadata
  const duration = d?.duration ?? d?.time;
  const distance = d?.distance ?? d?.dist;

  if (out.type === "Swim" || s(d?.laps) || s(d?.poolLength)) {
    out.type = "Swim";
    //out.laps = coerceNumberish(d?.laps);
    //out.poolLength = coerceNumberish(d?.poolLength);
    out.time = coerceNumberish(duration);
  } else if (out.type === "Run" || out.type === "Cycle" || out.type === "Other") {
    out.time = coerceNumberish(duration);
    out.distance = coerceNumberish(distance);
  } else if (!out.type) {
    // If type missing but we have any of the gym arrays, assume Gym
    if (warmUp.length + mainSet.length + coolDown.length > 0) out.type = "Gym";
  }

  return out;
}

function normalizeDays(parsed: any): ScheduleDay[] {
  const raw = Array.isArray(parsed?.schedule) ? parsed.schedule : (Array.isArray(parsed) ? parsed : []);
  return raw
    .map(normalizeDay)
    .filter(
      (d) =>
        d.warmUp.length + d.mainSet.length + d.coolDown.length > 0 ||
        !!(d.time || d.distance || d.laps || d.poolLength)
    );
}

//---

// function fallbackWorkout(): Workout {
//   return {
//     warmUp: ["5 min easy cardio", "Dynamic mobility (hips/shoulders)"],
//     mainSet: [
//       "Back Squat — 3×8",
//       "Bench Press — 4×6",
//       "Row — 3×10",
//       "Plank — 3×30s",
//     ],
//     coolDown: ["5–8 min stretching", "Easy walk"],
//     description:
//       "Balanced compound focus with light core and mobility to finish.",
//   };
// }

// Build a short persona for Pro+AI
function buildPersona(ctx?: any): string {
  if (!ctx || !Object.keys(ctx).length) {
    return "No profile context provided. Keep plan broadly applicable.";
  }
  return `User profile — age: ${ctx.age ?? "?"}, gender: ${ctx.gender ?? "unspecified"}, goals: ${
    ctx.goals ?? "general fitness"
  }, level: ${ctx.fitness_level ?? "unknown"}, weight_kg: ${ctx.weight_kg ?? "?"}, height_cm: ${
    ctx.height_cm ?? "?"
  }.`;
}

// function fallbackSchedule(): ScheduleDay[] {
//   return [
//     {
//       warmUp: ["5 min easy cardio", "Dynamic mobility"],
//       mainSet: ["Squat 3×8", "RDL 3×10", "Split squat 3×10/leg", "Plank 3×30s"],
//       coolDown: ["Full-body stretch 5 min"],
//     },
//     {
//       warmUp: ["5–10 min easy jog"],
//       mainSet: ["Steady run 25–35 min"],
//       coolDown: ["Walk 5 min", "Calf stretch"],
//     },
//     {
//       warmUp: ["Band pull-aparts 2×15", "Shoulder circles"],
//       mainSet: ["Bench 4×6", "Row 3×10", "OH Press 3×8", "Curl 3×12"],
//       coolDown: ["Shoulder + thoracic stretch"],
//     },
//   ];
// }

function fallbackNutrition(): NutritionPlanRaw {
  return {
    answer:
      "High-protein day to support training, with simple meals and a small snack.",
    breakfast: ["Greek yogurt (1 cup) with berries (½ cup) & honey"],
    lunch: ["Chicken quinoa bowl — chicken, quinoa, greens, olive oil"],
    dinner: ["Salmon, sweet potato, and mixed vegetables"],
    snacks: ["Protein shake", "Handful of almonds"],
    ingredients: {
      "Greek yogurt": "1 cup",
      berries: "½ cup",
      honey: "1 tsp",
      chicken: "200 g",
      quinoa: "1 cup cooked",
      salmon: "150–200 g",
      "sweet potato": "1 medium",
      vegetables: "2 cups mixed",
      almonds: "¼ cup",
      "protein powder": "1 scoop",
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// OpenAI JSON call (kept simple so it works in Expo fetch)
async function callOpenAIJSON(system: string, user: string) {
  if (!OPENAI_KEY) throw new Error("OPENAI_KEY missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OPENAI_HTTP_${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const content =
    json?.choices?.[0]?.message?.content ||
    json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ||
    "";
  return typeof content === "string" ? content : JSON.stringify(content);
}


// ───────────────────────────────────────────────────────────────────────────────
// Generators
// export async function generateWorkout(
//   prompt: string,
//   ctx?: ProfileContext
// ): Promise<Workout> {
//   const persona =
//     ctx && Object.keys(ctx).length
//       ? `User profile — age: ${ctx.age ?? "?"}, gender: ${
//           ctx.gender ?? "unspecified"
//         }, goals: ${ctx.goals ?? "general fitness"}, level: ${
//           ctx.fitness_level ?? "unknown"
//         }, weight_kg: ${ctx.weight_kg ?? "?"}, height_cm: ${
//           ctx.height_cm ?? "?"
//         }.`
//       : "No profile context provided. Keep plan broadly applicable.";

//   const system = `You are a concise fitness coach. 
// Return STRICT JSON with keys: warmUp (string[]), mainSet (string[]), coolDown (string[]), description (string, optional).
// Bullet items should be short, e.g. "Bench Press — 4×6", "RDL — 3×10". No markdown, no extra keys.`;

//   const user = `${persona}
// Create a single-session workout. Keep it realistic and balanced.

// User request: ${prompt}`;

//   try {
//     const out = await callOpenAIJSON(system, user);
//     const parsed = safeJSON(out) as any;
//     const workout: Workout = {
//       warmUp: nonEmptyLines(parsed?.warmUp),
//       mainSet: nonEmptyLines(parsed?.mainSet),
//       coolDown: nonEmptyLines(parsed?.coolDown),
//       description:
//         typeof parsed?.description === "string" ? parsed.description.trim() : undefined,
//     };
//     if (
//       workout.warmUp.length + workout.mainSet.length + workout.coolDown.length >
//       0
//     ) {
//       return workout;
//     }
//   } catch {
//     // fall through
//   }
//   return fallbackWorkout();
// }

// export async function generateWorkout(
//   prompt: string,
//   ctx?: any
// ): Promise<Workout> {
//   const persona = buildPersona(ctx);
//   const system = `You are a strength & conditioning assistant.
// Return STRICT JSON, a single object describing ONE session.
// For Gym sessions: include warmUp, mainSet, coolDown as arrays of objects: { "name": string, "sets": number, "reps": number }.
// If it's not Gym (Run, Cycle, Swim, Other), include keys:
// - type: "Run"|"Cycle"|"Swim"|"Other"
// - For Run/Cycle/Other: { "duration": minutes, "distance": km }
// - For Swim: { "laps": number, "poolLength": meters, "duration": minutes }
// Never include explanations.`;

//   const user = `${persona}
// User request: ${prompt}
// Keep bullets short. No markdown. JSON only.`;

//   try {
//     const out = await callOpenAIJSON(system, user);
//     const parsed = safeJSON(out);
//     const day = normalizeDay(parsed);
//     // Convert to Workout shape (still compatible with your UI)
//     const w: Workout = {
//       warmUp: day.warmUp,
//       mainSet: day.mainSet,
//       coolDown: day.coolDown,
//       type: day.type,
//       time: day.time,
//       distance: day.distance,
//       //laps: day.laps,
//       //poolLength: day.poolLength,
//     };
//     if (
//       w.warmUp.length + w.mainSet.length + w.coolDown.length > 0 ||
//       w.time || w.distance  //|| w.laps || w.poolLength
//     ) {
//       return w;
//     }
//   } catch {
//     // fallthrough to fallback
//   }
//   return fallbackWorkout();
// }


// export async function generateSchedule(
//   prompt: string,
//   ctx?: ProfileContext
// ): Promise<ScheduleDay[] | { schedule: ScheduleDay[] } | string> {
//   const persona =
//     ctx && Object.keys(ctx).length
//       ? `User profile — age: ${ctx.age ?? "?"}, gender: ${
//           ctx.gender ?? "unspecified"
//         }, goals: ${ctx.goals ?? "general fitness"}, level: ${
//           ctx.fitness_level ?? "unknown"
//         }, weight_kg: ${ctx.weight_kg ?? "?"}, height_cm: ${
//           ctx.height_cm ?? "?"
//         }.`
//       : "No profile context provided. Keep plan broadly applicable.";

//   const system = `You are a planning assistant.
// Return STRICT JSON: an array of days, each with warmUp (string[]), mainSet (string[]), coolDown (string[]). No dates. No extra keys.`;

//   const user = `${persona}
// Build a short multi-day plan (max 14 days). Keep bullets short; no absolute dates.

// User request: ${prompt}`;

//   try {
//     const out = await callOpenAIJSON(system, user);
//     // Model may return either an array or { schedule: [...] }
//     const parsed = safeJSON(out) as any;
//     if (Array.isArray(parsed)) {
//       const days: ScheduleDay[] = parsed.map((d) => ({
//         warmUp: nonEmptyLines(d?.warmUp),
//         mainSet: nonEmptyLines(d?.mainSet),
//         coolDown: nonEmptyLines(d?.coolDown),
//       }));
//       if (days.some((d) => d.warmUp.length + d.mainSet.length + d.coolDown.length > 0))
//         return days;
//     }
//     if (parsed?.schedule && Array.isArray(parsed.schedule)) {
//       const days: ScheduleDay[] = parsed.schedule.map((d: any) => ({
//         warmUp: nonEmptyLines(d?.warmUp),
//         mainSet: nonEmptyLines(d?.mainSet),
//         coolDown: nonEmptyLines(d?.coolDown),
//       }));
//       if (days.length) return { schedule: days };
//     }
//   } catch {
//     // fall through
//   }
//   // As a last resort return a minimal, parseable fallback
//   return fallbackSchedule();
// }

export async function generateNutrition(
  prompt: string,
  ctx?: ProfileContext
): Promise<NutritionPlanRaw> {
  const persona =
    ctx && Object.keys(ctx).length
      ? `User profile — age: ${ctx.age ?? "?"}, gender: ${
          ctx.gender ?? "unspecified"
        }, goals: ${ctx.goals ?? "general fitness"}, level: ${
          ctx.fitness_level ?? "unknown"
        }, weight_kg: ${ctx.weight_kg ?? "?"}, height_cm: ${
          ctx.height_cm ?? "?"
        }.`
      : "No profile context provided. Keep plan broadly applicable.";

  const system = `You are a nutritionist. 
Return STRICT JSON with keys:
- answer (string, a short summary),
- breakfast (string[]), lunch (string[]), dinner (string[]), snacks (string[]),
- ingredients (object mapping item → portion OR a string[]).
No markdown. No extra keys.`;

  const user = `${persona}
Create a one-day nutrition plan. Brief, practical meals and a simple ingredient list.

User request: ${prompt}`;

  try {
    const out = await callOpenAIJSON(system, user);
    const parsed = safeJSON(out) as any;
    if (parsed && typeof parsed === "object") {
      const plan: NutritionPlanRaw = {
        answer:
          typeof parsed.answer === "string" ? parsed.answer.trim() : undefined,
        breakfast: nonEmptyLines(parsed.breakfast) as any,
        lunch: nonEmptyLines(parsed.lunch) as any,
        dinner: nonEmptyLines(parsed.dinner) as any,
        snacks: nonEmptyLines(parsed.snacks) as any,
        ingredients:
          parsed.ingredients && typeof parsed.ingredients === "object"
            ? parsed.ingredients
            : nonEmptyLines(parsed.ingredients),
      };
      // accept even partial results
      return plan;
    }
  } catch {
    // fall through
  }
  return fallbackNutrition()
}

// //----------
// // Put this type near your other types if not already present:
// // export type ScheduleDay = {
// //   date: string;
// //   warmUp: string[];
// //   mainSet: string[];
// //   coolDown: string[];
// //   type?: "Gym" | "Run" | "Swim" | "Cycle" | "Other" | undefined;
// //   time?: string | undefined;
// //   distance?: string | undefined;
// //   done?: boolean | undefined;
// // };

// // --- helpers for schedule shaping ---
// function normalizeActivityType(s?: string): ScheduleDay["type"] {
//   if (!s) return undefined;
//   const t = String(s).toLowerCase();
//   if (t.includes("run")) return "Run";
//   if (t.includes("swim")) return "Swim";
//   if (t.includes("cycle") || t.includes("bike")) return "Cycle";
//   if (t.includes("gym") || t.includes("lift") || t.includes("strength")) return "Gym";
//   return "Other";
// }

// function inferTypeFromLines(lines: string[]): ScheduleDay["type"] {
//   const txt = lines.join(" • ").toLowerCase();
//   if (/(run|jog|tempo|intervals)/.test(txt)) return "Run";
//   if (/(swim|laps|pool|freestyle|butterfly)/.test(txt)) return "Swim";
//   if (/(cycle|bike|watts|rpm)/.test(txt)) return "Cycle";
//   if (/(squat|bench|deadlift|press|row|db|barbell|machine)/.test(txt)) return "Gym";
//   return undefined;
// }

// function ensureScheduleShape(items: any[]): ScheduleDay[] {
//   return items
//     .map((d) => {
//       const warmUp = nonEmptyLines(d?.warmUp);
//       const mainSet = nonEmptyLines(d?.mainSet);
//       const coolDown = nonEmptyLines(d?.coolDown);

//       const declaredType = normalizeActivityType(d?.type);
//       const inferredType = inferTypeFromLines([...warmUp, ...mainSet, ...coolDown]);

//       const day: ScheduleDay = {
//         // leave empty; planner/import flow should assign actual dates
//         date: typeof d?.date === "string" ? d.date : "",
//         warmUp,
//         mainSet,
//         coolDown,
//         type: declaredType ?? inferredType,
//         time: typeof d?.time === "string" ? d.time.trim() : undefined,
//         distance: typeof d?.distance === "string" ? d.distance.trim() : undefined,
//         done: typeof d?.done === "boolean" ? d.done : false,
//       };
//       return day;
//     })
//     .filter(
//       (d) => d.warmUp.length + d.mainSet.length + d.coolDown.length > 0
//     );
// }

// // Update your fallback to emit ScheduleDay[]
// function fallbackSchedule(): ScheduleDay[] {
//   return [
//     {
//       date: "",
//       warmUp: ["5 min easy cardio", "Dynamic mobility"],
//       mainSet: ["Squat 3×8", "RDL 3×10", "Split squat 3×10/leg", "Plank 3×30s"],
//       coolDown: ["Full-body stretch 5 min"],
//       type: "Gym",
//       done: false,
//     },
//     {
//       date: "",
//       warmUp: ["5–10 min easy jog"],
//       mainSet: ["Steady run 25–35 min"],
//       coolDown: ["Walk 5 min", "Calf stretch"],
//       type: "Run",
//       time: "30–40 min",
//       done: false,
//     },
//     {
//       date: "",
//       warmUp: ["Band pull-aparts 2×15", "Shoulder circles"],
//       mainSet: ["Bench 4×6", "Row 3×10", "OH Press 3×8", "Curl 3×12"],
//       coolDown: ["Shoulder + thoracic stretch"],
//       type: "Gym",
//       done: false,
//     },
//   ];
// }

// // ───────────────────────────────────────────────────────────────────────────────
// // FIXED generateSchedule: now returns ScheduleDay-shaped objects
// // export async function generateSchedule(
// //   prompt: string,
// //   ctx?: ProfileContext
// // ): Promise<ScheduleDay[] | { schedule: ScheduleDay[] } | string> {
// //   const persona =
// //     ctx && Object.keys(ctx).length
// //       ? `User profile — age: ${ctx.age ?? "?"}, gender: ${
// //           ctx.gender ?? "unspecified"
// //         }, goals: ${ctx.goals ?? "general fitness"}, level: ${
// //           ctx.fitness_level ?? "unknown"
// //         }, weight_kg: ${ctx.weight_kg ?? "?"}, height_cm: ${
// //           ctx.height_cm ?? "?"
// //         }.`
// //       : "No profile context provided. Keep plan broadly applicable.";

// //   const system = `You are a planning assistant.
// // Return STRICT JSON as EITHER:
// // 1) an array of days, or
// // 2) an object { "schedule": Day[] }.

// // Each Day must include:
// // - warmUp: string[]
// // - mainSet: string[]
// // - coolDown: string[]
// // Optionally include:
// // - type: one of "Gym","Run","Swim","Cycle","Other"
// // - time: string
// // - distance: string
// // DO NOT add calendar dates. DO NOT include extra keys.`;

// //   const user = `${persona}
// // Build a short multi-day training plan (max 14 days). Keep bullets short; no absolute dates.

// // User request: ${prompt}`;

// //   try {
// //     const out = await callOpenAIJSON(system, user);
// //     const parsed = safeJSON(out) as any;

// //     if (Array.isArray(parsed)) {
// //       const days = ensureScheduleShape(parsed);
// //       if (days.length) return days;
// //     }

// //     if (parsed?.schedule && Array.isArray(parsed.schedule)) {
// //       const days = ensureScheduleShape(parsed.schedule);
// //       if (days.length) return { schedule: days };
// //     }
// //   } catch {
// //     // fall through
// //   }

// //   // Always return a valid shape
// //   return fallbackSchedule();
// // }

// export async function generateSchedule(
//   prompt: string,
//   ctx?: any
// ): Promise<ScheduleDay[]> {
//   const persona = buildPersona(ctx);
//   const system = `You are a planning assistant.
// Return STRICT JSON: EITHER an array of day objects OR { "schedule": [ ... ] }.
// Each day must include:
// - "type": "Gym"|"Run"|"Swim"|"Cycle"|"Other"
// - For type "Gym": "warmUp"|"mainSet"|"coolDown" as arrays of { "name": string, "sets": number, "reps": number }
// - For "Run"/"Cycle"/"Other": include { "duration": minutes, "distance": km } (numbers)
// - For "Swim": include { "laps": number, "poolLength": meters, "duration": minutes } (numbers)
// No dates. No extra commentary. JSON only.`;

//   const user = `${persona}
// Build a concise plan (max 14 days).
// User request: ${prompt}`;

//   try {
//     const out = await callOpenAIJSON(system, user);
//     const parsed = safeJSON(out);
//     const days = normalizeDays(parsed);
//     if (days.length) return days;
//   } catch {
//     // fallthrough
//   }
//   return fallbackSchedule();
// }


//--------------------------

// ==================== helpers (copy/paste) ====================

type SimpleDay = { warmUp: string[]; mainSet: string[]; coolDown: string[] };

const s = (v: any) => (v == null ? "" : String(v).trim());

function personify(ctx?: any) {
  if (!ctx || !Object.keys(ctx).length) return "";
  return `User profile — age: ${ctx.age ?? "?"}, gender: ${ctx.gender ?? "unspecified"}, goals: ${
    ctx.goals ?? "general fitness"
  }, level: ${ctx.fitness_level ?? "unknown"}, weight_kg: ${ctx.weight_kg ?? "?"}, height_cm: ${ctx.height_cm ?? "?"}.`;
}

// “- foo”, “• foo”, “1) foo” → “foo” ; “3 x 10” → “3×10”
function cleanLine(str: string): string {
  let t = s(str)
    .replace(/^\s*[-*•–—]\s*/u, "")      // bullets
    .replace(/^\s*\d+[.)]\s*/u, "")       // numbered lists
    .replace(/\b(\d+)\s*[xX×]\s*(\d+)\b/g, "$1×$2") // sets x reps
    .replace(/\s+/g, " ")
    .trim();
  // strip trailing punctuation-only lines
  if (/^[.\-–—•*]+$/.test(t)) t = "";
  return t;
}

function normPart(part: any): string[] {
  if (!part) return [];
  if (Array.isArray(part)) {
    // accept ["Bench 3x10", {...}] style
    return part
      .map((it) => {
        if (typeof it === "string") return cleanLine(it);
        if (it && typeof it === "object") {
          const name = s(it.name || it.exercise || it.title);
          const sets = s(it.sets || it.set || it.setsCount);
          const reps = s(it.reps || it.rep || it.repsCount);
          const extra = s(it.detail || it.notes || it.tempo || it.rest);
          if (!name) return "";
          if (sets && reps) return cleanLine(`${name} ${sets}×${reps}${extra ? ` (${extra})` : ""}`);
          return cleanLine(extra ? `${name} — ${extra}` : name);
        }
        return "";
      })
      .map(cleanLine)
      .filter(Boolean);
  }
  // if a single string blob, split by newlines / “;”
  return s(part)
    .split(/\n|;|•|·/g)
    .map(cleanLine)
    .filter(Boolean);
}

function ensureAtLeastOne(line: string, fallback: string[]): string[] {
  const out = normPart(line);
  return out.length ? out : fallback;
}

function parseDaysFromText(text: string): SimpleDay[] {
  // Split into blocks per day by blank line or "Day X" headers
  const blocks = s(text)
    .split(/\n\s*\n|(?:^|\n)\s*day\s*\d+[:.\-]?\s*(?=\n)/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const getSection = (block: string, label: RegExp) => {
    // capture lines after a header until next header or block end
    const regex = new RegExp(`${label.source}\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*[A-Za-z].{0,20}[:\\-]|$)`, "i");
    const m = block.match(regex);
    return m ? normPart(m[1]) : [];
  };

  const days: SimpleDay[] = blocks.map((b) => {
    const warmUp = getSection(b, /(warm[\s-]*up|warmup)/i);
    const main   = getSection(b, /(main|workout|session|sets?)\b/i);
    const down   = getSection(b, /(cool[\s-]*down|cooldown|finish|stretch)/i);

    // If no headers, treat whole block as main
    if (!warmUp.length && !main.length && !down.length) {
      const all = normPart(b);
      return { warmUp: [], mainSet: all, coolDown: [] };
    }
    return { warmUp, mainSet: main, coolDown: down };
  });

  return days.filter((d) => d.warmUp.length + d.mainSet.length + d.coolDown.length > 0);
}

function parseDaysFromJSON(obj: any): SimpleDay[] {
  const raw = Array.isArray(obj?.schedule) ? obj.schedule : (Array.isArray(obj) ? obj : null);
  if (!raw) {
    // Might be a single-day workout object
    if (obj && typeof obj === "object" && (obj.warmUp || obj.mainSet || obj.coolDown)) {
      return [{
        warmUp: normPart(obj.warmUp),
        mainSet: normPart(obj.mainSet),
        coolDown: normPart(obj.coolDown),
      }];
    }
    return [];
  }
  return raw
    .map((d) => ({
      warmUp: normPart(d?.warmUp),
      mainSet: normPart(d?.mainSet),
      coolDown: normPart(d?.coolDown),
    }))
    .filter((d) => d.warmUp.length + d.mainSet.length + d.coolDown.length > 0);
}

function fallbackWorkout(): SimpleDay {
  return {
    warmUp: ["5 min light cardio", "Dynamic mobility"],
    mainSet: ["Bench Press 4×6", "Row 3×10", "Shoulder Press 3×8", "Curl 3×12"],
    coolDown: ["Full-body stretch 5 min"],
  };
}
function fallbackSchedule(): SimpleDay[] {
  return [
    {
      warmUp: ["5–10 min easy jog", "Dynamic leg swings"],
      mainSet: ["Intervals: 6 × 2 min hard / 2 min easy"],
      coolDown: ["5–10 min walk", "Light calf stretch"],
    },
    {
      warmUp: ["Bike 5 min", "Band Pull-Apart 2×15"],
      mainSet: ["Back Squat 3×5", "RDL 3×8", "Split Squat 3×10/leg"],
      coolDown: ["Quad stretch 60s"],
    },
    {
      warmUp: ["200m easy swim", "4 × 25m drill"],
      mainSet: ["6 × 100m aerobic, 30s rest"],
      coolDown: ["100m backstroke easy"],
    },
  ];
}

// ==================== generators (drop-in) ====================

export async function generateWorkout(prompt: string, ctx?: any): Promise<SimpleDay> {
  const persona = personify(ctx);
  const system = `You are a training assistant.
Return STRICT JSON for ONE session with exactly these keys:
{ "warmUp": string[] , "mainSet": string[], "coolDown": string[] }
No prose, no markdown, no extra keys. Keep items short.`;

  const user = `${persona ? persona + "\n" : ""}User request: ${prompt}`;

  try {
    // Prefer JSON endpoint if you have one
    const raw = await callOpenAIJSON(system, user);
    const json = safeJSON(raw);
    let days = parseDaysFromJSON(json);
    if (days.length) return days[0];

    // Some models "pretend JSON" but return text
    const asText = typeof raw === "string" ? raw : JSON.stringify(json ?? raw);
    const textDays = parseDaysFromText(asText);
    if (textDays.length) return textDays[0];
  } catch {
    // ignore and fallback
  }
  return fallbackWorkout();
}

export async function generateSchedule(prompt: string, ctx?: any): Promise<SimpleDay[]> {
  const persona = personify(ctx);
  const system = `You are a planning assistant.
Return STRICT JSON: either an array of day objects OR { "schedule": [ ... ] }.
Each day MUST have exactly these keys:
{ "warmUp": string[] , "mainSet": string[], "coolDown": string[] }
No dates, no markdown, no commentary. Max 14 days.`;

  const user = `${persona ? persona + "\n" : ""}Build a concise plan (<=14 days).
User request: ${prompt}`;

  try {
    const raw = await callOpenAIJSON(system, user);
    const json = safeJSON(raw);
    let days = parseDaysFromJSON(json);
    if (days.length) return days;

    // If the model sent plain text, parse sections/blocks
    const asText = typeof raw === "string" ? raw : JSON.stringify(json ?? raw);
    const textDays = parseDaysFromText(asText);
    if (textDays.length) return textDays;
  } catch {
    // ignore and fallback
  }
  return fallbackSchedule();
}