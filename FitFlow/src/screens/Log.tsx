// // Export FloatingWorkoutBar for global usage in navigator or other screens
// export { FloatingWorkoutBar };
// src/screens/Log.simplified.tsx — schema‑driven, compact Log screen
// Drop-in replacement for Log.tsx. Keeps features, removes ~60% of code via config.

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/api";
import {
  Template,
  templatePreview,
  templates,
} from "../lib/utils/gymTemplates";
import { useTheme } from "../theme/theme";

// ————————————————————————————————————————————————————————————————
// UI tokens
const UI = {
  PAD: 12,
  GAP: 10,
  BTN: 14,
  NOTES_H: 90,
};

type ImportedLogPayload = {
  type: ActivityType;
  notes?: string;
  customType?: string;
  // can be strings (template) or objects (smart import)
  exercises?: (
    | string
    | {
        name: string;
        sets?: {
          reps?: number | string;
          weight?: number | string;
          completed?: boolean;
        }[];
      }
  )[];
  // for non-gym, a flat bag that matches your FIELDS keys (e.g. distance, duration, pace...)
  segments?: Record<string, any>;
  date?: string; // ignored here but allowed
};

// Activity definitions
const TYPE_LIST = [
  "Gym",
  "Run",
  "Walk",
  "Cycle",
  "Swim",
  "Hike",
  "Row",
  // 'Elliptical',
  // 'Stair Master',
  "Yoga",
  "Football",
  "HIIT",
  "Other",
] as const;

type ActivityType = (typeof TYPE_LIST)[number];

type Field = {
  key: string;
  label: string;
  placeholder?: string;
  keyboard?: "default" | "numeric";
  half?: boolean; // if true, place two per row
};

// Schema for all non-gym activities
const FIELDS: Record<ActivityType, Field[]> = {
  Run: [
    {
      key: "distance",
      label: "Distance (km)",
      placeholder: "5",
      keyboard: "numeric",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "30 min", half: true },
    { key: "pace", label: "Pace", placeholder: "5:30 /km", half: true },
    {
      key: "surface",
      label: "Surface",
      placeholder: "road / trail",
      half: true,
    },
    {
      key: "hrAvg",
      label: "Avg HR (bpm)",
      placeholder: "152",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "calories",
      label: "Calories",
      placeholder: "420",
      keyboard: "numeric",
      half: true,
    },
  ],
  Walk: [
    {
      key: "distance",
      label: "Distance (km)",
      placeholder: "3",
      keyboard: "numeric",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "40 min", half: true },
    {
      key: "steps",
      label: "Steps",
      placeholder: "5000",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "surface",
      label: "Surface",
      placeholder: "park / treadmill",
      half: true,
    },
    {
      key: "calories",
      label: "Calories",
      placeholder: "220",
      keyboard: "numeric",
      half: true,
    },
  ],
  Cycle: [
    {
      key: "distance",
      label: "Distance (km)",
      placeholder: "20",
      keyboard: "numeric",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "20 min", half: true },
    {
      key: "avgSpeed",
      label: "Avg Speed (km/h)",
      placeholder: "26",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "elevationGain",
      label: "Elevation Gain (m)",
      placeholder: "350",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "bikeType",
      label: "Bike Type",
      placeholder: "road / MTB",
      half: true,
    },
    {
      key: "hrAvg",
      label: "Avg HR (bpm)",
      placeholder: "145",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "calories",
      label: "Calories",
      placeholder: "600",
      keyboard: "numeric",
      half: true,
    },
  ],
  Swim: [
    {
      key: "laps",
      label: "Laps",
      placeholder: "20",
      keyboard: "numeric",
      half: true,
    },
    { key: "time", label: "Time", placeholder: "45 min", half: true },
    { key: "stroke", label: "Stroke", placeholder: "freestyle", half: true },
    {
      key: "poolLength",
      label: "Pool Length (m)",
      placeholder: "25",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "calories",
      label: "Calories",
      placeholder: "500",
      keyboard: "numeric",
      half: true,
    },
  ],
  Hike: [
    {
      key: "distance",
      label: "Distance (km)",
      placeholder: "12",
      keyboard: "numeric",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "60 min", half: true },
    {
      key: "elevationGain",
      label: "Elevation Gain (m)",
      placeholder: "800",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "terrain",
      label: "Terrain",
      placeholder: "rocky / forest",
      half: true,
    },
    { key: "route", label: "Route / Trail", placeholder: "Ben Nevis CMD" },
    {
      key: "calories",
      label: "Calories",
      placeholder: "900",
      keyboard: "numeric",
      half: true,
    },
  ],
  Row: [
    {
      key: "distance",
      label: "Distance (m)",
      placeholder: "2000",
      keyboard: "numeric",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "8:10", half: true },
    {
      key: "spm",
      label: "SPM",
      placeholder: "28",
      keyboard: "numeric",
      half: true,
    },
    { key: "split500", label: "Split /500m", placeholder: "2:02", half: true },
    {
      key: "calories",
      label: "Calories",
      placeholder: "300",
      keyboard: "numeric",
      half: true,
    },
  ],
  Elliptical: [
    { key: "duration", label: "Duration", placeholder: "30 min", half: true },
    {
      key: "resistance",
      label: "Resistance",
      placeholder: "12",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "incline",
      label: "Incline",
      placeholder: "5",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "calories",
      label: "Calories",
      placeholder: "380",
      keyboard: "numeric",
      half: true,
    },
  ],
  "Stair Master": [
    {
      key: "level",
      label: "Level",
      placeholder: "8",
      keyboard: "numeric",
      half: true,
    },
    {
      key: "intervals",
      label: "Intervals",
      placeholder: "10 × 1:00/1:00",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "30 min", half: true },
    {
      key: "calories",
      label: "Calories",
      placeholder: "450",
      keyboard: "numeric",
      half: true,
    },
  ],
  Yoga: [
    {
      key: "style",
      label: "Style",
      placeholder: "vinyasa / hatha",
      half: true,
    },
    { key: "focus", label: "Focus", placeholder: "hips / back", half: true },
    {
      key: "difficulty",
      label: "Difficulty",
      placeholder: "easy / medium / hard",
      half: true,
    },
    { key: "duration", label: "Duration", placeholder: "45 min", half: true },
  ],
  Football: [
    {
      key: "context",
      label: "Context",
      placeholder: "match / training",
      half: true,
    },
    {
      key: "duration",
      label: "Duration(min)",
      placeholder: "60",
      keyboard: "numeric",
      half: true,
    },
    { key: "stats", label: "Stats", placeholder: "goals, assists…" },
    {
      key: "calories",
      label: "Calories",
      placeholder: "700",
      keyboard: "numeric",
      half: true,
    },
  ],
  HIIT: [
    {
      key: "rounds",
      label: "Rounds",
      placeholder: "10",
      keyboard: "numeric",
      half: true,
    },
    { key: "work", label: "Work", placeholder: ":40", half: true },
    { key: "rest", label: "Rest", placeholder: ":20", half: true },
    {
      key: "duration",
      label: "Duration (optional)",
      placeholder: "25 min",
      half: true,
    },
    { key: "movements", label: "Movements", placeholder: "burpees, bike, KB…" },
    {
      key: "calories",
      label: "Calories",
      placeholder: "450",
      keyboard: "numeric",
      half: true,
    },
  ],
  // Gym uses its own builder
  Gym: [],
  Other: [
    { key: "duration", label: "Duration", placeholder: "30 min", half: true },
    {
      key: "calories",
      label: "Calories (optional)",
      placeholder: "200",
      keyboard: "numeric",
      half: true,
    },
  ],
};

const TYPE_ICON: Record<ActivityType, React.ReactElement> = {
  Run: <MaterialCommunityIcons name="run" size={16} />,
  Walk: <Ionicons name="walk-outline" size={16} />,
  Cycle: <Ionicons name="bicycle" size={16} />,
  Swim: <MaterialCommunityIcons name="swim" size={16} />,
  Hike: <MaterialCommunityIcons name="walk" size={16} />,
  Row: <MaterialCommunityIcons name="rowing" size={16} />,
  // Elliptical: <Ionicons name="fitness-outline" size={16} />,
  // 'Stair Master': <MaterialCommunityIcons name="stairs" size={16} />,
  Yoga: <Ionicons name="leaf-outline" size={16} />,
  Football: <Ionicons name="football-outline" size={16} />,
  HIIT: <Ionicons name="flash-outline" size={16} />,
  Gym: <MaterialCommunityIcons name="dumbbell" size={16} />,
  Other: <Ionicons name="ellipsis-horizontal-circle-outline" size={16} />,
};

// ————————————————————————————————————————————————————————————————
// Small primitives
function Chip({
  active,
  onPress,
  children,
}: {
  active?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: active
          ? colors.primary
          : (colors as any).border || "#E5E5E5",
        backgroundColor: active ? colors.surface : colors.inputBackground,
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType }: any) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboardType}
      style={{
        backgroundColor: colors.inputBackground,
        color: colors.textPrimary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
      }}
    />
  );
}

// ————————————————————————————————————————————————————————————————
// Gym builder (lightweight)

type SetRow = { reps: string; weight: string; completed?: boolean };

type Exercise = { name: string; sets: SetRow[] };

type PhaseId = "Warm-Up" | "Main Set" | "Cool-Down" | string;
type Phase = { id: PhaseId; title: string; exercises: Exercise[] };

type PhaseAction =
  | { type: "reset"; payload: Phase[] }
  | { type: "addExercise"; phaseIdx: number; name?: string }
  | { type: "removeExercise"; phaseIdx: number; exIdx: number }
  | { type: "renameExercise"; phaseIdx: number; exIdx: number; name: string }
  | { type: "addSet"; phaseIdx: number; exIdx: number }
  | { type: "removeSet"; phaseIdx: number; exIdx: number; setIdx: number }
  | {
      type: "editSet";
      phaseIdx: number;
      exIdx: number;
      setIdx: number;
      field: "reps" | "weight";
      value: string;
    }
  | {
      type: "toggleCompleted";
      phaseIdx: number;
      exIdx: number;
      setIdx: number;
    };

const DEFAULT_PHASES: Phase[] = [
  {
    id: "Warm-Up",
    title: "Warm up",
    exercises: [],
  },
  {
    id: "Main Set",
    title: "Main set",
    exercises: [{ name: "", sets: [{ reps: "", weight: "" }] }],
  },
  { id: "Cool-Down", title: "Cool down", exercises: [] },
];

function phasesReducer(state: Phase[], action: PhaseAction): Phase[] {
  switch (action.type) {
    case "reset":
      return action.payload;

    case "addExercise": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      p.exercises = [
        ...p.exercises,
        { name: action.name || "", sets: [{ reps: "", weight: "" }] },
      ];
      next[action.phaseIdx] = p;
      return next;
    }

    case "removeExercise": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      p.exercises = p.exercises.filter((_, i) => i !== action.exIdx);
      next[action.phaseIdx] = p;
      return next;
    }

    case "renameExercise": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      p.exercises = p.exercises.map((ex, i) =>
        i === action.exIdx ? { ...ex, name: action.name } : ex
      );
      next[action.phaseIdx] = p;
      return next;
    }

    case "addSet": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      const ex = { ...p.exercises[action.exIdx] };
      ex.sets = [...ex.sets, { reps: "", weight: "" }];
      p.exercises = p.exercises.map((e, i) => (i === action.exIdx ? ex : e));
      next[action.phaseIdx] = p;
      return next;
    }

    case "removeSet": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      const ex = { ...p.exercises[action.exIdx] };
      ex.sets = ex.sets.filter((_, j) => j !== action.setIdx);
      p.exercises = p.exercises.map((e, i) => (i === action.exIdx ? ex : e));
      next[action.phaseIdx] = p;
      return next;
    }

    case "editSet": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      const ex = { ...p.exercises[action.exIdx] };
      ex.sets = ex.sets.map((s, j) =>
        j === action.setIdx ? { ...s, [action.field]: action.value } : s
      );
      p.exercises = p.exercises.map((e, i) => (i === action.exIdx ? ex : e));
      next[action.phaseIdx] = p;
      return next;
    }

    case "toggleCompleted": {
      const next = [...state];
      const p = { ...next[action.phaseIdx] };
      const ex = { ...p.exercises[action.exIdx] };
      ex.sets = ex.sets.map((s, j) =>
        j === action.setIdx ? { ...s, completed: !s.completed } : s
      );
      p.exercises = p.exercises.map((e, i) => (i === action.exIdx ? ex : e));
      next[action.phaseIdx] = p;
      return next;
    }

    default:
      return state;
  }
}

type GymAction =
  | { type: "addExercise"; name?: string }
  | { type: "removeExercise"; idx: number }
  | { type: "renameExercise"; idx: number; name: string }
  | { type: "addSet"; idx: number }
  | { type: "removeSet"; idx: number; setIdx: number }
  | {
      type: "editSet";
      idx: number;
      setIdx: number;
      field: "reps" | "weight";
      value: string;
    }
  | { type: "toggleCompleted"; idx: number; setIdx: number }
  | { type: "reset"; payload: Exercise[] };

function gymReducer(state: Exercise[], action: GymAction): Exercise[] {
  switch (action.type) {
    case "reset":
      return action.payload;
    case "addExercise":
      return [
        ...state,
        { name: action.name || "", sets: [{ reps: "", weight: "" }] },
      ];
    case "removeExercise":
      return state.filter((_, i) => i !== action.idx);
    case "renameExercise":
      return state.map((ex, i) =>
        i === action.idx ? { ...ex, name: action.name } : ex
      );
    case "addSet":
      return state.map((ex, i) =>
        i === action.idx
          ? { ...ex, sets: [...ex.sets, { reps: "", weight: "" }] }
          : ex
      );
    case "removeSet":
      return state.map((ex, i) =>
        i === action.idx
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== action.setIdx) }
          : ex
      );
    case "editSet":
      return state.map((ex, i) =>
        i === action.idx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === action.setIdx ? { ...s, [action.field]: action.value } : s
              ),
            }
          : ex
      );
    case "toggleCompleted":
      return state.map((ex, i) =>
        i === action.idx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === action.setIdx ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      );
    default:
      return state;
  }
}

// ————————————————————————————————————————————————————————————————
// Main screen
// …imports unchanged…

// ————————————————————————————————————————————————————————————————
// Main screen
export default function Log() {
  const navigation = useNavigation();
  const route = useRoute() as any;

  // ✅ Call useTheme ONCE here, never inside JSX below
  const theme = useTheme();
  const { colors, typography } = theme;

  // Optional: edit support (kept minimal)
  const entryToEdit = route?.params?.entry || null;
  const [mode, setMode] = useState<"create" | "edit">(
    entryToEdit ? "edit" : "create"
  );
  const [lastSig, setLastSig] = useState<string>("");

  const [type, setType] = useState<ActivityType>(entryToEdit?.type || "Gym");
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || "");
  const [isOpen, setOpen] = useState(false);
  const isPrefill = !!route?.params?.entry;
  const [saving, setSaving] = useState(false); // ⬅️ add this

  // All non-gym fields live in a single bag
  const [seg, setSeg] = useState<Record<string, string>>({});
  const setField = (k: string, v: string) => setSeg((s) => ({ ...s, [k]: v }));
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      userIdRef.current = data.session?.user?.id ?? null;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Gym state
  // const [exercises, dispatch] = useReducer(gymReducer, [
  //   { name: "", sets: [{ reps: "", weight: "" }] },
  // ]);

  const [phases, dispatchPhases] = useReducer(phasesReducer, DEFAULT_PHASES);

  const toExerciseArr = (arr: any[]): Exercise[] =>
    (arr || []).map((ex: any) => ({
      name: typeof ex === "string" ? ex : ex?.name || "",
      sets: (ex?.sets || [{ reps: "", weight: "" }]).map((s: any) => ({
        reps: s?.reps != null ? String(s.reps) : "",
        weight: s?.weight != null ? String(s.weight) : "",
        completed: !!s?.completed,
      })),
    }));

  // when user taps a template
  const start = (
    preset?: { name: string; exercises?: string[] },
    forcedType?: ActivityType
  ) => {
    const t = forcedType || (preset ? "Gym" : type);
    setType(t);

    if (t === "Gym") {
      if (preset) {
        const mainSet = toExerciseArr(preset.exercises || []);
        dispatchPhases({
          type: "reset",
          payload: [
            {
              id: "Warm-Up",
              title: "Warm up",
              exercises: [{ name: "", sets: [{ reps: "", weight: "" }] }],
            },
            {
              id: "Main Set",
              title: "Main set",
              exercises: mainSet.length
                ? mainSet
                : [{ name: "", sets: [{ reps: "", weight: "" }] }],
            },
            { id: "Cool-Down", title: "Cool down", exercises: [] },
          ],
        });
        setMode("edit"); // templates show "Edit Activity"
      } else {
        dispatchPhases({ type: "reset", payload: DEFAULT_PHASES });
        setMode("create");
      }
    } else {
      // non-gym reset
      setSeg({});
      setMode("create");
    }

    setNotes("");
    setOpen(true);
  };

  function compactGymExercises(phases: Phase[]) {
    const out: {
      section: string;
      name: string;
      setsArr: {
        reps: number | null;
        weight: number | null;
        completed: boolean;
      }[];
    }[] = [];

    for (const ph of phases) {
      for (const ex of ph.exercises) {
        const name = (ex.name || "").trim();
        // keep only meaningful sets (at least reps or weight or completed)
        const setsArr = ex.sets
          .map((s) => ({
            reps: s.reps?.trim() ? Number(s.reps) : null,
            weight: s.weight?.trim() ? Number(s.weight) : null,
            completed: !!s.completed,
          }))
          .filter((s) => s.reps !== null || s.weight !== null || s.completed);

        // If there's no name AND no meaningful sets, skip this exercise entirely
        if (!name && setsArr.length === 0) continue;

        // If user named the exercise but didn’t fill sets, keep a single empty set
        out.push({
          section: ph.id,
          name,
          setsArr: setsArr.length
            ? setsArr
            : [{ reps: null, weight: null, completed: false }],
        });
      }
    }
    return out;
  }

  // open modal with prefilled payload (templates / imports)
  function openWithPayload(payload: ImportedLogPayload | any) {
    const t = (payload?.type || "Gym") as ActivityType;
    setType(t);

    if (t === "Gym") {
      // Priority 1: payload.phases (array)
      // Priority 2: warmUp/mainSet/coolDown keys
      // Fallback: exercises array goes to Main Set
      const fromPhases = Array.isArray(payload?.phases) ? payload.phases : null;

      const warm = fromPhases
        ? toExerciseArr(
            fromPhases.find((p: any) => /warm/i.test(p?.title || p?.id))
              ?.exercises || []
          )
        : toExerciseArr(payload?.warmUp || payload?.warmup || []);

      const main = fromPhases
        ? toExerciseArr(
            fromPhases.find((p: any) => /main/i.test(p?.title || p?.id))
              ?.exercises || []
          )
        : toExerciseArr(
            payload?.mainSet || payload?.main || payload?.exercises || []
          );

      const cool = fromPhases
        ? toExerciseArr(
            fromPhases.find((p: any) => /cool/i.test(p?.title || p?.id))
              ?.exercises || []
          )
        : toExerciseArr(payload?.coolDown || payload?.cooldown || []);

      const phasesPayload: Phase[] = [
        {
          id: "Warm-Up",
          title: "Warm up",
          exercises: warm.length
            ? warm
            : [{ name: "", sets: [{ reps: "", weight: "" }] }],
        },
        {
          id: "Main Set",
          title: "Main set",
          exercises: main.length
            ? main
            : [{ name: "", sets: [{ reps: "", weight: "" }] }],
        },
        { id: "Cool-Down", title: "Cool down", exercises: cool },
      ];

      dispatchPhases({ type: "reset", payload: phasesPayload });
      setSeg({});
    } else {
      // keep only fields Log knows for this type
      const allowed = new Set((FIELDS[t] ?? []).map((f) => f.key));
      const bag: Record<string, string> = {};
      Object.entries(payload?.segments ?? {}).forEach(([k, v]) => {
        if (allowed.has(k)) bag[k] = String(v ?? "");
      });
      setSeg(bag);
    }

    setNotes(payload?.notes ?? payload?.customType ?? "");
    setMode("edit"); // imports show "Edit Activity"
    setOpen(true);
  }

  function startFromTemplate(tpl: Template) {
    // Force Gym mode and open modal in “edit” (so title says “Edit Activity”).
    setType("Gym");

    if (tpl.phases?.length) {
      // Map provided phases directly
      const payload = tpl.phases.map((p) => ({
        id: (p.id as any) || "Main Set",
        title: p.title || p.id || "Main set",
        exercises: toExerciseArr(p.exercises || []),
      }));
      dispatchPhases({ type: "reset", payload });
    } else {
      // Fallback: map `exercises` into Main Set, keep warm-up/cool-down empty
      const mainSet = toExerciseArr(tpl.exercises || []);
      dispatchPhases({
        type: "reset",
        payload: [
          {
            id: "Warm-Up",
            title: "Warm up",
            exercises: [{ name: "", sets: [{ reps: "", weight: "" }] }],
          },
          {
            id: "Main Set",
            title: "Main set",
            exercises: mainSet.length
              ? mainSet
              : [{ name: "", sets: [{ reps: "", weight: "" }] }],
          },
          { id: "Cool-Down", title: "Cool down", exercises: [] },
        ],
      });
    }

    setNotes("");
    setMode("edit"); // <- shows “Edit Activity” in the title
    setOpen(true);
  }


  // at top with other state
  const [lastImportSig, setLastImportSig] = useState<string>("");

  // ...
  useEffect(() => {
    const params: any = route?.params ?? {};
    const importPayload = params.importToLog;
    const ts = params._ts ?? null;

    // 👇 include _ts so repeated imports of the same plan still open the modal
    const sig = JSON.stringify({ ts, payload: importPayload ?? null });

    if (!ts || sig === lastImportSig) return;

    if (importPayload) {
      openWithPayload(importPayload);
      setLastImportSig(sig);
      // clear both so navigating back won't retrigger accidentally
      try {
        (navigation as any).setParams({
          importToLog: undefined,
          _ts: undefined,
        });
      } catch {}
    }
  }, [route?.params, lastImportSig, navigation]);

  const fieldsForType = useMemo(() => FIELDS[type], [type]);

  const fieldRows: (Field | null)[][] = useMemo(() => {
    const rows: (Field | null)[][] = [];
    const fields = fieldsForType;

    for (let i = 0; i < fields.length; ) {
      const a = fields[i];
      if (a.half) {
        const b = fields[i + 1];
        if (b?.half) {
          rows.push([a, b]); // two half fields share a row
          i += 2;
        } else {
          rows.push([a, null]); // lonely half field occupies left col
          i += 1;
        }
      } else {
        rows.push([a, null]); // full-width field in left col
        i += 1;
      }
    }
    return rows;
  }, [fieldsForType]);

  const nz = (v?: string) => (v && v.trim() !== "" ? v : undefined);
  async function save() {
    if (saving) return;
    setSaving(true);

    try {
      const uid =
        userIdRef.current ??
        (await supabase.auth.getUser()).data.user?.id ??
        null;
      if (!uid) throw new Error("User not found.");

      const isoDate = new Date().toISOString().slice(0, 10);
      const payload: any = { user_id: uid, date: isoDate, type, notes };

      if (type === "Gym") {
        payload.segments = [];
        payload.exercises = compactGymExercises(phases); // already filters empties
      } else {
        const bag: Record<string, any> = { type };
        fieldsForType.forEach((f) => {
          const raw = seg[f.key]?.trim();
          if (!raw) return;
          if (f.key === "laps") bag[f.key] = Number(raw);
          else if (["duration", "minutes"].includes(f.key)) {
            bag[f.key] = isNaN(Number(raw)) ? raw : Number(raw);
          } else {
            bag[f.key] = raw;
          }
        });
        payload.segments = [bag];
        payload.exercises = [];
      }

      // Fast write – no .select() / no returning
      let error;
      if (entryToEdit?.id) {
        ({ error } = await supabase
          .from("entries")
          .update(payload)
          .eq("id", entryToEdit.id));
      } else {
        ({ error } = await supabase.from("entries").insert([payload]));
      }
      if (error) throw error;

      // ✅ Close the modal immediately on success
      setOpen(false);

      // Notify listeners to refresh quietly (History, widgets, etc.)
      DeviceEventEmitter.emit("fitflow:entrySaved", {
        mode: entryToEdit?.id ? "update" : "insert",
        ts: Date.now(),
      });
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // ————————————————————————————————————————————————————————————
  // UI
  const {
    textPrimary,
    textSecondary,
    inputBackground,
    background,
    primary,
    error,
  } = colors;

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      {/* Header */}
      <Text style={[styles.h1, { color: textPrimary }]}>Log</Text>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 26,
          marginBottom: 60,
        }}
      >
        {/* Quick Start */}
        <View style={[styles.card]}>
          <Text style={[styles.h3, { color: textPrimary }]}>Quick Start</Text>

          <TouchableOpacity
            onPress={() => start(undefined, type)}
            activeOpacity={0.9}
            style={{ marginTop: 14 }}
          >
            <LinearGradient
              colors={[primary, "#5D8E8F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickStartBtn}
            >
              <Text style={styles.quickStartBtnText}>Start Empty Log</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Templates */}
        <Text
          style={[
            styles.h3,
            { marginTop: 18, marginBottom: 8, color: textPrimary },
          ]}
        >
          Workout Templates
        </Text>
        {templates.map((tpl) => (
          <TouchableOpacity
            key={tpl.name}
            onPress={() => startFromTemplate(tpl)}
            // onPress={() =>
            //   start({ name: tpl.name, exercises: tpl.exercises }, "Gym")
            // }
            activeOpacity={0.9}
            style={[styles.templateCard]}
          >
            <Text
              style={{ color: textPrimary, fontWeight: "700", marginBottom: 6 }}
            >
              {tpl.name}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              {templatePreview(tpl)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sheet Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
        style={{ minHeight: 200 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={[styles.sheet, { backgroundColor: background }]}>
            <View style={{ alignItems: "center", paddingVertical: 6 }}>
              <View
                style={{
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: inputBackground,
                }}
              />
            </View>

            {/* Title */}
            <Text
              style={[styles.h2, { color: textPrimary, alignSelf: "center" }]}
            >
              {mode === "edit" ? "Edit Activity" : "Log Activity"}
            </Text>
            <View style={{ height: 8 }} />

            {/* Type chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingBottom: 6,
              }}
            >
              {TYPE_LIST.map((t) => (
                <Chip key={t} active={type === t} onPress={() => setType(t)}>
                  <View style={{ marginRight: 6 }}>
                    {React.cloneElement(TYPE_ICON[t] as any, {
                      color: type === t ? textPrimary : textSecondary,
                    })}
                  </View>
                  <Text
                    style={{
                      color: type === t ? textPrimary : textSecondary,
                      fontWeight: "700",
                    }}
                  >
                    {t}
                  </Text>
                </Chip>
              ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingTop: 6,
                paddingBottom: 120,
              }}
              showsVerticalScrollIndicator={false}
            >
              {type === "Gym" ? (
                <View>
                  {phases.map((ph, pIdx) => (
                    <View
                      key={ph.id}
                      style={[styles.card, { padding: UI.PAD }]}
                    >
                      <Text
                        style={[
                          styles.h3,
                          { marginBottom: 8, color: textPrimary },
                        ]}
                      >
                        {ph.title}
                      </Text>

                      {ph.exercises.map((ex, eIdx) => (
                        <View
                          key={`p${pIdx}-ex${eIdx}`}
                          style={[
                            styles.card,
                            { padding: UI.PAD, backgroundColor: "transparent" },
                          ]}
                        >
                          <Text
                            style={[styles.label, { color: textSecondary }]}
                          >
                            Exercise #{eIdx + 1}
                          </Text>
                          <Input
                            value={ex.name}
                            onChangeText={(t: string) =>
                              dispatchPhases({
                                type: "renameExercise",
                                phaseIdx: pIdx,
                                exIdx: eIdx,
                                name: t,
                              })
                            }
                            placeholder="Name"
                          />

                          {ex.sets.map((s, j) => (
                            <View
                              key={`p${pIdx}-ex${eIdx}-set${j}`}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 8,
                                minWidth: "50%",
                              }}
                            >
                              <Input
                                value={s.reps}
                                onChangeText={(t: string) =>
                                  dispatchPhases({
                                    type: "editSet",
                                    phaseIdx: pIdx,
                                    exIdx: eIdx,
                                    setIdx: j,
                                    field: "reps",
                                    value: t,
                                  })
                                }
                                placeholder="Reps"
                                keyboardType="numeric"
                              />
                              <View style={{ width: 8 }} />
                              <Input
                                value={s.weight}
                                onChangeText={(t: string) =>
                                  dispatchPhases({
                                    type: "editSet",
                                    phaseIdx: pIdx,
                                    exIdx: eIdx,
                                    setIdx: j,
                                    field: "weight",
                                    value: t,
                                  })
                                }
                                placeholder="+kg"
                                keyboardType="numeric"
                              />
                              <View style={{ width: 8 }} />
                              <TouchableOpacity
                                onPress={() =>
                                  dispatchPhases({
                                    type: "toggleCompleted",
                                    phaseIdx: pIdx,
                                    exIdx: eIdx,
                                    setIdx: j,
                                  })
                                }
                                style={[
                                  styles.tick,
                                  {
                                    backgroundColor: s.completed
                                      ? primary
                                      : inputBackground,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    color: s.completed ? "#fff" : textSecondary,
                                  }}
                                >
                                  ✓
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() =>
                                  dispatchPhases({
                                    type: "removeSet",
                                    phaseIdx: pIdx,
                                    exIdx: eIdx,
                                    setIdx: j,
                                  })
                                }
                                style={{ marginLeft: 8 }}
                              >
                                <Text
                                  style={{ color: error, fontWeight: "700" }}
                                >
                                  ✕
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}

                          <TouchableOpacity
                            onPress={() =>
                              dispatchPhases({
                                type: "addSet",
                                phaseIdx: pIdx,
                                exIdx: eIdx,
                              })
                            }
                            style={[
                              styles.pillBtn,
                              {
                                marginTop: 10,
                                backgroundColor: inputBackground,
                              },
                            ]}
                          >
                            <Text
                              style={{ color: textPrimary, fontWeight: "700" }}
                            >
                              ＋ Add Set
                            </Text>
                          </TouchableOpacity>

                          {eIdx > 0 && (
                            <TouchableOpacity
                              onPress={() =>
                                dispatchPhases({
                                  type: "removeExercise",
                                  phaseIdx: pIdx,
                                  exIdx: eIdx,
                                })
                              }
                              style={{ alignSelf: "flex-end", marginTop: 8 }}
                            >
                              <Text style={{ color: error, fontWeight: "700" }}>
                                Remove exercise
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}

                      <TouchableOpacity
                        onPress={() =>
                          dispatchPhases({
                            type: "addExercise",
                            phaseIdx: pIdx,
                          })
                        }
                        activeOpacity={0.9}
                        style={{
                          borderRadius: 12,
                          overflow: "hidden",
                          marginTop: 6,
                        }}
                      >
                        <LinearGradient
                          colors={[primary, "#4A6C6F"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.cta}
                        >
                          <Text style={styles.ctaText}>
                            ＋ Add Exercise to {ph.title}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  {fieldRows.map((row, ri) => (
                    <View
                      key={`row-${ri}`}
                      style={{ flexDirection: "row", marginBottom: 10 }}
                    >
                      {row.map((f, ci) => (
                        <View
                          key={ci}
                          style={{ flex: 1, marginRight: ci === 0 ? 10 : 0 }}
                        >
                          {!!f && (
                            <>
                              <Text
                                style={[styles.label, { color: textSecondary }]}
                              >
                                {f.label}
                              </Text>
                              <Input
                                value={seg[f.key] || ""}
                                onChangeText={(t: string) => setField(f.key, t)}
                                placeholder={f.placeholder}
                                keyboardType={
                                  f.keyboard === "numeric"
                                    ? "numeric"
                                    : "default"
                                }
                                style={{ shadowRadius: 4, shadowOpacity: 0.1 }}
                              />
                            </>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              <View style={[styles.card, { padding: UI.PAD }]}>
                <Text style={[styles.label, { color: textSecondary }]}>
                  Notes
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Anything else to log?"
                  placeholderTextColor={textSecondary}
                  style={{
                    backgroundColor: inputBackground,
                    color: textPrimary,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    height: UI.NOTES_H,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              {/* Actions */}
              <TouchableOpacity
                onPress={save}
                disabled={saving}
                activeOpacity={0.9}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <LinearGradient
                  colors={[primary, "#4A6C6F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>
                    {saving
                      ? "Saving…"
                      : mode === "edit"
                      ? "Update Entry"
                      : "Save Activity"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                activeOpacity={0.9}
                style={{ borderRadius: 14, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={[error, "#C05050"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Styles
const styles = StyleSheet.create({
  screen: { flex: 1 },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginTop: 60,
    marginBottom: 16,
    marginLeft: 16,
  },
  h2: { fontSize: 22, fontWeight: "800" },
  h3: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  card: {
    backgroundColor: "transparent",
    padding: UI.PAD,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  templateCard: {
    backgroundColor: "transparent",
    padding: UI.PAD,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sheet: {
    maxHeight: "92%",
    minHeight: "60%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 0,
  },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  pillBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  tick: {
    width: 46,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    paddingVertical: UI.BTN,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  quickStartBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  quickStartBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
