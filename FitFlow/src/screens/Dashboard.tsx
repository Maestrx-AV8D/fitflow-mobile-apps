// === Dashboard.tsx ===
import React, { useEffect, useState, useRef } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions
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
import { MaterialIcons, Ionicons } from '@expo/vector-icons'

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

const { width } = Dimensions.get('window')

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

    if (error || !data || data.length === 0) {
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

      const { data } = await supabase
        .from('workouts')
        .select('id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      if (!data || data.length === 0) break

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
    const base = hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : 'good evening'
    return name ? `${base}, ${name}!` : `${base}.`
  }

  const handleDatePress = (date: Date) => setSelectedDate(date)

  const inspirations = [
    {
      id: '1',
      title: 'GET INSPIRED',
      content: 'Who matches your adventurous spirit?',
      cta: 'Write it Out',
      icon: '💡',
      author: null
    },
    {
      id: '2',
      title: 'GET INSPIRED',
      content: 'Everybody is talented because everybody who is human has something to express.',
      cta: 'Reflect on It',
      icon: '“',
      author: 'Brenda Ueland'
    }
  ]

  const renderInspirationCarousel = () => (
    <View>
      <FlatList
        data={inspirations}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={width * 0.8 + 16}
        contentContainerStyle={{ paddingLeft: 4, marginBottom: 32 }}
        renderItem={({ item }) => (
          <View style={[styles.inspirationCard, { backgroundColor: colors.surface }]}>

            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: 8, textAlign: 'center'}]}>
              {item.content}
            </Text>
            {item.author && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12, textAlign: 'center' }}>
                {item.author}
              </Text>
            )}
            <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.card }]}>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{item.cta}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )

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
        <Text style={{
                  color:  colors.textSecondary,
                  fontWeight: '700' ,
                  fontSize: 16,
                  textAlign: 'center',
                  marginBottom: 15
                }}>
                  Get Inspired
                </Text>
        {renderInspirationCarousel()}
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
  streakBox: { flexDirection: 'row', alignItems: 'center' },
  dateStrip: { flexDirection: 'row', marginBottom: 24 },
  dateItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  inspirationCard: {
    width: width * 0.8,
    padding: 24,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  ctaButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999
  },
  chartWrapper: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#15131D',
    marginBottom: 50,
    marginTop: 25
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    padding: 16,
    borderRadius: 999,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2
  }
})