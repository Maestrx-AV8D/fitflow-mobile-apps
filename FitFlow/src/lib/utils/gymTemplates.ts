// // // src/data/workoutTemplates.ts

// // // ---- Types used by templates (simple, UI-friendly) ----
// // export type PhaseKey = 'warmup' | 'main' | 'cooldown';

// // export type TemplateSet = {
// //   reps?: number | string;
// //   weight?: number | string;
// //   note?: string;
// // };

// // export type TemplateExercise = {
// //   name: string;
// //   /** Optional explicit sets (overrides scheme) */
// //   sets?: TemplateSet[];
// //   /** Optional scheme like "5x5", "3x8", etc. If sets omitted, this will expand into sets */
// //   scheme?: string;
// // };

// // export type TemplatePhase = {
// //   key: PhaseKey;
// //   title?: string;
// //   exercises: TemplateExercise[];
// // };

// // export type Template = {
// //   id: string;
// //   name: string;
// //   phases: TemplatePhase[];
// // };

// // // ---- Helper to expand "3x10" -> [{reps:'10'}, ...3 times] ----
// // function expandSchemeToSets(ex: TemplateExercise) {
// //   if (ex.sets?.length) return ex.sets;
// //   const m = ex.scheme?.match(/^\s*(\d+)\s*x\s*(\d+)\s*$/i);
// //   if (!m) return [{ reps: '' }]; // fallback: one blank set
// //   const [_, s, r] = m;
// //   const sets = Number(s);
// //   const reps = String(r);
// //   return Array.from({ length: sets }, () => ({ reps }));
// // }

// // // ---- Adapter: convert Template -> your Log "phases" shape ----
// // // This matches: Phase = { key, title, exercises: { name, sets: { reps, weight, completed? }[] }[] }
// // export function templateToPhases(tpl: Template) {
// //   const titleByKey: Record<PhaseKey, string> = {
// //     warmup: 'Warm Up',
// //     main: 'Main Set',
// //     cooldown: 'Cool Down',
// //   };

// //   const wantedOrder: PhaseKey[] = ['warmup', 'main', 'cooldown'];

// //   return wantedOrder.map((k) => {
// //     const p = tpl.phases.find((ph) => ph.key === k);
// //     const exercises =
// //       p?.exercises?.map((ex) => ({
// //         name: ex.name,
// //         sets: expandSchemeToSets(ex).map((s) => ({
// //           reps: s.reps != null ? String(s.reps) : '',
// //           weight: s.weight != null ? String(s.weight) : '',
// //           note: s.note ? String(s.note) : undefined,
// //           completed: false,
// //         })),
// //       })) ?? [];

// //     return {
// //       key: k,
// //       title: p?.title || titleByKey[k],
// //       exercises,
// //     };
// //   });
// // }

// // // ---- A curated set of Gym templates with phases ----
// // export const templates: Template[] = [
// //   {
// //     id: 'push',
// //     name: 'Push',
// //     phases: [
// //       {
// //         key: 'warmup',
// //         exercises: [
// //           { name: 'Band Pull-Apart', scheme: '2x15' },
// //           { name: 'PVC Shoulder Pass-Throughs', scheme: '2x10' },
// //         ],
// //       },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Bench Press', scheme: '5x5' },
// //           { name: 'Overhead Press', scheme: '3x8' },
// //           { name: 'Incline Dumbbell Press', scheme: '3x10' },
// //           { name: 'Lateral Raise', scheme: '3x15' },
// //           { name: 'Tricep Pushdown', scheme: '3x12' },
// //         ],
// //       },
// //       {
// //         key: 'cooldown',
// //         exercises: [
// //           { name: 'Chest Stretch', scheme: '2x30' },
// //           { name: 'Triceps Stretch', scheme: '2x30' },
// //         ],
// //       },
// //     ],
// //   },
// //   {
// //     id: 'pull',
// //     name: 'Pull',
// //     phases: [
// //       {
// //         key: 'warmup',
// //         exercises: [
// //           { name: 'Scapular Pull-Up', scheme: '2x10' },
// //           { name: 'Face Pull (light)', scheme: '2x15' },
// //         ],
// //       },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Pull-Up / Lat Pulldown', scheme: '4x8' },
// //           { name: 'Barbell Row', scheme: '4x8' },
// //           { name: 'Seated Cable Row', scheme: '3x12' },
// //           { name: 'Face Pull', scheme: '3x15' },
// //           { name: 'Bicep Curl', scheme: '3x12' },
// //         ],
// //       },
// //       {
// //         key: 'cooldown',
// //         exercises: [
// //           { name: 'Lat Stretch (bar hang)', scheme: '2x30' },
// //           { name: 'Biceps Stretch', scheme: '2x30' },
// //         ],
// //       },
// //     ],
// //   },
// //   {
// //     id: 'legs',
// //     name: 'Legs',
// //     phases: [
// //       {
// //         key: 'warmup',
// //         exercises: [
// //           { name: 'Air Squat', scheme: '2x10' },
// //           { name: 'Hip Hinge Drill', scheme: '2x10' },
// //         ],
// //       },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Back Squat', scheme: '5x5' },
// //           { name: 'Romanian Deadlift', scheme: '4x8' },
// //           { name: 'Leg Press', scheme: '3x12' },
// //           { name: 'Leg Curl', scheme: '3x12' },
// //           { name: 'Calf Raise', scheme: '4x12' },
// //         ],
// //       },
// //       {
// //         key: 'cooldown',
// //         exercises: [
// //           { name: 'Quad Stretch', scheme: '2x30' },
// //           { name: 'Hamstring Stretch', scheme: '2x30' },
// //         ],
// //       },
// //     ],
// //   },
// //   {
// //     id: 'upper',
// //     name: 'Upper Body',
// //     phases: [
// //       {
// //         key: 'warmup',
// //         exercises: [
// //           { name: 'Band External Rotation', scheme: '2x12' },
// //           { name: 'Scap Push-Up', scheme: '2x10' },
// //         ],
// //       },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Bench Press', scheme: '4x6' },
// //           { name: 'Pull-Up / Lat Pulldown', scheme: '4x8' },
// //           { name: 'Overhead Press', scheme: '3x8' },
// //           { name: 'Barbell Row', scheme: '3x10' },
// //           { name: 'Lateral Raise', scheme: '3x15' },
// //         ],
// //       },
// //       {
// //         key: 'cooldown',
// //         exercises: [{ name: 'Doorway Pec Stretch', scheme: '2x30' }],
// //       },
// //     ],
// //   },
// //   {
// //     id: 'lower',
// //     name: 'Lower Body',
// //     phases: [
// //       {
// //         key: 'warmup',
// //         exercises: [
// //           { name: 'Glute Bridge', scheme: '2x12' },
// //           { name: 'World’s Greatest Stretch', scheme: '2x5' },
// //         ],
// //       },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Back Squat', scheme: '5x5' },
// //           { name: 'Romanian Deadlift', scheme: '4x8' },
// //           { name: 'Walking Lunge', scheme: '3x20' },
// //           { name: 'Leg Curl', scheme: '3x12' },
// //           { name: 'Calf Raise', scheme: '4x12' },
// //         ],
// //       },
// //       {
// //         key: 'cooldown',
// //         exercises: [{ name: 'Pigeon Pose', scheme: '2x30' }],
// //       },
// //     ],
// //   },
// //   {
// //     id: 'full-5x5',
// //     name: 'Full Body (Strength 5×5)',
// //     phases: [
// //       { key: 'warmup', exercises: [{ name: 'Empty Bar Squat', scheme: '2x10' }] },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Back Squat', scheme: '5x5' },
// //           { name: 'Bench Press', scheme: '5x5' },
// //           { name: 'Barbell Row', scheme: '5x5' },
// //         ],
// //       },
// //       { key: 'cooldown', exercises: [] },
// //     ],
// //   },
// //   {
// //     id: 'full-balanced',
// //     name: 'Full Body (Balanced)',
// //     phases: [
// //       {
// //         key: 'warmup',
// //         exercises: [{ name: 'Rowing (light)', scheme: '1x5' }],
// //       },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Back Squat', scheme: '4x6' },
// //           { name: 'Bench Press', scheme: '4x6' },
// //           { name: 'Barbell Row', scheme: '3x8' },
// //           { name: 'Romanian Deadlift', scheme: '3x8' },
// //           { name: 'Plank', sets: [{ reps: '45s' }, { reps: '45s' }, { reps: '45s' }] },
// //         ],
// //       },
// //       { key: 'cooldown', exercises: [] },
// //     ],
// //   },
// //   {
// //     id: 'full-db',
// //     name: 'Full Body (Dumbbell Only)',
// //     phases: [
// //       { key: 'warmup', exercises: [{ name: 'Arm Circles', scheme: '2x15' }] },
// //       {
// //         key: 'main',
// //         exercises: [
// //           { name: 'Goblet Squat', scheme: '4x10' },
// //           { name: 'Dumbbell Bench Press', scheme: '4x10' },
// //           { name: 'One-Arm Dumbbell Row', scheme: '3x12' },
// //           { name: 'Dumbbell Romanian Deadlift', scheme: '3x12' },
// //           { name: 'Dumbbell Shoulder Press', scheme: '3x10' },
// //         ],
// //       },
// //       { key: 'cooldown', exercises: [] },
// //     ],
// //   },
// // ];

// // // quick lookup if you need it (by id or name)
// // export const getTemplate = (idOrName: string) =>
// //   templates.find(
// //     (t) =>
// //       t.id.toLowerCase() === idOrName.toLowerCase() ||
// //       t.name.toLowerCase() === idOrName.toLowerCase()
// //   );

// // src/lib/utils/gymTemplates.ts

// export type PhaseId = "Warm-Up" | "Main Set" | "Cool-Down" | string;

// export type SetSeed = {
//   reps: number | string;
//   weight?: number | string;   // keep optional; you can leave empty to fill in later
//   completed?: boolean;
// };

// export type ExerciseSeed =
//   | string
//   | {
//       name: string;
//       sets?: SetSeed[];       // if omitted, we'll default to 3×10 (no weight)
//     };

// export type Template = {
//   name: string;
//   // If phases are present, your Log can show Warm-Up / Main Set / Cool-Down sections.
//   phases?: {
//     id?: PhaseId;
//     title?: string;
//     exercises: ExerciseSeed[];
//   }[];
//   // If phases are omitted, Log will treat these as the “Main Set”.
//   exercises?: ExerciseSeed[];
//   tags?: string[];
//   level?: "Beginner" | "Intermediate" | "Advanced";
// };

// // —— helpers to feed Log’s reducer shape ————————————————
// // Log reducer wants: { name: string; sets: { reps: string; weight: string; completed?: boolean }[] }[]
// export type ReducerExercise = { name: string; sets: { reps: string; weight: string; completed?: boolean }[] };

// const toReducerExercise = (seed: ExerciseSeed): ReducerExercise => {
//   const name = typeof seed === "string" ? seed : seed.name;

//   // default if no sets provided
//   const defaultSets: SetSeed[] = [
//     { reps: 10, weight: "" },
//     { reps: 10, weight: "" },
//     { reps: 10, weight: "" },
//   ];

//   const seeds = typeof seed === "string" ? defaultSets : seed.sets?.length ? seed.sets : defaultSets;

//   return {
//     name,
//     sets: seeds.map((s) => ({
//       reps: String(s.reps ?? ""),
//       weight: String(s.weight ?? ""),
//       completed: s.completed ?? false,
//     })),
//   };
// };

// /** Single list (no phases) -> reducer payload */
// export const toExerciseList = (t: Template): ReducerExercise[] => {
//   const list = t.exercises ?? [];
//   return list.map(toReducerExercise);
// };

// /** Phases -> reducer payload grouped by phase (for Warm-Up / Main Set / Cool-Down UIs) */
// export const toPhasedExerciseLists = (t: Template) => {
//   if (!t.phases?.length) return null;
//   return t.phases.map((p) => ({
//     id: (p.id ?? "Main Set") as PhaseId,
//     title: p.title ?? p.id ?? "Main Set",
//     exercises: p.exercises.map(toReducerExercise),
//   }));
// };

// // —— TEMPLATES ————————————————————————————————————————————————
// // A few good starters with sets & reps included. Feel free to tweak.
// export const templates: Template[] = [
//   {
//     name: "Full Body (Balanced)",
//     phases: [
//       {
//         id: "Warm-Up",
//         title: "Warm up",
//         exercises: [
//           { name: "Bike", sets: [{ reps: 5, weight: "" }] },     // minutes as reps for warmups is fine
//           { name: "Hip Hinge Drill", sets: [{ reps: 12 }] },
//         ],
//       },
//       {
//         id: "Main Set",
//         title: "Main set",
//         exercises: [
//           { name: "Back Squat", sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }] },
//           { name: "Bench Press", sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }] },
//           { name: "Barbell Row", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//           { name: "Romanian Deadlift", sets: [{ reps: 10 }, { reps: 10 }] },
//           { name: "Plank", sets: [{ reps: 60 }, { reps: 60 }] },  // seconds as reps is okay
//         ],
//       },
//       {
//         id: "Cool-Down",
//         title: "Cool down",
//         exercises: [
//           { name: "Walk", sets: [{ reps: 5 }] },
//           { name: "Hamstring Stretch", sets: [{ reps: 30 }, { reps: 30 }] },
//         ],
//       },
//     ],
//   },

//   {
//     name: "Upper Body",
//     phases: [
//       {
//         id: "Warm-Up",
//         title: "Warm up",
//         exercises: [
//           { name: "Band Pull-Apart", sets: [{ reps: 15 }, { reps: 15 }] },
//           { name: "Scap Push-Up", sets: [{ reps: 12 }] },
//         ],
//       },
//       {
//         id: "Main Set",
//         title: "Main set",
//         exercises: [
//           { name: "Bench Press", sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }] },
//           { name: "Pull-Up / Lat Pulldown", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//           { name: "Overhead Press", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//           { name: "Barbell Row", sets: [{ reps: 10 }, { reps: 10 }] },
//           { name: "Lateral Raise", sets: [{ reps: 15 }, { reps: 15 }] },
//         ],
//       },
//       {
//         id: "Cool-Down",
//         title: "Cool down",
//         exercises: [{ name: "Doorway Chest Stretch", sets: [{ reps: 30 }, { reps: 30 }] }],
//       },
//     ],
//   },

//   // Simple list versions (auto goes to Main Set in Log)
//   {
//     name: "Push",
//     exercises: [
//       { name: "Bench Press", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//       { name: "Overhead Press", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//       { name: "Incline Dumbbell Press", sets: [{ reps: 10 }, { reps: 10 }] },
//       { name: "Lateral Raise", sets: [{ reps: 15 }, { reps: 15 }] },
//       { name: "Tricep Pushdown", sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
//     ],
//   },
//   {
//     name: "Pull",
//     exercises: [
//       { name: "Pull-Up / Lat Pulldown", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//       { name: "Barbell Row", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//       { name: "Seated Cable Row", sets: [{ reps: 12 }, { reps: 12 }] },
//       { name: "Face Pull", sets: [{ reps: 15 }, { reps: 15 }] },
//       { name: "Bicep Curl", sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
//     ],
//   },
//   {
//     name: "Legs",
//     exercises: [
//       { name: "Back Squat", sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }] },
//       { name: "Romanian Deadlift", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
//       { name: "Leg Press", sets: [{ reps: 12 }, { reps: 12 }] },
//       { name: "Leg Curl", sets: [{ reps: 12 }, { reps: 12 }] },
//       { name: "Calf Raise", sets: [{ reps: 15 }, { reps: 15 }] },
//     ],
//   },
// ];




// /lib/utils/gymTemplates.ts (adjust path to match your project)
export type TemplateExercise =
  | string
  | {
      name: string;
      sets?: {
        reps?: number | string;
        weight?: number | string;
        completed?: boolean;
      }[];
    };

export type TemplatePhase = {
  id?: "Warm-Up" | "Main Set" | "Cool-Down" | string; // Log maps by id/title text
  title?: string;
  exercises: TemplateExercise[];
};

export type Template = {
  name: string;
  // Option A: just list exercises → Log drops them into "Main Set"
  exercises?: TemplateExercise[];
  // Option B: provide phases → Log uses Warm-Up/Main Set/Cool-Down as-is
  phases?: TemplatePhase[];
};

// --- preview helpers ---
const exName = (ex: TemplateExercise) =>
  typeof ex === "string" ? ex : ex.name;

const summarize = (names: string[], max = 3) =>
  names.length === 0
    ? "—"
    : names.slice(0, max).join(", ") +
      (names.length > max ? ` +${names.length - max} more` : "");

export function templatePreview(tpl: Template): string {
  // Prefer Main Set if phases exist, fall back sensibly
  if (tpl.phases?.length) {
    const main =
      tpl.phases.find((p) => /main/i.test(p.id ?? p.title ?? "")) ??
      tpl.phases[0];

    const mainNames = (main?.exercises ?? []).map(exName);
    if (mainNames.length) return summarize(mainNames);

    const all = tpl.phases.flatMap((p) => p.exercises.map(exName));
    return summarize(all);
  }

  // No phases: show first few exercise names
  const names = (tpl.exercises ?? []).map(exName);
  return summarize(names);
}

export const templates: Template[] = [
  // — Classic splits (with full phases) —
  {
    name: "Push",
    phases: [
      {
        id: "Warm-Up",
        exercises: [
          { name: "Band Pull-Apart", sets: [{ reps: 15 }, { reps: 15 }] },
          { name: "PVC Shoulder Pass-Through", sets: [{ reps: 12 }] },
        ],
      },
      {
        id: "Main Set",
        exercises: [
          {
            name: "Bench Press",
            sets: [
              { reps: 5 },
            ],
          },
          {
            name: "Overhead Press",
            sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }],
          },
          {
            name: "Incline Dumbbell Press",
            sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }],
          },
          {
            name: "Lateral Raise",
            sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }],
          },
          {
            name: "Tricep Pushdown",
            sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
          },
        ],
      },
      {
        id: "Cool-Down",
        exercises: [
          { name: "Chest Stretch", sets: [{ reps: 30 }] },
          { name: "Shoulder Stretch", sets: [{ reps: 30 }] },
        ],
      },
    ],
  },
  {
    name: "Pull",
    phases: [
      {
        id: "Warm-Up",
        exercises: [
          { name: "Scap Pull-Up", sets: [{ reps: 8 }, { reps: 8 }] },
          { name: "Face Pull (light)", sets: [{ reps: 15 }] },
        ],
      },
      {
        id: "Main Set",
        exercises: [
          {
            name: "Pull-Up / Lat Pulldown",
            sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }],
          },
          {
            name: "Barbell Row",
            sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }],
          },
          {
            name: "Seated Cable Row",
            sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
          },
          { name: "Face Pull", sets: [{ reps: 15 }, { reps: 15 }] },
          {
            name: "Bicep Curl",
            sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
          },
        ],
      },
      {
        id: "Cool-Down",
        exercises: [{ name: "Lat Stretch", sets: [{ reps: 30 }] }],
      },
    ],
  },
  {
    name: "Legs",
    phases: [
      {
        id: "Warm-Up",
        exercises: [
          { name: "Air Squat", sets: [{ reps: 10 }, { reps: 10 }] },
          { name: "Hip Opener", sets: [{ reps: 10 }] },
        ],
      },
      {
        id: "Main Set",
        exercises: [
          {
            name: "Back Squat",
            sets: [
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
            ],
          },
          {
            name: "Romanian Deadlift",
            sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }],
          },
          {
            name: "Leg Press",
            sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
          },
          {
            name: "Leg Curl",
            sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
          },
          { name: "Calf Raise", sets: [{ reps: 15 }, { reps: 15 }] },
        ],
      },
      {
        id: "Cool-Down",
        exercises: [{ name: "Quad/Hamstring Stretch", sets: [{ reps: 30 }] }],
      },
    ],
  },

  // — Upper / Lower —
  {
    name: "Upper Body",
    exercises: [
      "Bench Press",
      "Pull-Up / Lat Pulldown",
      "Overhead Press",
      "Barbell Row",
      "Lateral Raise",
    ], // falls into "Main Set"
  },
  {
    name: "Lower Body",
    exercises: [
      "Back Squat",
      "Romanian Deadlift",
      "Walking Lunge",
      "Leg Curl",
      "Calf Raise",
    ], // falls into "Main Set"
  },

  // — Full body —
  {
    name: "Full Body (Strength 5×5)",
    phases: [
      {
        id: "Main Set",
        exercises: [
          {
            name: "Back Squat",
            sets: [
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
            ],
          },
          {
            name: "Bench Press",
            sets: [
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
            ],
          },
          {
            name: "Barbell Row",
            sets: [
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
              { reps: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Full Body (Balanced)",
    exercises: [
      "Back Squat",
      "Bench Press",
      "Barbell Row",
      "Romanian Deadlift",
      "Plank",
    ], // main set fallback
  },
  {
    name: "Full Body (Dumbbell Only)",
    exercises: [
      "Goblet Squat",
      "Dumbbell Bench Press",
      "One-Arm Dumbbell Row",
      "Dumbbell Romanian Deadlift",
      "Dumbbell Shoulder Press",
    ],
  },
];
