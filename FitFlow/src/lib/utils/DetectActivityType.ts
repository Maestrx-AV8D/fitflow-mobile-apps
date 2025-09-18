// Detect activity type from text lines (auto-detect main/fallback for schedule/workout)
  export function detectActivityTypeFromLines(
    lines: string[]
  ): "Gym" | "Run" | "Swim" | "Cycle" | "Other" | null {
    const hay = (lines || []).join(" ").toLowerCase();

    // Strong swim cues
    const swimWords = [
      "swim",
      "pool",
      "freestyle",
      "butterfly",
      "backstroke",
      "breaststroke",
      "laps in pool",
      "kickboard",
      "pull buoy",
    ];
    if (swimWords.some((w) => hay.includes(w))) return "Swim";

    // Strong run cues
    const runWords = [
      "run",
      "jog",
      "tempo",
      "intervals",
      "track workout",
      "easy run",
      "long run",
      "5k",
      "10k",
      "half marathon",
      "marathon",
    ];
    if (runWords.some((w) => hay.includes(w))) return "Run";

    // Strong cycle cues
    const cycleWords = [
      "cycle",
      "bike",
      "bicycle",
      "spindown",
      "spin class",
      "watt",
      "cadence",
      "peloton",
      "ftp",
    ];
    if (cycleWords.some((w) => hay.includes(w))) return "Cycle";

    // Gym / resistance cues
    const gymWords = [
      "bench press",
      "deadlift",
      "squat",
      "overhead press",
      "shoulder press",
      "lat pulldown",
      "row",
      "curl",
      "triceps",
      "dumbbell",
      "barbell",
      "machine",
      "reps",
      "sets",
      "superset",
      "hypertrophy",
      "strength",
      "leg press",
      "lunges",
      "hip thrust",
      "hamstring curl",
      "cable",
      "smith machine",
      "rack",
    ];
    if (gymWords.some((w) => hay.includes(w))) return "Gym";

    // Fallback "Other" if it's active wording but no clear category
    const activeWords = [
      "workout",
      "session",
      "warm-up",
      "cool down",
      "mobility",
      "yoga",
      "pilates",
      "stretch",
      "core",
      "hiit",
      "cardio",
    ];
    if (activeWords.some((w) => hay.includes(w))) return "Other";

    return null;
  }