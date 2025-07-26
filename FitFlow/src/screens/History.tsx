// src/screens/History.tsx
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { supabase, getEntries } from '../lib/api'

type Entry = {
  id: number
  date: string
  type: string
  exercises?: Array<{ name: string; sets: number; reps: number; weight?: number }>
  segments?: Array<{ distance?: string; laps?: number; time?: string }>
  notes?: string
}

export default function History() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation()

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    const data = await getEntries()
    setEntries(data)
    setLoading(false)
  }

  async function handleDelete(id: number) {
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('entries').delete().eq('id', id)
          if (error) {
            Alert.alert('Error', error.message)
          } else {
            setEntries(prev => prev.filter(e => e.id !== id))
          }
        },
      },
    ])
  }

  function handleEdit(entry: Entry) {
    navigation.navigate('Log' as never, { entry } as never)
  }

  const gym = entries.filter(e => e.type === 'Gym')
  const other = entries.filter(e => e.type !== 'Gym')

  const renderEntry = (entry: Entry) => {
    const badgeColor =
      {
        Gym:   '#7F00FF',
        Run:   '#7ADB78',
        Swim:  '#5DA5FF',
        Cycle: '#FFC300',
      }[entry.type] ?? '#858DFF'

    return (
      <View key={entry.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>
            {new Date(entry.date).toLocaleDateString('en-GB')}
          </Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{entry.type}</Text>
          </View>
        </View>

        {entry.exercises?.length ? (
          <View style={styles.section}>
            {entry.exercises.map((ex, i) => (
              <Text key={i} style={styles.line}>
                • <Text style={styles.bold}>{ex.name}</Text> — {ex.sets}×{ex.reps}
                {ex.weight ? ` @ ${ex.weight}kg` : ''}
              </Text>
            ))}
          </View>
        ) : null}

        {entry.segments?.length ? (
          <Text style={styles.line}>
            {entry.segments[0].distance ?? entry.segments[0].laps ?? ''}{' '}
            {entry.segments[0].time ?? ''}
          </Text>
        ) : null}

        {entry.notes ? (
          <Text style={styles.notes}>“{entry.notes}”</Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(entry)}>
            <Ionicons name="pencil-outline" size={20} color="#CAC6DD" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(entry.id)}>
            <MaterialIcons name="delete-outline" size={20} color="#F66" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>History</Text>

      <Text style={styles.sectionTitle}>🏋️ Gym Workouts</Text>
      {gym.length
        ? gym.map(renderEntry)
        : <Text style={styles.empty}>No gym workouts logged.</Text>
      }

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        🎽 Other Activities
      </Text>
      {other.length
        ? other.map(renderEntry)
        : <Text style={styles.empty}>No other activities logged.</Text>
      }
    </ScrollView></View>
  )
}

const styles = StyleSheet.create({
    screen: {
    flex: 1,
    backgroundColor: '#0E0C15',
  },
  container: {
    padding: 16,
    paddingTop: 70,
    backgroundColor: '#0E0C15',
    paddingBottom: 32,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#AC6AFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#2E2A41',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: { color: '#CAC6DD', fontSize: 14 },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 8 },
  line: { color: '#ADA8C3', fontSize: 14, marginBottom: 4 },
  bold: { color: '#FFFFFF', fontWeight: '600' },
  notes: { fontStyle: 'italic', color: '#757185', marginTop: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    spaceX: 16,
  },
  empty: { color: '#ADA8C3', textAlign: 'center', marginBottom: 12 },
})