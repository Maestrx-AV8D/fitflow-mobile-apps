// // // premium.tsx - FitFlow Premium Subscription Flow (Stripe + Supabase)

// // import { LinearGradient } from 'expo-linear-gradient'
// // import React, { useEffect, useState } from 'react'
// // import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// // import { supabase } from '../lib/api'

// // export const useIsPremium = () => {
// //   const [isPremium, setIsPremium] = useState(false)

// //   useEffect(() => {
// //     const check = async () => {
// //       const {
// //         data,
// //         error
// //       } = await supabase.from('is_premium').select('is_premium').maybeSingle()
// //       if (error) console.warn('Premium check error', error)
// //       setIsPremium(data?.is_premium ?? false)
// //     }
// //     check()
// //   }, [])

// //   return isPremium
// // }

// // export function Paywall({ navigation }: any) {
// //   const handleSubscribe = async () => {
// //     const {
// //       data: { user }
// //     } = await supabase.auth.getUser()
// //     const { data, error } = await supabase.functions.invoke('create-stripe-session', { body: { user } })
// //     if (data?.url) {
// //       Linking.openURL(data.url)
// //     } else {
// //       Alert.alert('Error', 'Unable to start subscription. Try again.')
// //     }
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <LinearGradient colors={['#111', '#000']} style={styles.card}>
// //         <Text style={styles.title}>Unlock Premium</Text>
// //         <Text style={styles.subtitle}>3-day free trial · then £4.99/mo</Text>

// //         <Text style={styles.bullet}>✓ AI SmartWorkouts</Text>
// //         <Text style={styles.bullet}>✓ Unlimited Logs</Text>
// //         <Text style={styles.bullet}>✓ Priority Support</Text>

// //         <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
// //           <Text style={styles.buttonText}>Start Free Trial</Text>
// //         </TouchableOpacity>
// //       </LinearGradient>
// //     </View>
// //   )
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#FDFCF9',
// //     justifyContent: 'center',
// //     padding: 24
// //   },
// //   card: {
// //     borderRadius: 20,
// //     padding: 32,
// //     alignItems: 'center'
// //   },
// //   title: {
// //     fontSize: 32,
// //     fontWeight: '700',
// //     color: '#fff',
// //     marginBottom: 8
// //   },
// //   subtitle: {
// //     fontSize: 16,
// //     color: '#ccc',
// //     marginBottom: 24
// //   },
// //   bullet: {
// //     fontSize: 16,
// //     color: '#fff',
// //     marginBottom: 12
// //   },
// //   button: {
// //     marginTop: 24,
// //     backgroundColor: '#fff',
// //     borderRadius: 8,
// //     paddingVertical: 14,
// //     paddingHorizontal: 32
// //   },
// //   buttonText: {
// //     color: '#000',
// //     fontSize: 16,
// //     fontWeight: '600'
// //   }
// // })

// import { LinearGradient } from 'expo-linear-gradient'
// import React from 'react'
// import {
//   Alert,
//   Dimensions,
//   Linking,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from 'react-native'
// import { supabase } from '../lib/api'

// const width = Dimensions.get('window').width

// export default function Paywall({ navigation }: any) {
//   const handleSubscribe = async () => {
//     const {
//       data: { user }
//     } = await supabase.auth.getUser()

//     const { data, error } = await supabase.functions.invoke('create-stripe-session', {
//       body: { user }
//     })

//     if (data?.url) {
//       Linking.openURL(data.url)
//     } else {
//       Alert.alert('Error', 'Unable to start subscription. Try again.')
//     }
//   }

//   const features = [
//     { title: 'AI Coach', description: 'Smart workouts & intelligent training advice', ai: true },
//     { title: 'Unlimited Logs', description: 'No limits. Track as much as you want' },
//     { title: 'Import to Schedule', description: 'Push workouts into your calendar seamlessly' },
//     { title: 'App Personalisation', description: 'Themes, widgets & layout settings' },
//     { title: 'Protect Journal Entries', description: 'Lock logs with Face ID or passcode' }
//   ]

//   return (
//     <View style={styles.container}>
//       <Text style={styles.headerTitle}>Looking for that extra boost?</Text>
//       <Text style={styles.headerSub}>Unlock all FitFlow features, forever.</Text>

//       <View style={styles.toggleWrapper}>
//         <Text style={styles.toggleInactive}>Monthly</Text>
//         <LinearGradient
//           colors={['#B490FB', '#C07DFF']}
//           style={styles.toggleActive}
//         >
//           <Text style={styles.toggleActiveText}>Yearly + AI</Text>
//         </LinearGradient>
//       </View>

//       <View style={styles.card}>
//         {features.map((item, i) => (
//           <View key={i} style={styles.featureRow}>
//             <Text style={styles.featureTitle}>{item.title}</Text>
//             <Text style={styles.featureDesc}>{item.description}</Text>
//             {item.ai && <Text style={styles.aiBadge}>AI</Text>}
//           </View>
//         ))}

//         <View style={styles.priceBox}>
//           <Text style={styles.priceMain}>£19.99 annually</Text>
//           <Text style={styles.priceSub}>Cancel anytime</Text>
//         </View>

//         <TouchableOpacity onPress={handleSubscribe} style={styles.ctaButton}>
//           <LinearGradient
//             colors={['#B490FB', '#C07DFF']}
//             style={styles.ctaGradient}
//           >
//             <Text style={styles.ctaText}>Try 7 days free</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FDFCF9',
//     padding: 20
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginTop: 12
//   },
//   headerSub: {
//     color: '#6A6A6A',
//     fontSize: 15,
//     marginBottom: 24
//   },
//   toggleWrapper: {
//     flexDirection: 'row',
//     alignSelf: 'center',
//     marginBottom: 24,
//     backgroundColor: '#ECECEC',
//     borderRadius: 24,
//     padding: 4
//   },
//   toggleInactive: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     color: '#8D8D8D',
//     fontWeight: '500'
//   },
//   toggleActive: {
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 20
//   },
//   toggleActiveText: {
//     color: '#fff',
//     fontWeight: '600'
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2
//   },
//   featureRow: {
//     marginBottom: 20
//   },
//   featureTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1A1A1A'
//   },
//   featureDesc: {
//     color: '#6A6A6A',
//     fontSize: 14
//   },
//   aiBadge: {
//     position: 'absolute',
//     right: 0,
//     top: 0,
//     backgroundColor: '#C07DFF',
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 11,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 6
//   },
//   priceBox: {
//     marginTop: 16,
//     alignItems: 'center'
//   },
//   priceMain: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#000'
//   },
//   priceSub: {
//     fontSize: 13,
//     color: '#6A6A6A',
//     marginBottom: 16
//   },
//   ctaButton: {
//     borderRadius: 32,
//     overflow: 'hidden'
//   },
//   ctaGradient: {
//     paddingVertical: 14,
//     alignItems: 'center',
//     borderRadius: 32
//   },
//   ctaText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16
//   }
// })

import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/api";

const width = Dimensions.get("window").width;

const premiumFeatures = [
  {
    title: "Unlimited Logs",
    description: "No limits. Track as much as you want",
    icon: <Feather name="edit-2" size={20} color="#000" />,
  },
  {
    title: "Import to Schedule",
    description: "Push workouts into your calendar seamlessly",
    icon: <Ionicons name="calendar-outline" size={20} color="#000" />,
  },
  {
    title: "App Personalisation",
    description: "Themes, widgets & layout settings",
    icon: <Feather name="sliders" size={20} color="#000" />,
  },
  {
    title: "Protect Journal Entries",
    description: "Lock logs with Face ID or passcode",
    icon: <MaterialIcons name="lock-outline" size={20} color="#000" />,
  },
];

const featureSets = {
  premium: premiumFeatures,
  ai: [
    {
      title: "AI Coach",
      description: "Smart workouts & intelligent training advice",
      icon: <Ionicons name="flash-outline" size={20} color="#000" />,
      ai: true,
    },
    {
      title: "AI Journalling",
      description: "Reflect deeper with intelligent suggestions",
      icon: <MaterialIcons name="psychology" size={20} color="#000" />,
      ai: true,
    },
    ...premiumFeatures,
  ],
};

export default function Paywall({ navigation }: any) {
  const [selected, setSelected] = useState<"premium" | "ai">("ai");

  const handleSubscribe = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.functions.invoke(
      "create-stripe-session",
      {
        body: { user, plan: selected },
      }
    );

    if (data?.url) {
      Linking.openURL(data.url);
    } else {
      Alert.alert("Error", "Unable to start subscription. Try again.");
    }
  };

  const features = selected === "ai" ? featureSets.ai : featureSets.premium;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Looking for that extra goodness?</Text>
        <Text style={styles.headerSub}>
          Unlock all FitFlow premium features.
        </Text>

        <View style={styles.toggleWrapper}>
          <TouchableOpacity onPress={() => setSelected("premium")}>
            {selected === "premium" ? (
              <LinearGradient
                colors={["#FFCF91", "#F79F4D"]}
                style={styles.toggleOption}
              >
                <Text style={[styles.toggleTextSelected]}>Premium</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleOption}>
                <Text style={styles.toggleText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSelected("ai")}>
            {selected === "ai" ? (
              <LinearGradient
                colors={["#B490FB", "#C07DFF"]}
                style={styles.toggleOption}
              >
                <Text style={[styles.toggleTextSelected]}>Premium + AI</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleOption}>
                <Text style={styles.toggleText}>Premium + AI</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {features.map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.iconWrapper}>{item.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.description}</Text>
              </View>
              {item.ai && <Text style={styles.aiBadge}>AI</Text>}
            </View>
          ))}

          <View style={styles.priceBox}>
            <Text style={styles.priceMain}>£19.99 annually</Text>
            <Text style={styles.priceSub}>Cancel anytime</Text>
          </View>

          <TouchableOpacity onPress={handleSubscribe} style={styles.ctaButton}>
            <LinearGradient
              colors={["#B490FB", "#C07DFF"]}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Try 7 days free</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    backgroundColor: "#FDFCF9",
    padding: 16,
    paddingTop: 70,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 12,
  },
  headerSub: {
    color: "#6A6A6A",
    fontSize: 15,
    marginBottom: 24,
  },
  toggleWrapper: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 24,
    backgroundColor: "#ECECEC",
    borderRadius: 24,
    padding: 4,
  },
  toggleOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toggleSelected: {
    backgroundColor: "#C07DFF",
  },
  toggleText: {
    fontWeight: "500",
    color: "#8D8D8D",
  },
  toggleTextSelected: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrapper: {
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  featureDesc: {
    color: "#6A6A6A",
    fontSize: 14,
  },
  aiBadge: {
    backgroundColor: "#C07DFF",
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBox: {
    marginTop: 16,
    alignItems: "center",
  },
  priceMain: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  priceSub: {
    fontSize: 13,
    color: "#6A6A6A",
    marginBottom: 16,
  },
  ctaButton: {
    borderRadius: 32,
    overflow: "hidden",
  },
  ctaGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 32,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
