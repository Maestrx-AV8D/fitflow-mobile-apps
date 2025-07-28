import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from '../lib/api';
import { useTheme } from '../theme/theme';


type Exercise = { name: string; sets: string; reps: string; weight: string };

export default function Log() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, typography } = useTheme();
  const entryToEdit = (route.params as any)?.entry;

  const [date, setDate] = useState(
    entryToEdit?.date
      ? new Date(entryToEdit.date).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB')
  );
  const [type, setType] = useState<string>(entryToEdit?.type || 'Run');
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || '');
  const [loading, setLoading] = useState<boolean>(false);

  const [exercises, setExercises] = useState<Exercise[]>(
    entryToEdit?.exercises?.map((e: any) => ({
      name: e.name,
      sets: e.sets.toString(),
      reps: e.reps.toString(),
      weight: e.weight?.toString() || '',
    })) || [{ name: '', sets: '', reps: '', weight: '' }]
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

  const addExercise = () =>
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  const removeExercise = (idx: number) =>
    setExercises(exercises.filter((_, i) => i !== idx));

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
    };

    if (type === 'Gym') {
      payload.exercises = exercises.map((e) => ({
        name: e.name,
        sets: Number(e.sets),
        reps: Number(e.reps),
        weight: e.weight ? Number(e.weight) : null,
      }));
      payload.segments = [];
    } else {
      payload.exercises = [];
      payload.segments =
        type === 'Swim'
          ? [{ laps: Number(laps), time }]
          : [{ distance, duration }];
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
      navigation.navigate('History' as never);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
          >
            <Text style={[typography.h2, { marginBottom: 16, color: colors.textPrimary }]}> 
              {entryToEdit ? 'Edit Activity' : 'Log Activity'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Activity Type</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBackground }]}>
                <Picker
                  selectedValue={type}
                  onValueChange={(v) => setType(v)}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                  mode="dropdown"
                >
                  {['Run', 'Walk', 'Cycle', 'Gym', 'Swim', 'Other'].map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat}/>
                  ))}
                </Picker>
              </View>
            </View>

            {type === 'Gym' && exercises.map((ex, idx) => (
              <View key={idx} style={[styles.exerciseBox, { backgroundColor: colors.inputBackground }]}>
                {idx > 0 && (
                  <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
                    <Text style={{ color: colors.error }}>✕</Text>
                  </TouchableOpacity>
                )}
                <Text style={[styles.label, { color: colors.textPrimary }]}>Exercise #{idx + 1}</Text>
                <TextInput
                  placeholder="Name"
                  placeholderTextColor={colors.textSecondary}
                  value={ex.name}
                  onChangeText={(t) => {
                    const c = [...exercises];
                    c[idx].name = t;
                    setExercises(c);
                  }}
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                />
                <View style={styles.row}>
                  {['sets', 'reps', 'weight'].map((fld, i) => (
                    <TextInput
                      key={i}
                      placeholder={fld.charAt(0).toUpperCase() + fld.slice(1)}
                      placeholderTextColor={colors.textSecondary}
                      value={(ex as any)[fld]}
                      onChangeText={(t) => {
                        const c = [...exercises];
                        (c[idx] as any)[fld] = t;
                        setExercises(c);
                      }}
                      keyboardType="numeric"
                      style={[styles.input, styles.smallInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                    />
                  ))}
                </View>
              </View>
            ))}

            {type === 'Gym' && (
              <TouchableOpacity onPress={addExercise}>
                <Text style={{ color: colors.primary, marginBottom: 12 }}>+ Add Exercise</Text>
              </TouchableOpacity>
            )}

            {type !== 'Gym' && type !== 'Swim' && (
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Distance</Text>
                  <TextInput
                    placeholder="e.g. 5 km"
                    placeholderTextColor={colors.textSecondary}
                    value={distance}
                    onChangeText={setDistance}
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Duration</Text>
                  <TextInput
                    placeholder="e.g. 30 min"
                    placeholderTextColor={colors.textSecondary}
                    value={duration}
                    onChangeText={setDuration}
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  />
                </View>
              </View>
            )}

            {type === 'Swim' && (
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Laps</Text>
                  <TextInput
                    placeholder="e.g. 20"
                    placeholderTextColor={colors.textSecondary}
                    value={laps}
                    onChangeText={setLaps}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Time</Text>
                  <TextInput
                    placeholder="e.g. 45 min"
                    placeholderTextColor={colors.textSecondary}
                    value={time}
                    onChangeText={setTime}
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  />
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Anything else to log?"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { height: 80, backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={[colors.primary, '#4A6C6F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.btn, loading && styles.btnDisabled]}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Saving…' : entryToEdit ? 'Update Entry' : 'Save Activity'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingTop: 70, paddingBottom: 32 },
  formGroup: { marginBottom: 16 },
  label: { marginBottom: 4, fontSize: 14, fontWeight: '500' },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 4,
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 150,
    fontSize: 14,
  },
  exerciseBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  removeBtn: { position: 'absolute', top: 8, right: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  smallInput: { flex: 1, marginHorizontal: 4 },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});
