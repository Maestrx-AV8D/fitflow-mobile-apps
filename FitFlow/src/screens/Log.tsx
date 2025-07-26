// src/screens/Log.tsx
import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { supabase } from '../lib/api'  // or supabaseClient

type Exercise = { name: string; sets: string; reps: string; weight: string }

export default function Log() {
  const navigation = useNavigation()
  const route = useRoute()
  const entryToEdit = (route.params as any)?.entry

  // Common form state
  const [date, setDate] = useState(
    entryToEdit?.date
      ? new Date(entryToEdit.date).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB')
  )
  const [type, setType] = useState<string>(entryToEdit?.type || 'Run')
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || '')
  const [loading, setLoading] = useState<boolean>(false)

  // Gym-specific
  const [exercises, setExercises] = useState<Exercise[]>(
    entryToEdit?.exercises?.map((e: any) => ({
      name: e.name,
      sets: e.sets.toString(),
      reps: e.reps.toString(),
      weight: e.weight?.toString() || '',
    })) || [{ name: '', sets: '', reps: '', weight: '' }]
  )

  // Segment-specific
  const [distance, setDistance] = useState<string>(
    entryToEdit?.segments?.[0]?.distance || ''
  )
  const [duration, setDuration] = useState<string>(
    entryToEdit?.segments?.[0]?.duration || ''
  )
  const [laps, setLaps] = useState<string>(
    entryToEdit?.segments?.[0]?.laps?.toString() || ''
  )
  const [time, setTime] = useState<string>(
    entryToEdit?.segments?.[0]?.time || ''
  )

  // Add / remove exercises
  const addExercise = () =>
    setExercises([...exercises, { name:'', sets:'', reps:'', weight:'' }])
  const removeExercise = (idx: number) =>
    setExercises(exercises.filter((_, i) => i !== idx))

  // Save or update
  const handleSubmit = async () => {
    setLoading(true)
    // build payload
    const isoDate = date.split('/').reverse().join('-')
    const payload: any = {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      date: isoDate,
      type,
      notes,
    }
    if (type === 'Gym') {
      payload.exercises = exercises.map(e=>({
        name:e.name, sets: Number(e.sets), reps: Number(e.reps), weight: e.weight?Number(e.weight):null
      }))
      payload.segments = []
    } else {
      payload.exercises = []
      payload.segments = type === 'Swim'
        ? [{ laps: Number(laps), time }]
        : [{ distance, duration }]
    }

    let res
    if (entryToEdit?.id) {
      res = await supabase
        .from('entries')
        .update(payload)
        .eq('id', entryToEdit.id)
    } else {
      res = await supabase.from('entries').insert([payload])
    }
    setLoading(false)
    if (res.error) {
      Alert.alert('Error', res.error.message)
    } else {
      navigation.navigate('History' as never)
    }
  }

  return (
<View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}>
      <Text style={styles.title}>
        {entryToEdit ? 'Edit Activity' : 'Log Activity'}
      </Text>

      {/* Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
      </View>

      {/* Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Activity Type</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={type}
            onValueChange={v => setType(v)}
            style={styles.picker}
          >
            {['Run','Gym','Swim','Cycle','Other'].map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Gym */}
      {type === 'Gym' && (
        <>
          {exercises.map((ex, idx) => (
            <View key={idx} style={styles.exerciseBox}>
              {idx>0 && (
                <TouchableOpacity
                  onPress={()=>removeExercise(idx)}
                  style={styles.removeBtn}
                >
                  <Text style={{color:'#f66'}}>✕</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.subTitle}>Exercise #{idx+1}</Text>
              <TextInput
                placeholder="Name"
                value={ex.name}
                onChangeText={t=>{
                  const c=[...exercises]; c[idx].name=t; setExercises(c)
                }}
                style={styles.input}
              />
              <View style={styles.row}>
                {['sets','reps','weight'].map((fld,i)=>(
                  <TextInput
                    key={i}
                    placeholder={fld.charAt(0).toUpperCase()+fld.slice(1)}
                    value={(ex as any)[fld]}
                    onChangeText={t=>{
                      const c=[...exercises]; (c[idx] as any)[fld]=t; setExercises(c)
                    }}
                    keyboardType="numeric"
                    style={[styles.input,styles.smallInput]}
                  />
                ))}
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={addExercise}>
            <Text style={styles.addLink}>+ Add Exercise</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Run/Cycle/Other */}
      {type !== 'Gym' && type !== 'Swim' && (
        <View style={styles.row}>
          <View style={{ flex:1, marginRight:8 }}>
            <Text style={styles.label}>Distance</Text>
            <TextInput
              placeholder="e.g. 5 km"
              value={distance}
              onChangeText={setDistance}
              style={styles.input}
            />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.label}>Duration</Text>
            <TextInput
              placeholder="e.g. 30 min"
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
            />
          </View>
        </View>
      )}

      {/* Swim */}
      {type === 'Swim' && (
        <View style={styles.row}>
          <View style={{ flex:1, marginRight:8 }}>
            <Text style={styles.label}>Laps</Text>
            <TextInput
              placeholder="e.g. 20"
              value={laps}
              onChangeText={setLaps}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              placeholder="e.g. 45 min"
              value={time}
              onChangeText={setTime}
              style={styles.input}
            />
          </View>
        </View>
      )}

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, { height: 80 }]}
        />
      </View>

      {/* Save */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.btn, loading && styles.btnDisabled]}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? 'Saving…' : (entryToEdit ? 'Update Entry' : 'Save Activity')}
        </Text>
      </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
    </ScrollView>
    </View>
    
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0E0C15',
  },
  container: { padding:16, paddingTop: 70, paddingBottom:32, backgroundColor:'#0E0C15' },
  title: { fontSize:24, fontWeight:'600', color:'#FFF', marginBottom:16 },
  formGroup: { marginBottom:12 },
  label: { color:'#CAC6DD', marginBottom:4 },
  input: {
    backgroundColor:'#2E2A41',
    borderRadius:8,
    padding:12,
    color:'#FFF',
    marginBottom:4,
  },
  pickerWrapper: {
    backgroundColor:'#2E2A41',
    borderRadius:8,
  },
  picker: {
    color:'#FFF',
  },
  exerciseBox: {
    backgroundColor:'#2E2A41',
    padding:12,
    borderRadius:8,
    marginBottom:12,
    position:'relative',
  },
  removeBtn: { position:'absolute', top:8, right:8 },
  subTitle: { color:'#FFF', fontWeight:'500', marginBottom:8 },
  row: { flexDirection:'row', justifyContent:'space-between' },
  smallInput: { flex:1, marginHorizontal:4 },
  addLink: { color:'#7ADB78', marginBottom:12 },
  btn: {
    backgroundColor:'#7ADB78',
    padding:16,
    borderRadius:8,
    alignItems:'center',
    marginTop:16,
  },
  btnDisabled: { opacity:0.6 },
  btnText: { color:'#1B1B2E', fontWeight:'600' },
})