export type Workout = {
  warmUp: string[];
  mainSet: string[];
  coolDown: string[];
  description?: string;
};

export type ScheduleDay = {
  date: string;
  warmUp: string[];
  mainSet: string[];
  coolDown: string[];
  type?: "Gym" | "Run" | "Swim" | "Cycle" | "Other";
  time?: string; // minutes or HH:MM for endurance sessions
  distance?: string; // km for run/cycle, m for swim
  done?: boolean;
};

export type NutritionPlan = {
  breakfast?: {
    name: string;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    notes: string;
  }[];
  lunch?: {
    name: string;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    notes: string;
  }[];
  dinner?: {
    name: string;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    notes: string;
  }[];
  ingredients?: string[];
  answer?: string;
};

export type NormalizedNutrition = {
    answer?: string;
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
    ingredients: string[];
  };



  // Build the param exactly like Schedule does (strings → exercise objects)
export function toExercises(lines: any[] = []) {
  return lines.map((item) => {
    if (typeof item === "string") {
      // Accept "Bench Press: 3x10 @ 40kg" or just "Bench Press"
      const [rawName, metaRaw] = item.split(":");
      const name = (rawName || "").trim();
      const meta = (metaRaw || "").trim();

      const repsMatch = meta.match(/(\d+)\s*[x×]\s*(\d+)/i);
      const reps = repsMatch ? Number(repsMatch[2]) : undefined;
      const weightMatch = meta.match(/@?\s*(\d+(?:\.\d+)?)\s*kg/i);
      const weight = weightMatch ? Number(weightMatch[1]) : undefined;

      return { name, sets: reps || weight ? [{ reps, weight }] : [] };
    }
    // If your AI produced objects { name, sets?, reps?, weight? }, normalize it:
    const r = Number(item.reps) || undefined;
    const w = Number(item.weight) || undefined;
    return { name: String(item.name || "").trim(), sets: r || w ? [{ reps: r, weight: w }] : [] };
  });
}

export function mapSegmentsForTypeFromWorkout(type: string, w: Workout) {
  // minimal non-gym mapping; extend if you add more fields
  if (type === "Swim") {
    return {
      laps: (w as any).laps || "",
      poolLength: (w as any).poolLength || "",
      time: (w as any).time || "",
    };
  }
  if (type === "Run" || type === "Walk" || type === "Cycle") {
    return {
      distance: (w as any).distance || "",
      duration: (w as any).time || "",
    };
  }
  // default "Other"
  const seg: any = { duration: (w as any).time || "" };
  if ((w as any).distance) seg.distance = (w as any).distance;
  return seg;
}