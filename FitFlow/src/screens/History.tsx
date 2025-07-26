// src/screens/History.tsx
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { supabase, getEntries } from '../lib/api'
import { LinearGradient } from 'expo-linear-gradient'

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
        }
      }
    ])
  }

  function handleEdit(entry: Entry) {
    navigation.navigate('Log' as never, { entry } as never)
  }

  const gym = entries.filter(e => e.type === 'Gym')
  const other = entries.filter(e => e.type !== 'Gym')

  const thisMonth = new Date().toLocaleString('en-US', { month: 'long' })
  const thisMonthEntries = entries.filter(entry =>
    new Date(entry.date).getMonth() === new Date().getMonth()
  )

  const renderEntry = (entry: Entry) => {
    const badgeColor =
      {
        Gym: '#AC6AFF',
        Run: '#43E97B',
        Swim: '#5DA5FF',
        Cycle: '#FFC300'
      }[entry.type] ?? '#AAA'

    return (
      <View key={entry.id} style={styles.whiteCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{new Date(entry.date).toLocaleDateString('en-GB')}</Text>
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
          <TouchableOpacity onPress={() => handleEdit(entry)} style={{ marginRight: 12 }}>
            <Ionicons name="pencil-outline" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(entry.id)}>
            <MaterialIcons name="delete-outline" size={20} color="#D33" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#FDFCF9' }]}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#FDFCF9' }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A']}
          style={styles.insightsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View>
            <Text style={styles.insightsTitle}>{thisMonth}{'\n'}Insights</Text>
            <Text style={styles.insightsCountLabel}>Entries</Text>
            <Text style={styles.insightsCountValue}>{thisMonthEntries.length}</Text>
          </View>
          <TouchableOpacity style={styles.insightsAction}>
            <Text style={styles.insightsSeeAll}>See All {'>'}</Text>
          </TouchableOpacity>
        </LinearGradient>

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
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  container: {
    padding: 16,
    paddingTop: 70,
    paddingBottom: 100
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12
  },
  insightsCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  insightsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12
  },
  insightsCountLabel: {
    fontSize: 14,
    color: '#ccc'
  },
  insightsCountValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff'
  },
  insightsAction: {
    position: 'absolute',
    top: 20,
    right: 24
  },
  insightsSeeAll: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500'
  },
  whiteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  date: {
    color: '#333',
    fontSize: 14
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  section: {
    marginBottom: 8
  },
  line: {
    color: '#444',
    fontSize: 14,
    marginBottom: 4
  },
  bold: {
    fontWeight: '600',
    color: '#1A1A1A'
  },
  notes: {
    fontStyle: 'italic',
    color: '#777',
    marginTop: 4
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12
  },
  empty: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 12
  }
})