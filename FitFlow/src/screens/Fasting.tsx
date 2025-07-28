// // // import React, { useEffect, useState } from 'react'
// // // import {
// // //   Dimensions,
// // //   ScrollView,
// // //   StyleSheet,
// // //   Text,
// // //   TouchableOpacity,
// // //   View,
// // // } from 'react-native'
// // // import FastingTipsCard from '../components/FastingTipsCard'
// // // import ProgressRing from '../components/ProgressRing'
// // // import { useTheme } from '../theme/theme'

// // // const FASTING_TYPES = [
// // //   { label: '16:8', fastingHours: 16, eatingHours: 8 },
// // //   { label: '18:6', fastingHours: 18, eatingHours: 6 },
// // //   { label: '20:4', fastingHours: 20, eatingHours: 4 },
// // //   { label: 'OMAD', fastingHours: 23, eatingHours: 1 },
// // // ]

// // // export default function Fasting() {
// // //   const { colors, spacing, typography } = useTheme()
// // //   const [selectedType, setSelectedType] = useState(FASTING_TYPES[0])
// // //   const [startTime, setStartTime] = useState<Date | null>(null)
// // //   const [elapsed, setElapsed] = useState(0)

// // //   useEffect(() => {
// // //     let interval: any
// // //     if (startTime) {
// // //       interval = setInterval(() => {
// // //         const now = new Date().getTime()
// // //         setElapsed(Math.floor((now - startTime.getTime()) / 1000))
// // //       }, 1000)
// // //     } else {
// // //       setElapsed(0)
// // //     }
// // //     return () => clearInterval(interval)
// // //   }, [startTime])

// // //   const toggleFasting = () => {
// // //     if (startTime) {
// // //       setStartTime(null)
// // //     } else {
// // //       setStartTime(new Date())
// // //     }
// // //   }

// // //   const formatTime = (seconds: number) => {
// // //     const h = Math.floor(seconds / 3600)
// // //     const m = Math.floor((seconds % 3600) / 60)
// // //     const s = seconds % 60
// // //     return `${h.toString().padStart(2, '0')}:${m
// // //       .toString()
// // //       .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
// // //   }

// // //   return (
// // //     <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
// // //       <View style={styles.container}>
// // //         <Text style={[typography.h2, { color: colors.textPrimary }]}>Fasting</Text>

// // //         <View style={styles.pickerRow}>
// // //           {FASTING_TYPES.map((type) => (
// // //             <TouchableOpacity
// // //               key={type.label}
// // //               onPress={() => setSelectedType(type)}
// // //               style={[
// // //                 styles.fastingType,
// // //                 {
// // //                   backgroundColor:
// // //                     selectedType.label === type.label ? colors.primary : colors.card,
// // //                 },
// // //               ]}
// // //             >
// // //               <Text
// // //                 style={{
// // //                   color:
// // //                     selectedType.label === type.label
// // //                       ? colors.surface
// // //                       : colors.textPrimary,
// // //                   fontWeight: '600',
// // //                 }}
// // //               >
// // //                 {type.label}
// // //               </Text>
// // //             </TouchableOpacity>
// // //           ))}
// // //         </View>

// // //         <ProgressRing progress={elapsed / (selectedType.fastingHours * 3600)} time={formatTime(elapsed)} />
// // // <FastingTipsCard phase={startTime ? (elapsed >= selectedType.fastingHours * 3600 ? 'after' : 'during') : 'before'} />

// // //       </View>
// // //     </ScrollView>
// // //   )
// // // }

// // // const { width } = Dimensions.get('window')

// // // const styles = StyleSheet.create({
// // //   container: {
// // //     padding: 24,
// // //     paddingBottom: 64,
// // //   },
// // //   pickerRow: {
// // //     flexDirection: 'row',
// // //     justifyContent: 'space-between',
// // //     marginVertical: 24,
// // //   },
// // //   fastingType: {
// // //     paddingVertical: 12,
// // //     paddingHorizontal: 20,
// // //     borderRadius: 16,
// // //   },
// // //   timerBox: {
// // //     marginTop: 8,
// // //     marginBottom: 32,
// // //     alignItems: 'center',
// // //     padding: 24,
// // //     borderRadius: 24,
// // //     shadowColor: '#000',
// // //     shadowOpacity: 0.05,
// // //     shadowRadius: 6,
// // //   },
// // //   timerButton: {
// // //     marginTop: 16,
// // //     paddingVertical: 10,
// // //     paddingHorizontal: 24,
// // //     borderRadius: 24,
// // //   },
// // //   tipsCard: {
// // //     padding: 20,
// // //     borderRadius: 20,
// // //     shadowColor: '#000',
// // //     shadowOpacity: 0.05,
// // //     shadowRadius: 4,
// // //     elevation: 2,
// // //   },
// // //   tip: {
// // //     marginTop: 8,
// // //     lineHeight: 20,
// // //     fontSize: 14,
// // //   },
// // // })


// // // screens/Fasting.tsx
// // import AsyncStorage from '@react-native-async-storage/async-storage'
// // import React, { useEffect, useState } from 'react'
// // import {
// //   Alert,
// //   Dimensions,
// //   ScrollView,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   View,
// // } from 'react-native'
// // import ConfettiCannon from 'react-native-confetti-cannon'
// // import FastingInfoCard from '../components/FastingInfoCard'
// // import FastingTipsCard from '../components/FastingTipsCard'
// // import ProgressRing from '../components/ProgressRing'
// // import { useTheme } from '../theme/theme'


// // const FASTING_TYPES = [
// //   { label: '16:8', fastingHours: 16, eatingHours: 8 },
// //   { label: '18:6', fastingHours: 18, eatingHours: 6 },
// //   { label: '20:4', fastingHours: 20, eatingHours: 4 },
// //   { label: 'OMAD', fastingHours: 23, eatingHours: 1 },
// // ]

// // export default function Fasting() {
// //   const { colors, spacing, typography } = useTheme()
// //   const [selectedType, setSelectedType] = useState(FASTING_TYPES[0])
// //   const [startTime, setStartTime] = useState<Date | null>(null)
// //   const [elapsed, setElapsed] = useState(0)
// //   const [celebrated, setCelebrated] = useState(false)

// //   const fastingSeconds = selectedType.fastingHours * 3600
// //   const progress = Math.min(elapsed / fastingSeconds, 1)

// //   useEffect(() => {
// //     const loadFastingData = async () => {
// //       const stored = await AsyncStorage.getItem('fastStartTime')
// //       if (stored) setStartTime(new Date(stored))
// //     }
// //     loadFastingData()
// //   }, [])

// //   useEffect(() => {
// //     let interval: any
// //     if (startTime) {
// //       interval = setInterval(() => {
// //         const now = new Date().getTime()
// //         const diff = Math.floor((now - startTime.getTime()) / 1000)
// //         setElapsed(diff)

// //         if (diff >= fastingSeconds && !celebrated) {
// //           setCelebrated(true)
// //           Alert.alert('🎉 Fast Complete!', `You've completed a ${selectedType.label} fast.`)
// //         }
// //       }, 1000)
// //     } else {
// //       setElapsed(0)
// //       setCelebrated(false)
// //     }
// //     return () => clearInterval(interval)
// //   }, [startTime, selectedType, celebrated])

// //   const toggleFasting = async () => {
// //     if (startTime) {
// //       setStartTime(null)
// //       await AsyncStorage.removeItem('fastStartTime')
// //     } else {
// //       const now = new Date()
// //       setStartTime(now)
// //       await AsyncStorage.setItem('fastStartTime', now.toISOString())
// //     }
// //   }

// //   const formatTime = (seconds: number) => {
// //     const h = Math.floor(seconds / 3600)
// //     const m = Math.floor((seconds % 3600) / 60)
// //     const s = seconds % 60
// //     return `${h.toString().padStart(2, '0')}:${m
// //       .toString()
// //       .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
// //   }

// //   const getFastingPhase = (): 'before' | 'during' | 'after' => {
// //     if (!startTime) return 'before'
// //     return elapsed >= fastingSeconds ? 'after' : 'during'
// //   }

// //   const getFastingState = () => {
// //     if (elapsed < 4 * 3600) return 'Digesting'
// //     if (elapsed < 8 * 3600) return 'Fat Burning'
// //     if (elapsed < 12 * 3600) return 'Ketosis'
// //     return 'Deep Ketosis'
// //   }

// //   return (
// //     <View style={[styles.screen, { backgroundColor: colors.background }]}>
// //     <ScrollView contentContainerStyle={styles.container}>
// //       <View style={styles.topBar}>
// //         <Text style={[typography.h2, { color: colors.textPrimary }]}>Fasting</Text>

// //         <View style={styles.pickerRow}>
// //           {FASTING_TYPES.map((type) => (
// //             <TouchableOpacity
// //               key={type.label}
// //               onPress={() => setSelectedType(type)}
// //               style={[
// //                 styles.fastingType,
// //                 {
// //                   backgroundColor:
// //                     selectedType.label === type.label ? colors.primary : colors.card,
// //                 },
// //               ]}
// //             >
// //               <Text
// //                 style={{
// //                   color:
// //                     selectedType.label === type.label
// //                       ? colors.surface
// //                       : colors.textPrimary,
// //                   fontWeight: '600',
// //                 }}
// //               >
// //                 {type.label}
// //               </Text>
// //             </TouchableOpacity>
// //           ))}
// //         </View>

// //         <ProgressRing progress={progress} time={formatTime(elapsed)} />

// //         <Text
// //           style={{
// //             textAlign: 'center',
// //             fontSize: 14,
// //             color: colors.textSecondary,
// //             marginBottom: 12,
// //           }}
// //         >
// //           {startTime ? `Current State: ${getFastingState()}` : 'Choose a fast and begin'}
// //         </Text>

// //         <TouchableOpacity
// //           onPress={toggleFasting}
// //           style={[styles.timerButton, { backgroundColor: colors.primary }]}
// //         >
// //           <Text style={{ color: colors.surface, fontWeight: '600' }}>
// //             {startTime ? 'End Fast' : `Start ${selectedType.label} Fasting`}
// //           </Text>
// //         </TouchableOpacity>

// //         <FastingTipsCard phase={getFastingPhase()} />
// //         <FastingInfoCard />

// //         {celebrated && (
// //           <ConfettiCannon count={80} origin={{ x: width / 2, y: 0 }} fadeOut />
// //         )}
// //       </View>
// //     </ScrollView>
// //     </View>
// //   )
// // }

// // const { width } = Dimensions.get('window')

// // const styles = StyleSheet.create({
// //   screen: { flex: 1 },
// //   container: { padding: 16, paddingBottom: 100 },
// //   topBar: {
// //     marginTop: 70,
// //     marginBottom: 24,
// //   },
// //   pickerRow: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     marginVertical: 24,
// //   },
// //   fastingType: {
// //     paddingVertical: 12,
// //     paddingHorizontal: 20,
// //     borderRadius: 16,
// //   },
// //   timerButton: {
// //     marginTop: 12,
// //     paddingVertical: 10,
// //     paddingHorizontal: 24,
// //     borderRadius: 24,
// //     alignSelf: 'center',
// //     marginBottom: 20,
// //   },
// // })


// // import AsyncStorage from '@react-native-async-storage/async-storage'
// // import React, { useEffect, useState } from 'react'
// // import {
// //   Alert,
// //   Dimensions,
// //   ScrollView,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   View,
// // } from 'react-native'

// // import FastingInfoCard from '../components/FastingInfoCard'
// // import FastingTipsCard from '../components/FastingTipsCard'
// // import FastingTypePicker from '../components/FastingTypePicker'
// // import ProgressRing from '../components/ProgressRing'
// // import { useTheme } from '../theme/theme'

// // const FASTING_TYPES = [
// //   { label: '16:8', fastingHours: 16, eatingHours: 8 },
// //   { label: '18:6', fastingHours: 18, eatingHours: 6 },
// //   { label: '20:4', fastingHours: 20, eatingHours: 4 },
// //   { label: 'OMAD', fastingHours: 23, eatingHours: 1 },
// // ]

// // export default function Fasting() {
// //   const { colors, typography } = useTheme()
// //   const [selectedType, setSelectedType] = useState(FASTING_TYPES[0])
// //   const [startTime, setStartTime] = useState<Date | null>(null)
// //   const [elapsed, setElapsed] = useState(0)
// //   const [celebrated, setCelebrated] = useState(false)

// //   const fastingSeconds = selectedType.fastingHours * 3600
// //   const progress = Math.min(elapsed / fastingSeconds, 1)

// //   const milestones = [
// //     { label: 'Fat Burning', progress: 4 / selectedType.fastingHours },
// //     { label: 'Ketosis', progress: 8 / selectedType.fastingHours },
// //     { label: 'Deep Ketosis', progress: 12 / selectedType.fastingHours },
// //   ].filter(m => m.progress < 1)

// //   useEffect(() => {
// //     const load = async () => {
// //       const stored = await AsyncStorage.getItem('fastStartTime')
// //       if (stored) setStartTime(new Date(stored))
// //     }
// //     load()
// //   }, [])

// //   useEffect(() => {
// //     let interval: any
// //     if (startTime) {
// //       interval = setInterval(() => {
// //         const now = new Date().getTime()
// //         const diff = Math.floor((now - startTime.getTime()) / 1000)
// //         setElapsed(diff)

// //         if (diff >= fastingSeconds && !celebrated) {
// //           setCelebrated(true)
// //           Alert.alert('🎉 Fast Complete!', `You've completed a ${selectedType.label} fast.`)
// //         }
// //       }, 1000)
// //     } else {
// //       setElapsed(0)
// //       setCelebrated(false)
// //     }
// //     return () => clearInterval(interval)
// //   }, [startTime, selectedType, celebrated])

// //   const toggleFasting = async () => {
// //     if (startTime) {
// //       setStartTime(null)
// //       await AsyncStorage.removeItem('fastStartTime')
// //     } else {
// //       const now = new Date()
// //       setStartTime(now)
// //       await AsyncStorage.setItem('fastStartTime', now.toISOString())
// //     }
// //   }

// //   const formatTime = (seconds: number) => {
// //     const h = Math.floor(seconds / 3600)
// //     const m = Math.floor((seconds % 3600) / 60)
// //     const s = seconds % 60
// //     return `${h.toString().padStart(2, '0')}:${m
// //       .toString()
// //       .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
// //   }

// //   const getFastingPhase = (): 'before' | 'during' | 'after' => {
// //     if (!startTime) return 'before'
// //     return elapsed >= fastingSeconds ? 'after' : 'during'
// //   }

// //   const getFastingState = () => {
// //     if (elapsed < 4 * 3600) return 'Digesting'
// //     if (elapsed < 8 * 3600) return 'Fat Burning'
// //     if (elapsed < 12 * 3600) return 'Ketosis'
// //     return 'Deep Ketosis'
// //   }

// //   const getRemaining = () => {
// //     const remaining = Math.max(fastingSeconds - elapsed, 0)
// //     return formatTime(remaining)
// //   }

// //   const getTimeRange = () => {
// //     if (!startTime) return { start: '--:--', end: '--:--' }
// //     const end = new Date(startTime.getTime() + fastingSeconds * 1000)
// //     return {
// //       start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
// //       end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
// //     }
// //   }

// //   return (
// //     <View style={[styles.screen, { backgroundColor: colors.background }]}>
// //       <ScrollView contentContainerStyle={styles.container}>
// //         <View style={styles.topBar}>
// //           <Text style={[typography.h2, { color: colors.textPrimary }]}>Fasting</Text>

// //           <FastingTypePicker
// //             types={FASTING_TYPES}
// //             selected={selectedType.label}
// //             onSelect={(label) =>
// //               setSelectedType(FASTING_TYPES.find(t => t.label === label)!)
// //             }
// //           />

// //           <ProgressRing
// //             progress={progress}
// //             time={formatTime(elapsed)}
// //             remaining={getRemaining()}
// //             startTime={getTimeRange().start}
// //             endTime={getTimeRange().end}
// //             milestones={milestones}
// //             fastingLabel={selectedType.label}
// //             stateInfo={startTime ? getFastingState() : undefined}
// //           />

// //          {startTime && ( <View style={styles.row}>
// // <View style={styles.option}>
// //   <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().start}</Text>
  
// // </View><View style={styles.option2}><Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().end}</Text></view>
// //           </View>)}

// //           <Text
// //           style={{
// //             textAlign: 'center',
// //             fontSize: 14,
// //             color: colors.textSecondary,
// //             marginBottom: 12,
// //           }}
// //         >
// //           {startTime ? `Current State: ${getFastingState()}` : 'Choose a fast and begin'}
// //         </Text>

// //           <TouchableOpacity
// //             onPress={toggleFasting}
// //             style={[styles.timerButton, { backgroundColor: colors.primary }]}
// //           >
// //             <Text style={{ color: colors.surface, fontWeight: '600' }}>
// //               {startTime ? 'End Fast' : `Start ${selectedType.label} Fasting`}
// //             </Text>
// //           </TouchableOpacity>

// //           <FastingTipsCard phase={getFastingPhase()} />
// //           <FastingInfoCard label={selectedType.label} state={getFastingState()} />
// //         </View>
// //       </ScrollView>
// //     </View>
// //   )
// // }

// // const { width } = Dimensions.get('window')

// // const styles = StyleSheet.create({
// //   screen: { flex: 1 },
// //   container: { padding: 16, paddingBottom: 100 },
// //   topBar: {
// //     marginTop: 70,
// //     marginBottom: 24,
// //   },
// //   timerButton: {
// //     marginTop: 12,
// //     paddingVertical: 10,
// //     paddingHorizontal: 24,
// //     borderRadius: 24,
// //     alignSelf: 'center',
// //     marginBottom: 20,
// //   },
// //   row: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     marginVertical: 24,
// //   },
// //   option: {
// //     paddingVertical: 12,
// //     paddingHorizontal: 20,
// //     borderRadius: 16,
// //     alignContent: 'flex-start',
// //   },
// //   option2: {
// //     paddingVertical: 12,
// //     paddingHorizontal: 20,
// //     borderRadius: 16,
// //     alignContent: 'flex-end',
// //   },
// //   text: {
// //     fontSize: 14,
// //     lineHeight: 20,
// //   },
// // })


// import AsyncStorage from '@react-native-async-storage/async-storage'
// import React, { useEffect, useState } from 'react'
// import {
//   Alert,
//   Dimensions,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native'

// import FastingInfoCard from '../components/FastingInfoCard'
// import FastingTipsCard from '../components/FastingTipsCard'
// import FastingTypePicker from '../components/FastingTypePicker'
// import ProgressRing from '../components/ProgressRing'
// import { useTheme } from '../theme/theme'

// const FASTING_TYPES = [
//   { label: 'TEST 2min', fastingHours: 0.033, eatingHours: 23.967 },
//   { label: '16:8', fastingHours: 16, eatingHours: 8 },
//   { label: '18:6', fastingHours: 18, eatingHours: 6 },
//   { label: '20:4', fastingHours: 20, eatingHours: 4 },
//   { label: 'OMAD', fastingHours: 23, eatingHours: 1 },
// ]

// export default function Fasting() {
//   const { colors, typography } = useTheme()
//   const [selectedType, setSelectedType] = useState(FASTING_TYPES[0])
//   const [startTime, setStartTime] = useState<Date | null>(null)
//   const [elapsed, setElapsed] = useState(0)
//   const [celebrated, setCelebrated] = useState(false)
  

//   const fastingSeconds = selectedType.fastingHours * 3600
//   const progress = Math.min(elapsed / fastingSeconds, 1)

//   // const milestones = [
//   //   { label: 'Fat Burning', progress: 4 / selectedType.fastingHours },
//   //   { label: 'Ketosis', progress: 8 / selectedType.fastingHours },
//   //   { label: 'Deep Ketosis', progress: 12 / selectedType.fastingHours },
//   // ].filter(m => m.progress < 1)

//   const milestones = [
//   { label: 'Fat Burning', progress: 0.25 },
//   { label: 'Ketosis', progress: 0.5 },
//   { label: 'Deep Ketosis', progress: 0.75 },
// ].filter(m => m.progress < 1)

//   useEffect(() => {
//     const load = async () => {
//       const stored = await AsyncStorage.getItem('fastStartTime')
//       if (stored) setStartTime(new Date(stored))
//     }
//     load()
//   }, [])

//   useEffect(() => {
//     let interval: any
//     if (startTime) {
//       interval = setInterval(() => {
//         const now = new Date().getTime()
//         const diff = Math.floor((now - startTime.getTime()) / 1000)
//         setElapsed(diff)

//         if (diff >= fastingSeconds && !celebrated) {
//           setCelebrated(true)
//           Alert.alert('🎉 Fast Complete!', `You've completed a ${selectedType.label} fast.`)
//         }
//       }, 1000)
//     } else {
//       setElapsed(0)
//       setCelebrated(false)
//     }
//     return () => clearInterval(interval)
//   }, [startTime, selectedType, celebrated])

//   const toggleFasting = async () => {
//     if (startTime) {
//       setStartTime(null)
//       await AsyncStorage.removeItem('fastStartTime')
//     } else {
//       const now = new Date()
//       setStartTime(now)
//       await AsyncStorage.setItem('fastStartTime', now.toISOString())
//     }
//   }

//   const formatTime = (seconds: number) => {
//     const h = Math.floor(seconds / 3600)
//     const m = Math.floor((seconds % 3600) / 60)
//     const s = seconds % 60
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
//   }

//   const getFastingPhase = (): 'before' | 'during' | 'after' => {
//     if (!startTime) return 'before'
//     return elapsed >= fastingSeconds ? 'after' : 'during'
//   }

//   const getFastingState = () => {
//     if (elapsed < 4 * 3600) return 'Digesting'
//     if (elapsed < 8 * 3600) return 'Fat Burning'
//     if (elapsed < 12 * 3600) return 'Ketosis'
//     return 'Deep Ketosis'
//   }

//   const getRemaining = () => {
//     const remaining = Math.max(fastingSeconds - elapsed, 0)
//     return formatTime(remaining)
//   }

//   const getTimeRange = () => {
//     if (!startTime) return { start: '--:--', end: '--:--' }
//     const end = new Date(startTime.getTime() + fastingSeconds * 1000)
//     return {
//       start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     }
//   }

//   return (
//     <View style={[styles.screen, { backgroundColor: colors.background }]}>
//       <ScrollView contentContainerStyle={styles.container}>
//         <View style={styles.topBar}>
//           <Text style={[typography.h2, { color: colors.textPrimary }]}>Fasting</Text>

//           <FastingTypePicker
//             types={FASTING_TYPES}
//             selected={selectedType.label}
//             onSelect={(label) =>
//               setSelectedType(FASTING_TYPES.find(t => t.label === label)!)
//             }
//           />

//           <ProgressRing
//             progress={progress}
//             time={formatTime(elapsed)}
//             remaining={getRemaining()}
//             milestones={milestones}
//             fastingLabel={selectedType.label}
//             started={!!startTime}
//           />

//           {startTime && (
            
//             <View style={styles.row}>
//               <View style={styles.timeBlock}>
//                 <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
//                 <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().start}</Text>
//               </View>
//               <View style={styles.timeBlock}>
//                 <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
//                 <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().end}</Text>
//               </View>
              
//             </View>
//           )}

//           <Text
//             style={{
//               textAlign: 'center',
//               fontSize: 14,
//               color: colors.textSecondary,
//               marginBottom: 12,
//             }}
//           >
//             {startTime ? `Current State: ${getFastingState()}` : 'Choose a fast and begin'}
//           </Text>

//           <TouchableOpacity
//             onPress={toggleFasting}
//             style={[styles.timerButton, { backgroundColor: colors.primary }]}
//           >
//             <Text style={{ color: colors.surface, fontWeight: '600' }}>
//               {startTime ? 'End Fast' : `Start ${selectedType.label} Fasting`}
//             </Text>
//           </TouchableOpacity>

//           <FastingTipsCard phase={getFastingPhase()} />
//           <FastingInfoCard label={selectedType.label} state={getFastingState()} />
//         </View>
//       </ScrollView>
//     </View>
//   )
// }

// const { width } = Dimensions.get('window')

// const styles = StyleSheet.create({
//   screen: { flex: 1 },
//   container: { padding: 16, paddingBottom: 100 },
//   topBar: {
//     marginTop: 70,
//     marginBottom: 24,
//   },
//   timerButton: {
//     marginTop: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 24,
//     borderRadius: 24,
//     alignSelf: 'center',
//     marginBottom: 20,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginHorizontal: 50,
//     marginBottom: 16,
//   },
//   timeBlock: {
//     alignItems: 'center',
//   },
//   timeLabel: {
//     fontSize: 13,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   text: {
//     fontSize: 14,
//     lineHeight: 20,
//   },
// })



import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import FastingInfoCard from '../components/FastingInfoCard'
import FastingTipsCard from '../components/FastingTipsCard'
import FastingTypePicker from '../components/FastingTypePicker'
import ProgressRing from '../components/ProgressRing'
import { supabase } from '../lib/api'
import { useTheme } from '../theme/theme'

const FASTING_TYPES = [
  { label: '16:8', fastingHours: 16, eatingHours: 8 },
  { label: '18:6', fastingHours: 18, eatingHours: 6 },
  { label: '20:4', fastingHours: 20, eatingHours: 4 },
  { label: 'OMAD', fastingHours: 23, eatingHours: 1 },
]

export default function Fasting() {
  const { colors, typography } = useTheme()
  const [selectedType, setSelectedType] = useState(FASTING_TYPES[0])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [celebrated, setCelebrated] = useState(false)
  

  const fastingSeconds = selectedType.fastingHours * 3600
  const progress = Math.min(elapsed / fastingSeconds, 1)

  const milestones = [
    { label: 'Fat Burning', progress: 4 / selectedType.fastingHours },
    { label: 'Ketosis', progress: 8 / selectedType.fastingHours },
    { label: 'Deep Ketosis', progress: 12 / selectedType.fastingHours },
  ].filter(m => m.progress < 1)



  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('fastStartTime')
      if (stored) setStartTime(new Date(stored))
    }
    load()
  }, [])

  useEffect(() => {
  let interval: any
  if (startTime) {
    interval = setInterval(async () => {
      const now = new Date().getTime()
      const diff = Math.floor((now - startTime.getTime()) / 1000)
      setElapsed(diff)

      if (diff >= fastingSeconds && !celebrated) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user?.id) {
          console.error('User fetch error:', userError)
          return
        }
       const today = new Date().toISOString().split('T')[0]
        await supabase.from('entries').insert({
          user_id: user.id, // ✅ required for RLS
          type: 'Fasting',
          date: today,
          notes: `Completed a ${selectedType.label} fast (${Math.round(
            selectedType.fastingHours
          )} hours)`,
          segments: []
        }).select()

        setCelebrated(true)
        Alert.alert('🎉 Fast Complete!', `You've completed a ${selectedType.label} fast.`)

        
        // Reset fast state after completion
        setStartTime(null)
        AsyncStorage.removeItem('fastStartTime')
      }
    }, 1000)
  } else {
    setElapsed(0)
    setCelebrated(false)
  }

  return () => clearInterval(interval)
}, [startTime, selectedType, celebrated])



  const toggleFasting = async () => {
    if (startTime) {
      setStartTime(null)
      await AsyncStorage.removeItem('fastStartTime')
    } else {
      const now = new Date()
      setStartTime(now)
      await AsyncStorage.setItem('fastStartTime', now.toISOString())
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getFastingPhase = (): 'before' | 'during' | 'after' => {
    if (!startTime) return 'before'
    return elapsed >= fastingSeconds ? 'after' : 'during'
  }

  const getFastingState = () => {
    if (elapsed < 4 * 3600) return '🍽️ Digesting'
    if (elapsed < 8 * 3600) return '🔥 Fat Burning'
    if (elapsed < 12 * 3600) return '🥑 Ketosis'
    return '🧠 Deep Ketosis'
  }

  const getRemaining = () => {
    const remaining = Math.max(fastingSeconds - elapsed, 0)
    return formatTime(remaining)
  }

  const getTimeRange = () => {
    if (!startTime) return { start: '--:--', end: '--:--' }
    const end = new Date(startTime.getTime() + fastingSeconds * 1000)
    return {
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Fasting</Text>

          <FastingTypePicker
            types={FASTING_TYPES}
            selected={selectedType.label}
            onSelect={(label) =>
              setSelectedType(FASTING_TYPES.find(t => t.label === label)!)
            }
          />

          <ProgressRing
            progress={progress}
            time={formatTime(elapsed)}
            remaining={getRemaining()}
            milestones={milestones}
            fastingLabel={selectedType.label}
            started={!!startTime}
          />

          {startTime && (
            <View style={styles.row}>
              <View style={styles.timeBlock}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
                <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().start}</Text>
              </View>
              <View style={styles.timeBlock}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
                <Text style={[styles.text, { color: colors.textSecondary }]}>{getTimeRange().end}</Text>
              </View>
            </View>
          )}

          <Text
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12,
            }}
          >
            {startTime ? `${getFastingState()}` : 'Choose a fast and begin'}
          </Text>

          <TouchableOpacity
            onPress={toggleFasting}
            style={[styles.timerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: colors.surface, fontWeight: '600' }}>
              {startTime ? 'End Fast' : `Start ${selectedType.label} Fasting`}
            </Text>
          </TouchableOpacity>

          <FastingTipsCard phase={getFastingPhase()} />
          <FastingInfoCard label={selectedType.label} state={getFastingState()} />
        </View>
      </ScrollView>
    </View>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 100 },
  topBar: {
    marginTop: 70,
    marginBottom: 24,
  },
  timerButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 50,
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
})
