// src/screens/History.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useNavigation, useTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import {
  Alert,
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
  const [modalVisible, setModalVisible] = useState<{ gym: boolean; fasting: boolean; other: boolean }>({
    gym: false,
    fasting: false,
    other: false
  })
  const navigation = useNavigation()
  const { dark } = useTheme()

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
  const fasts = entries.filter(e => e.type === 'Fasting')
  const other = entries.filter(
    e => e.type !== 'Gym' && e.type !== 'Fasting'
  )
  const thisMonth = new Date().toLocaleString('en-US', { month: 'long' })
  const thisMonthEntries = entries.filter(entry =>
    new Date(entry.date).getMonth() === new Date().getMonth()
  )

  const formatDuration = (segments?: { time?: string }[]) => {
    if (!segments || segments.length === 0) return '—'
    // Try to find time in segments, else placeholder
    for (const seg of segments) {
      if (seg.time) return seg.time
    }
    return '—'
  }

  const calculateVolume = (exercises?: { sets: number; reps: number; weight?: number }[]) => {
    if (!exercises) return 0
    let volume = 0
    for (const ex of exercises) {
      if (ex.weight) {
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

    // Placeholder PR count - could be enhanced with real data
    const prCount = 0

    // Calculate volume for gym workouts
    const volume = entry.type === 'Gym' ? calculateVolume(entry.exercises) : null

    // Duration from segments or placeholder
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
                        Set {setIndex + 1}: {ex.weight ? `${ex.weight}kg × ` : ''}{ex.reps} reps
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
            <TouchableOpacity style={[styles.insightsSeeAllButton, { borderColor: '#666' }]}>
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
            <TouchableOpacity style={styles.insightsSeeAllButton}>
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
    // Deprecated, replaced by sectionCardButton
  },
  sectionButtonText: {
    // Deprecated, replaced by sectionCardButtonText
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
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700'
  },
  modalCloseButton: {
    padding: 4
  }
})