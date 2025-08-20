// src/screens/History.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  DeviceEventEmitter,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { getEntries, supabase } from '../lib/api'

type Entry = {
  id: number
  date: string
  type: string
  exercises?: { name: string; sets: number; reps: number; weight?: number }[]
  segments?: { distance?: string; laps?: number; time?: string }[]
  notes?: string
}

export default function History() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null)
  const [modalVisible, setModalVisible] = useState<{ gym: boolean; fasting: boolean; other: boolean; insights: boolean }>({
    gym: false,
    fasting: false,
    other: false,
    insights: false
  })
  const navigation = useNavigation()
  const { dark } = useTheme()

  // NEW — controls week-by-week pager in Insights modal
  const [insightsWeekIndex, setInsightsWeekIndex] = useState(0)
  const weekPagerRef = useRef<ScrollView>(null)
  const screenW = Dimensions.get('window').width
  const horizontalPad = 18 // we use 18px side padding inside the card
  const pageW = screenW - horizontalPad * 2

  useEffect(() => {
    refresh()
  }, [])

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      refresh();
      return undefined;
    }, [])
  );

  // Listen for entrySaved events from other screens (e.g., Log)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('fitflow:entrySaved', () => {
      refresh();
    });
    return () => {
      try { sub.remove(); } catch {}
    };
  }, [refresh]);

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
  const fasts = entries.filter(e => e.type === 'Fasting')
  const other = entries.filter(e => e.type !== 'Gym' && e.type !== 'Fasting')
  const thisMonth = new Date().toLocaleString('en-US', { month: 'long' })
  const thisMonthEntries = entries.filter(entry =>
    new Date(entry.date).getMonth() === new Date().getMonth()
  )

  const formatDuration = (segments?: { time?: string }[]) => {
    if (!segments || segments.length === 0) return '—'
    for (const seg of segments) {
      if (seg.time) return seg.time
    }
    return '—'
  }

  const calculateVolume = (exercises?: { sets: number; reps: number; weight?: number }[]) => {
    if (!exercises) return 0
    let volume = 0
    for (const ex of exercises) {
      if (typeof ex.weight === 'number') {
        volume += ex.sets * ex.reps * ex.weight
      } else {
        volume += ex.sets * ex.reps
      }
    }
    return volume
  }

  const renderEntry = (entry: Entry) => {
    const isExpanded = expandedEntryId === entry.id

    const badgeColor =
      {
        Gym: '#AC6AFF',
        Run: '#43E97B',
        Swim: '#5DA5FF',
        Cycle: '#FFC300',
        Fasting: '#FF6A6A',
      }[entry.type] ?? '#AAA'

    const prCount = 0
    const volume = entry.type === 'Gym' ? calculateVolume(entry.exercises) : null
    const duration = formatDuration(entry.segments)

    const toggleExpand = () => {
      setExpandedEntryId(prev => (prev === entry.id ? null : entry.id))
    }

    return (
      <TouchableOpacity
        key={entry.id}
        activeOpacity={0.8}
        onPress={toggleExpand}
        style={[styles.whiteCard, { backgroundColor: '#fff' }]}
      >
        {/* Summary Card */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {entry.type === 'Fasting' ? (
                <MaterialIcons name="timer" size={14} color="#fff" style={{ marginRight: 4 }} />
              ) : entry.type === 'Gym' ? (
                <MaterialIcons name="fitness-center" size={14} color="#fff" style={{ marginRight: 4 }} />
              ) : entry.type === 'Run' ? (
                <Ionicons name="walk" size={14} color="#fff" style={{ marginRight: 4 }} />
              ) : entry.type === 'Swim' ? (
                <Ionicons name="water" size={14} color="#fff" style={{ marginRight: 4 }} />
              ) : entry.type === 'Cycle' ? (
                <MaterialIcons name="directions-bike" size={14} color="#fff" style={{ marginRight: 4 }} />
              ) : null}
              <Text style={styles.badgeText}>{entry.type}</Text>
            </View>
          </View>
          <Text style={[styles.date, { color: dark ? '#fff' : '#1A1A1A' }]}>{new Date(entry.date).toLocaleDateString('en-GB')}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: dark ? '#000' : '#1A1A1A', fontWeight: '600' }]}>Duration</Text>
            <Text style={[styles.summaryValue, { color: dark ? '#000' : '#1A1A1A', fontWeight: '700' }]}>{duration}</Text>
          </View>
          {entry.type === 'Gym' && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: dark ? '#000' : '#1A1A1A', fontWeight: '600' }]}>Volume</Text>
              <Text style={[styles.summaryValue, { color: dark ? '#000' : '#1A1A1A', fontWeight: '700' }]}>{volume}</Text>
            </View>
          )}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: dark ? '#000' : '#1A1A1A', fontWeight: '600' }]}>PRs</Text>
            <Text style={[styles.summaryValue, { color: dark ? '#000' : '#1A1A1A', fontWeight: '700' }]}>{prCount}</Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.detailsSection}>
            {entry.type === 'Gym' && entry.exercises?.length ? (
              <View style={styles.section}>
                {entry.exercises.map((ex, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={[styles.bold, { fontSize: 16, marginBottom: 2, color: dark ? '#000' : '#1A1A1A' }]}>{ex.name}</Text>
                    {[...Array(ex.sets).keys()].map(setIndex => (
                      <Text key={setIndex} style={[styles.line, { color: dark ? '#000' : '#1A1A1A' }]}>
                        Set {setIndex + 1}: {typeof ex.weight === 'number' ? `${ex.weight}kg × ` : ''}{ex.reps} reps
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {entry.type !== 'Gym' && entry.segments?.length ? (
              <View style={styles.section}>
                {entry.segments.map((seg, i) => (
                  <Text key={i} style={[styles.line, { color: dark ? '#000' : '#1A1A1A' }]}>
                    {seg.distance ? `${seg.distance}` : seg.laps ? `${seg.laps} laps` : ''}{seg.distance || seg.laps ? ' - ' : ''}{seg.time ?? ''}
                  </Text>
                ))}
              </View>
            ) : null}

            {entry.notes ? (
              <Text
                style={[
                  styles.notes,
                  entry.type === 'Fasting' && { color: '#FF6A6A', fontWeight: '600' },
                  { color: dark ? '#000' : '#1A1A1A' }
                ]}
              >
                {entry.notes}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(entry)} style={{ marginRight: 12 }}>
                <Ionicons name="pencil-outline" size={20} color={dark ? '#ccc' : '#444'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <MaterialIcons name="delete-outline" size={20} color={dark ? '#ccc' : '#444'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: dark ? '#1A1A1A' : '#FDFCF9' }]}>
        <Text style={[styles.empty, { color: dark ? '#EEE' : '#999' }]}>Loading…</Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: dark ? '#1A1A1A' : '#FDFCF9' }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: dark ? '#fff' : '#1A1A1A' }]}>History</Text>
        {dark ? (
          <View style={[styles.insightsCard, { backgroundColor: '#fff' }]}>
            <View>
              <Text style={[styles.insightsTitle, { color: '#1A1A1A' }]}>{thisMonth}{'\n'}Insights</Text>
              <Text style={[styles.insightsCountLabel, { color: '#666' }]}>Entries</Text>
              <Text style={[styles.insightsCountValue, { color: '#1A1A1A' }]}>{thisMonthEntries.length}</Text>
            </View>
            <TouchableOpacity
              style={[styles.insightsSeeAllButton, { borderColor: '#666' }]}
              onPress={() => setModalVisible(prev => ({ ...prev, insights: true }))}
            >
              <Text style={[styles.insightsSeeAllText, { color: '#666' }]}>See All {'>'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
            <TouchableOpacity
              style={styles.insightsSeeAllButton}
              onPress={() => setModalVisible(prev => ({ ...prev, insights: true }))}
            >
              <Text style={styles.insightsSeeAllText}>See All {'>'}</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Section: Gym Workouts */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0, marginBottom: 6 }}>
            <Ionicons
              name="barbell-outline"
              size={22}
              color={dark ? '#fff' : '#1A1A1A'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#1A1A1A', marginTop: 0, marginBottom: 0 }]}>
              Gym Workouts
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sectionCardButton,
              {
                backgroundColor: '#fff'
              }
            ]}
            onPress={() => setModalVisible(prev => ({ ...prev, gym: true }))}
            activeOpacity={0.85}
          >
            <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.sectionCardButtonText, { color: '#1A1A1A', textAlign: 'center' }]}>
                View Gym History
              </Text>
              <Text style={[styles.sectionCardButtonSubText, { color: '#1A1A1A' }]}>
                Total: {gym.length} logs
              </Text>
            </View>
          </TouchableOpacity>
          <Modal
            visible={modalVisible.gym}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(prev => ({ ...prev, gym: false }))}
          >
            <View style={[styles.modalOverlay, { backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
              <View style={[styles.modalContent, { backgroundColor: dark ? '#1A1A1A' : '#FDFCF9', flex: 1 }]}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="barbell-outline"
                      size={22}
                      color={dark ? '#fff' : '#1A1A1A'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.modalTitle, { color: dark ? '#fff' : '#1A1A1A' }]}>Gym Workouts</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(prev => ({ ...prev, gym: false }))} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={28} color={dark ? '#fff' : '#1A1A1A'} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                  style={{ flex: 1 }}
                >
                  {gym.length ? gym.map(renderEntry) : <Text style={[styles.empty, { color: dark ? '#EEE' : '#999' }]}>No gym workouts logged.</Text>}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Section: Fasting Logs */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0, marginBottom: 6 }}>
            <Ionicons
              name="timer-outline"
              size={22}
              color={dark ? '#fff' : '#1A1A1A'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#1A1A1A', marginTop: 0, marginBottom: 0 }]}>
              Fasting Logs
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sectionCardButton,
              {
                backgroundColor: '#fff'
              }
            ]}
            onPress={() => setModalVisible(prev => ({ ...prev, fasting: true }))}
            activeOpacity={0.85}
          >
            <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.sectionCardButtonText, { color: '#1A1A1A', textAlign: 'center' }]}>
                View Fasting History
              </Text>
              <Text style={[styles.sectionCardButtonSubText, { color: '#1A1A1A' }]}>
                Total: {fasts.length} logs
              </Text>
            </View>
          </TouchableOpacity>
          <Modal
            visible={modalVisible.fasting}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(prev => ({ ...prev, fasting: false }))}
          >
            <View style={[styles.modalOverlay, { backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
              <View style={[styles.modalContent, { backgroundColor: dark ? '#1A1A1A' : '#FDFCF9', flex: 1 }]}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="timer-outline"
                      size={22}
                      color={dark ? '#fff' : '#1A1A1A'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.modalTitle, { color: dark ? '#fff' : '#1A1A1A' }]}>Fasting Logs</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(prev => ({ ...prev, fasting: false }))} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={28} color={dark ? '#fff' : '#1A1A1A'} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                  style={{ flex: 1 }}
                >
                  {fasts.length ? fasts.map(renderEntry) : <Text style={[styles.empty, { color: dark ? '#EEE' : '#999' }]}>No fasting logs yet.</Text>}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Section: Other Activities */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0, marginBottom: 6 }}>
            <Ionicons
              name="bicycle-outline"
              size={22}
              color={dark ? '#fff' : '#1A1A1A'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.sectionTitle, { color: dark ? '#fff' : '#1A1A1A', marginTop: 0, marginBottom: 0 }]}>
              Other Activities
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sectionCardButton,
              {
                backgroundColor: '#fff'
              }
            ]}
            onPress={() => setModalVisible(prev => ({ ...prev, other: true }))}
            activeOpacity={0.85}
          >
            <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.sectionCardButtonText, { color: '#1A1A1A', textAlign: 'center' }]}>
                View Other History
              </Text>
              <Text style={[styles.sectionCardButtonSubText, { color: '#1A1A1A' }]}>
                Total: {other.length} logs
              </Text>
            </View>
          </TouchableOpacity>
          <Modal
            visible={modalVisible.other}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(prev => ({ ...prev, other: false }))}
          >
            <View style={[styles.modalOverlay, { backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
              <View style={[styles.modalContent, { backgroundColor: dark ? '#1A1A1A' : '#FDFCF9', flex: 1 }]}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="bicycle-outline"
                      size={22}
                      color={dark ? '#fff' : '#1A1A1A'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.modalTitle, { color: dark ? '#fff' : '#1A1A1A' }]}>Other Activities</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(prev => ({ ...prev, other: false }))} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={28} color={dark ? '#fff' : '#1A1A1A'} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                  style={{ flex: 1 }}
                >
                  {other.length ? other.map(renderEntry) : <Text style={[styles.empty, { color: dark ? '#EEE' : '#999' }]}>No other activities logged.</Text>}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Insights Modal */}
        <Modal
          visible={modalVisible.insights}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(prev => ({ ...prev, insights: false }))}
        >
          <View style={[styles.modalOverlay, { backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
            <View style={[styles.modalContent, { backgroundColor: dark ? '#1A1A1A' : '#FDFCF9', maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: dark ? '#fff' : '#1A1A1A' }]}>{thisMonth} Insights</Text>
                <TouchableOpacity onPress={() => setModalVisible(prev => ({ ...prev, insights: false }))} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={28} color={dark ? '#fff' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 0 }}>
                {/* Summary metrics */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginBottom: 20,
                  backgroundColor: dark ? '#23222B' : '#F5F5F8',
                  borderRadius: 18,
                  paddingVertical: 22,
                  paddingHorizontal: 8,
                  marginHorizontal: 18,
                }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: dark ? '#fff' : '#1A1A1A',
                      fontWeight: '800',
                      fontSize: 32,
                      lineHeight: 38,
                      marginBottom: 2,
                    }}>{entries.length}</Text>
                    <Text style={{
                      color: dark ? '#bbb' : '#555',
                      fontSize: 16,
                      fontWeight: '600',
                      lineHeight: 22,
                    }}>Total Logs</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: '#AC6AFF',
                      fontWeight: '800',
                      fontSize: 32,
                      lineHeight: 38,
                      marginBottom: 2,
                    }}>{gym.length}</Text>
                    <Text style={{
                      color: dark ? '#bbb' : '#555',
                      fontSize: 16,
                      fontWeight: '600',
                      lineHeight: 22,
                    }}>Gym</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: '#FF6A6A',
                      fontWeight: '800',
                      fontSize: 32,
                      lineHeight: 38,
                      marginBottom: 2,
                    }}>{fasts.length}</Text>
                    <Text style={{
                      color: dark ? '#bbb' : '#555',
                      fontSize: 16,
                      fontWeight: '600',
                      lineHeight: 22,
                    }}>Fasts</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: '#5DA5FF',
                      fontWeight: '800',
                      fontSize: 32,
                      lineHeight: 38,
                      marginBottom: 2,
                    }}>{other.length}</Text>
                    <Text style={{
                      color: dark ? '#bbb' : '#555',
                      fontSize: 16,
                      fontWeight: '600',
                      lineHeight: 22,
                    }}>Other</Text>
                  </View>
                </View>

                {/* Monthly Activity Overview */}
                <View style={{
                  backgroundColor: dark ? '#23222B' : '#F5F5F8',
                  borderRadius: 18,
                  padding: 18,
                  marginBottom: 16,
                  marginHorizontal: 18,
                  marginTop: 2,
                  }}>
                  <Text style={{
                    color: dark ? '#fff' : '#1A1A1A',
                    fontWeight: '700',
                    fontSize: 22,
                    marginBottom: 8,
                    lineHeight: 28,
                  }}>
                    Monthly Activity Overview
                  </Text>
                  <Text style={{
                    color: dark ? '#fff' : '#1A1A1A',
                    fontSize: 17,
                    lineHeight: 24,
                  }}>
                    <Text style={{ fontWeight: 'bold' }}>Gym:</Text> {gym.length} &nbsp;&nbsp;
                    <Text style={{ fontWeight: 'bold' }}>Fasting:</Text> {fasts.length} &nbsp;&nbsp;
                    <Text style={{ fontWeight: 'bold' }}>Other:</Text> {other.length}
                  </Text>
                </View>

                {/* NEW — Month Pager (Mon–Sun per page, swipeable) */}
                {(() => {
                  const today = new Date()
                  const year = today.getFullYear()
                  const month = today.getMonth()

                  // helper: strip time
                  const asYMD = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
                  const sameDay = (a: Date, b: Date) => asYMD(a).getTime() === asYMD(b).getTime()

                  // get first of month
                  const firstOfMonth = new Date(year, month, 1)
                  const lastOfMonth = new Date(year, month + 1, 0)

                  // we want Monday-start weeks covering the full month
                  const firstWeekStart = (() => {
                    const d = new Date(firstOfMonth)
                    const dow = d.getDay() // 0 Sun,1 Mon,...6 Sat
                    const daysToMonday = (dow + 6) % 7
                    d.setDate(d.getDate() - daysToMonday)
                    return d
                  })()

                  const lastWeekEnd = (() => {
                    const d = new Date(lastOfMonth)
                    const dow = d.getDay()
                    const daysToSunday = (7 - dow) % 7
                    d.setDate(d.getDate() + daysToSunday)
                    return d
                  })()

                  // build weeks (array of arrays of 7 dates)
                  const weeks: Date[][] = []
                  let cursor = new Date(firstWeekStart)
                  while (cursor <= lastWeekEnd) {
                    const week: Date[] = []
                    for (let i = 0; i < 7; i++) {
                      week.push(new Date(cursor))
                      cursor.setDate(cursor.getDate() + 1)
                    }
                    weeks.push(week)
                  }

                  const onMomentumEnd = (e: any) => {
                    const x = e.nativeEvent.contentOffset.x
                    const page = Math.round(x / pageW)
                    setInsightsWeekIndex(page)
                  }

                  const goToPage = (idx: number) => {
                    const clamped = Math.max(0, Math.min(idx, weeks.length - 1))
                    weekPagerRef.current?.scrollTo({ x: clamped * pageW, animated: true })
                    setInsightsWeekIndex(clamped)
                  }

                  const countForDate = (d: Date) => {
                    const dateStr = d.toISOString().slice(0, 10)
                    return entries.filter(e => e.date.slice(0, 10) === dateStr).length
                  }

                  const inThisMonth = (d: Date) => d.getMonth() === month && d.getFullYear() === year

                  return (
                    <View style={{
                      backgroundColor: dark ? '#23222B' : '#F5F5F8',
                      borderRadius: 18,
                      paddingVertical: 14,
                      marginBottom: 16,
                      marginHorizontal: horizontalPad,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 8 }}>
                        <TouchableOpacity onPress={() => goToPage(insightsWeekIndex - 1)} disabled={insightsWeekIndex === 0} style={{ padding: 6, opacity: insightsWeekIndex === 0 ? 0.4 : 1 }}>
                          <Ionicons name="chevron-back" size={22} color={dark ? '#fff' : '#1A1A1A'} />
                        </TouchableOpacity>
                        <Text style={{ flex: 1, textAlign: 'center', color: dark ? '#fff' : '#1A1A1A', fontWeight: '700', fontSize: 18 }}>
                          Weekly Breakdown
                        </Text>
                        <TouchableOpacity onPress={() => goToPage(insightsWeekIndex + 1)} disabled={insightsWeekIndex === weeks.length - 1} style={{ padding: 6, opacity: insightsWeekIndex === weeks.length - 1 ? 0.4 : 1 }}>
                          <Ionicons name="chevron-forward" size={22} color={dark ? '#fff' : '#1A1A1A'} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        ref={weekPagerRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={onMomentumEnd}
                        contentContainerStyle={{}}
                        snapToInterval={pageW}
                        decelerationRate="fast"
                        snapToAlignment="start"
                      >
                        {weeks.map((week, wi) => (
                          <View key={wi} style={{ width: pageW, paddingHorizontal: 6 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              {week.map((d, di) => {
                                const cnt = countForDate(d)
                                const isToday = sameDay(d, today)
                                const muted = !inThisMonth(d)
                                return (
                                  <View
                                    key={`${wi}-${di}`}
                                    style={{
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      paddingVertical: 10,
                                      paddingHorizontal: 6,
                                      borderRadius: 12,
                                      width: Math.floor((pageW - 6 * 2) / 7) - 2, // seven equal slots-ish
                                      backgroundColor: isToday ? (dark ? '#AC6AFF22' : '#EEE5FF') : 'transparent',
                                      opacity: muted ? 0.5 : 1
                                    }}
                                  >
                                    <Text style={{ color: dark ? '#bbb' : '#555', fontSize: 13, fontWeight: '700' }}>
                                      {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                                    </Text>
                                    <Text style={{ color: dark ? '#bbb' : '#555', fontSize: 12, marginBottom: 2 }}>
                                      {d.getDate()}
                                    </Text>
                                    <Text style={{
                                      fontWeight: '800',
                                      color: cnt > 0 ? (dark ? '#AC6AFF' : '#1A1A1A') : (dark ? '#555' : '#bbb'),
                                      fontSize: 20,
                                      lineHeight: 24,
                                    }}>{cnt}</Text>
                                  </View>
                                )
                              })}
                            </View>
                          </View>
                        ))}
                      </ScrollView>

                      {/* page dots */}
                      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                        {weeks.map((_, i) => (
                          <View
                            key={`dot-${i}`}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              marginHorizontal: 4,
                              backgroundColor: i === insightsWeekIndex ? (dark ? '#fff' : '#1A1A1A') : (dark ? '#555' : '#bbb')
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )
                })()}

                {/* Most Active Day */}
                {(() => {
                  const dowCounts: { [key: string]: number } = {}
                  thisMonthEntries.forEach(e => {
                    const d = new Date(e.date)
                    const dow = d.toLocaleDateString('en-US', { weekday: 'long' })
                    dowCounts[dow] = (dowCounts[dow] || 0) + 1
                  })
                  let maxDay: string | null = null, maxCount = 0
                  Object.entries(dowCounts).forEach(([dow, cnt]) => {
                    if (cnt > maxCount) {
                      maxDay = dow
                      maxCount = cnt
                    }
                  })
                  return (
                    <View style={{
                      backgroundColor: dark ? '#23222B' : '#F5F5F8',
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 16,
                      marginHorizontal: 18,
                    }}>
                      <Text style={{
                        color: dark ? '#fff' : '#1A1A1A',
                        fontWeight: '700',
                        fontSize: 22,
                        marginBottom: 8,
                        lineHeight: 28,
                      }}>Most Active Day</Text>
                      {maxDay ? (
                        <Text style={{
                          fontSize: 22,
                          lineHeight: 26,
                          fontWeight: '800',
                          color: dark ? '#AC6AFF' : '#1A1A1A',
                        }}>
                          {maxDay} <Text style={{
                            fontWeight: 'normal',
                            color: dark ? '#bbb' : '#888',
                            fontSize: 17,
                          }}>({maxCount} logs)</Text>
                        </Text>
                      ) : (
                        <Text style={{
                          color: dark ? '#bbb' : '#888',
                          fontSize: 18,
                          lineHeight: 22,
                        }}>No logs this month</Text>
                      )}
                    </View>
                  )
                })()}

                {/* Average Logs Per Week */}
                {(() => {
                  const now = new Date()
                  const year = now.getFullYear()
                  const month = now.getMonth()
                  function getWeekNumber(d: Date) {
                    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
                    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7))
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
                    const weekNo = Math.ceil((((d as any)- (yearStart as any))/86400000 + 1)/7)
                    return weekNo
                  }
                  const weeksSet = new Set<number>()
                  const weekCounts: { [week: number]: number } = {}
                  thisMonthEntries.forEach(e => {
                    const d = new Date(e.date)
                    if (d.getMonth() === month && d.getFullYear() === year) {
                      const week = getWeekNumber(d)
                      weeksSet.add(week)
                      weekCounts[week] = (weekCounts[week] || 0) + 1
                    }
                  })
                  const numWeeks = weeksSet.size || 1
                  const avg = thisMonthEntries.length / numWeeks
                  return (
                    <View style={{
                      backgroundColor: dark ? '#23222B' : '#F5F5F8',
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 16,
                      marginHorizontal: 18,
                    }}>
                      <Text style={{
                        color: dark ? '#fff' : '#1A1A1A',
                        fontWeight: '700',
                        fontSize: 22,
                        marginBottom: 8,
                        lineHeight: 28,
                      }}>Average Logs Per Week</Text>
                      <Text style={{
                        fontSize: 22,
                        lineHeight: 26,
                        fontWeight: '800',
                        color: dark ? '#43E97B' : '#1A1A1A',
                      }}>
                        {avg.toFixed(1)}
                        <Text style={{
                          fontWeight: 'normal',
                          color: dark ? '#bbb' : '#888',
                          fontSize: 17,
                        }}> logs/week</Text>
                      </Text>
                    </View>
                  )
                })()}

                {/* Category Distribution */}
                {(() => {
                  const total = gym.length + fasts.length + other.length
                  const perc = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100)
                  return (
                    <View style={{
                      backgroundColor: dark ? '#23222B' : '#F5F5F8',
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 12,
                      marginHorizontal: 18,
                    }}>
                      <Text style={{
                        color: dark ? '#fff' : '#1A1A1A',
                        fontWeight: '700',
                        fontSize: 22,
                        marginBottom: 12,
                        lineHeight: 28,
                      }}>Category Distribution</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <MaterialIcons name="fitness-center" size={32} color="#AC6AFF" style={{ marginBottom: 4 }} />
                          <Text style={{
                            fontWeight: '800',
                            color: '#AC6AFF',
                            fontSize: 22,
                            lineHeight: 26,
                          }}>{perc(gym.length)}%</Text>
                          <Text style={{
                            color: dark ? '#bbb' : '#555',
                            fontSize: 16,
                            lineHeight: 22,
                            fontWeight: '600',
                          }}>Gym</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <MaterialIcons name="timer" size={32} color="#FF6A6A" style={{ marginBottom: 4 }} />
                          <Text style={{
                            fontWeight: '800',
                            color: '#FF6A6A',
                            fontSize: 22,
                            lineHeight: 26,
                          }}>{perc(fasts.length)}%</Text>
                          <Text style={{
                            color: dark ? '#bbb' : '#555',
                            fontSize: 16,
                            lineHeight: 22,
                            fontWeight: '600',
                          }}>Fasting</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Ionicons name="walk" size={32} color="#5DA5FF" style={{ marginBottom: 4 }} />
                          <Text style={{
                            fontWeight: '800',
                            color: '#5DA5FF',
                            fontSize: 22,
                            lineHeight: 26,
                          }}>{perc(other.length)}%</Text>
                          <Text style={{
                            color: dark ? '#bbb' : '#555',
                            fontSize: 16,
                            lineHeight: 22,
                            fontWeight: '600',
                          }}>Other</Text>
                        </View>
                      </View>
                    </View>
                  )
                })()}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
    paddingBottom: 140
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 32,
  },
  insightsCard: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  insightsTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12
  },
  insightsCountLabel: {
    fontSize: 14,
    color: '#ccc'
  },
  insightsCountValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff'
  },
  insightsSeeAllButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsSeeAllText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  whiteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  date: {
    fontSize: 14,
    fontWeight: '600'
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 16,
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8
  },
  section: {
    marginBottom: 12
  },
  line: {
    fontSize: 14,
    marginBottom: 2
  },
  bold: {
    fontWeight: '600'
  },
  notes: {
    fontStyle: 'italic',
    color: '#333',
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
  },
  sectionButton: {
    // Deprecated
  },
  sectionButtonText: {
    // Deprecated
  },
  sectionCardButton: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sectionCardButtonText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  sectionCardButtonSubText: {
    color: '#888',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalContent: {
    flex: 1,
    maxHeight: '95%', // raise the sheet higher to cover the "History" title
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    transform: [{ translateY: -12 }] // nudge upward a bit more
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700'
  },
  modalCloseButton: {
    padding: 4
  }
})