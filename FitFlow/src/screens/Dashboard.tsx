// // src/screens/Dashboard.tsx
// import React, { useEffect, useState } from 'react'
// import {
//   ScrollView,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native'
// import { MaterialIcons } from '@expo/vector-icons'
// import { useNavigation } from '@react-navigation/native'

// import WeeklyWorkoutsChart from '../components/WeeklyWorkoutChart'
// import {
//   getUserName,
//   getEntryCount,
//   getExercisesCompleted,
//   getLatestWorkoutDate,
//   getLast7DaysWorkouts,
//   supabase,
// } from '../lib/api'
// import { format } from 'date-fns'

// export default function Dashboard() {
//   const [name, setName] = useState('')
//   const [totalWorkouts, setTotalWorkouts] = useState(0)
//   const [exercisesCompleted, setExercisesCompleted] = useState(0)
//   const [latestWorkout, setLatestWorkout] = useState('—')
//   const [chartData, setChartData] = useState<any[]>([])
//   const nav = useNavigation()

//   useEffect(() => {
//   ;(async () => {
//     setName(await getUserName())
//     setTotalWorkouts(await getEntryCount())
//     setExercisesCompleted(await getExercisesCompleted())
//     const latest = await getLatestWorkoutDate()
//     setLatestWorkout(latest ? format(new Date(latest), 'dd/MM/yyyy') : '—')
//     setChartData(await getLast7DaysWorkouts())
//   })()
// }, [])

// async function handleFinish({ experience, goals, equipment }: OnboardValues) {
//   const { error } = await supabase
//     .from('profiles_onboarding')
//     .upsert({
//       user_id: supabase.auth.user()?.id,
//       experience,
//       goals,
//       equipment,
//     });
//   if (error) throw error;
//   // mark locally so we skip onboarding next launch
//   navigation.replace('Main');
// }
//   const CARD_MARGIN = 8
//   const PADDING = 16
//   const { width } = Dimensions.get('window')
//   const twoCardWidth = (width - PADDING * 2 - CARD_MARGIN) / 2

//   return (
//     <View style={styles.screen}>
//       <ScrollView contentContainerStyle={styles.container}>
//         <Text style={styles.branding}>FitFlow</Text>
//         <Text style={styles.greeting}>Welcome, {name}!</Text>

//         <View style={styles.statsRow}>
//           <View style={[styles.statCard, { backgroundColor: '#7F00FF'}]}>
//             <Text style={styles.statLabel}>Workouts Logged</Text>
//             <Text style={styles.statValue}>{totalWorkouts}</Text>
//           </View>
//           <View style={[styles.statCard, { backgroundColor: '#00BFA6'}]}>
//             <Text style={styles.statLabel}>Exercises Completed</Text>
//             <Text style={styles.statValue}>{exercisesCompleted}</Text>
//           </View>
//           <View style={[styles.statCard, { backgroundColor: '#FFB300'}]}>
//             <Text style={styles.statLabel}>Latest Workout</Text>
//             <Text style={styles.statValue}>{latestWorkout}</Text>
//           </View>
//         </View>

//         <View style={styles.actionsRow}>
//           <TouchableOpacity
//             style={[styles.actionButton, { backgroundColor: '#3F3A52' }]}
//             onPress={() => nav.navigate('Log' as never)}
//           >
//             <Text style={styles.actionText}>Log a Workout</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.actionButton, { backgroundColor: '#3F3A52' }]}
//             onPress={() => nav.navigate('Coach' as never)}
//           >
//             <Text style={styles.actionText}>Generate Workout Plan</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.chartWrapper}>
//           <Text style={styles.sectionTitle}>Workouts This Week</Text>
//           <WeeklyWorkoutsChart data={chartData} />
//         </View>
//       </ScrollView>

//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => nav.navigate('Log' as never)}
//       >
//         <MaterialIcons name="add" size={28} color="#FFFFFF" />
//       </TouchableOpacity>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: '#0E0C15',
//   },
//   container: {
//     padding: 16,
//     paddingTop: 70,
//     paddingBottom: 100,
//   },
//   branding: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#AC6AFF',
//     marginBottom: 8,
//   },
//   greeting: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: 16,
//   },
//   statsRow: {
//     flexDirection: 'column',
//     // flexWrap: 'wrap',
//     // justifyContent: 'space-between',
//     marginBottom: 24,
//   },
//   statCard: {
//     width: '100%',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statLabel: {
//     color: '#CAC6DD',
//     fontSize: 12,
//     textTransform: 'uppercase',
//     marginBottom: 8,
//   },
//   statValue: {
//     color: '#FFFFFF',
//     fontSize: 28,
//     fontWeight: '700',
//   },
//   actionsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 24,
//   },
//   actionButton: {
//     flex: 1,
//     marginHorizontal: 4,
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   actionText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   chartWrapper: {
//     backgroundColor: '#15131D',
//     borderRadius: 24,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 4,
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: 12,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 24,
//     right: 24,
//     backgroundColor: '#AC6AFF',
//     borderRadius: 32,
//     padding: 12,
//     shadowColor: '#000',
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     elevation: 5,
//   },
// })

// src/screens/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isBefore,
  isAfter,
  differenceInSeconds,
  subDays
} from 'date-fns'
import { MaterialIcons } from '@expo/vector-icons'
import { Ionicons } from '@expo/vector-icons'

import WeeklyWorkoutsChart from '../components/WeeklyWorkoutChart'
import {
  getUserName,
  getEntryCount,
  getExercisesCompleted,
  getLatestWorkoutDate,
  getLast7DaysWorkouts,
  supabase
} from '../lib/api'
import { useTheme } from '../theme/theme'

export default function Dashboard() {
  const { colors, spacing, typography } = useTheme()
  const nav = useNavigation()
  const flatListRef = useRef<FlatList>(null)

  const [name, setName] = useState('')
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [exercisesCompleted, setExercisesCompleted] = useState(0)
  const [latestWorkout, setLatestWorkout] = useState('—')
  const [chartData, setChartData] = useState<any[]>([])
  const [weekDays, setWeekDays] = useState<Date[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [daySummary, setDaySummary] = useState<string>('')
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      const userName = await getUserName()
      setName(userName)

      setTotalWorkouts(await getEntryCount())
      setExercisesCompleted(await getExercisesCompleted())
      const latest = await getLatestWorkoutDate()
      setLatestWorkout(latest ? format(new Date(latest), 'dd/MM/yyyy') : '—')
      setChartData(await getLast7DaysWorkouts())

      const days = generateDateRange()
      setWeekDays(days)

      const today = new Date()
      const todayInRange = days.find((d) => isSameDay(d, today))
      const defaultDate = todayInRange || days[0]
      setSelectedDate(defaultDate)

      const index = days.findIndex((d) => isSameDay(d, defaultDate))
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true })
        }, 300)
      }

      await calculateStreak()
    })()
  }, [])

  useEffect(() => {
    if (selectedDate) fetchDaySummary()
  }, [selectedDate])

  const fetchDaySummary = async () => {
    const start = new Date(selectedDate!)
    start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate!)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (error) {
      console.error('Fetch error:', error)
      setDaySummary('')
      return
    }

    if (!data || data.length === 0) {
      setDaySummary('')
      return
    }

    const exerciseCount = data.reduce(
      (sum, entry) => sum + (entry.exercises?.length || 0),
      0
    )

    setDaySummary(
      `You completed ${data.length} workout${data.length > 1 ? 's' : ''} and logged ${exerciseCount} exercise${exerciseCount > 1 ? 's' : ''}.`
    )
  }

  const calculateStreak = async () => {
    let streak = 0
    let dayCursor = new Date()

    while (true) {
      const start = new Date(dayCursor)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dayCursor)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('workouts')
        .select('id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      if (error || !data || data.length === 0) break

      streak += 1
      dayCursor = subDays(dayCursor, 1)
    }

    setStreak(streak)
  }

  const generateDateRange = () => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 1 })
    return Array.from({ length: 14 }, (_, i) => addDays(addDays(start, -7), i))
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours()
    const base =
      hour < 12
        ? 'good morning'
        : hour < 18
        ? 'good afternoon'
        : 'good evening'
    return name ? `${base}, ${name}!` : `${base}.`
  }

  const handleDatePress = (date: Date) => {
    setSelectedDate(date)
  }

  const renderDateContent = () => {
    const now = new Date()
    if (!selectedDate) return null

    if (isBefore(selectedDate, now)) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm }}>
            Summary of {format(selectedDate, 'EEEE')}
          </Text>
          {daySummary ? (
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: spacing.md }}>
              {daySummary}
            </Text>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', fontStyle: 'italic' }}>
              No logs for this day.
            </Text>
          )}
        </View>
      )
    } else if (isAfter(selectedDate, now)) {
      const secondsLeft = differenceInSeconds(selectedDate, now)
      const hours = Math.floor(secondsLeft / 3600)
      const minutes = Math.floor((secondsLeft % 3600) / 60)
      const seconds = secondsLeft % 60

      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm }}>
            Tomorrow's activities will be ready in
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: spacing.md }}>
            {`${hours}h ${minutes}min ${seconds}s`}
          </Text>
        </View>
      )
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm }}>
          Daily Check-In
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: spacing.md }}>
          Reflect on today!
        </Text>
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Continue</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.streakBox}>
            <MaterialIcons name="local-fire-department" size={22} color="#FF6D00" />
            <Text style={{ marginLeft: 6, fontWeight: '600', color: colors.textPrimary }}>{streak}</Text>
          </View>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {getTimeGreeting()}
          </Text>
          <TouchableOpacity onPress={() => nav.navigate('Profile' as never)}>
            <Ionicons name="person-circle-outline" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={weekDays}
          keyExtractor={(item) => item.toDateString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
          renderItem={({ item }) => {
            const dayLabel = format(item, 'E')
            const dateNumber = format(item, 'd')
            const isSelected = selectedDate && isSameDay(item, selectedDate)

            return (
              <TouchableOpacity
                onPress={() => handleDatePress(item)}
                style={[
                  styles.dateItem,
                  {
                    backgroundColor: isSelected ? colors.surface : 'transparent',
                    borderColor: isSelected ? colors.border : 'transparent',
                  },
                ]}
              >
                <Text style={{
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                  textAlign: 'center',
                }}>
                  {dayLabel}
                </Text>
                <Text style={{
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: 16,
                  textAlign: 'center',
                }}>
                  {dateNumber}
                </Text>
              </TouchableOpacity>
            )
          }}
        />

        {renderDateContent()}

        <View style={styles.chartWrapper}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: 8 }]}>
            Workouts This Week
          </Text>
          <WeeklyWorkoutsChart data={chartData} />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => nav.navigate('Log' as never)}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 100 },
  topBar: {
    marginTop: 70,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateStrip: { flexDirection: 'row', marginBottom: 24 },
  dateItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  card: { padding: 24, borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  ctaButton: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999 },
  chartWrapper: { padding: 16, borderRadius: 16, backgroundColor: '#15131D' },
  fab: { position: 'absolute', right: 24, bottom: 24, padding: 16, borderRadius: 999, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2 },
})