// // // import React, { useEffect, useState } from 'react'
// // // import {
// // //   ScrollView,
// // //   View,
// // //   Text,
// // //   TextInput,
// // //   TouchableOpacity,
// // //   StyleSheet,
// // //   ActivityIndicator,
// // //   Alert
// // // } from 'react-native'
// // // import { useNavigation } from '@react-navigation/native'
// // // import { getProfile, saveProfile, supabase } from '../lib/api'

// // // export default function YourData() {
// // //   const navigation = useNavigation<any>()
// // //   const [form, setForm] = useState({
// // //     fullName: '',
// // //     age: '',
// // //     gender: '',
// // //     height: '',
// // //     weight: '',
// // //     goals: {
// // //       goalType: '',
// // //       targetValue: '',
// // //       targetDate: ''
// // //     },
// // //     is_premium: false
// // //   })
// // //   const [goals, setGoals] = useState({
// // //     goalType: '',
// // //     targetValue: '',
// // //     targetDate: ''
// // //   })
// // //   const [loading, setLoading] = useState(true)
// // //   const [editing, setEditing] = useState(false)

// // //   useEffect(() => {
// // //     (async () => {
// // //       const data = await getProfile()
// // //       if (data) {
// // //         setForm(data)
// // //         setGoals(data.goals || goals)
// // //         setEditing(false)
// // //       } else {
// // //         setEditing(true)
// // //       }
// // //       setLoading(false)
// // //     })()
// // //   }, [])

// // //   const handleSave = async () => {
// // //     if (!form.fullName.trim()) {
// // //       Alert.alert('Full name required', 'Please enter your name to continue.')
// // //       return
// // //     }
// // //     setLoading(true)
// // //     try {
// // //       await saveProfile({ ...form, goals })
// // //       setEditing(false)
// // //     } catch (e: any) {
// // //       Alert.alert('Error', e.message)
// // //     } finally {
// // //       setLoading(false)
// // //     }
// // //   }

// // //   const handleLogout = async () => {
// // //     await supabase.auth.signOut()
// // //     navigation.replace('Signin')
// // //   }

// // //   if (loading) {
// // //     return (
// // //       <View style={styles.center}>
// // //         <ActivityIndicator size="large" color="#000" />
// // //       </View>
// // //     )
// // //   }

// // //   return (
// // //     <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
// // //       <Text style={styles.title}>Your Data</Text>

// // //       <View style={styles.card}>
// // //         <View style={styles.formGroup}>
// // //           <Text style={styles.label}>Full Name</Text>
// // //           {editing ? (
// // //             <>
// // //               <TextInput
// // //                 value={form.fullName}
// // //                 onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
// // //                 style={styles.input}
// // //                 placeholder="Enter your full name"
// // //                 placeholderTextColor="#757575"
// // //               />
// // //               <TouchableOpacity style={styles.button} onPress={handleSave}>
// // //                 <Text style={styles.buttonText}>Save Name</Text>
// // //               </TouchableOpacity>
// // //             </>
// // //           ) : (
// // //             <>
// // //               <Text style={styles.item}>{form.fullName}</Text>
// // //               <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
// // //                 <Text style={styles.buttonText}>Edit Name</Text>
// // //               </TouchableOpacity>
// // //             </>
// // //           )}
// // //         </View>

// // //         {form.is_premium ? (
// // //           editing ? (
// // //             <>
// // //               {(['age', 'gender', 'height', 'weight'] as const).map(key => (
// // //                 <View key={key} style={styles.formGroup}>
// // //                   <Text style={styles.label}>
// // //                     {key === 'age' ? 'Age' : key === 'gender' ? 'Gender' : key === 'height' ? 'Height (cm)' : 'Weight (kg)'}
// // //                   </Text>
// // //                   <TextInput
// // //                     value={form[key]}
// // //                     onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
// // //                     style={styles.input}
// // //                     keyboardType={key !== 'gender' ? 'numeric' : 'default'}
// // //                     placeholder={key === 'gender' ? 'male / female / other' : undefined}
// // //                     placeholderTextColor="#757575"
// // //                   />
// // //                 </View>
// // //               ))}
// // //               <TouchableOpacity style={styles.button} onPress={handleSave}>
// // //                 <Text style={styles.buttonText}>Save Profile</Text>
// // //               </TouchableOpacity>
// // //             </>
// // //           ) : (
// // //             <>
// // //               <Text style={styles.item}>🎂 Age: {form.age}</Text>
// // //               <Text style={styles.item}>⚧ Gender: {form.gender}</Text>
// // //               <Text style={styles.item}>📏 Height: {form.height} cm</Text>
// // //               <Text style={styles.item}>⚖️ Weight: {form.weight} kg</Text>
// // //               <View style={styles.actionsRow}>
// // //                 <TouchableOpacity style={styles.buttonHalf} onPress={() => setEditing(true)}>
// // //                   <Text style={styles.buttonText}>Edit</Text>
// // //                 </TouchableOpacity>
// // //                 <TouchableOpacity style={styles.buttonHalf} onPress={handleLogout}>
// // //                   <Text style={styles.buttonText}>Log Out</Text>
// // //                 </TouchableOpacity>
// // //               </View>
// // //             </>
// // //           )
// // //         ) : (
// // //           <>
// // //             <Text style={styles.item}>Upgrade to premium to input health data 🧬</Text>
// // //             <TouchableOpacity
// // //               style={[styles.button, { backgroundColor: '#4A6C6F' }]}
// // //               onPress={() => navigation.navigate('Premium')}
// // //             >
// // //               <Text style={styles.buttonText}>Go Premium</Text>
// // //             </TouchableOpacity>
// // //           </>
// // //         )}
// // //       </View>

// // //       <View style={styles.card}>
// // //         <Text style={styles.sectionTitle}>Your Goals</Text>

// // //         {form.is_premium ? (
// // //           <>
// // //             {['goalType', 'targetValue', 'targetDate'].map((key) => (
// // //               <View style={styles.formGroup} key={key}>
// // //                 <Text style={styles.label}>
// // //                   {key === 'goalType' ? 'Goal' : key === 'targetValue' ? 'Target' : 'By When (optional)'}
// // //                 </Text>
// // //                 <TextInput
// // //                   value={goals[key]}
// // //                   onChangeText={v => setGoals(g => ({ ...g, [key]: v }))}
// // //                   placeholder={
// // //                     key === 'goalType' ? 'e.g. Lose weight, Run 5km' :
// // //                     key === 'targetValue' ? 'e.g. 75kg or 30 minutes' :
// // //                     'e.g. 01/10/2025'
// // //                   }
// // //                   placeholderTextColor="#757575"
// // //                   style={styles.input}
// // //                 />
// // //               </View>
// // //             ))}
// // //             <TouchableOpacity style={styles.button} onPress={handleSave}>
// // //               <Text style={styles.buttonText}>Save Goal</Text>
// // //             </TouchableOpacity>
// // //           </>
// // //         ) : (
// // //           <>
// // //             <Text style={styles.item}>Upgrade to premium to set fitness goals 🎯</Text>
// // //             <TouchableOpacity
// // //               style={[styles.button, { backgroundColor: '#4A6C6F' }]}
// // //               onPress={() => navigation.navigate('Premium')}
// // //             >
// // //               <Text style={styles.buttonText}>Go Premium</Text>
// // //             </TouchableOpacity>
// // //           </>
// // //         )}
// // //       </View>
// // //     </ScrollView>
// // //   )
// // // }

// // // const styles = StyleSheet.create({
// // //   screen: {
// // //     flex: 1,
// // //     backgroundColor: '#FDFCF9'
// // //   },
// // //   container: {
// // //     padding: 16,
// // //     paddingBottom: 100
// // //   },
// // //   title: {
// // //     fontSize: 32,
// // //     fontWeight: '700',
// // //     marginBottom: 24,
// // //     color: '#000'
// // //   },
// // //   card: {
// // //     backgroundColor: '#fff',
// // //     padding: 20,
// // //     borderRadius: 16,
// // //     marginBottom: 24,
// // //     shadowColor: '#000',
// // //     shadowOpacity: 0.05,
// // //     shadowRadius: 8,
// // //     elevation: 2
// // //   },
// // //   formGroup: {
// // //     marginBottom: 16
// // //   },
// // //   label: {
// // //     color: '#1A1A1A',
// // //     marginBottom: 6,
// // //     fontSize: 14
// // //   },
// // //   input: {
// // //     backgroundColor: '#F2F2F2',
// // //     borderRadius: 8,
// // //     padding: 12,
// // //     color: '#1A1A1A'
// // //   },
// // //   item: {
// // //     fontSize: 16,
// // //     color: '#1A1A1A',
// // //     marginBottom: 10
// // //   },
// // //   button: {
// // //     backgroundColor: '#000',
// // //     padding: 14,
// // //     borderRadius: 8,
// // //     alignItems: 'center',
// // //     marginTop: 8
// // //   },
// // //   buttonHalf: {
// // //     backgroundColor: '#000',
// // //     padding: 14,
// // //     borderRadius: 8,
// // //     alignItems: 'center',
// // //     flex: 1,
// // //     marginHorizontal: 4
// // //   },
// // //   buttonText: {
// // //     color: '#fff',
// // //     fontWeight: '600',
// // //     fontSize: 16
// // //   },
// // //   actionsRow: {
// // //     flexDirection: 'row',
// // //     justifyContent: 'space-between',
// // //     marginTop: 16
// // //   },
// // //   sectionTitle: {
// // //     fontSize: 18,
// // //     fontWeight: '600',
// // //     marginBottom: 12,
// // //     color: '#1A1A1A'
// // //   },
// // //   center: {
// // //     flex: 1,
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //     backgroundColor: '#FDFCF9'
// // //   }
// // // })


// // import { useNavigation } from '@react-navigation/native'
// // import { LinearGradient } from 'expo-linear-gradient'
// // import React, { useEffect, useState } from 'react'
// // import {
// //   ActivityIndicator,
// //   Alert,
// //   ScrollView,
// //   StyleSheet,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   View
// // } from 'react-native'
// // import { getProfile, saveProfile, supabase } from '../lib/api'

// // export default function YourData() {
// //   const navigation = useNavigation<any>()
// //   const [form, setForm] = useState({
// //     fullName: '',
// //     age: '',
// //     gender: '',
// //     height: '',
// //     weight: '',
// //     goals: {
// //       goalType: '',
// //       targetValue: '',
// //       targetDate: ''
// //     },
// //     is_premium: false
// //   })
// //   const [goals, setGoals] = useState({
// //     goalType: '',
// //     targetValue: '',
// //     targetDate: ''
// //   })
// //   const [loading, setLoading] = useState(true)
// //   const [editing, setEditing] = useState(false)

// //   useEffect(() => {
// //     (async () => {
// //       const data = await getProfile()
// //       if (data) {
// //         setForm(data)
// //         setGoals(data.goals || goals)
// //         setEditing(false)
// //       } else {
// //         setEditing(true)
// //       }
// //       setLoading(false)
// //     })()
// //   }, [])

// //   const handleSave = async () => {
// //     if (!form.fullName.trim()) {
// //       Alert.alert('Full name required', 'Please enter your name to continue.')
// //       return
// //     }
// //     setLoading(true)
// //     try {
// //       await saveProfile({ ...form, goals })
// //       setEditing(false)
// //     } catch (e: any) {
// //       Alert.alert('Error', e.message)
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   const handleLogout = async () => {
// //     await supabase.auth.signOut()
// //     navigation.replace('Signin')
// //   }

// //   const renderLockedOverlay = () => (
// //     <View style={styles.lockedOverlay}>
// //       <Text style={styles.lockedText}>🔒 Premium Only</Text>
// //       <TouchableOpacity
// //         onPress={() => navigation.navigate('Premium')}
// //         style={styles.upgradeButton}
// //       >
// //         <LinearGradient colors={['#000', '#333']} style={styles.upgradeButtonInner}>
// //           <Text style={styles.upgradeButtonText}>Upgrade to Unlock</Text>
// //         </LinearGradient>
// //       </TouchableOpacity>
// //     </View>
// //   )

// //   if (loading) {
// //     return (
// //       <View style={styles.center}>
// //         <ActivityIndicator size="large" color="#000" />
// //       </View>
// //     )
// //   }

// //   return (
// //     <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
// //       <Text style={styles.title}>Your Data</Text>

// //       <View style={styles.card}>
// //         <View style={styles.formGroup}>
// //           <Text style={styles.label}>Full Name</Text>
// //           {editing ? (
// //             <>
// //               <TextInput
// //                 value={form.fullName}
// //                 onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
// //                 style={styles.input}
// //                 placeholder="Enter your full name"
// //                 placeholderTextColor="#757575"
// //               />
// //               <TouchableOpacity style={styles.button} onPress={handleSave}>
// //                 <Text style={styles.buttonText}>Save Name</Text>
// //               </TouchableOpacity>
// //             </>
// //           ) : (
// //             <>
// //               <Text style={styles.item}>{form.fullName}</Text>
// //               <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
// //                 <Text style={styles.buttonText}>Edit Name</Text>
// //               </TouchableOpacity>
// //             </>
// //           )}
// //         </View>

// //         {(['age', 'gender', 'height', 'weight'] as const).map(key => (
// //           <View key={key} style={styles.formGroup}>
// //             <Text style={styles.label}>
// //               {key === 'age' ? 'Age' : key === 'gender' ? 'Gender' : key === 'height' ? 'Height (cm)' : 'Weight (kg)'}
// //             </Text>
// //             <TextInput
// //               value={form[key]}
// //               onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
// //               style={[styles.input, !form.is_premium && styles.disabledInput]}
// //               editable={form.is_premium}
// //               keyboardType={key !== 'gender' ? 'numeric' : 'default'}
// //               placeholder={key === 'gender' ? 'male / female / other' : undefined}
// //               placeholderTextColor="#757575"
// //             />
// //             {!form.is_premium && renderLockedOverlay()}
// //           </View>
// //         ))}

// //         {form.is_premium && (
// //           <TouchableOpacity style={styles.button} onPress={handleSave}>
// //             <Text style={styles.buttonText}>Save Profile</Text>
// //           </TouchableOpacity>
// //         )}
// //       </View>

// //       <View style={styles.card}>
// //         <Text style={styles.sectionTitle}>Your Goals</Text>

// //         {['goalType', 'targetValue', 'targetDate'].map((key) => (
// //           <View style={styles.formGroup} key={key}>
// //             <Text style={styles.label}>
// //               {key === 'goalType' ? 'Goal' : key === 'targetValue' ? 'Target' : 'By When (optional)'}
// //             </Text>
// //             <TextInput
// //               value={goals[key]}
// //               onChangeText={v => setGoals(g => ({ ...g, [key]: v }))}
// //               placeholder={
// //                 key === 'goalType' ? 'e.g. Lose weight, Run 5km' :
// //                 key === 'targetValue' ? 'e.g. 75kg or 30 minutes' :
// //                 'e.g. 01/10/2025'
// //               }
// //               placeholderTextColor="#757575"
// //               style={[styles.input, !form.is_premium && styles.disabledInput]}
// //               editable={form.is_premium}
// //             />
// //             {!form.is_premium && renderLockedOverlay()}
// //           </View>
// //         ))}

// //         {form.is_premium && (
// //           <TouchableOpacity style={styles.button} onPress={handleSave}>
// //             <Text style={styles.buttonText}>Save Goal</Text>
// //           </TouchableOpacity>
// //         )}
// //       </View>
// //     </ScrollView>
// //   )
// // }

// // const styles = StyleSheet.create({
// //   screen: {
// //     flex: 1,
// //     backgroundColor: '#FDFCF9'
// //   },
// //   container: {
// //     padding: 16,
// //     paddingBottom: 100
// //   },
// //   title: {
// //     fontSize: 32,
// //     fontWeight: '700',
// //     marginBottom: 24,
// //     color: '#000'
// //   },
// //   card: {
// //     backgroundColor: '#fff',
// //     padding: 20,
// //     borderRadius: 16,
// //     marginBottom: 24,
// //     shadowColor: '#000',
// //     shadowOpacity: 0.05,
// //     shadowRadius: 8,
// //     elevation: 2
// //   },
// //   formGroup: {
// //     marginBottom: 16
// //   },
// //   label: {
// //     color: '#1A1A1A',
// //     marginBottom: 6,
// //     fontSize: 14
// //   },
// //   input: {
// //     backgroundColor: '#F2F2F2',
// //     borderRadius: 8,
// //     padding: 12,
// //     color: '#1A1A1A'
// //   },
// //   disabledInput: {
// //     opacity: 0.6
// //   },
// //   item: {
// //     fontSize: 16,
// //     color: '#1A1A1A',
// //     marginBottom: 10
// //   },
// //   button: {
// //     backgroundColor: '#000',
// //     padding: 14,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //     marginTop: 8
// //   },
// //   buttonText: {
// //     color: '#fff',
// //     fontWeight: '600',
// //     fontSize: 16
// //   },
// //   sectionTitle: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     marginBottom: 12,
// //     color: '#1A1A1A'
// //   },
// //   center: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#FDFCF9'
// //   },
// //   lockedOverlay: {
// //     position: 'absolute',
// //     top: 0,
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     backgroundColor: 'rgba(255,255,255,0.7)',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     borderRadius: 8
// //   },
// //   lockedText: {
// //     fontSize: 14,
// //     fontWeight: '600',
// //     color: '#000',
// //     marginBottom: 8
// //   },
// //   upgradeButton: {
// //     borderRadius: 8,
// //     overflow: 'hidden'
// //   },
// //   upgradeButtonInner: {
// //     paddingVertical: 10,
// //     paddingHorizontal: 16,
// //     borderRadius: 8
// //   },
// //   upgradeButtonText: {
// //     color: '#fff',
// //     fontWeight: '600',
// //     fontSize: 14
// //   }
// // })


// import { useNavigation } from '@react-navigation/native'
// import { LinearGradient } from 'expo-linear-gradient'
// import React, { useEffect, useState } from 'react'
// import {
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from 'react-native'
// import { getProfile, saveProfile, supabase } from '../lib/api'
// import { useTheme } from '../theme/theme'

// export default function YourData() {
//   const navigation = useNavigation<any>()
//   const { colors } = useTheme();
//   const [form, setForm] = useState({
//     fullName: '',
//     age: '',
//     gender: '',
//     height: '',
//     weight: '',
//     goals: {
//       goalType: '',
//       targetValue: '',
//       targetDate: ''
//     },
//     is_premium: false
//   })
//   const [goals, setGoals] = useState({
//     goalType: '',
//     targetValue: '',
//     targetDate: ''
//   })
//   const [loading, setLoading] = useState(true)
//   const [editing, setEditing] = useState(false)

//   useEffect(() => {
//     (async () => {
//       const data = await getProfile()
//       if (data) {
//         setForm(data)
//         setGoals(data.goals || goals)
//         setEditing(false)
//       } else {
//         setEditing(true)
//       }
//       setLoading(false)
//     })()
//   }, [])

//   const handleSave = async () => {
//     if (!form.fullName.trim()) {
//       Alert.alert('Full name required', 'Please enter your name to continue.')
//       return
//     }
//     setLoading(true)
//     try {
//       await saveProfile({ ...form, goals })
//       setEditing(false)
//     } catch (e: any) {
//       Alert.alert('Error', e.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleLogout = async () => {
//     await supabase.auth.signOut()
//     navigation.replace('Signin')
//   }

//   const renderLockedOverlay = () => (
//     <View style={styles.lockedOverlayContainer}>
//       <View style={[styles.lockedOverlay, {backgroundColor: colors.card}]}>
//         <Text style={[styles.lockedText, {color: colors.textPrimary}]}>🔒 Premium Only</Text>
//         <TouchableOpacity
//           onPress={() => navigation.navigate('Premium')}
//           style={styles.upgradeButton}
//         >
//           <LinearGradient colors={[colors.secondary, colors.border]} style={styles.upgradeButtonInner}>
//             <Text style={styles.upgradeButtonText}>Upgrade to Unlock</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   )

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#000" />
//       </View>
//     )
//   }

//   return (
//     <View style={[styles.screen, { backgroundColor: colors.background }]}>
//     <ScrollView  contentContainerStyle={styles.container}>
//       <Text style={[styles.title, {color: colors.textPrimary}]}>Your Data</Text>

//       <View style={[styles.card, {backgroundColor: colors.card}]}>
//         <View style={styles.formGroup}>
//           <Text style={[styles.label, {color: colors.textSecondary}]}>Nickname</Text>
//           {editing ? (
//             <>
//               <TextInput
//                 value={form.fullName}
//                 onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
//                 style={styles.input}
//                 placeholder="Enter your full name"
//                 placeholderTextColor="#757575"
//               />
//               <TouchableOpacity style={[styles.button, {backgroundColor: colors.inputBackground}]} onPress={handleSave}>
//                 <Text style={[styles.buttonText, {color: colors.accent}]}>Save Name</Text>
//               </TouchableOpacity>
//             </>
//           ) : (
//             <>
//               <Text style={styles.item}>{form.fullName}</Text>
//               <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
//                 <Text style={styles.buttonText}>Edit Name</Text>
//               </TouchableOpacity>
//             </>
//           )}
//         </View>

//         <View pointerEvents={form.is_premium ? 'auto' : 'none'} style={{ opacity: form.is_premium ? 1 : 0.6 }}>
//           {(['age', 'gender', 'height', 'weight'] as const).map(key => (
//             <View key={key} style={styles.formGroup}>
//               <Text style={[styles.label, {color: colors.textSecondary}]}>
//                 {key === 'age' ? 'Age' : key === 'gender' ? 'Gender' : key === 'height' ? 'Height (cm)' : 'Weight (kg)'}
//               </Text>
//               <TextInput
//                 value={form[key]}
//                 onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
//                 style={styles.input}
//                 keyboardType={key !== 'gender' ? 'numeric' : 'default'}
//                 placeholder={key === 'gender' ? 'male / female / other' : undefined}
//                 placeholderTextColor="#757575"
//               />
//             </View>
//           ))}
//         </View>
//         {!form.is_premium && renderLockedOverlay()}

//         {form.is_premium && (
//           <TouchableOpacity style={styles.button} onPress={handleSave}>
//             <Text style={styles.buttonText}>Save Profile</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={[styles.card, {backgroundColor: colors.card}]}>
//         <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Your Goals</Text>

//         <View pointerEvents={form.is_premium ? 'auto' : 'none'} style={{ opacity: form.is_premium ? 1 : 0.6 }}>
//           {['goalType', 'targetValue', 'targetDate'].map((key) => (
//             <View style={styles.formGroup} key={key}>
//               <Text style={[styles.label, {color: colors.textSecondary}]}>
//                 {key === 'goalType' ? 'Goal' : key === 'targetValue' ? 'Target' : 'By When (optional)'}
//               </Text>
//               <TextInput
//                 value={goals[key]}
//                 onChangeText={v => setGoals(g => ({ ...g, [key]: v }))}
//                 placeholder={
//                   key === 'goalType' ? 'e.g. Lose weight, Run 5km' :
//                   key === 'targetValue' ? 'e.g. 75kg or 30 minutes' :
//                   'e.g. 01/10/2025'
//                 }
//                 placeholderTextColor="#757575"
//                 style={styles.input}
//               />
//             </View>
//           ))}
//         </View>
//         {!form.is_premium && renderLockedOverlay()}

//         {form.is_premium && (
//           <TouchableOpacity style={styles.button} onPress={handleSave}>
//             <Text style={styles.buttonText}>Save Goal</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </ScrollView>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//   },
//   container: {
//     padding: 16,
//     paddingTop: 70,
//     paddingBottom: 100,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '700',
//     marginBottom: 24,
//     color: '#000'
//   },
//   card: {
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2
//   },
//   formGroup: {
//     marginBottom: 16
//   },
//   label: {
//     color: '#1A1A1A',
//     marginBottom: 6,
//     fontSize: 14
//   },
//   input: {
//     backgroundColor: '#F2F2F2',
//     borderRadius: 8,
//     padding: 12,
//     color: '#1A1A1A'
//   },
//   item: {
//     fontSize: 16,
//     color: '#1A1A1A',
//     marginBottom: 10
//   },
//   button: {
//     backgroundColor: '#000',
//     padding: 14,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 8
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//     color: '#1A1A1A'
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FDFCF9'
//   },
//   lockedOverlayContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   lockedOverlay: {
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     padding: 20,
//     borderRadius: 16,
//     alignItems: 'center'
//   },
//   lockedText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 8
//   },
//   upgradeButton: {
//     borderRadius: 8,
//     overflow: 'hidden'
//   },
//   upgradeButtonInner: {
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 8
//   },
//   upgradeButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 14
//   }
// })


import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { getProfile, saveProfile, supabase } from '../lib/api'
import { useTheme } from '../theme/theme'

export default function YourData() {
  const navigation = useNavigation<any>()
  const { colors } = useTheme();
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    goals: {
      goalType: '',
      targetValue: '',
      targetDate: ''
    },
    is_premium: false
  })
  const [goals, setGoals] = useState({
    goalType: '',
    targetValue: '',
    targetDate: ''
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

 useEffect(() => {
  const unsubscribe = navigation.addListener('focus', async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Get profile (full info)
    const profile = await getProfile()

    // Also fetch first name fallback (lightweight)
    const { data: nameData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user?.id)
      .single()

    const fullName = nameData?.full_name ?? profile?.fullName ?? ''
    const needsEditing = !fullName?.trim()

    setForm({
      ...profile!,
      fullName: fullName || '',
    })
    setGoals(profile?.goals || goals)
    setEditing(needsEditing) // force edit mode if no name

    setLoading(false)
  })

  return unsubscribe
}, [navigation])



  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Full name required', 'Please enter your name to continue.')
      return
    }
    setLoading(true)
    try {
      await saveProfile({ ...form, goals })
      setEditing(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const renderLockedOverlay = () => (
    <View style={styles.lockedOverlayContainer}>
      <View style={[styles.lockedOverlay, {backgroundColor: colors.card}]}>
        <Text style={[styles.lockedText, {color: colors.textPrimary}]}>🔒 Premium Only</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Premium')}
          style={styles.upgradeButton}
        >
          <LinearGradient colors={[colors.secondary, colors.border]} style={styles.upgradeButtonInner}>
            <Text style={styles.upgradeButtonText}>Upgrade to Unlock</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.toggleWrapper2}><TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <View style={styles.toggleWrapper}>
          <Ionicons name="chevron-back-sharp" size={20} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>your profile</Text></View>
        </TouchableOpacity></View>
        
        
        <Text style={[styles.title, {color: colors.textPrimary}]}>Your Data</Text>

        <View style={[styles.card, {backgroundColor: colors.card}]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Nickname</Text>
            {editing ? (
              <>
                <TextInput
                  value={form.fullName}
                  onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#757575"
                />
                <TouchableOpacity style={[styles.button, {backgroundColor: colors.inputBackground}]} onPress={handleSave}>
                  <Text style={[styles.buttonText, {color: colors.accent}]}>Save Name</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.item, {color: colors.textPrimary}]}>{form.fullName}</Text>
                <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
                  <Text style={[styles.buttonText, {color: colors.textPrimary}]}>Edit Name</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View pointerEvents={form.is_premium ? 'auto' : 'none'} style={{ opacity: form.is_premium ? 1 : 0.6 }}>
            {(['age', 'gender', 'height', 'weight'] as const).map(key => (
              <View key={key} style={styles.formGroup}>
                <Text style={[styles.label, {color: colors.textSecondary}]}> 
                  {key === 'age' ? 'Age' : key === 'gender' ? 'Gender' : key === 'height' ? 'Height (cm)' : 'Weight (kg)'}
                </Text>
                <TextInput
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  style={styles.input}
                  keyboardType={key !== 'gender' ? 'numeric' : 'default'}
                  placeholder={key === 'gender' ? 'male / female / other' : undefined}
                  placeholderTextColor="#757575"
                />
              </View>
            ))}
          </View>
          {!form.is_premium && renderLockedOverlay()}

          {form.is_premium && (
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Your Goals</Text>

          <View pointerEvents={form.is_premium ? 'auto' : 'none'} style={{ opacity: form.is_premium ? 1 : 0.6 }}>
            {['goalType', 'targetValue', 'targetDate'].map((key) => (
              <View style={styles.formGroup} key={key}>
                <Text style={[styles.label, {color: colors.textSecondary}]}> 
                  {key === 'goalType' ? 'Goal' : key === 'targetValue' ? 'Target' : 'By When (optional)'}
                </Text>
                <TextInput
                  value={goals[key]}
                  onChangeText={v => setGoals(g => ({ ...g, [key]: v }))}
                  placeholder={
                    key === 'goalType' ? 'e.g. Lose weight, Run 5km' :
                    key === 'targetValue' ? 'e.g. 75kg or 30 minutes' :
                    'e.g. 01/10/2025'
                  }
                  placeholderTextColor="#757575"
                  style={styles.input}
                />
              </View>
            ))}
          </View>
          {!form.is_premium && renderLockedOverlay()}

          {form.is_premium && (
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingTop: 70,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    color: '#000'
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    color: '#1A1A1A',
    marginBottom: 6,
    fontSize: 14
  },
  input: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    padding: 12,
    color: '#1A1A1A'
  },
  item: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 10
  },
  button: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1A1A1A'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFCF9'
  },
  lockedOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lockedOverlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center'
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8
  },
  upgradeButton: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  upgradeButtonInner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  closeButton: {
    position: "absolute",
    top: 10,
    //right: 20,
    zIndex: 10,
    padding: 8,
    left: -10
  },
  toggleWrapper: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 24,
    // backgroundColor: "#ECECEC",
    // borderRadius: 24,
    padding: 4,
    //marginTop: 10
  },
  toggleWrapper2: {
    alignSelf: 'flex-start',
    paddingBottom: 50,
    //marginTop: 36
  },
})

