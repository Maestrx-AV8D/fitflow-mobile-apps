import { useNavigation } from '@react-navigation/native';
import {
  add,
  addDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfToday,
} from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSchedule, saveSchedule, saveToHistory } from '../lib/api';
import { useTheme } from '../theme/theme';

export default function Schedule() {
  const navigation = useNavigation<any>();
  const [plan, setPlan] = useState<Array<any>>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [warmUpList, setWarmUpList] = useState<{ name: string; sets: string; reps: string }[]>([
    { name: '', sets: '', reps: '' },
  ]);
  const [mainSetList, setMainSetList] = useState<{ name: string; sets: string; reps: string }[]>([
    { name: '', sets: '', reps: '' },
  ]);
  const [coolDownList, setCoolDownList] = useState<{ name: string; sets: string; reps: string }[]>([
    { name: '', sets: '', reps: '' },
  ]);
  const [sessionType, setSessionType] = useState('Gym');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const { colors, spacing, typography } = useTheme();

  useEffect(() => {
    (async () => {
      const stored = await getSchedule();
      setPlan(stored);
    })();
  }, []);

  const persist = async (newPlan: Array<any>) => {
    setPlan(newPlan);
    await saveSchedule(newPlan);
  };

  const filtered = plan.filter(
    (d) =>
      (showCompleted ? true : !d.done) &&
      d.type === sessionType
  );
  // Sort filtered by date ascending so nearest upcoming date appears first
  const sortedFiltered = [...filtered].sort((a, b) =>
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  async function completeDay(idx: number) {
    // Prevent completion if frozen
    if (plan[idx]?.frozen) return;
    const updated = plan.map((d, i) =>
      i === idx ? { ...d, done: true } : d
    );
    // Save updated schedule
    persist(updated);

    // Prepare history entry
    const completedItem = updated[idx];
    const historyEntry: any = {
      date: completedItem.date,
      type: completedItem.type,
      notes: '',
      exercises: [],
      segments: [],
    };
    if (completedItem.type === 'Gym') {
      historyEntry.exercises = (completedItem.mainSet || []).map((s: string) => {
        const [name, rest = ''] = s.split(':');
        const sets = rest.match(/(\d+)×/)?.[1] || '';
        const reps = rest.match(/×(\d+)/)?.[1] || '';
        return { name: name.trim(), sets, reps, weight: '' };
      });
    } else {
      historyEntry.segments = [
        {
          type: completedItem.type,
          time: completedItem.time || '',
          distance: completedItem.distance || '',
        },
      ];
    }
    // Save to history (placeholder if not implemented)
    try {
      if (typeof saveToHistory === 'function') {
        await saveToHistory(historyEntry);
      } else {
        // fallback placeholder
        // eslint-disable-next-line no-console
        console.log('History entry:', historyEntry);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Failed to save to history:', error);
    }
  }

  // Toggle frozen state for a specific item
  function toggleFreeze(idx: number) {
    const updated = plan.map((d, i) =>
      i === idx ? { ...d, frozen: !d.frozen } : d
    );
    persist(updated);
  }

  function removeDay(idx: number) {
    const updated = plan.filter((_, i) => i !== idx);
    persist(updated);
  }

  function importToLog(day: any, exercise?: string) {
    const entry: any = {
      date: day.date,
      type: day.type || 'Gym',
      notes: exercise || day.mainSet?.join(', '),
      exercises: [],
      segments: [],
    };
    if (exercise) {
      const [name, rest = ''] = exercise.split(':');
      const sets = rest.match(/(\d+)×/)?.[1] || '';
      const reps = rest.match(/×(\d+)/)?.[1] || '';
      entry.exercises = [
        { name: name.trim(), sets, reps, weight: '' },
      ];
    } else if (day.type === 'Gym') {
      entry.exercises = (day.mainSet || []).map((s: string) => {
        const [name, rest = ''] = s.split(':');
        const sets = rest.match(/(\d+)×/)?.[1] || '';
        const reps = rest.match(/×(\d+)/)?.[1] || '';
        return { name: name.trim(), sets, reps, weight: '' };
      });
    } else {
      entry.segments = [
        {
          type: day.type,
          time: day.time || '',
          distance: day.distance || '',
        },
      ];
    }
    navigation.navigate('Log', { entry });
  }

  function handleManualScheduleSubmit() {
    if (!selectedDate) {
      Alert.alert('Missing Date', 'Please select a date.');
      return;
    }
    const today = new Date();
    const limit = addDays(today, 7);
    if (isBefore(limit, selectedDate)) {
      Alert.alert('Too Far Ahead', 'You can only schedule within 7 days from today.');
      return;
    }

    const isoDate = format(selectedDate, 'yyyy-MM-dd');
    const newDay: any = {
      date: isoDate,
      type: sessionType,
      done: false,
      frozen: false,
    };

    if (sessionType === 'Gym') {
      // Format: "Bench Press: 3×10"
      newDay.warmUp = warmUpList
        .filter((e) => e.name.trim() !== '')
        .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ''}`);
      newDay.mainSet = mainSetList
        .filter((e) => e.name.trim() !== '')
        .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ''}`);
      newDay.coolDown = coolDownList
        .filter((e) => e.name.trim() !== '')
        .map((e) => `${e.name}${e.sets && e.reps ? `: ${e.sets}×${e.reps}` : ''}`);
    } else {
      newDay.time = duration;
      newDay.distance = distance;
    }

    persist([...plan, newDay]);
    setSelectedDate(null);
    setWarmUpList([{ name: '', sets: '', reps: '' }]);
    setMainSetList([{ name: '', sets: '', reps: '' }]);
    setCoolDownList([{ name: '', sets: '', reps: '' }]);
    setDuration('');
    setDistance('');
  }

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    add(startOfToday(), { days: i })
  );
  // Shared header height constant for consistent vertical spacing
  // Adjusted header height to ensure full visibility of first schedule item
  // Reduce header heights by ~30% for mobile compression
  const HEADER_HEIGHT_GYM = 500;
  const HEADER_HEIGHT_OTHER = 375;
  const HEADER_HEIGHT = sessionType === 'Gym' ? HEADER_HEIGHT_GYM : HEADER_HEIGHT_OTHER;
  const FLATLIST_PADDING_TOP = HEADER_HEIGHT + 32;

  return (
    <View style={{ flex: 1 }}>
      {/* Fixed Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: colors.background,
          paddingTop: 68, // increased from 56 to push header content lower
          paddingBottom: 0,
          paddingHorizontal: 12, // reduced from 16
          height: HEADER_HEIGHT,
        }}
      >
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8, fontSize: 28 }]}>
          Schedule
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 8, // reduced from 12
            padding: 11, // reduced from 16
            marginBottom: 0,
            minHeight: 200, // reduced from 290
            justifyContent: 'flex-start',
          }}
        >
          <Text style={[typography.h3, { color: colors.textPrimary, fontSize: 18 }]}>
            Create a Session
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Schedule up to 7 days in advance
          </Text>

          {/* Date Picker */}
          <FlatList
            horizontal
            data={weekDates}
            keyExtractor={(item) => item.toISOString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 8 }}
            renderItem={({ item }) => {
              const isSelected = selectedDate && isSameDay(item, selectedDate);
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(item)}
                  style={{
                    paddingVertical: 5, // reduced from 8
                    paddingHorizontal: 8, // reduced from 12
                    marginRight: 5, // reduced from 8
                    borderRadius: 7, // reduced from 10
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFF' : colors.textPrimary,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    {format(item, 'EEE')}
                  </Text>
                  <Text style={{ color: isSelected ? '#FFF' : colors.textSecondary, fontSize: 12 }}>
                    {format(item, 'dd MMM')}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Session Type */}
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Type of session</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {['Gym', 'Run', 'Swim', 'Cycle', 'Other'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSessionType(type)}
                style={{
                  backgroundColor:
                    sessionType === type ? colors.primary : colors.inputBackground,
                  paddingVertical: 7, // reduced from 10
                  paddingHorizontal: 11, // reduced from 16
                  borderRadius: 6, // reduced from 8
                  marginRight: 5, // reduced from 8
                  marginTop: 4, // reduced from 6
                }}
              >
                <Text style={{ color: sessionType === type ? '#FFF' : colors.textPrimary, fontSize: 16 }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Distance + Duration Input for non-Gym */}
          {sessionType !== 'Gym' && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Duration (min)
              </Text>
              <TextInput
                value={duration}
                keyboardType="numeric"
                onChangeText={setDuration}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 8, // reduced from 12
                  borderRadius: 7, // reduced from 10
                  marginTop: 2, // reduced from 4
                  color: colors.textPrimary,
                }}
                placeholder="e.g. 30 (minutes)"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 12, marginTop: 5, color: colors.textSecondary }}>
                Distance (km)
              </Text>
              <TextInput
                value={distance}
                keyboardType="numeric"
                onChangeText={setDistance}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 8, // reduced from 12
                  borderRadius: 7, // reduced from 10
                  marginTop: 2, // reduced from 4
                  color: colors.textPrimary,
                }}
                placeholder="e.g. 5.0 (kilometers)"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}
          {/* Exercise Inputs (Gym Only) */}
          {sessionType === 'Gym' && (
            <ScrollView
              style={{ maxHeight: 230, marginVertical: 4 }}
              contentContainerStyle={{ paddingBottom: 6 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* Warm-Up */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                Warm-Up
              </Text>
              {warmUpList.map((exercise, idx) => (
                <View key={`warm-${idx}`} style={{ marginTop: 2, flexDirection: 'row', gap: 4 }}>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={exercise.name}
                      placeholder="Exercise"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8, // reduced from 12
                        borderRadius: 7, // reduced from 10
                        fontSize: 14, // reduced from 16
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...warmUpList];
                        updated[idx] = { ...updated[idx], name: text };
                        setWarmUpList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.sets}
                      placeholder="Sets"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...warmUpList];
                        updated[idx] = { ...updated[idx], sets: text };
                        setWarmUpList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.reps}
                      placeholder="Reps"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...warmUpList];
                        updated[idx] = { ...updated[idx], reps: text };
                        setWarmUpList(updated);
                      }}
                    />
                  </View>
                  {warmUpList.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setWarmUpList(warmUpList.filter((_, i) => i !== idx))
                      }
                      style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 2 }}
                    >
                      <Text style={{ color: colors.error, fontSize: 12 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setWarmUpList([...warmUpList, { name: '', sets: '', reps: '' }])}
              >
                <Text
                  style={{ color: colors.accent, fontWeight: '600', marginVertical: 4, fontSize: 14 }}
                >
                  Add Warm-Up
                </Text>
              </TouchableOpacity>

              {/* Main Set */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                Main Set
              </Text>
              {mainSetList.map((exercise, idx) => (
                <View key={`main-${idx}`} style={{ marginTop: 2, flexDirection: 'row', gap: 4 }}>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={exercise.name}
                      placeholder="Exercise"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...mainSetList];
                        updated[idx] = { ...updated[idx], name: text };
                        setMainSetList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.sets}
                      placeholder="Sets"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...mainSetList];
                        updated[idx] = { ...updated[idx], sets: text };
                        setMainSetList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.reps}
                      placeholder="Reps"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...mainSetList];
                        updated[idx] = { ...updated[idx], reps: text };
                        setMainSetList(updated);
                      }}
                    />
                  </View>
                  {mainSetList.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setMainSetList(mainSetList.filter((_, i) => i !== idx))
                      }
                      style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 2 }}
                    >
                      <Text style={{ color: colors.error, fontSize: 12 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setMainSetList([...mainSetList, { name: '', sets: '', reps: '' }])}
              >
                <Text
                  style={{ color: colors.accent, fontWeight: '600', marginVertical: 4, fontSize: 14 }}
                >
                  Add Main Set
                </Text>
              </TouchableOpacity>

              {/* Cool-Down */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                Cool-Down
              </Text>
              {coolDownList.map((exercise, idx) => (
                <View key={`cool-${idx}`} style={{ marginTop: 2, flexDirection: 'row', gap: 4 }}>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={exercise.name}
                      placeholder="Exercise"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...coolDownList];
                        updated[idx] = { ...updated[idx], name: text };
                        setCoolDownList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.sets}
                      placeholder="Sets"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...coolDownList];
                        updated[idx] = { ...updated[idx], sets: text };
                        setCoolDownList(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={exercise.reps}
                      placeholder="Reps"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 8,
                        borderRadius: 7,
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 1,
                      }}
                      onChangeText={(text) => {
                        const updated = [...coolDownList];
                        updated[idx] = { ...updated[idx], reps: text };
                        setCoolDownList(updated);
                      }}
                    />
                  </View>
                  {coolDownList.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setCoolDownList(coolDownList.filter((_, i) => i !== idx))
                      }
                      style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 2 }}
                    >
                      <Text style={{ color: colors.error, fontSize: 12 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setCoolDownList([...coolDownList, { name: '', sets: '', reps: '' }])}
              >
                <Text
                  style={{ color: colors.accent, fontWeight: '600', marginVertical: 4, fontSize: 14 }}
                >
                  Add Cool-Down
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleManualScheduleSubmit}
            style={{
              marginTop: 10, // reduced from 16
              paddingVertical: 7, // reduced from 10
              paddingHorizontal: 11, // reduced from 16
              borderRadius: 6, // reduced from 8
              backgroundColor: colors.success + '22',
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: colors.success, fontWeight: '600', fontSize: 16 }}>
              Add to Schedule
            </Text>
          </TouchableOpacity>

          {/* Upcoming Section Heading - moved here, always after the last form input */}
          <Text
            style={[
              typography.h3,
              {
                color: colors.textPrimary,
                marginTop: 12, // reduced from 18
                paddingBottom: 6, // reduced from 8
                paddingHorizontal: 2, // reduced from 4
                fontSize: 18, // reduced from 20
              },
            ]}
          >
            Upcoming Schedule
          </Text>
        </View>
      </View>
      {/* FlatList below header */}
      <View style={{ flex: 1, paddingTop: FLATLIST_PADDING_TOP }}>
        <FlatList
          data={sortedFiltered}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          contentContainerStyle={{
            paddingBottom: 70, // reduced from 100
            paddingTop: 100,
          }}
          renderItem={({ item, index }) => (
            <View
              key={`${item.date}-${index}`}
              style={{
                backgroundColor: colors.card,
                borderRadius: 10, // reduced from 14
                padding: 15, // reduced from 20
                marginHorizontal: 12, // reduced from 16
                marginBottom: 12, // reduced from 16
                opacity: item.done ? 0.5 : 1,
              }}
            >
              {item.frozen && (
                <Text
                  style={{
                    fontSize: 12, // reduced from 14
                    fontWeight: '500',
                    color: colors.warning,
                    marginBottom: 2, // reduced from 4
                    marginLeft: 2, // reduced from 4
                  }}
                >
                  Frozen
                </Text>
              )}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 5, // reduced from 8
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {format(parseISO(item.date), 'dd/MM/yy')}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  {/* Freeze/Unfreeze Button REMOVED */}
                  {!item.done && (
                    <TouchableOpacity
                      onPress={() => {
                        if (!item.frozen) completeDay(index);
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '600',
                          color: item.frozen
                            ? colors.textSecondary
                            : colors.success,
                          marginRight: 8, // reduced from 12
                          opacity: item.frozen ? 0.5 : 1,
                          fontSize: 15, // reduced from 18
                        }}
                      >
                        Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => importToLog(item)}>
                    <Text
                      style={{
                        fontWeight: '600',
                        color: colors.accent,
                        marginRight: 8,
                        fontSize: 15,
                      }}
                    >
                      Import
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeDay(index)}>
                    <Text style={{ fontWeight: '600', color: colors.error, fontSize: 15 }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Render based on session type */}
              {item.type === 'Gym' ? (
                ['warmUp', 'mainSet', 'coolDown'].map((sec) => (
                  <View key={sec} style={{ marginTop: 5 }}>
                    <Text
                        style={{
                          fontWeight: '600',
                          marginBottom: 2,
                          color: colors.textSecondary,
                          fontSize: 14,
                        }}
                    >
                      {sec === 'warmUp'
                        ? 'Warm-Up'
                        : sec === 'mainSet'
                        ? 'Main Set'
                        : 'Cool-Down'}
                    </Text>
                    {(item[sec] || []).map((entry: string, j: number) => (
                      <View
                        key={j}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            marginLeft: 2, // reduced from 4
                            marginBottom: 1, // reduced from 2
                            color: colors.textPrimary,
                            fontSize: 14,
                          }}
                        >
                          • {entry}
                        </Text>
                        {sec === 'mainSet' && (
                          <TouchableOpacity
                            onPress={() => importToLog(item, entry)}
                          >
                            <Text
                              style={{
                                fontWeight: '600',
                                color: colors.accent,
                                fontSize: 15,
                              }}
                            >
                              Import
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={{ marginTop: 5 }}>
                  <Text
                    style={{
                      fontWeight: '600',
                      marginBottom: 2,
                      color: colors.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {item.type} Summary
                  </Text>
                  <Text style={{ color: colors.textPrimary, marginBottom: 2, fontSize: 14 }}>
                    • Time: {item.time || '-'} min
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                    • Distance: {item.distance || '-'} km
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}