// // App.tsx
// import React, { useEffect } from 'react'
// import AppNavigator, { navigationRef }  from './src/navigation/AppNavigator'
// import { AuthProvider } from './src/hooks/useAuth'
// import { supabase } from './src/lib/api'
// import * as Linking from 'expo-linking'

// export default function App() {
  
//   useEffect(() => {
//     // Listen for deep links
//     const subscription = Linking.addEventListener('url', async ({ url }) => {
//       // e.g. fitflow://login-callback?access_token=...&refresh_token=...
//       const { queryParams } = Linking.parse(url)
//       if (queryParams?.access_token) {
//         await supabase.auth.setSession({
//           access_token: queryParams.access_token as string,
//           refresh_token: queryParams.refresh_token as string
//         })
//         // now the user is signed in—navigate to your protected area
//         if (navigationRef.isReady()) {
//           navigationRef.navigate('Main')
//         }
//       }
//     })

//     return () => subscription.remove()
//   }, [])
//   return (
//     <AuthProvider>
//       <AppNavigator />
//     </AuthProvider>
//   )
// }


// // App.tsx
// import 'react-native-get-random-values'
// import 'react-native-url-polyfill/auto'
// import React, { useEffect } from 'react'
// import { AuthProvider } from './src/hooks/useAuth'
// import AppNavigator from './src/navigation/AppNavigator'
// import * as Linking from 'expo-linking'
// import { supabase } from './src/lib/api'

// export default function App() {
//   useEffect(() => {
//     const sub = Linking.addEventListener('url', async ({ url }) => {
//       const { queryParams } = Linking.parse(url)
//       if (queryParams?.access_token && queryParams.refresh_token) {
//         await supabase.auth.setSession({
//           access_token: queryParams.access_token as string,
//           refresh_token: queryParams.refresh_token as string,
//         })
//       }
//     })
//     return () => sub.remove()
//   }, [])

//   return (
//     <AuthProvider>
//       <AppNavigator/>
//     </AuthProvider>
//   )
// }

// App.tsx
//import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React from 'react';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator/>
    </AuthProvider>
  );
}