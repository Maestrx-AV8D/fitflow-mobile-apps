// src/screens/Dashboard.tsx
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import WeeklyWorkoutsChart from '../components/WeeklyWorkoutChart'
import {
  getUserName,
  getEntryCount,
  getExercisesCompleted,
  getLatestWorkoutDate,
  getLast7DaysWorkouts,
  supabase,
} from '../lib/api'
import { format } from 'date-fns'

export default function Dashboard() {
  const [name, setName] = useState('')
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [exercisesCompleted, setExercisesCompleted] = useState(0)
  const [latestWorkout, setLatestWorkout] = useState('—')
  const [chartData, setChartData] = useState<any[]>([])
  const nav = useNavigation()

  useEffect(() => {
  ;(async () => {
    setName(await getUserName())
    setTotalWorkouts(await getEntryCount())
    setExercisesCompleted(await getExercisesCompleted())
    const latest = await getLatestWorkoutDate()
    setLatestWorkout(latest ? format(new Date(latest), 'dd/MM/yyyy') : '—')
    setChartData(await getLast7DaysWorkouts())
  })()
}, [])

async function handleFinish({ experience, goals, equipment }: OnboardValues) {
  const { error } = await supabase
    .from('profiles_onboarding')
    .upsert({
      user_id: supabase.auth.user()?.id,
      experience,
      goals,
      equipment,
    });
  if (error) throw error;
  // mark locally so we skip onboarding next launch
  navigation.replace('Main');
}
  const CARD_MARGIN = 8
  const PADDING = 16
  const { width } = Dimensions.get('window')
  const twoCardWidth = (width - PADDING * 2 - CARD_MARGIN) / 2

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.branding}>FitFlow</Text>
        <Text style={styles.greeting}>Welcome, {name}!</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#7F00FF'}]}>
            <Text style={styles.statLabel}>Workouts Logged</Text>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#00BFA6'}]}>
            <Text style={styles.statLabel}>Exercises Completed</Text>
            <Text style={styles.statValue}>{exercisesCompleted}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFB300'}]}>
            <Text style={styles.statLabel}>Latest Workout</Text>
            <Text style={styles.statValue}>{latestWorkout}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3F3A52' }]}
            onPress={() => nav.navigate('Log' as never)}
          >
            <Text style={styles.actionText}>Log a Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3F3A52' }]}
            onPress={() => nav.navigate('Coach' as never)}
          >
            <Text style={styles.actionText}>Generate Workout Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartWrapper}>
          <Text style={styles.sectionTitle}>Workouts This Week</Text>
          <WeeklyWorkoutsChart data={chartData} />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => nav.navigate('Log' as never)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
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
    paddingBottom: 100,
  },
  branding: {
    fontSize: 32,
    fontWeight: '700',
    color: '#AC6AFF',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'column',
    // flexWrap: 'wrap',
    // justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    color: '#CAC6DD',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chartWrapper: {
    backgroundColor: '#15131D',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#AC6AFF',
    borderRadius: 32,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
})