// // // // // src/screens/SignIn.tsx
// // // // import React, { useState } from 'react'
// // // // import {
// // // //   View,
// // // //   Text,
// // // //   TextInput,
// // // //   TouchableOpacity,
// // // //   StyleSheet,
// // // //   ActivityIndicator,
// // // //   Alert,
// // // // } from 'react-native'
// // // // import { useNavigation } from '@react-navigation/native'
// // // // import { supabase } from '../lib/api'

// // // // export default function SignIn() {
// // // //   const nav = useNavigation()
// // // //   const [email, setEmail] = useState('')
// // // //   const [loading, setLoading] = useState(false)
// // // //   const [isSigningUp, setIsSigningUp] = useState(false)

// // // //   async function handleMagicLink(email: string) {
// // // //     setLoading(true)
// // // //     const { error } = await supabase.auth.signInWithOtp({
// // // //       email,
// // // //       options: {
// // // //         emailRedirectTo: 'fitflow://login-callback',
// // // //       },
// // // //     })
// // // //     setLoading(false)

// // // //     if (error) {
// // // //       return Alert.alert('Oops!', error.message)
// // // //     }

// // // //     Alert.alert(
// // // //       'Check your inbox',
// // // //       `A magic link has been sent to ${email}.`
// // // //     )
// // // //   }

// // // //   return (
// // // //     <View style={styles.container}>
// // // //       <Text style={styles.title}>
// // // //         {isSigningUp ? 'Create account' : 'Send Magic Link'}
// // // //       </Text>

// // // //       <TextInput
// // // //         placeholder="Email"
// // // //         placeholderTextColor="#757185"
// // // //         autoCapitalize="none"
// // // //         keyboardType="email-address"
// // // //         value={email}
// // // //         onChangeText={setEmail}
// // // //         style={styles.input}
// // // //       />

// // // //       <TouchableOpacity
// // // //         style={[styles.button, { backgroundColor: '#AC6AFF' }]}
// // // //         onPress={() => handleMagicLink(email.trim())}
// // // //         disabled={loading || !email.trim()}
// // // //       >
// // // //         {loading ? (
// // // //           <ActivityIndicator color="#fff" />
// // // //         ) : (
// // // //           <Text style={styles.buttonText}>Send Magic Link</Text>
// // // //         )}
// // // //       </TouchableOpacity>

// // // //       <TouchableOpacity
// // // //         onPress={() => setIsSigningUp((v) => !v)}
// // // //         disabled={loading}
// // // //       >
// // // //         <Text style={styles.toggle}>
// // // //           {isSigningUp
// // // //             ? 'Have an account? Send link again'
// // // //             : "Don't have an account? (Still just magic link)"}
// // // //         </Text>
// // // //       </TouchableOpacity>
// // // //     </View>
// // // //   )
// // // // }

// // // // const styles = StyleSheet.create({
// // // //   container: {
// // // //     flex: 1,
// // // //     backgroundColor: '#0E0C15',
// // // //     justifyContent: 'center',
// // // //     padding: 24,
// // // //   },
// // // //   title: {
// // // //     fontSize: 28,
// // // //     fontWeight: '700',
// // // //     color: '#AC6AFF',
// // // //     marginBottom: 24,
// // // //     textAlign: 'center',
// // // //   },
// // // //   input: {
// // // //     backgroundColor: '#15131D',
// // // //     color: '#FFFFFF',
// // // //     paddingHorizontal: 12,
// // // //     paddingVertical: 10,
// // // //     borderRadius: 8,
// // // //     marginBottom: 16,
// // // //   },
// // // //   button: {
// // // //     paddingVertical: 14,
// // // //     borderRadius: 8,
// // // //     alignItems: 'center',
// // // //     marginBottom: 12,
// // // //   },
// // // //   buttonText: {
// // // //     color: '#FFFFFF',
// // // //     fontWeight: '600',
// // // //     fontSize: 16,
// // // //   },
// // // //   toggle: {
// // // //     color: '#CAC6DD',
// // // //     textAlign: 'center',
// // // //     marginTop: 8,
// // // //   },
// // // // })


// // // // src/screens/SignIn.tsx
// // // import React, { useState } from 'react'
// // // import {
// // //   View, Text, TextInput, TouchableOpacity,
// // //   StyleSheet, ActivityIndicator, Alert,
// // // } from 'react-native'
// // // import { supabase } from '../lib/api'
// // // import { useAuth } from '../hooks/useAuth'
// // // import { useNavigation } from '@react-navigation/native'

// // // export default function SignIn() {
// // //   const { setUser } = useAuth()
// // //   const nav = useNavigation()
// // //   const [email, setEmail] = useState('')
// // //   const [password, setPassword] = useState('')
// // //   const [loading, setLoading] = useState(false)
// // //   const [isSigningUp, setIsSigningUp] = useState(false)

// // //   async function handleSubmit() {
// // //     setLoading(true)
// // //     try {
// // //       const { data, error } = isSigningUp
// // //         ? await supabase.auth.signUp({ email, password })
// // //         : await supabase.auth.signInWithPassword({ email, password })
// // //       if (error) throw error
// // //       setUser(data.user)
// // //       nav.navigate('Main' as never)
// // //     } catch (err: any) {
// // //       Alert.alert('Authentication error', err.message)
// // //     } finally {
// // //       setLoading(false)
// // //     }
// // //   }

// // //   return (
// // //     <View style={styles.container}>
// // //       <Text style={styles.title}>
// // //         {isSigningUp ? 'Create Account' : 'Welcome Back'}
// // //       </Text>
// // //       <TextInput
// // //         placeholder="Email"
// // //         autoCapitalize="none"
// // //         keyboardType="email-address"
// // //         value={email}
// // //         onChangeText={setEmail}
// // //         style={styles.input}
// // //       />
// // //       <TextInput
// // //         placeholder="Password"
// // //         secureTextEntry
// // //         value={password}
// // //         onChangeText={setPassword}
// // //         style={styles.input}
// // //       />
// // //       <TouchableOpacity
// // //         style={[styles.button, { backgroundColor: '#AC6AFF' }]}
// // //         onPress={handleSubmit}
// // //         disabled={loading}
// // //       >
// // //         {loading ? (
// // //           <ActivityIndicator color="#fff" />
// // //         ) : (
// // //           <Text style={styles.buttonText}>
// // //             {isSigningUp ? 'Sign Up' : 'Sign In'}
// // //           </Text>
// // //         )}
// // //       </TouchableOpacity>
// // //       <TouchableOpacity
// // //         onPress={() => setIsSigningUp(f => !f)}
// // //         disabled={loading}
// // //       >
// // //         <Text style={styles.toggle}>
// // //           {isSigningUp
// // //             ? 'Already have an account? Sign In'
// // //             : "Don't have one? Create Account"}
// // //         </Text>
// // //       </TouchableOpacity>
// // //     </View>
// // //   )
// // // }

// // // const styles = StyleSheet.create({
// // //   container: { flex:1, backgroundColor:'#0E0C15', justifyContent:'center', padding:24 },
// // //   title:     { fontSize:28, fontWeight:'700', color:'#AC6AFF', marginBottom:24, textAlign:'center' },
// // //   input:     { backgroundColor:'#15131D', color:'#FFF', padding:12, borderRadius:8, marginBottom:16 },
// // //   button:    { paddingVertical:14, borderRadius:8, alignItems:'center', marginBottom:12 },
// // //   buttonText:{ color:'#FFF', fontWeight:'600', fontSize:16 },
// // //   toggle:    { color:'#CAC6DD', textAlign:'center', marginTop:8 },
// // // })


// // src/screens/SignIn.tsx
// import React, { useState } from 'react'
// import {
//   View, Text, TextInput, TouchableOpacity,
//   StyleSheet, ActivityIndicator, Alert,
// } from 'react-native'
// import { supabase } from '../lib/api'
// import { useAuth } from '../hooks/useAuth'
// import { useNavigation } from '@react-navigation/native'
// import * as Linking from 'expo-linking'

// export default function SignIn() {
//   const { setUser } = useAuth()
//   const nav = useNavigation()
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [mode, setMode] = useState<'password'|'magic'>('password')
//   const [isSigningUp, setIsSigningUp] = useState(false)

//   // expo scheme, match your app.json "scheme"
//   const redirectTo = Linking.createURL('login-callback')

//   async function handlePasswordAuth() {
//     const fn = isSigningUp
//       ? supabase.auth.signUp
//       : supabase.auth.signInWithPassword
//     const { data, error } = await fn({ email, password })
//     return { data, error }
//   }

//   async function handleMagicLink() {
//     return supabase.auth.signInWithOtp({
//       email,
//       options: { emailRedirectTo: redirectTo },
//     })
//   }

//   async function handleSubmit() {
//     if (!email.trim() || (mode==='password' && !password)) {
//       return Alert.alert('Please fill in all fields')
//     }
//     setLoading(true)
//     try {
//       let result, error
//       if (mode === 'password') {
//         ({ data: result, error } = await handlePasswordAuth())
//       } else {
//         ({ data: result, error } = await handleMagicLink())
//       }
//       if (error) throw error

//       if (mode === 'password') {
//         // immediately eligible
//         setUser(result.user)
//         nav.navigate('Main' as never)
//       } else {
//         Alert.alert(
//           'Check Your Inbox',
//           'We’ve sent you a magic link. Tap it to return to the app.'
//         )
//       }
//     } catch (err: any) {
//       Alert.alert('Auth error', err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>FitFlow</Text>

//       {/* Mode Toggle */}
//       <View style={styles.modeRow}>
//         <TouchableOpacity onPress={() => setMode('password')}>
//           <Text style={mode==='password' ? styles.modeActive : styles.mode}>
//             Password
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={() => setMode('magic')}>
//           <Text style={mode==='magic' ? styles.modeActive : styles.mode}>
//             Magic Link
//           </Text>
//         </TouchableOpacity>
//       </View>

//       <TextInput
//         placeholder="Email"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         value={email}
//         onChangeText={setEmail}
//         style={styles.input}
//       />

//       {mode === 'password' && (
//         <TextInput
//           placeholder="Password"
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//           style={styles.input}
//         />
//       )}

//       {mode==='password' && (
//         <TouchableOpacity
//           style={styles.toggleSignup}
//           onPress={() => setIsSigningUp(s => !s)}
//           disabled={loading}
//         >
//           <Text style={styles.toggleText}>
//             {isSigningUp ? 'Have an account? Sign In' : "Don't have one? Sign Up"}
//           </Text>
//         </TouchableOpacity>
//       )}

//       <TouchableOpacity
//         style={[styles.button, { backgroundColor: '#AC6AFF' }]}
//         onPress={handleSubmit}
//         disabled={loading}
//       >
//         {loading
//           ? <ActivityIndicator color="#fff"/>
//           : <Text style={styles.buttonText}>
//               {mode==='magic'
//                 ? 'Send Magic Link'
//                 : isSigningUp ? 'Sign Up' : 'Sign In'}
//             </Text>
//         }
//       </TouchableOpacity>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex:1, backgroundColor:'#0E0C15',
//     justifyContent:'center', padding:24
//   },
//   title: {
//     fontSize:36, color:'#AC6AFF',
//     fontWeight:'700', textAlign:'center',
//     marginBottom:32
//   },
//   modeRow: {
//     flexDirection:'row', justifyContent:'center',
//     marginBottom:16
//   },
//   mode: {
//     color:'#757185', marginHorizontal:12, fontSize:16
//   },
//   modeActive: {
//     color:'#AC6AFF', marginHorizontal:12,
//     fontSize:16, fontWeight:'600'
//   },
//   input: {
//     backgroundColor:'#15131D', color:'#FFF',
//     padding:12, borderRadius:8, marginBottom:16
//   },
//   toggleSignup: {
//     alignSelf:'flex-end', marginBottom:12
//   },
//   toggleText: {
//     color:'#CAC6DD', fontSize:14
//   },
//   button: {
//     paddingVertical:14, borderRadius:8,
//     alignItems:'center', marginTop:8
//   },
//   buttonText: {
//     color:'#FFF', fontWeight:'600', fontSize:16
//   },
// })


// src/screens/SignIn.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native'
import { signUp, signIn } from '../lib/api'
import { useNavigation } from '@react-navigation/native'

export default function SignIn() {
  const nav = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      if (isSigningUp) {
        await signUp(email.trim(), password)
        Alert.alert('Success', 'Account created—please check your email to confirm.')
      } else {
        await signIn(email.trim(), password)
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSigningUp ? 'Create Account' : 'Sign In'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.buttonText}>
              {isSigningUp ? 'Sign Up' : 'Sign In'}
            </Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsSigningUp(s => !s)} disabled={loading}>
        <Text style={styles.toggle}>
          {isSigningUp ? 'Have an account? Sign In' : "Don't have one? Create Account"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:24, backgroundColor:'#0E0C15' },
  title:     { fontSize:28, fontWeight:'700', color:'#AC6AFF', marginBottom:24, textAlign:'center' },
  input:     { backgroundColor:'#15131D', color:'#FFF', padding:12, borderRadius:8, marginBottom:16 },
  button:    { backgroundColor:'#AC6AFF', padding:14, borderRadius:8, alignItems:'center', marginBottom:12 },
  buttonText:{ color:'#FFF', fontWeight:'600', fontSize:16 },
  toggle:    { color:'#CAC6DD', textAlign:'center', marginTop:8 },
})
