import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView, Modal, Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { GestureHandlerRootView, State as GestureState, PanGestureHandler, Swipeable } from 'react-native-gesture-handler';
import { supabase } from '../lib/api';
import { useTheme } from '../theme/theme';
// Exported WorkoutContext for global use (wrap your navigator with this provider)
export const WorkoutContext = React.createContext<any>({
  activeWorkout: null,
  setActiveWorkout: (_: any) => {},
});

type SetObj = { reps: string; weight: string; completed: boolean };
type Exercise = { name: string; sets?: string; reps?: string; weight?: string; setsArr?: SetObj[] };

// FloatingWorkoutBar component (supports full and mini modes)
// This bar is globally integrated with the navigator and appears at the bottom when a workout is active but the modal is closed.
function FloatingWorkoutBar({ onPress, mini = false }: { onPress: () => void; mini?: boolean }) {
  // Hooks must be called inside a component or custom hook
  const { colors } = useTheme();
  const { activeWorkout } = useContext(WorkoutContext);
  // Timer logic for workout
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (activeWorkout) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line
  }, [activeWorkout]);
  // Safe background for light/dark mode
  const backgroundColor = mini
    ? (colors?.background || '#fff')
    : colors.primary;
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
        {activeWorkout?.notes && activeWorkout.notes.trim() !== '' ? activeWorkout.notes : 'Active Workout'}
      </Text>
      <Text
        style={{
          color: mini ? colors.textPrimary : '#fff',
          fontWeight: '600',
          fontVariant: ['tabular-nums'],
          fontSize: mini ? 16 : 18,
          marginRight: mini ? 20 : 0,
        }}
      >
        {Math.floor(elapsed / 60)}:{('0' + (elapsed % 60)).slice(-2)}
      </Text>
    </TouchableOpacity>
  );
}

export default function Log() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, typography } = useTheme();
  const entryToEdit = (route.params as any)?.entry;
  const scheduledEntries = (route.params as any)?.scheduledEntries || [];

  // Workout Templates
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

  // Modal state
  // Now, modal can be minimized (swipe down) and restored (tap mini bar)
  const [isModalOpen, setModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // All workout log state local to modal
  const [date, setDate] = useState(
    entryToEdit?.date
      ? new Date(entryToEdit.date).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB')
  );
  // Use a ref to persist type across rerenders unless explicitly reset
  const typeRef = useRef<string>(entryToEdit?.type || 'Run');
  const [type, setType] = useState<string>(typeRef.current);
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || '');
  const [loading, setLoading] = useState<boolean>(false);

  // Previous weights state
  const [previousWeights, setPreviousWeights] = useState<{ [exerciseName: string]: string }>({});

  // Rest timer modal state
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [selectedRestTime, setSelectedRestTime] = useState('2:00');
  const [restTimerExerciseIdx, setRestTimerExerciseIdx] = useState<number | null>(null);

  // Helper to initialize setsArr for Gym exercises
  function initSetsArr(e: any): SetObj[] {
    // If editing old entry with sets/reps/weight, initialize at least one set
    if (e.sets && e.reps && e.weight !== undefined && e.weight !== null) {
      return [
        {
          reps: e.reps.toString(),
          weight: e.weight?.toString() || '',
          completed: false,
        },
      ];
    }
    // Otherwise, start empty
    return [
      { reps: '', weight: '', completed: false },
    ];
  }

  const [exercises, setExercises] = useState<Exercise[]>(
    entryToEdit?.exercises?.map((e: any) => ({
      name: e.name,
      setsArr: initSetsArr(e),
    })) || [{ name: '', setsArr: [{ reps: '', weight: '', completed: false }] }]
  );

  const [distance, setDistance] = useState<string>(
    entryToEdit?.segments?.[0]?.distance || ''
  );
  const [duration, setDuration] = useState<string>(
    entryToEdit?.segments?.[0]?.duration || ''
  );
  const [laps, setLaps] = useState<string>(
    entryToEdit?.segments?.[0]?.laps?.toString() || ''
  );
  const [time, setTime] = useState<string>(
    entryToEdit?.segments?.[0]?.time || ''
  );

  // Timer logic for workout
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // If workout is active (modal open or minimized), start timer.
  useEffect(() => {
    if (activeWorkout) {
      // If first time, set elapsed to how long since startedAt
      if (activeWorkout.startedAt) {
        setElapsed(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
      }
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeWorkout]);

  const addExercise = () =>
    setExercises([...exercises, { name: '', setsArr: [{ reps: '', weight: '', completed: false }] }]);
  const removeExercise = (idx: number) =>
    setExercises(exercises.filter((_, i) => i !== idx));

  // Add set to a particular exercise
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

  // Toggle set completed
  const toggleSetCompleted = (exerciseIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const setsArr = [...(updated[exerciseIdx].setsArr || [])];
      setsArr[setIdx] = { ...setsArr[setIdx], completed: !setsArr[setIdx].completed };
      updated[exerciseIdx] = { ...updated[exerciseIdx], setsArr };
      return updated;
    });
  };

  // Remove a set from a particular exercise, and if it's the last empty set in a new exercise, remove the exercise
  const removeSet = (exerciseIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const setsArr = [...(updated[exerciseIdx].setsArr || [])];
      setsArr.splice(setIdx, 1);
      // If this exercise is new (name is empty) and now has no sets, remove the exercise entirely
      if (
        setsArr.length === 0 ||
        (
          setsArr.length === 1 &&
          setsArr[0].reps === '' &&
          setsArr[0].weight === '' &&
          updated[exerciseIdx].name.trim() === ''
        )
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

  // Open rest timer modal for a specific exercise
  const openRestTimerModal = (exerciseIdx: number) => {
    setRestTimerExerciseIdx(exerciseIdx);
    setShowRestTimer(true);
  };

  // When user presses Start Empty Workout, open modal and set global state.
  const handleStartEmptyLog = () => {
    setExercises([{ name: '', setsArr: [{ reps: '', weight: '', completed: false }] }]);
    // Only reset type if starting a new log and entryToEdit is present, otherwise preserve
    const newType = entryToEdit?.type || type || 'Run';
    typeRef.current = newType;
    setType(newType);
    setDistance('');
    setDuration('');
    setLaps('');
    setTime('');
    setNotes('');
    setElapsed(0);
    setActiveWorkout({
      notes: '',
      startedAt: Date.now(),
    });
    setModalOpen(true);
    setIsMinimized(false);
    // Ensure timer starts immediately
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  // Start a workout from a template
  const handleStartTemplate = (template: { name: string; exercises: Exercise[] }) => {
    setExercises(template.exercises.map(ex => ({
      name: ex.name,
      setsArr: [{ reps: '', weight: '', completed: false }],
    })));
    // Only reset type if starting from template, else preserve
    typeRef.current = 'Gym';
    setType('Gym'); // templates are gym by default
    setDistance('');
    setDuration('');
    setLaps('');
    setTime('');
    setNotes('');
    setElapsed(0);
    setActiveWorkout({
      notes: '',
      startedAt: Date.now(),
    });
    setModalOpen(true);
    setIsMinimized(false);
    // Ensure timer starts immediately
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const isoDate = date.split('/').reverse().join('-');
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
        // Save as array of sets, but for backward compatibility, if only one set, flatten
        if (e.setsArr && e.setsArr.length > 0) {
          // For each set, save name, reps, weight.
          // Optionally: flatten to legacy if only one set
          if (e.setsArr.length === 1) {
            return {
              name: e.name,
              sets: 1,
              reps: Number(e.setsArr[0].reps),
              weight: e.setsArr[0].weight ? Number(e.setsArr[0].weight) : null,
            };
          } else {
            return {
              name: e.name,
              setsArr: e.setsArr.map((s) => ({
                reps: Number(s.reps),
                weight: s.weight ? Number(s.weight) : null,
                completed: !!s.completed,
              })),
            };
          }
        }
        // fallback
        return {
          name: e.name,
          sets: Number((e as any).sets) || 1,
          reps: Number((e as any).reps),
          weight: (e as any).weight ? Number((e as any).weight) : null,
        };
      });
      // For Gym, segments is empty.
    } else if (type === 'Swim') {
      payload.segments = [{
        type: 'Swim',
        laps: Number(laps),
        time,
      }];
    } else {
      payload.segments = [{
        type,
        distance,
        duration,
      }];
    }

    let res;
    if (entryToEdit?.id) {
      res = await supabase.from('entries').update(payload).eq('id', entryToEdit.id);
    } else {
      res = await supabase.from('entries').insert([payload]);
    }

    setLoading(false);
    if (res.error) {
      Alert.alert('Error', res.error.message);
    } else {
      // Close modal, clear timer, reset workout state
      setModalOpen(false);
      setIsMinimized(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
      setActiveWorkout(null);
      navigation.navigate('History' as never);
    }
  };

  const windowWidth = Dimensions.get('window').width;

  const renderScheduledItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.scheduledCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        navigation.navigate('Log' as never, { entry: item } as never);
      }}
    >
      <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: 4 }]}>
        {item.type || 'Workout'}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
        {new Date(item.date).toLocaleDateString('en-GB')}
      </Text>
    </TouchableOpacity>
  );


  // Fetch previous weights for each exercise when modal opens and type is Gym
  useEffect(() => {
    async function fetchPreviousWeights() {
      if (!isModalOpen || type !== 'Gym') return;
      // Fetch most recent entry for each exercise name in exercises
      const names = exercises.map((e) => e.name).filter((n) => n.trim() !== '');
      if (names.length === 0) return;
      // Fetch up to 20 previous gym entries
      const { data, error } = await supabase
        .from('entries')
        .select('exercises, date')
        .eq('type', 'Gym')
        .order('date', { ascending: false })
        .limit(20);
      if (error) return;
      const prev: { [exerciseName: string]: string } = {};
      for (const n of names) {
        for (const entry of data) {
          if (!entry.exercises) continue;
          // Support both new (setsArr) and legacy (flat) formats
          const found = entry.exercises.find(
            (ex: any) =>
              ex.name &&
              ex.name.trim().toLowerCase() === n.trim().toLowerCase()
          );
          if (found) {
            if (found.setsArr && found.setsArr.length > 0) {
              // Use last set's weight
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
    // eslint-disable-next-line
  }, [isModalOpen, type, JSON.stringify(exercises.map(e => e.name))]);

  // Modal content for workout logging with swipe-down-to-minimize
  const WorkoutModal = () => {
    const [dragY, setDragY] = useState(0);
    const dragOffset = useRef(0);
    const panRef = useRef(null);
    const exercisesScrollRef = useRef(null);
    const [modalVisible, setModalVisible] = useState(isModalOpen && !isMinimized);
    // Sync modalVisible with isModalOpen & isMinimized
    useEffect(() => { setModalVisible(isModalOpen && !isMinimized); }, [isModalOpen, isMinimized]);
    // If modalVisible becomes false, reset dragY
    useEffect(() => { if (!modalVisible) setDragY(0); }, [modalVisible]);
    // Only allow minimizing if swiped down enough
    // Increase swipe-to-close threshold to reduce accidental swipes
    const gestureStartTopLimit = 80;
    const gestureActiveOffsetY = 10; // Only vertical movement
    const handleGestureEvent = (event) => {
      setDragY(event.nativeEvent.translationY);
    };
    const handleGestureStateChange = (event) => {
      // Only allow swipe-to-minimize if gesture started at top of modal
      const startY = event?.nativeEvent?.y ?? 0;
      if (
        (event.nativeEvent.state === GestureState.END ||
          event.nativeEvent.oldState === GestureState.ACTIVE)
      ) {
        // Only allow minimizing if gesture started near top (y < gestureStartTopLimit)
        if (
          startY < gestureStartTopLimit &&
          event.nativeEvent.translationY > 120 // threshold for swipe down
        ) {
          setDragY(0);
          // Instead of closing, minimize!
          setIsMinimized(true);
          setModalOpen(false); // hide modal, show mini bar
        } else {
          // Snap back
          setDragY(0);
        }
      }
    };
    return (
      <Modal
        visible={modalVisible}
        animationType="none"
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          setIsMinimized(true); // minimize instead of close
          setModalOpen(false);
        }}
        transparent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(20,24,28,0.23)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={80}
              style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
              <PanGestureHandler
                ref={panRef}
                onGestureEvent={handleGestureEvent}
                onHandlerStateChange={handleGestureStateChange}
                activeOffsetY={gestureActiveOffsetY}
                failOffsetX={[-10, 10]}
                simultaneousHandlers={exercisesScrollRef}
              >
                <View
                  style={[
                    styles.modalContainer,
                    { backgroundColor: colors.background, transform: [{ translateY: dragY > 0 ? dragY : 0 }] },
                  ]}
                >
                  {/* Drag handle / swipe-down area */}
                  <View style={{ alignItems: 'center', paddingTop: 10, marginBottom: 4 }}>
                    <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.inputBackground, marginBottom: 10 }} />
                    <Text style={[typography.h2, { color: colors.textPrimary, fontSize: 26, fontWeight: 'bold', marginBottom: 2 }]}>
                      {entryToEdit ? 'Edit Activity' : 'Log Activity'}
                    </Text>
                    <Text style={{
                      color: colors.primary,
                      marginTop: 2,
                      fontSize: 22,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                      marginBottom: 6,
                      fontVariant: ['tabular-nums'],
                    }}>
                      {Math.floor(elapsed / 60)}:{('0' + (elapsed % 60)).slice(-2)}
                    </Text>
                  </View>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={80}
                    style={{ flex: 1 }}
                  >
                    <ScrollView
                      contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                      keyboardDismissMode="on-drag"
                    >
              {/* Activity Type Picker Card */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, marginBottom: 28, padding: 22 }, // restore more visual weight
                ]}
              >
                <Text style={[styles.label, { color: colors.textSecondary, fontSize: 15, marginBottom: 12 }]}>Activity Type</Text>
                <View
                  style={[
                    styles.pickerWrapper,
                    {
                      backgroundColor: colors.inputBackground,
                      minHeight: 160,
                      height: 160,
                      justifyContent: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={type}
                    onValueChange={(v) => {
                      typeRef.current = v;
                      setType(v);
                    }}
                    style={[
                      styles.picker,
                      {
                        color: colors.textPrimary,
                        height: 150,
                        fontSize: 14,
                      },
                    ]}
                    dropdownIconColor={colors.textPrimary}
                    mode="dropdown"
                  >
                    {['Run', 'Walk', 'Cycle', 'Gym', 'Swim', 'Other'].map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Exercises Cards */}
              {type === 'Gym' && (
                <>
                  <FlatList
                    ref={exercisesScrollRef}
                    style={{ maxHeight: 500, minHeight: 120, marginBottom: 12 }}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    removeClippedSubviews={false}
                    data={exercises}
                    keyExtractor={(_, idx) => String(idx)}
                    extraData={JSON.stringify(exercises)}
                    renderItem={({ item: ex, index: idx }) => (
                      <View
                        style={[
                          styles.exerciseCard,
                          {
                            backgroundColor: colors.surface,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.17,
                            shadowRadius: 12,
                            elevation: 7,
                            borderRadius: 18,
                            marginBottom: 18,
                          },
                        ]}
                      >
                        <View style={styles.exerciseHeader}>
                          <Text style={[styles.exerciseTitle, { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }]}>
                            {ex.name.trim() !== '' ? ex.name : <Text>{`Exercise #${idx + 1}`}</Text>}
                          </Text>
                          {idx > 0 && (
                            <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
                              <Text style={{ color: colors.error, fontSize: 22, fontWeight: '700' }}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TextInput
                          placeholder="Name"
                          placeholderTextColor={colors.textSecondary}
                          value={ex.name}
                          onChangeText={(t) => {
                            const c = [...exercises];
                            c[idx].name = t;
                            setExercises(c);
                          }}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.inputBackground,
                              color: colors.textPrimary,
                              marginBottom: 8,
                              borderRadius: 10,
                              paddingHorizontal: 14,
                              fontSize: 16,
                            },
                          ]}
                        />
                        <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginRight: 12, fontSize: 14 }]}>
                            <Text>Previous: </Text>
                            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                              {previousWeights[ex.name] ? previousWeights[ex.name] : '-'}
                            </Text>
                          </Text>
                        </View>
                        {/* List of sets */}
                        <View>
                          {(ex.setsArr || []).map((set, setIdx) => {
                            const renderRightActions = () => (
                              <TouchableOpacity
                                onPress={() => removeSet(idx, setIdx)}
                                style={{
                                  backgroundColor: colors.error,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  width: 44,
                                  height: 56,
                                  borderRadius: 8,
                                  marginLeft: 6,
                                }}
                              >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Delete</Text>
                              </TouchableOpacity>
                            );

                            return (
                              <Swipeable
                                key={setIdx}
                                renderRightActions={renderRightActions}
                                overshootRight={false}
                              >
                                <View style={[styles.setRow, { height: 56, alignItems: 'center' }]}>
                                  <Text style={{ color: colors.textSecondary, width: 18, textAlign: 'center' }}>
                                    {setIdx + 1}
                                  </Text>

                                  {/* Reps Input */}
                                  <TextInput
                                    placeholder="Reps"
                                    placeholderTextColor={colors.textSecondary}
                                    value={set.reps}
                                    keyboardType="numeric"
                                    onChangeText={(t) => {
                                      const updated = [...exercises];
                                      updated[idx].setsArr![setIdx].reps = t;
                                      setExercises(updated);
                                    }}
                                    style={{
                                      flex: 1,
                                      backgroundColor: colors.inputBackground,
                                      borderRadius: 10,
                                      textAlign: 'center',
                                      marginHorizontal: 4,
                                      color: colors.textPrimary,
                                      height: 56,
                                      paddingVertical: 14,
                                    }}
                                  />

                                  {/* Weight Input */}
                                  <TextInput
                                    placeholder="+kg"
                                    placeholderTextColor={colors.textSecondary}
                                    value={set.weight}
                                    keyboardType="numeric"
                                    onChangeText={(t) => {
                                      const updated = [...exercises];
                                      updated[idx].setsArr![setIdx].weight = t;
                                      setExercises(updated);
                                    }}
                                    style={{
                                      flex: 1,
                                      backgroundColor: colors.inputBackground,
                                      borderRadius: 10,
                                      textAlign: 'center',
                                      marginHorizontal: 4,
                                      color: colors.textPrimary,
                                      height: 56,
                                      paddingVertical: 14,
                                    }}
                                  />

                                  {/* Tick to complete */}
                                  <TouchableOpacity
                                    onPress={() => toggleSetCompleted(idx, setIdx)}
                                    style={{
                                      width: 50,
                                      height: 56,
                                      borderRadius: 10,
                                      backgroundColor: set.completed ? colors.primary : colors.inputBackground,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginLeft: 4,
                                    }}
                                  >
                                    <Text style={{ color: set.completed ? '#fff' : colors.textSecondary, fontSize: 18 }}>
                                      ✓
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </Swipeable>
                            );
                          })}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <TouchableOpacity
                              onPress={() => addSet(idx)}
                              style={{
                                backgroundColor: colors.inputBackground,
                                borderRadius: 10,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                marginRight: 12,
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
                              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>＋ Add Set</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => openRestTimerModal(idx)}
                              style={{
                                backgroundColor: colors.inputBackground,
                                borderRadius: 10,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
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
                              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                                {selectedRestTime}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  />
                  {/* Add Exercise Button and Notes stay fixed */}
                  <View style={{ marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={addExercise}
                      activeOpacity={0.9}
                      style={{ marginBottom: 20, borderRadius: 14, overflow: 'hidden' }}
                    >
                      <LinearGradient
                        colors={[colors.primary, '#5D8E8F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          paddingVertical: 16,
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
                            fontSize: 17,
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
      {/* Rest Timer Modal */}
              <Modal
                visible={showRestTimer}
                animationType="slide"
                transparent
                onRequestClose={() => setShowRestTimer(false)}
              >
                <TouchableWithoutFeedback onPress={() => setShowRestTimer(false)}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(30,30,30,0.32)', justifyContent: 'flex-end' }}>
                    <TouchableWithoutFeedback>
                      <View style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        padding: 24,
                        minHeight: 320,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.12,
                        shadowRadius: 6,
                        elevation: 8,
                      }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Set Rest Timer</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                          {['0:30', '1:00', '2:00', '3:00'].map((t) => (
                            <TouchableOpacity
                              key={t}
                              onPress={() => {
                                setSelectedRestTime(t);
                                setShowRestTimer(false);
                              }}
                              style={{
                                backgroundColor: selectedRestTime === t ? colors.primary : colors.inputBackground,
                                borderRadius: 10,
                                paddingVertical: 12,
                                paddingHorizontal: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginHorizontal: 2,
                              }}
                            >
                              <Text style={{ color: selectedRestTime === t ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 16 }}>
                                {t}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={{ marginTop: 10 }}>
                          <Text style={{ color: colors.textSecondary, marginBottom: 6, fontSize: 14 }}>Custom</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput
                              placeholder="mm:ss"
                              placeholderTextColor={colors.textSecondary}
                              style={{
                                backgroundColor: colors.inputBackground,
                                color: colors.textPrimary,
                                borderRadius: 8,
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                fontSize: 16,
                                flex: 1,
                                marginRight: 10,
                              }}
                              onSubmitEditing={(e) => {
                                let val = e.nativeEvent.text;
                                // Validate mm:ss
                                if (/^\d{1,2}:\d{2}$/.test(val)) {
                                  setSelectedRestTime(val);
                                  setShowRestTimer(false);
                                }
                              }}
                              returnKeyType="done"
                            />
                            <TouchableOpacity
                              onPress={() => setShowRestTimer(false)}
                              style={{
                                backgroundColor: colors.error,
                                borderRadius: 8,
                                paddingVertical: 10,
                                paddingHorizontal: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Close</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>

              {/* Non-Gym Activity Inputs */}
              {type !== 'Gym' && (
                <>
                  {(type !== 'Swim') && (
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                      <Text style={[typography.h4, { marginBottom: 12, color: colors.textPrimary }]}>
                        Distance & Duration
                      </Text>
                      <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Distance</Text>
                          <TextInput
                            placeholder="e.g. 5 km"
                            placeholderTextColor={colors.textSecondary}
                            value={distance}
                            onChangeText={setDistance}
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 }]}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Duration</Text>
                          <TextInput
                            placeholder="e.g. 30 min"
                            placeholderTextColor={colors.textSecondary}
                            value={duration}
                            onChangeText={setDuration}
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 }]}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {type === 'Swim' && (
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                      <Text style={[typography.h4, { marginBottom: 12, color: colors.textPrimary }]}>
                        Swim Details
                      </Text>
                      <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Laps</Text>
                          <TextInput
                            placeholder="e.g. 20"
                            placeholderTextColor={colors.textSecondary}
                            value={laps}
                            onChangeText={setLaps}
                            keyboardType="numeric"
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 }]}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Time</Text>
                          <TextInput
                            placeholder="e.g. 45 min"
                            placeholderTextColor={colors.textSecondary}
                            value={time}
                            onChangeText={setTime}
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 }]}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Notes Card */}
              <View style={[styles.card, { backgroundColor: colors.surface, marginBottom: 40, marginTop: 24 }]}>
                <Text style={[typography.h4, { marginBottom: 8, color: colors.textPrimary }]}>Add Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Anything else to log?"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { height: 100, backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, textAlignVertical: 'top' }]}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ marginBottom: 8, borderRadius: 14, overflow: 'hidden', marginTop: 4 }}>
                <LinearGradient
                  colors={[colors.primary, '#4A6C6F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.btn,
                    loading && styles.btnDisabled,
                    { borderRadius: 14, paddingVertical: 18 }
                  ]}
                >
                  <Text style={[styles.btnText, { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.2 }]}>
                    {loading ? 'Saving…' : entryToEdit ? 'Update Entry' : 'Save Activity'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => {
                  // Cancel the workout: reset state
                  setIsMinimized(false);
                  setModalOpen(false);
                  if (timerRef.current) clearInterval(timerRef.current);
                  setElapsed(0);
                  setActiveWorkout(null);
                }}
                style={{ marginBottom: 36, borderRadius: 14, overflow: 'hidden', marginTop: 4 }}
              >
                <LinearGradient
                  colors={[colors.error, '#C05050']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.btn,
                    { borderRadius: 14, paddingVertical: 18 }
                  ]}
                >
                  <Text style={[styles.btnText, { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.2 }]}>
                    Cancel Activity
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
                    </ScrollView>
                  </KeyboardAvoidingView>
                </View>
              </PanGestureHandler>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  // Main screen (just quick start and scheduled workouts)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.screen, { backgroundColor: colors.background, flex: 1 }]}>
        {/* Only show main screen if modal is not open */}
        {!isModalOpen && (
          <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
                style={{ flex: 1 }}
              >
                {/* Log Heading */}
                <Text style={[
                  typography.h2,
                  {
                    marginTop: 60,
                    marginBottom: 16,
                    color: colors.textPrimary,
                    marginLeft: 16,
                    fontSize: (typography.h2.fontSize || 24) + 2
                  }
                ]}>
                  Log
                </Text>
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Group Quick Start and Scheduled Workouts lower on the page */}
                  <View style={{ marginTop: 5 }}>
                    {/* Quick Start Card */}
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                      <Text style={[typography.h3, { marginBottom: 12, color: colors.textPrimary }]}>
                        Quick Start
                      </Text>
                      <TouchableOpacity
                        onPress={handleStartEmptyLog}
                        style={[styles.quickStartBtn, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.quickStartBtnText]}>Start Empty Log</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Scheduled Workouts Horizontal Scroll */}
                    {scheduledEntries.length > 0 && (
                      <View style={{ marginVertical: 16 }}>
                        <Text style={[typography.h3, { marginBottom: 12, color: colors.textPrimary }]}>
                          Scheduled Workouts
                        </Text>
                        <FlatList
                          data={scheduledEntries}
                          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          renderItem={renderScheduledItem}
                          contentContainerStyle={{ paddingLeft: 16 }}
                          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                        />
                      </View>
                    )}
                  </View>

                  {/* Workout Templates Section */}
                  <Text style={[typography.h3, { marginTop: 24, marginBottom: 12, color: colors.textPrimary }]}>
                    Workout Templates
                  </Text>
                  <FlatList
                    data={templates}
                    keyExtractor={(item) => item.name}
                    numColumns={1}
                    renderItem={({ item }) => (
                      <TouchableOpacity
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
                          {item.exercises.map(ex => ex.name).join(', ')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </>
        )}
        {/* Modal for workout logging */}
        {/* Only show modal if not minimized */}
        <WorkoutModal />
      </View>
      {/* Floating mini workout bar if workout is active and modal is minimized */}
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
  headerContainer: {
    paddingTop: 70,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    // height/padding set inline to allow override
  },
  picker: {
    height: 150,
    fontSize: 14,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  exerciseInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseInputWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  quickStartBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickStartBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  addExerciseBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
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
    marginBottom: 4,
    backgroundColor: 'transparent',
    height: 56,
    // padding etc. now handled inline for card-like set rows in modal
  },
  modalContainer: {
    width: '100%',
    height: '95%',
    alignSelf: 'center',
    borderRadius: 18,
    paddingTop: 6,
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginTop: 80,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 9,
  },
});
// Export FloatingWorkoutBar for global usage in navigator or other screens
export { FloatingWorkoutBar };
