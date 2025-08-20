// src/screens/Log.tsx — compact popup + contextual inputs for all activities (tight, uniform spacing)

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import {
  GestureHandlerRootView,
  State as GestureState,
  PanGestureHandler,
  Swipeable,
} from 'react-native-gesture-handler';
import { supabase } from '../lib/api';
import { useTheme } from '../theme/theme';

// ---- Compact, uniform spacing tokens ----
const UI = {
  GAP_XS: 4,
  GAP_SM: 6,
  GAP_MD: 8,
  CARD_PAD: 10,
  CARD_MB: 8,
  BTN_VPAD: 14,
  NOTES_H: 84,
  MODAL_H: '90%' as const,
  CONTENT_PB: 96,
};

// ====== Global workout context (unchanged API) ======
export const WorkoutContext = React.createContext<any>({
  activeWorkout: null,
  setActiveWorkout: (_: any) => {},
});

type SetObj = { reps: string; weight: string; completed: boolean };
type Exercise = { name: string; sets?: string; reps?: string; weight?: string; setsArr?: SetObj[] };

// Render-ready icon map
const TYPE_META: Record<string, React.ReactElement> = {
  Run: <MaterialCommunityIcons name="run" size={14} />,
  Walk: <Ionicons name="walk-outline" size={14} />,
  Cycle: <Ionicons name="bicycle" size={14} />,
  Gym: <MaterialCommunityIcons name="dumbbell" size={14} />,
  Swim: <MaterialCommunityIcons name="swim" size={14} />,
  Hike: <MaterialCommunityIcons name="walk" size={14} />,
  Row: <MaterialCommunityIcons name="rowing" size={14} />,
  Elliptical: <Ionicons name="fitness-outline" size={14} />,
  'Stair Master': <MaterialCommunityIcons name="stairs" size={14} />,
  Yoga: <Ionicons name="leaf-outline" size={14} />,
  Football: <Ionicons name="football-outline" size={14} />,
  HIIT: <Ionicons name="flash-outline" size={14} />,
  Other: <Ionicons name="ellipsis-horizontal-circle-outline" size={14} />,
};

const TYPE_LIST = [
  'Run',
  'Walk',
  'Cycle',
  'Gym',
  'Swim',
  'Hike',
  'Row',
  'Elliptical',
  'Stair Master',
  'Yoga',
  'Football',
  'HIIT',
  'Other',
];

const EXERCISE_SUGGESTIONS = [
  'Squat',
  'Bench Press',
  'Deadlift',
  'Overhead Press',
  'Pull Up',
  'Romanian Deadlift',
  'Lat Pulldown',
  'Barbell Row',
  'Leg Press',
  'Hip Thrust',
];

// ====== Floating bar shown when an activity is active but modal is minimized ======
function FloatingWorkoutBar({ onPress, mini = false }: { onPress: () => void; mini?: boolean }) {
  const { colors } = useTheme();
  const { activeWorkout } = useContext(WorkoutContext);
  const backgroundColor = mini ? (colors?.surface || '#fff') : colors.primary;

  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        bottom: mini ? 0 : 20,
        left: mini ? 0 : 20,
        right: mini ? 0 : 20,
        backgroundColor,
        borderTopLeftRadius: mini ? 18 : 16,
        borderTopRightRadius: mini ? 18 : 16,
        borderRadius: mini ? 0 : 16,
        paddingVertical: mini ? 12 : 14,
        paddingHorizontal: mini ? 0 : 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 9999,
      }}
      activeOpacity={0.93}
      onPress={onPress}
      testID="mini-workout-bar"
      pointerEvents="box-none"
    >
      <Text
        style={{
          color: mini ? colors.textPrimary : '#fff',
          fontWeight: '600',
          fontSize: mini ? 16 : 18,
          marginLeft: mini ? 20 : 0,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {activeWorkout?.notes && activeWorkout.notes.trim() !== ''
          ? activeWorkout.notes
          : 'Active Activity'}
      </Text>
    </TouchableOpacity>
  );
}

export default function Log() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, typography } = useTheme();

  // safer route params guard
  const routeParams: any = (route && (route as any).params) || {};
  const entryToEdit = routeParams?.entry;
  const scheduledEntries = routeParams?.scheduledEntries || [];

  // ====== Templates (kept simple, used to pre-fill modal) ======
  const templates = [
    {
      name: 'Chest',
      exercises: [
        { name: 'Bench Press', sets: '', reps: '', weight: '' },
        { name: 'Incline Dumbbell Press', sets: '', reps: '', weight: '' },
        { name: 'Chest Fly', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Back',
      exercises: [
        { name: 'Pull Up', sets: '', reps: '', weight: '' },
        { name: 'Barbell Row', sets: '', reps: '', weight: '' },
        { name: 'Lat Pulldown', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Legs',
      exercises: [
        { name: 'Squat', sets: '', reps: '', weight: '' },
        { name: 'Leg Press', sets: '', reps: '', weight: '' },
        { name: 'Leg Extension', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Shoulders',
      exercises: [
        { name: 'Overhead Press', sets: '', reps: '', weight: '' },
        { name: 'Lateral Raise', sets: '', reps: '', weight: '' },
        { name: 'Face Pull', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Arms',
      exercises: [
        { name: 'Bicep Curl', sets: '', reps: '', weight: '' },
        { name: 'Tricep Pushdown', sets: '', reps: '', weight: '' },
        { name: 'Hammer Curl', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Push',
      exercises: [
        { name: 'Bench Press', sets: '', reps: '', weight: '' },
        { name: 'Overhead Press', sets: '', reps: '', weight: '' },
        { name: 'Tricep Pushdown', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Pull',
      exercises: [
        { name: 'Pull Up', sets: '', reps: '', weight: '' },
        { name: 'Barbell Row', sets: '', reps: '', weight: '' },
        { name: 'Bicep Curl', sets: '', reps: '', weight: '' },
      ],
    },
    {
      name: 'Full Body',
      exercises: [
        { name: 'Squat', sets: '', reps: '', weight: '' },
        { name: 'Bench Press', sets: '', reps: '', weight: '' },
        { name: 'Pull Up', sets: '', reps: '', weight: '' },
      ],
    },
  ];

  const { activeWorkout, setActiveWorkout } = useContext(WorkoutContext);

  // ====== Modal + activity state ======
  const [isModalOpen, setModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [date] = useState(
    entryToEdit?.date
      ? new Date(entryToEdit.date).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB')
  );

  const typeRef = useRef<string>(entryToEdit?.type || 'Run');
  const [type, setType] = useState<string>(typeRef.current);
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || '');
  const [loading, setLoading] = useState<boolean>(false);

  const [previousWeights, setPreviousWeights] = useState<{ [exerciseName: string]: string }>({});
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState('');

  function initSetsArr(e: any): SetObj[] {
    if (e.sets && e.reps && e.weight !== undefined && e.weight !== null) {
      return [{ reps: e.reps.toString(), weight: e.weight?.toString() || '', completed: false }];
    }
    return [{ reps: '', weight: '', completed: false }];
  }

  const [exercises, setExercises] = useState<Exercise[]>(
    entryToEdit?.exercises?.map((e: any) => ({
      name: e.name,
      setsArr: initSetsArr(e),
    })) || [{ name: '', setsArr: [{ reps: '', weight: '', completed: false }] }]
  );

  // ====== Shared fields for cardio/other ======
  const [distance, setDistance] = useState<string>(entryToEdit?.segments?.[0]?.distance || '');
  const [duration, setDuration] = useState<string>(entryToEdit?.segments?.[0]?.duration || '');
  const [laps, setLaps] = useState<string>(entryToEdit?.segments?.[0]?.laps?.toString() || '');
  const [time, setTime] = useState<string>(entryToEdit?.segments?.[0]?.time || '');

  // ====== Contextual fields by activity ======
  // Run
  const [pace, setPace] = useState<string>('');
  const [runSurface, setRunSurface] = useState<string>(''); // road/trail/treadmill
  const [hrAvg, setHrAvg] = useState<string>(''); // BPM
  const [calories, setCalories] = useState<string>('');

  // Walk
  const [steps, setSteps] = useState<string>('');
  const [walkSurface, setWalkSurface] = useState<string>(''); // pavement/park/treadmill

  // Cycle
  const [avgSpeed, setAvgSpeed] = useState<string>(''); // km/h
  const [elevationGain, setElevationGain] = useState<string>(''); // m
  const [bikeType, setBikeType] = useState<string>(''); // road/mtb/indoor

  // Swim (laps/time already present)
  const [stroke, setStroke] = useState<string>(''); // freestyle/breaststroke/etc.
  const [poolLength, setPoolLength] = useState<string>(''); // meters

  // Hike
  const [hikeElevationGain, setHikeElevationGain] = useState<string>('');
  const [hikeRoute, setHikeRoute] = useState<string>('');
  const [hikeTerrain, setHikeTerrain] = useState<string>(''); // rocky/forest/etc.

  // Row
  const [spm, setSpm] = useState<string>(''); // strokes per min
  const [split500, setSplit500] = useState<string>(''); // /500m split

  // Elliptical
  const [ellipticalResistance, setEllipticalResistance] = useState<string>('');
  const [ellipticalIncline, setEllipticalIncline] = useState<string>('');

  // Stair Master
  const [stairLevel, setStairLevel] = useState<string>('');
  const [stairIntervals, setStairIntervals] = useState<string>('');
  const [stairDuration, setStairDuration] = useState<string>('');

  // Yoga
  const [yogaStyle, setYogaStyle] = useState<string>(''); // vinyasa/hatha etc
  const [yogaFocus, setYogaFocus] = useState<string>(''); // hips/back/relax
  const [yogaDifficulty, setYogaDifficulty] = useState<string>(''); // easy/med/hard

  // Football
  const [footballContext, setFootballContext] = useState<string>(''); // match/training
  const [footballMinutes, setFootballMinutes] = useState<string>(''); // minutes
  const [footballStats, setFootballStats] = useState<string>(''); // goals/assists/tackles

  // HIIT
  const [hiitRounds, setHiitRounds] = useState<string>(''); // number of rounds
  const [hiitWork, setHiitWork] = useState<string>(''); // work duration
  const [hiitRest, setHiitRest] = useState<string>(''); // rest duration
  const [hiitMovements, setHiitMovements] = useState<string>(''); // list

  // ====== Helpers ======
  const addExercise = (name = '') =>
    setExercises((prev) => [...prev, { name, setsArr: [{ reps: '', weight: '', completed: false }] }]);
  const removeExercise = (idx: number) => setExercises(exercises.filter((_, i) => i !== idx));

  const addSet = (exerciseIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIdx] = {
        ...updated[exerciseIdx],
        setsArr: [...(updated[exerciseIdx].setsArr || []), { reps: '', weight: '', completed: false }],
      };
      return updated;
    });
  };

  const toggleSetCompleted = (exerciseIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const setsArr = [...(updated[exerciseIdx].setsArr || [])];
      setsArr[setIdx] = { ...setsArr[setIdx], completed: !setsArr[setIdx].completed };
      updated[exerciseIdx] = { ...updated[exerciseIdx], setsArr };
      return updated;
    });
  };

  const removeSet = (exerciseIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const setsArr = [...(updated[exerciseIdx].setsArr || [])];
      setsArr.splice(setIdx, 1);
      if (
        setsArr.length === 0 ||
        (setsArr.length === 1 &&
          setsArr[0].reps === '' &&
          setsArr[0].weight === '' &&
          updated[exerciseIdx].name.trim() === '')
      ) {
        updated.splice(exerciseIdx, 1);
        return updated.length === 0
          ? [{ name: '', setsArr: [{ reps: '', weight: '', completed: false }] }]
          : updated;
      }
      updated[exerciseIdx] = { ...updated[exerciseIdx], setsArr };
      return updated;
    });
  };

  const handleStartEmptyLog = (presetType?: string) => {
    const newType = presetType || entryToEdit?.type || type || 'Run';
    setExercises([{ name: '', setsArr: [{ reps: '', weight: '', completed: false }] }]);
    typeRef.current = newType;
    setType(newType);
    // reset every contextual field
    setDistance(''); setDuration(''); setLaps(''); setTime(''); setNotes('');
    setPace(''); setRunSurface(''); setHrAvg(''); setCalories('');
    setSteps(''); setWalkSurface('');
    setAvgSpeed(''); setElevationGain(''); setBikeType('');
    setStroke(''); setPoolLength('');
    setHikeElevationGain(''); setHikeRoute(''); setHikeTerrain('');
    setSpm(''); setSplit500('');
    setEllipticalResistance(''); setEllipticalIncline('');
    setStairLevel(''); setStairIntervals(''); setStairDuration('');
    setYogaStyle(''); setYogaFocus(''); setYogaDifficulty('');
    setFootballContext(''); setFootballMinutes(''); setFootballStats('');
    setHiitRounds(''); setHiitWork(''); setHiitRest(''); setHiitMovements('');
    setActiveWorkout({ notes: '', startedAt: Date.now() });
    setModalOpen(true);
    setIsMinimized(false);
  };

  const handleStartTemplate = (template: { name: string; exercises: Exercise[] }) => {
    setExercises(
      template.exercises.map((ex) => ({ name: ex.name, setsArr: [{ reps: '', weight: '', completed: false }] }))
    );
    typeRef.current = 'Gym';
    setType('Gym');
    // reset contextual fields
    setDistance(''); setDuration(''); setLaps(''); setTime(''); setNotes('');
    setPace(''); setRunSurface(''); setHrAvg(''); setCalories('');
    setSteps(''); setWalkSurface('');
    setAvgSpeed(''); setElevationGain(''); setBikeType('');
    setStroke(''); setPoolLength('');
    setHikeElevationGain(''); setHikeRoute(''); setHikeTerrain('');
    setSpm(''); setSplit500('');
    setEllipticalResistance(''); setEllipticalIncline('');
    setStairLevel(''); setStairIntervals(''); setStairDuration('');
    setYogaStyle(''); setYogaFocus(''); setYogaDifficulty('');
    setFootballContext(''); setFootballMinutes(''); setFootballStats('');
    setHiitRounds(''); setHiitWork(''); setHiitRest(''); setHiitMovements('');
    setActiveWorkout({ notes: '', startedAt: Date.now() });
    setModalOpen(true);
    setIsMinimized(false);
  };

  // helper to omit empty strings in payload
  const nz = (v: string) => (v?.trim() ? v : undefined);

  const handleSubmit = async () => {
    setLoading(true);
    const isoDate = new Date().toISOString().slice(0, 10);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      Alert.alert('Error', 'User not found.');
      setLoading(false);
      return;
    }

    const payload: any = {
      user_id: user.id,
      date: isoDate,
      type,
      notes,
      exercises: [],
      segments: [],
    };

    if (type === 'Gym') {
      payload.exercises = exercises.map((e) => {
        if (e.setsArr && e.setsArr.length > 0) {
          if (e.setsArr.length === 1) {
            const reps = e.setsArr[0].reps?.trim() ? Number(e.setsArr[0].reps) : null;
            const weight = e.setsArr[0].weight?.trim() ? Number(e.setsArr[0].weight) : null;
            return {
              name: e.name,
              sets: 1,
              reps,
              weight,
            };
          } else {
            return {
              name: e.name,
              setsArr: e.setsArr.map((s) => ({
                reps: s.reps?.trim() ? Number(s.reps) : null,
                weight: s.weight?.trim() ? Number(s.weight) : null,
                completed: !!s.completed,
              })),
            };
          }
        }
        return {
          name: e.name,
          sets: Number((e as any).sets) || 1,
          reps: (e as any).reps?.toString()?.trim() ? Number((e as any).reps) : null,
          weight: (e as any).weight?.toString()?.trim() ? Number((e as any).weight) : null,
        };
      });
    } else {
      // Contextual segments for all other types (omit empty fields)
      switch (type) {
        case 'Run':
          payload.segments = [{ type, distance: nz(distance), duration: nz(duration), pace: nz(pace), surface: nz(runSurface), hrAvg: nz(hrAvg), calories: nz(calories) }];
          break;
        case 'Walk':
          payload.segments = [{ type, distance: nz(distance), duration: nz(duration), steps: nz(steps), surface: nz(walkSurface), calories: nz(calories) }];
          break;
        case 'Cycle':
          payload.segments = [{ type, distance: nz(distance), duration: nz(duration), avgSpeed: nz(avgSpeed), elevationGain: nz(elevationGain), bikeType: nz(bikeType), hrAvg: nz(hrAvg), calories: nz(calories) }];
          break;
        case 'Swim':
          payload.segments = [{ type, laps: laps?.trim() ? Number(laps) : undefined, time: nz(time), stroke: nz(stroke), poolLength: nz(poolLength), calories: nz(calories) }];
          break;
        case 'Hike':
          payload.segments = [{ type, distance: nz(distance), duration: nz(duration), elevationGain: nz(hikeElevationGain), route: nz(hikeRoute), terrain: nz(hikeTerrain), calories: nz(calories) }];
          break;
        case 'Row':
          payload.segments = [{ type, distance: nz(distance), duration: nz(duration), spm: nz(spm), split500: nz(split500), calories: nz(calories) }];
          break;
        case 'Elliptical':
          payload.segments = [{ type, duration: nz(duration), resistance: nz(ellipticalResistance), incline: nz(ellipticalIncline), calories: nz(calories) }];
          break;
        case 'Stair Master':
          payload.segments = [{ type, level: nz(stairLevel), intervals: nz(stairIntervals), duration: nz(stairDuration), calories: nz(calories) }];
          break;
        case 'Yoga':
          payload.segments = [{ type, duration: nz(duration), style: nz(yogaStyle), focus: nz(yogaFocus), difficulty: nz(yogaDifficulty) }];
          break;
        case 'Football':
          payload.segments = [{ type, context: nz(footballContext), minutes: nz(footballMinutes), stats: nz(footballStats), calories: nz(calories) }];
          break;
        case 'HIIT':
          payload.segments = [{ type, rounds: nz(hiitRounds), work: nz(hiitWork), rest: nz(hiitRest), movements: nz(hiitMovements), duration: nz(duration), calories: nz(calories) }];
          break;
        default:
          payload.segments = [{ type, duration: nz(duration), calories: nz(calories) }];
          break;
      }
    }

    let res;
    if (entryToEdit?.id) {
      res = await supabase
        .from('entries')
        .update(payload)
        .eq('id', entryToEdit.id)
        .select()
        .single();
    } else {
      res = await supabase
        .from('entries')
        .insert([payload])
        .select()
        .single();
    }

    setLoading(false);
    if (res.error) {
      Alert.alert('Error', res.error.message);
    } else {
      setModalOpen(false);
      setIsMinimized(false);
      setActiveWorkout(null);

      // Broadcast a cross-app update so History/Dashboard can refresh immediately
      try {
        const saved = res.data;
        DeviceEventEmitter.emit('fitflow:entrySaved', {
          mode: entryToEdit?.id ? 'update' : 'insert',
          entry: saved,
          ts: Date.now(),
        });
      } catch (_) {}

      // Navigate to History and bump a timestamp param to force refocus refresh
      try {
        (navigation as any).navigate('History', { ts: Date.now() });
      } catch (_) {
        try { (navigation as any).navigate('Home', { screen: 'History', params: { ts: Date.now() } }); } catch (_) {}
      }
    }
  };

  // ====== Fetch previous weights (unchanged) ======
  useEffect(() => {
    async function fetchPreviousWeights() {
      if (!isModalOpen || type !== 'Gym') return;
      const names = exercises.map((e) => e.name).filter((n) => n.trim() !== '');
      if (names.length === 0) return;
      const { data, error } = await supabase
        .from('entries')
        .select('exercises, date')
        .eq('type', 'Gym')
        .order('date', { ascending: false })
        .limit(20);
      if (error) return;
      const prev: { [exerciseName: string]: string } = {};
      for (const n of names) {
        for (const entry of (data as any[])) {
          if (!entry.exercises) continue;
          const found = entry.exercises.find(
            (ex: any) => ex.name && ex.name.trim().toLowerCase() === n.trim().toLowerCase()
          );
          if (found) {
            if (found.setsArr && found.setsArr.length > 0) {
              prev[n] = found.setsArr[found.setsArr.length - 1].weight?.toString() || '-';
            } else if (found.weight !== undefined && found.weight !== null) {
              prev[n] = found.weight?.toString();
            }
            break;
          }
        }
      }
      setPreviousWeights(prev);
    }
    fetchPreviousWeights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, type, JSON.stringify(exercises.map((e) => e.name))]);

  // ====== Derived mini summary ======
  const totalExercises = exercises.filter(
    (e) => e.name.trim() !== '' || (e.setsArr && e.setsArr.some((s) => s.reps || s.weight))
  ).length;
  const totalSets = exercises.reduce(
    (acc, e) => acc + (e.setsArr?.filter((s) => s.reps || s.weight).length || 0),
    0
  );

  // ====== Modal component ======
  const WorkoutModal = () => {
    const [dragY, setDragY] = useState(0);
    const panRef = useRef(null);
    const exercisesScrollRef = useRef<ScrollView>(null);
    const chipsScrollRef = useRef<ScrollView>(null);
    const chipX = useRef<{ [key: string]: number }>({});

    const scrollChipIntoView = (key: string) => {
      const x = chipX.current[key];
      if (chipsScrollRef.current && typeof x === 'number') {
        chipsScrollRef.current.scrollTo({ x: Math.max(0, x - 16), animated: true });
      }
    };
    const [modalVisible, setModalVisible] = useState(isModalOpen && !isMinimized);

    useEffect(() => {
      setModalVisible(isModalOpen && !isMinimized);
    }, [isModalOpen, isMinimized]);

    useEffect(() => {
      if (!modalVisible) return setDragY(0);
      const id = setTimeout(() => {
        scrollChipIntoView(typeRef.current);
      }, 0);
      return () => clearTimeout(id);
    }, [modalVisible]);

    useEffect(() => {
      if (!modalVisible) return;
      requestAnimationFrame(() => {
        scrollChipIntoView(type);
      });
    }, [type, modalVisible]);

    const gestureStartTopLimit = 80;
    const gestureActiveOffsetY = 10;

    const handleGestureEvent = (event: any) => setDragY(event.nativeEvent.translationY);
    const handleGestureStateChange = (event: any) => {
      // Fall back to numeric states for RNGH compatibility: 4 = ACTIVE, 5 = END
      const endState = event?.nativeEvent?.state;
      const wasActive =
        event?.nativeEvent?.oldState === 4 ||
        event?.nativeState?.oldState === 4 ||
        event?.nativeEvent?.oldState === GestureState.ACTIVE;
      const startY = event?.nativeEvent?.y ?? 0;

      if (endState === 5 || endState === GestureState.END || wasActive) {
        if (startY < gestureStartTopLimit && event.nativeEvent.translationY > 120) {
          setDragY(0);
          setIsMinimized(true);
          setModalOpen(false);
        } else {
          setDragY(0);
        }
      }
    };

    const TypeChip = ({ value, label }: { value: string; label: string }) => (
      <TouchableOpacity
        onLayout={(e) => {
          chipX.current[value] = e.nativeEvent.layout.x;
        }}
        onPress={() => {
          typeRef.current = value;
          setType(value);
          requestAnimationFrame(() => {
            scrollChipIntoView(value);
          });
        }}
        activeOpacity={0.9}
        style={{
          height: 36,
          paddingHorizontal: 10,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: type === value ? colors.primary : (colors as any).border || '#E5E5E5',
          backgroundColor: type === value ? colors.surface : colors.inputBackground,
          marginRight: UI.GAP_MD,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ marginRight: 6 }}>
          {React.cloneElement((TYPE_META[value] ?? TYPE_META['Other']) as any, {
            color: type === value ? colors.textPrimary : colors.textSecondary,
            size: 16,
          })}
        </View>
        <Text style={{ color: type === value ? colors.textPrimary : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
          {label}
        </Text>
      </TouchableOpacity>
    );

    const Labeled = ({
      label,
      children,
      right,
      mb = UI.GAP_MD,
    }: {
      label: string;
      children: React.ReactNode;
      right?: React.ReactNode;
      mb?: number;
    }) => (
      <View style={{ marginBottom: mb }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: UI.GAP_XS }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
          {right}
        </View>
        {children}
      </View>
    );

    const SmallInput = (props: any) => (
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.textPrimary,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
          },
          props.style,
        ]}
        placeholderTextColor={colors.textSecondary}
      />
    );

    return (
      <Modal
        visible={modalVisible}
        animationType="none"
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          setIsMinimized(true);
          setModalOpen(false);
        }}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20,24,28,0.23)',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={80}
              style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}
            >
              {/* Sheet container */}
              <View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: colors.background,
                    transform: [{ translateY: dragY > 0 ? dragY : 0 }],
                    borderTopLeftRadius: 22,
                    borderTopRightRadius: 22,
                  },
                ]}
              >
                {/* Drag handle only (keeps minimize behavior without blocking horizontal chip scroll) */}
                <PanGestureHandler
                  ref={panRef}
                  onGestureEvent={handleGestureEvent}
                  onHandlerStateChange={handleGestureStateChange}
                  activeOffsetY={gestureActiveOffsetY}
                >
                  <View style={{ alignItems: 'center', paddingTop: UI.GAP_XS }} pointerEvents="box-only">
                    <View
                      style={{
                        width: 44,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: colors.inputBackground,
                        marginBottom: UI.GAP_SM,
                      }}
                    />
                  </View>
                </PanGestureHandler>

                {/* Title & subtitle */}
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={[
                      typography.h2,
                      { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 0 },
                    ]}
                  >
                    {entryToEdit ? 'Edit Activity' : 'Log Activity'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: UI.GAP_XS }}>
                    {date} • Tap a type chip.
                  </Text>
                </View>

                {/* Type chips (fully scrollable & tappable) */}
                <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
                  <ScrollView
                    ref={chipsScrollRef}
                    horizontal
                    scrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    persistentScrollbar={false}
                    bounces={true}
                    overScrollMode="never"
                    style={{}}
                    contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', paddingVertical: 0 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {TYPE_LIST.map((t) => (
                        <TouchableOpacity
                          key={t}
                          onLayout={(e) => {
                            chipX.current[t] = e.nativeEvent.layout.x;
                          }}
                          onPress={() => {
                            typeRef.current = t;
                            setType(t);
                            requestAnimationFrame(() => {
                              const x = chipX.current[t];
                              if (typeof x === 'number') {
                                chipsScrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
                              }
                            });
                          }}
                          activeOpacity={0.9}
                          style={{
                            height: 34,
                            paddingHorizontal: 10,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: type === t ? colors.primary : (colors as any).border || '#E5E5E5',
                            backgroundColor: type === t ? colors.surface : colors.inputBackground,
                            marginRight: UI.GAP_SM,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <View style={{ marginRight: 6 }}>
                            {React.cloneElement((TYPE_META[t] ?? TYPE_META['Other']) as any, {
                              color: type === t ? colors.textPrimary : colors.textSecondary,
                              size: 16,
                            })}
                          </View>
                          <Text style={{ color: type === t ? colors.textPrimary : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>


                {/* Content */}
                <View style={{ flex: 1, width: '100%' }}>
                  {/* Mini summary bar */}
                  <View style={{ paddingHorizontal: 12, marginTop: 0, marginBottom: UI.GAP_XS }}>
                    <View
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderRadius: 12,
                        paddingVertical: UI.GAP_SM,
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {React.cloneElement((TYPE_META[type] ?? TYPE_META['Other']) as any, {
                          color: colors.textSecondary,
                          size: 16,
                        })}
                        <Text style={{ color: colors.textPrimary, marginLeft: 8, fontWeight: '700' }}>{type}</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary }}>
                        Exercises: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{totalExercises}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        Sets: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{totalSets}</Text>
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: 0, paddingBottom: UI.CONTENT_PB }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    keyboardDismissMode="on-drag"
                  >
                    {/* Gym-only */}
                    {type === 'Gym' && (
                      <>
                        {/* Quick add/search */}
                        <View
                          style={[
                            styles.card,
                            { backgroundColor: colors.surface, padding: UI.CARD_PAD, marginTop: UI.GAP_XS, marginBottom: UI.CARD_MB },
                          ]}
                        >
                          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 6 }]}>
                            Add exercise
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <SmallInput
                              value={search}
                              onChangeText={setSearch}
                              placeholder="Search or type a name"
                              returnKeyType="done"
                              onSubmitEditing={() => {
                                if (search.trim().length > 0) {
                                  addExercise(search.trim());
                                  setSearch('');
                                }
                              }}
                              style={{ flex: 1 }}
                            />
                            <TouchableOpacity
                              onPress={() => {
                                if (search.trim().length > 0) {
                                  addExercise(search.trim());
                                  setSearch('');
                                }
                              }}
                              style={{
                                marginLeft: UI.GAP_MD,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: colors.primary,
                              }}
                              activeOpacity={0.9}
                            >
                              <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
                            </TouchableOpacity>
                          </View>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ marginTop: UI.GAP_MD }}
                          >
                            {EXERCISE_SUGGESTIONS.map((n) => (
                              <TouchableOpacity
                                key={n}
                                onPress={() => addExercise(n)}
                                style={{
                                  paddingVertical: UI.GAP_SM,
                                  paddingHorizontal: 10,
                                  backgroundColor: colors.inputBackground,
                                  borderRadius: 999,
                                  marginRight: UI.GAP_MD,
                                }}
                                activeOpacity={0.9}
                              >
                                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 12 }}>{n}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        <View style={{ maxHeight: 280, minHeight: 100, marginBottom: UI.CARD_MB }}>
                          <ScrollView
                            ref={exercisesScrollRef}
                            contentContainerStyle={{ paddingBottom: 6 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled
                          >
                            {exercises.map((ex, idx) => {
                              const isCollapsed = !!collapsed[idx];
                              return (
                                <View
                                  key={`ex-${idx}`}
                                  style={[
                                    styles.exerciseCard,
                                    {
                                      backgroundColor: colors.surface,
                                      shadowColor: '#000',
                                      shadowOffset: { width: 0, height: 6 },
                                      shadowOpacity: 0.12,
                                      shadowRadius: 12,
                                      elevation: 7,
                                      borderRadius: 14,
                                      marginBottom: UI.CARD_MB,
                                    },
                                  ]}
                                >
                                  <View style={styles.exerciseHeader}>
                                    <TouchableOpacity
                                      onPress={() => setCollapsed((c) => ({ ...c, [idx]: !c[idx] }))}
                                      activeOpacity={0.9}
                                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                                    >
                                      <MaterialCommunityIcons
                                        name="weight-lifter"
                                        size={18}
                                        color={colors.textSecondary}
                                        style={{ marginRight: 8, opacity: 0.8 }}
                                      />
                                      <Text
                                        style={[
                                          styles.exerciseTitle,
                                          { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
                                        ]}
                                      >
                                        {ex.name.trim() !== '' ? ex.name : `Exercise #${idx + 1}`}
                                      </Text>
                                      <View
                                        style={{
                                          marginLeft: 8,
                                          paddingHorizontal: 8,
                                          paddingVertical: 2,
                                          borderRadius: 6,
                                          backgroundColor: colors.inputBackground,
                                        }}
                                      >
                                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                          {(ex.setsArr || []).length} sets
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <TouchableOpacity
                                        onPress={() => {
                                          const prev = previousWeights[ex.name];
                                          if (!prev) return;
                                          const copy = [...exercises];
                                          if (!copy[idx].setsArr || copy[idx].setsArr!.length === 0) {
                                            copy[idx].setsArr = [{ reps: '', weight: prev, completed: false }];
                                          } else {
                                            copy[idx].setsArr![0].weight = prev;
                                          }
                                          setExercises(copy);
                                        }}
                                        style={{
                                          paddingHorizontal: 10,
                                          paddingVertical: 6,
                                          marginRight: 6,
                                          borderRadius: 8,
                                          backgroundColor: colors.inputBackground,
                                        }}
                                        activeOpacity={0.8}
                                      >
                                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                                          Use Prev
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={() => setCollapsed((c) => ({ ...c, [idx]: !c[idx] }))}
                                        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                                      >
                                        <Ionicons
                                          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                                          size={20}
                                          color={colors.textSecondary}
                                        />
                                      </TouchableOpacity>
                                      {idx > 0 && (
                                        <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
                                          <Text style={{ color: colors.error, fontSize: 20, fontWeight: '700' }}>✕</Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                  </View>

                                  {/* Editable name */}
                                  <SmallInput
                                    placeholder="Name"
                                    value={ex.name}
                                    onChangeText={(t: string) => {
                                      const c = [...exercises];
                                      c[idx].name = t;
                                      setExercises(c);
                                    }}
                                    style={{ marginBottom: isCollapsed ? 0 : UI.GAP_MD }}
                                  />

                                  {/* Collapsed summary */}
                                  {isCollapsed && (
                                    <Text style={{ color: colors.textSecondary, marginTop: UI.GAP_SM }}>
                                      {`${(ex.setsArr || []).filter((s) => s.reps || s.weight).length} set(s) added`} • Prev:{' '}
                                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                                        {previousWeights[ex.name] || '-'}
                                      </Text>
                                    </Text>
                                  )}

                                  {/* Sets */}
                                  {!isCollapsed && (
                                    <View>
                                      <View
                                        style={{
                                          marginBottom: UI.GAP_SM,
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.inputLabel,
                                            { color: colors.textSecondary, marginRight: 12, fontSize: 13 },
                                          ]}
                                        >
                                          Prev weight:{' '}
                                          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                                            {previousWeights[ex.name] ? previousWeights[ex.name] : '-'}
                                          </Text>
                                        </Text>
                                      </View>

                                      {(ex.setsArr || []).map((set, setIdx) => {
                                        const renderRightActions = () => (
                                          <TouchableOpacity
                                            onPress={() => removeSet(idx, setIdx)}
                                            style={{
                                              backgroundColor: colors.error,
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                              width: 56,
                                              height: 52,
                                              borderRadius: 10,
                                              marginLeft: 6,
                                            }}
                                          >
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Delete</Text>
                                          </TouchableOpacity>
                                        );

                                        return (
                                          <Swipeable
                                            key={`set-${idx}-${setIdx}`}
                                            // cast avoids occasional TS/def mismatch on RNGH versions
                                            renderRightActions={renderRightActions as any}
                                            overshootRight={false}
                                          >
                                            <View style={[styles.setRow, { height: 52, alignItems: 'center' }]}>
                                              <Text
                                                style={{ color: colors.textSecondary, width: 18, textAlign: 'center' }}
                                              >
                                                {setIdx + 1}
                                              </Text>

                                              {/* Reps */}
                                              <SmallInput
                                                placeholder="Reps"
                                                value={set.reps}
                                                keyboardType="numeric"
                                                onChangeText={(t: string) => {
                                                  const updated = [...exercises];
                                                  updated[idx].setsArr![setIdx].reps = t;
                                                  setExercises(updated);
                                                }}
                                                style={{ flex: 1, textAlign: 'center', marginHorizontal: 4, height: 52, paddingVertical: 10 }}
                                              />

                                              {/* Weight */}
                                              <SmallInput
                                                placeholder="+kg"
                                                value={set.weight}
                                                keyboardType="numeric"
                                                onChangeText={(t: string) => {
                                                  const updated = [...exercises];
                                                  updated[idx].setsArr![setIdx].weight = t;
                                                  setExercises(updated);
                                                }}
                                                style={{ flex: 1, textAlign: 'center', marginHorizontal: 4, height: 52, paddingVertical: 10 }}
                                              />

                                              {/* Complete tick */}
                                              <TouchableOpacity
                                                onPress={() => toggleSetCompleted(idx, setIdx)}
                                                style={{
                                                  width: 50,
                                                  height: 52,
                                                  borderRadius: 10,
                                                  backgroundColor: set.completed
                                                    ? colors.primary
                                                    : colors.inputBackground,
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  marginLeft: 4,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: set.completed ? '#fff' : colors.textSecondary,
                                                    fontSize: 18,
                                                  }}
                                                >
                                                  ✓
                                                </Text>
                                              </TouchableOpacity>
                                            </View>
                                          </Swipeable>
                                        );
                                      })}

                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: UI.GAP_SM }}>
                                        <TouchableOpacity
                                          onPress={() => addSet(idx)}
                                          style={{
                                            backgroundColor: colors.inputBackground,
                                            borderRadius: 10,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.07,
                                            shadowRadius: 2,
                                            elevation: 1,
                                          }}
                                          activeOpacity={0.8}
                                        >
                                          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                                            ＋ Add Set
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </ScrollView>
                        </View>

                        {/* Add Exercise Button */}
                        <View style={{ marginTop: 4 }}>
                          <TouchableOpacity
                            onPress={() => addExercise('')}
                            activeOpacity={0.9}
                            style={{ marginBottom: UI.CARD_MB, borderRadius: 14, overflow: 'hidden' }}
                          >
                            <LinearGradient
                              colors={[colors.primary, '#5D8E8F']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                paddingVertical: UI.BTN_VPAD,
                                borderRadius: 14,
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                              }}
                            >
                              <Text
                                style={{
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  fontSize: 16,
                                  letterSpacing: 0.2,
                                }}
                              >
                                ＋ Add Exercise
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}

                    {/* Contextual inputs for other types */}
                    {type !== 'Gym' && (
                      <>
                        {type === 'Run' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Run</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Distance (km)">
                                  <SmallInput placeholder="e.g. 5" value={distance} onChangeText={setDistance} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 30 min" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Pace">
                                  <SmallInput placeholder="e.g. 5:30 /km" value={pace} onChangeText={setPace} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Surface">
                                  <SmallInput placeholder="road / trail / treadmill" value={runSurface} onChangeText={setRunSurface} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Avg HR (bpm)">
                                  <SmallInput placeholder="e.g. 152" value={hrAvg} onChangeText={setHrAvg} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Calories">
                                  <SmallInput placeholder="e.g. 420" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                          </View>
                        )}

                        {type === 'Walk' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Walk</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Distance (km)">
                                  <SmallInput placeholder="e.g. 3" value={distance} onChangeText={setDistance} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 40 min" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Steps">
                                  <SmallInput placeholder="e.g. 5000" value={steps} onChangeText={setSteps} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Surface">
                                  <SmallInput placeholder="pavement / park / treadmill" value={walkSurface} onChangeText={setWalkSurface} />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 220" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'Cycle' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Cycle</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Distance (km)">
                                  <SmallInput placeholder="e.g. 20" value={distance} onChangeText={setDistance} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 1 h" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Avg Speed (km/h)">
                                  <SmallInput placeholder="e.g. 26" value={avgSpeed} onChangeText={setAvgSpeed} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Elevation Gain (m)">
                                  <SmallInput placeholder="e.g. 350" value={elevationGain} onChangeText={setElevationGain} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Bike Type">
                                  <SmallInput placeholder="road / MTB / indoor" value={bikeType} onChangeText={setBikeType} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Avg HR (bpm)">
                                  <SmallInput placeholder="e.g. 145" value={hrAvg} onChangeText={setHrAvg} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 600" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'Swim' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Swim</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Laps">
                                  <SmallInput placeholder="e.g. 20" value={laps} onChangeText={setLaps} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Time">
                                  <SmallInput placeholder="e.g. 45 min" value={time} onChangeText={setTime} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Stroke">
                                  <SmallInput placeholder="freestyle / breaststroke" value={stroke} onChangeText={setStroke} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Pool Length (m)">
                                  <SmallInput placeholder="25 / 50" value={poolLength} onChangeText={setPoolLength} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 500" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'Hike' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Hike</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Distance (km)">
                                  <SmallInput placeholder="e.g. 12" value={distance} onChangeText={setDistance} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 3 h" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Elevation Gain (m)">
                                  <SmallInput placeholder="e.g. 800" value={hikeElevationGain} onChangeText={setHikeElevationGain} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Terrain">
                                  <SmallInput placeholder="rocky / forest / mixed" value={hikeTerrain} onChangeText={setHikeTerrain} />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Route / Trail">
                              <SmallInput placeholder="e.g. Ben Nevis CMD" value={hikeRoute} onChangeText={setHikeRoute} />
                            </Labeled>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 900" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'Row' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Row</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Distance (m)">
                                  <SmallInput placeholder="e.g. 2000" value={distance} onChangeText={setDistance} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 8:10" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="SPM">
                                  <SmallInput placeholder="e.g. 28" value={spm} onChangeText={setSpm} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Split /500m">
                                  <SmallInput placeholder="e.g. 2:02" value={split500} onChangeText={setSplit500} />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 300" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'Elliptical' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Elliptical</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 30 min" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Resistance">
                                  <SmallInput placeholder="e.g. 12" value={ellipticalResistance} onChangeText={setEllipticalResistance} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                            <View style={[styles.row]}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Incline">
                                  <SmallInput placeholder="e.g. 5" value={ellipticalIncline} onChangeText={setEllipticalIncline} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Calories">
                                  <SmallInput placeholder="e.g. 380" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                          </View>
                        )}

                        {type === 'Stair Master' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Stair Master</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Level">
                                  <SmallInput placeholder="e.g. 8" value={stairLevel} onChangeText={setStairLevel} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Intervals">
                                  <SmallInput placeholder="e.g. 10 x 1:00 / 1:00" value={stairIntervals} onChangeText={setStairIntervals} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 30 min" value={stairDuration} onChangeText={setStairDuration} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Calories">
                                  <SmallInput placeholder="e.g. 450" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                          </View>
                        )}

                        {type === 'Yoga' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Yoga</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Style">
                                  <SmallInput placeholder="vinyasa / hatha / yin" value={yogaStyle} onChangeText={setYogaStyle} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Focus">
                                  <SmallInput placeholder="hips / back / relaxation" value={yogaFocus} onChangeText={setYogaFocus} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Difficulty">
                                  <SmallInput placeholder="easy / medium / hard" value={yogaDifficulty} onChangeText={setYogaDifficulty} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 45 min" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                          </View>
                        )}

                        {type === 'Football' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Football</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Context">
                                  <SmallInput placeholder="match / training" value={footballContext} onChangeText={setFootballContext} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Minutes">
                                  <SmallInput placeholder="e.g. 60" value={footballMinutes} onChangeText={setFootballMinutes} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Stats">
                              <SmallInput placeholder="goals, assists, tackles…" value={footballStats} onChangeText={setFootballStats} />
                            </Labeled>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 700" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'HIIT' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>HIIT</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Rounds">
                                  <SmallInput placeholder="e.g. 10" value={hiitRounds} onChangeText={setHiitRounds} keyboardType="numeric" />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Work">
                                  <SmallInput placeholder="e.g. :40" value={hiitWork} onChangeText={setHiitWork} />
                                </Labeled>
                              </View>
                            </View>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Rest">
                                  <SmallInput placeholder="e.g. :20" value={hiitRest} onChangeText={setHiitRest} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Duration (optional)">
                                  <SmallInput placeholder="e.g. 25 min" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                            </View>
                            <Labeled label="Movements">
                              <SmallInput placeholder="burpees, bike, KB swing…" value={hiitMovements} onChangeText={setHiitMovements} />
                            </Labeled>
                            <Labeled label="Calories">
                              <SmallInput placeholder="e.g. 450" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                            </Labeled>
                          </View>
                        )}

                        {type === 'Other' && (
                          <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: UI.GAP_MD, marginBottom: UI.CARD_MB }]}>
                            <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Other</Text>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: UI.GAP_MD }}>
                                <Labeled label="Duration">
                                  <SmallInput placeholder="e.g. 30 min" value={duration} onChangeText={setDuration} />
                                </Labeled>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Labeled label="Calories (optional)">
                                  <SmallInput placeholder="e.g. 200" value={calories} onChangeText={setCalories} keyboardType="numeric" />
                                </Labeled>
                              </View>
                            </View>
                          </View>
                        )}
                      </>
                    )}

                    {/* Notes */}
                    <View style={[styles.card, { backgroundColor: colors.surface, marginBottom: 20, marginTop: 12, paddingVertical: UI.GAP_MD }]}>
                      <Text style={[typography.h4, { marginBottom: UI.GAP_MD, color: colors.textPrimary }]}>Add Notes</Text>
                      <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        placeholder="Anything else to log?"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            height: UI.NOTES_H,
                            backgroundColor: colors.inputBackground,
                            color: colors.textPrimary,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            textAlignVertical: 'top',
                          },
                        ]}
                      />
                    </View>

                    {/* Save */}
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={loading}
                      style={{ marginBottom: UI.CARD_MB, borderRadius: 14, overflow: 'hidden', marginTop: 2 }}
                    >
                      <LinearGradient
                        colors={[colors.primary, '#4A6C6F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.btn, loading && styles.btnDisabled, { borderRadius: 14, paddingVertical: UI.BTN_VPAD }]}
                      >
                        <Text style={[styles.btnText, { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.2 }]}>
                          {loading ? 'Saving…' : entryToEdit ? 'Update Entry' : 'Save Activity'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity
                      onPress={() => {
                        setIsMinimized(false);
                        setModalOpen(false);
                        setActiveWorkout(null);
                      }}
                      style={{ marginBottom: UI.CARD_MB, borderRadius: 14, overflow: 'hidden', marginTop: 2 }}
                    >
                      <LinearGradient
                        colors={[colors.error, '#C05050']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.btn, { borderRadius: 14, paddingVertical: UI.BTN_VPAD }]}
                      >
                        <Text style={[styles.btnText, { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.2 }]}>
                          Cancel Activity
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  // Main screen
  const renderScheduledItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.scheduledCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        navigation.navigate('Log' as never, { entry: item } as never);
      }}
    >
      <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: 4 }]}>{item.type || 'Workout'}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
        {new Date(item.date).toLocaleDateString('en-GB')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.screen, { backgroundColor: colors.background, flex: 1 }]}>
        {!isModalOpen && (
          <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
                style={{ flex: 1 }}
              >
                {/* Log Heading */}
                <Text
                  style={[
                    typography.h2,
                    {
                      marginTop: 60,
                      marginBottom: 16,
                      color: colors.textPrimary,
                      marginLeft: 16,
                      fontSize: (typography.h2?.fontSize || 24) + 2,
                    },
                  ]}
                >
                  Log
                </Text>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {/* Quick Start */}
                  <View style={{ marginTop: 5 }}>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                      <Text style={[typography.h3, { marginBottom: 12, color: colors.textPrimary }]}>Quick Start</Text>
                      <TouchableOpacity
                        onPress={() => handleStartEmptyLog()}
                        style={[styles.quickStartBtn, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.quickStartBtnText]}>Start Empty Log</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Scheduled */}
                    {scheduledEntries.length > 0 && (
                      <View style={{ marginVertical: 16 }}>
                        <Text style={[typography.h3, { marginBottom: 12, color: colors.textPrimary }]}>
                          Scheduled Workouts
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
                          {scheduledEntries.map((it: any) => (
                            <View key={it.id || Math.random()} style={{ marginRight: 12 }}>
                              {renderScheduledItem({ item: it } as any)}
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Workout Templates */}
                  <Text style={[typography.h3, { marginTop: 24, marginBottom: 12, color: colors.textPrimary }]}>
                    Workout Templates
                  </Text>
                  <View style={{ paddingBottom: 20 }}>
                    {templates.map((item) => (
                      <TouchableOpacity
                        key={item.name}
                        activeOpacity={0.84}
                        style={{
                          width: '90%',
                          alignSelf: 'center',
                          marginBottom: 12,
                          borderRadius: 12,
                          backgroundColor: colors.surface,
                          padding: 16,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                          justifyContent: 'center',
                        }}
                        onPress={() => handleStartTemplate(item)}
                      >
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', marginBottom: 6, fontSize: 16 }}>
                          {item.name}
                        </Text>
                        <Text numberOfLines={3} ellipsizeMode="tail" style={{ color: colors.textSecondary, fontSize: 13 }}>
                          {item.exercises.map((ex) => ex.name).join(', ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </>
        )}

        {/* Modal for workout logging */}
        <WorkoutModal />
      </View>

      {/* Floating mini workout bar if active and minimized */}
      {activeWorkout && isMinimized && (
        <FloatingWorkoutBar
          mini
          onPress={() => {
            setIsMinimized(false);
            setModalOpen(true);
          }}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: UI.CARD_PAD,
    marginBottom: UI.CARD_MB,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
  inputLabel: { fontSize: 13, marginBottom: 4, fontWeight: '500' },
  input: {
    borderRadius: 8,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: UI.CARD_MB,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: { fontSize: 16, fontWeight: '700' },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  quickStartBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  quickStartBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  btn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  scheduledCard: {
    width: 140,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    backgroundColor: 'transparent',
    height: 52,
  },
  modalContainer: {
    width: '100%',
    height: UI.MODAL_H,
    alignSelf: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: UI.GAP_SM,
    paddingBottom: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 9,
  },
});

// Export FloatingWorkoutBar for global usage in navigator or other screens
export { FloatingWorkoutBar };
