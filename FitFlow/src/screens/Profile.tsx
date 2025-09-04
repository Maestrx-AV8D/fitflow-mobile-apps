// // import React, { useEffect, useState } from 'react'
// // import {
// //   ScrollView,
// //   View,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   StyleSheet,
// //   ActivityIndicator,
// //   Alert,
// //   Linking
// // } from 'react-native'
// // import { LinearGradient } from 'expo-linear-gradient'
// // import { useNavigation } from '@react-navigation/native'
// // import { getProfile, saveProfile, supabase } from '../lib/api'

// // export default function Profile() {
// //   const navigation = useNavigation<any>()
// //   const [form, setForm] = useState({
// //     fullName: '',
// //     age: '',
// //     gender: '',
// //     height: '',
// //     weight: ''
// //   })
// //   const [loading, setLoading] = useState(true)
// //   const [editing, setEditing] = useState(false)

// //   useEffect(() => {
// //     (async () => {
// //       const data = await getProfile()
// //       if (data) {
// //         setForm(data)
// //         setEditing(false)
// //       } else {
// //         setEditing(true)
// //       }
// //       setLoading(false)
// //     })()
// //   }, [])

// //   const handleLogout = async () => {
// //     await supabase.auth.signOut()
// //     navigation.replace('Signin')
// //   }

// //   const openLink = (url: string) => {
// //     Linking.openURL(url).catch(err => Alert.alert('Failed to open link', err.message))
// //   }

// //   const GradientButton = ({ text, onPress, style = {}, white = false }: any) => (
// //     <TouchableOpacity onPress={onPress} style={[styles.gradientWrapper, style]}>
// //       {!white ? (
// //         <LinearGradient
// //           colors={['#1C1B23', '#000']}
// //           start={{ x: 0, y: 0 }}
// //           end={{ x: 1, y: 1 }}
// //           style={styles.button}
// //         >
// //           <Text style={styles.buttonText}>{text}</Text>
// //         </LinearGradient>
// //       ) : (
// //         <View style={[styles.button, { backgroundColor: '#FFF' }]}>
// //           <Text style={[styles.buttonText, { color: '#000' }]}>{text}</Text>
// //         </View>
// //       )}
// //     </TouchableOpacity>
// //   )

// //   if (loading) {
// //     return (
// //       <View style={styles.center}>
// //         <ActivityIndicator size="large" color="#000" />
// //       </View>
// //     )
// //   }

// //   return (
// //     <View style={styles.modalBackdrop}>
// //       <View style={styles.screen}>
// //         <ScrollView contentContainerStyle={styles.container}>
// //           <View style={styles.modalCard}>
// //             <TouchableOpacity
// //               style={{ position: 'absolute', top: 16, right: 16, zIndex: 999 }}
// //               onPress={() => navigation.goBack()}
// //             >
// //               <Text style={{ fontSize: 24 }}>✕</Text>
// //             </TouchableOpacity>

// //             <Text style={styles.title}>Profile</Text>

// //             <LinearGradient
// //               colors={['#111', '#000']}
// //               start={{ x: 0, y: 0 }}
// //               end={{ x: 1, y: 1 }}
// //               style={styles.premiumBox}
// //             >
// //               <Text style={styles.premiumText}>
// //                 Unlock full access to FitFlow: smart workouts, AI coaching, sync across devices, and more.
// //               </Text>
// //               <GradientButton text="Try 3 Days for Free" onPress={() => Alert.alert('Coming Soon')} white />
// //             </LinearGradient>

// //             {/* Account */}
// //             <View style={styles.card}>
// //               <Text style={styles.sectionTitle}>Account</Text>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('YourData')}>
// //                 <Text style={styles.linkText}>Your Data</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity
// //                 style={styles.linkItem}
// //                 onPress={() => Alert.alert('Coming Soon', 'Notification preferences coming soon.')}
// //               >
// //                 <Text style={styles.linkText}>Notifications</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity
// //                 style={styles.linkItem}
// //                 onPress={() =>
// //                   Alert.alert(
// //                     'About Premium',
// //                     'Premium includes full access to FitFlow AI, unlimited logs, and iCloud sync.'
// //                   )
// //                 }
// //               >
// //                 <Text style={styles.linkText}>About Premium</Text>
// //               </TouchableOpacity>
// //             </View>

// //             {/* Personalisation */}
// //             <View style={styles.card}>
// //               <Text style={styles.sectionTitle}>Personalisation</Text>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('Checkin')}>
// //                 <Text style={styles.linkText}>Preferences</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('Onboarding')}>
// //                 <Text style={styles.linkText}>Appearance</Text>
// //               </TouchableOpacity>
// //             </View>

// //             {/* Support */}
// //             <View style={styles.card}>
// //               <Text style={styles.sectionTitle}>Help & Support</Text>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://fitflow.help')}>
// //                 <Text style={styles.linkText}>FAQ</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => openLink('mailto:support@fitflow.app')}>
// //                 <Text style={styles.linkText}>Report a Bug</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://fitflow.app/suggest')}>
// //                 <Text style={styles.linkText}>Suggest a Feature</Text>
// //               </TouchableOpacity>
// //             </View>

// //             {/* Application */}
// //             <View style={styles.card}>
// //               <Text style={styles.sectionTitle}>Application</Text>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('Widgets')}>
// //                 <Text style={styles.linkText}>Widgets</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://fitflow.app/privacy')}>
// //                 <Text style={styles.linkText}>Privacy</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://fitflow.app/terms')}>
// //                 <Text style={styles.linkText}>Terms of Service</Text>
// //               </TouchableOpacity>
// //             </View>

// //             <GradientButton text="Log Out" onPress={handleLogout} style={{ marginTop: 24 }} />

// //             <Text style={styles.version}>FitFlow v2025.1</Text>
// //           </View>
// //         </ScrollView>
// //       </View>
// //     </View>
// //   )
// // }

// // const styles = StyleSheet.create({
// //   modalBackdrop: {
// //     flex: 1,
// //     backgroundColor: 'rgba(0,0,0,0.05)',
// //     justifyContent: 'flex-end'
// //   },
// //   screen: {
// //     flex: 1,
// //     backgroundColor: '#FDFCF9'
// //   },
// //   container: {
// //     padding: 16,
// //     paddingTop: 40,
// //     paddingBottom: 80,
// //     backgroundColor: '#FDFCF9',
// //     flexGrow: 1
// //   },
// //   center: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#FDFCF9'
// //   },
// //   modalCard: {
// //     backgroundColor: '#FFFFFF',
// //     borderTopLeftRadius: 24,
// //     borderTopRightRadius: 24,
// //     padding: 20,
// //     marginTop: 20
// //   },
// //   title: {
// //     fontSize: 36,
// //     fontWeight: '700',
// //     color: '#000',
// //     textAlign: 'left',
// //     marginBottom: 24
// //   },
// //   gradientWrapper: {
// //     borderRadius: 8,
// //     overflow: 'hidden'
// //   },
// //   button: {
// //     padding: 14,
// //     alignItems: 'center',
// //     justifyContent: 'center'
// //   },
// //   buttonText: {
// //     fontWeight: '600',
// //     fontSize: 16,
// //     textAlign: 'center',
// //     color: '#FFFFFF'
// //   },
// //   premiumBox: {
// //     borderRadius: 16,
// //     padding: 24,
// //     marginBottom: 24,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     minHeight: 260,
// //     overflow: 'hidden'
// //   },
// //   premiumText: {
// //     color: '#fff',
// //     fontSize: 16,
// //     marginBottom: 30,
// //     fontWeight: '500',
// //     textAlign: 'center'
// //   },
// //   sectionTitle: {
// //     fontSize: 14,
// //     color: '#5E5E5E',
// //     textTransform: 'uppercase',
// //     marginBottom: 12
// //   },
// //   card: {
// //     backgroundColor: '#FFFFFF',
// //     borderRadius: 16,
// //     padding: 20,
// //     marginBottom: 24,
// //     shadowColor: '#000',
// //     shadowOpacity: 0.05,
// //     shadowRadius: 8,
// //     elevation: 2
// //   },
// //   linkItem: {
// //     paddingVertical: 12
// //   },
// //   linkText: {
// //     color: '#1A1A1A',
// //     fontSize: 16
// //   },
// //   version: {
// //     textAlign: 'center',
// //     marginTop: 40,
// //     fontSize: 13,
// //     color: '#A0A0A0'
// //   }
// // })

// // === Updated Profile.tsx ===
// import { useNavigation } from "@react-navigation/native";
// import { LinearGradient } from "expo-linear-gradient";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Linking,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useIsPremium } from "../hooks/useIsPremium";
// import { getProfile, supabase } from "../lib/api";

// export default function Profile() {
//   const navigation = useNavigation<any>();
//   const [form, setForm] = useState({
//     fullName: "",
//     age: "",
//     gender: "",
//     height: "",
//     weight: "",
//   });
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(false);
//   const [showBugModal, setShowBugModal] = useState(false);
//   const [showFeatureModal, setShowFeatureModal] = useState(false);
//   const [feedback, setFeedback] = useState("");
//   // const [isPremium, setIsPremium] = useState(false) // Replace with real user subscription check

//   const isPremium = useIsPremium();

//   useEffect(() => {
//     (async () => {
//       const data = await getProfile();
//       if (data) {
//         setForm(data);
//         setEditing(false);
//       } else {
//         setEditing(true);
//       }
//       setLoading(false);
//     })();
//   }, []);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     navigation.replace("Signin");
//   };

//   const openLink = (url: string) => {
//     Linking.openURL(url).catch((err) =>
//       Alert.alert("Failed to open link", err.message)
//     );
//   };

//   const handleSendFeedback = (type: "bug" | "feature") => {
//     const subject =
//       type === "bug" ? "FitFlow Bug Report" : "FitFlow Feature Suggestion";
//     const body = encodeURIComponent(feedback);
//     const mailto = `mailto:support@fitflow.app?subject=${subject}&body=${body}`;
//     Linking.openURL(mailto);
//     setFeedback("");
//     setShowBugModal(false);
//     setShowFeatureModal(false);
//   };

//   const FeedbackModal = ({ visible, onClose, type }: any) => (
//     <Modal visible={visible} animationType="slide" transparent>
//       <View style={styles.modalOverlay}>
//         <View style={styles.feedbackModal}>
//           <Text style={styles.modalTitle}>
//             {type === "bug" ? "Report a Bug" : "Suggest a Feature"}
//           </Text>
//           <TextInput
//             style={styles.feedbackInput}
//             multiline
//             placeholder="Describe your feedback..."
//             value={feedback}
//             onChangeText={setFeedback}
//           />
//           <TouchableOpacity
//             style={[styles.button, { backgroundColor: "#000", marginTop: 12 }]}
//             onPress={() => handleSendFeedback(type)}
//           >
//             <Text style={styles.buttonText}>Send</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
//             <Text style={{ color: "#999" }}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );

//   const GradientButton = ({
//     text,
//     onPress,
//     style = {},
//     white = false,
//   }: any) => (
//     <TouchableOpacity onPress={onPress} style={[styles.gradientWrapper, style]}>
//       {!white ? (
//         <LinearGradient
//           colors={["#1C1B23", "#000"]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.button}
//         >
//           <Text style={styles.buttonText}>{text}</Text>
//         </LinearGradient>
//       ) : (
//         <View style={[styles.button, { backgroundColor: "#FFF" }]}>
//           <Text style={[styles.buttonText, { color: "#000" }]}>{text}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#000" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.modalBackdrop}>
//       <View style={styles.screen}>
//         <View style={styles.modalCardContainer}>
//           <ScrollView contentContainerStyle={styles.modalCard}>
//             <View style={styles.modalCard}>
//               <TouchableOpacity
//                 style={{
//                   position: "absolute",
//                   top: 16,
//                   right: 16,
//                   zIndex: 999,
//                 }}
//                 onPress={() => navigation.goBack()}
//               >
//                 <Text style={{ fontSize: 24 }}>✕</Text>
//               </TouchableOpacity>

//               <Text style={styles.title}>Profile</Text>

//               <LinearGradient
//                 colors={["#111", "#000"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={styles.premiumBox}
//               >
//                 <Text style={styles.premiumText}>
//                   Unlock full access to FitFlow: smart workouts, AI coaching,
//                   sync across devices, and more.
//                 </Text>
//                 <GradientButton
//                   text="Try 7 Days for Free"
//                   onPress={() => Alert.alert("Coming Soon")}
//                   white
//                 />
//               </LinearGradient>
//               <Text style={styles.sectionTitle}>Personalise</Text>
//               <View style={styles.card}>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => navigation.navigate("YourData")}
//                 >
//                   <Text style={styles.linkText}>Your Profile</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => Alert.alert("Coming Soon")}
//                 >
//                   <Text style={styles.linkText}>Notifications</Text>
//                 </TouchableOpacity>
//               </View>
//               <Text style={styles.sectionTitle}>Account</Text>
//               <View style={styles.card}>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => navigation.navigate("Paywall")}
//                 >
//                   <Text style={styles.linkText}>About Premium</Text>
//                 </TouchableOpacity>
//               </View>

             
//               <Text style={styles.sectionTitle}>Help & Support</Text>
//               <View style={styles.card}>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => openLink("https://fitflow.help")}
//                 >
//                   <Text style={styles.linkText}>FAQ</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => setShowBugModal(true)}
//                 >
//                   <Text style={styles.linkText}>Report a Bug</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => setShowFeatureModal(true)}
//                 >
//                   <Text style={styles.linkText}>Suggest a Feature</Text>
//                 </TouchableOpacity>
//               </View>
//               <Text style={styles.sectionTitle}>Legal</Text>
//               <View style={styles.card}>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => openLink("https://fitflow.app/privacy")}
//                 >
//                   <Text style={styles.linkText}>Privacy</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.linkItem}
//                   onPress={() => openLink("https://fitflow.app/terms")}
//                 >
//                   <Text style={styles.linkText}>Terms of Service</Text>
//                 </TouchableOpacity>
//               </View>

//               <GradientButton
//                 text="Log Out"
//                 onPress={handleLogout}
//                 style={{ marginTop: 24 }}
//               />
//               <Text style={styles.version}>FitFlow v2025.1</Text>
//             </View>
//           </ScrollView>
//         </View>
//         <FeedbackModal
//           visible={showBugModal}
//           onClose={() => setShowBugModal(false)}
//           type="bug"
//         />
//         <FeedbackModal
//           visible={showFeatureModal}
//           onClose={() => setShowFeatureModal(false)}
//           type="feature"
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.05)",
//     justifyContent: "flex-end",
//   },
//   screen: { flex: 1, backgroundColor: "#FDFCF9" },
//   container: {
//     padding: 16,
//     paddingTop: 40,
//     paddingBottom: 80,
//     backgroundColor: "#FDFCF9",
//     flexGrow: 1,
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#FDFCF9",
//   },
//   modalCard: {
//     backgroundColor: "#FFFFFF",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 20,
//     flexGrow: 20,
//   },
//   title: {
//     fontSize: 36,
//     fontWeight: "700",
//     color: "#000",
//     textAlign: "left",
//     marginBottom: 24,
//   },
//   gradientWrapper: { borderRadius: 8, overflow: "hidden" },
//   button: { padding: 14, alignItems: "center", justifyContent: "center" },
//   buttonText: {
//     fontWeight: "600",
//     fontSize: 16,
//     textAlign: "center",
//     color: "#FFFFFF",
//   },
//   premiumBox: {
//     borderRadius: 16,
//     padding: 24,
//     marginBottom: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     minHeight: 260,
//     overflow: "hidden",
//   },
//   premiumText: {
//     color: "#fff",
//     fontSize: 16,
//     marginBottom: 30,
//     fontWeight: "500",
//     textAlign: "center",
//   },
//   sectionTitle: {
//     fontSize: 14,
//     color: "#5E5E5E",
//     textTransform: "uppercase",
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   linkItem: { paddingVertical: 12 },
//   linkText: { color: "#1A1A1A", fontSize: 16 },
//   version: {
//     textAlign: "center",
//     marginTop: 40,
//     fontSize: 13,
//     color: "#A0A0A0",
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   feedbackModal: {
//     backgroundColor: "#FFF",
//     padding: 24,
//     borderRadius: 16,
//     width: "90%",
//   },
//   modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
//   feedbackInput: {
//     height: 100,
//     borderColor: "#DDD",
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     textAlignVertical: "top",
//   },
//   modalCardContainer: {
//     flex: 1,
//     paddingTop: 40,
//     paddingBottom: 80,
//     backgroundColor: "#FDFCF9",
//   },
// });



// === Updated Profile.tsx ===
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useIsPremium } from "../hooks/useIsPremium";
import { getProfile, supabase } from "../lib/api";
import { useTheme } from "../theme/theme";

export default function Profile() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const isPremium = useIsPremium();
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      const data = await getProfile();
      if (data) {
        setForm(data);
        setEditing(false);
      } else {
        setEditing(true);
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace("SignIn");
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      Alert.alert("Failed to open link", err.message)
    );
  };

  const handleSendFeedback = (type: "bug" | "feature") => {
    const subject =
      type === "bug" ? "FitFlow Bug Report" : "FitFlow Feature Suggestion";
    const body = encodeURIComponent(feedback);
    const mailto = `mailto:support@fitflow.app?subject=${subject}&body=${body}`;
    Linking.openURL(mailto);
    setFeedback("");
    setShowBugModal(false);
    setShowFeatureModal(false);
  };

  const FeedbackModal = ({ visible, onClose, type }: any) => (
    <Modal visible={visible} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.feedbackModal}>
          <TouchableOpacity
                style={{ position: "absolute", top: 16, right: 16, zIndex: 999 }}
                onPress={onClose}
              >
                <Text style={{ fontSize: 24, color: colors.inputBackground }}>✕</Text>
              </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {type === "bug" ? "Report a Bug" : "Suggest a Feature"}
          </Text>
          <TextInput
            style={styles.feedbackInput}
            multiline
            placeholder="Describe your feedback..."
            value={feedback}
            onChangeText={setFeedback}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#000", marginTop: 12 }]}
            onPress={() => handleSendFeedback(type)}
          >
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const GradientButton = ({ text, onPress, style = {}, white = false }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.gradientWrapper, style]}>
      {!white ? (
        <LinearGradient
          colors={["#1C1B23", "#000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{text}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.button, { backgroundColor: "#FFF" }]}>
          <Text style={[styles.buttonText, { color: "#000" }]}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.modalCardContainer}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={{ position: "absolute", top: 16, right: 16, zIndex: 999 }}
                onPress={() => navigation.goBack()}
              >
                <Text style={{ fontSize: 24, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>

              <Text style={[styles.title, {color: colors.textPrimary}]}>Your Profile</Text>

              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={styles.premiumBox}
              >
                {/* <Image source={require("../assets/unlock.png")} style={{ width: 32, height: 32, marginBottom: 16 }} /> */}
                <Text style={styles.premiumText}>
                  Unlock full access to FitFlow: smart workouts, AI coaching,
                  sync across devices, and more.
                </Text>
                <GradientButton
                  text="Try 7 Days for Free"
                  onPress={() => navigation.navigate("Paywall")}
                  white
                />
              </LinearGradient>

              <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Customisation</Text>
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => navigation.navigate("YourData")}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>Personalise</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => navigation.navigate("NotificationSettings")}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>Notifications</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Account</Text>
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => navigation.navigate("Paywall")}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>About Premium</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Help & Support</Text>
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => openLink("https://fitflow.help")}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>FAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => setShowBugModal(true)}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>Found a Bug?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => setShowFeatureModal(true)}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>Suggest a Feature</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Legal</Text>
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => openLink("https://fitflow.app/privacy")}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>Privacy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={() => openLink("https://fitflow.app/terms")}
                >
                  <Text style={[styles.linkText, {color: colors.textPrimary}]}>Terms of Service</Text>
                </TouchableOpacity>
              </View>

              <GradientButton
                text="Log Out"
                onPress={handleLogout}
                style={{ marginTop: 24 }}
                white
              />
              <Text style={styles.version}>FitFlow v2025.2</Text>
            </View>
          </ScrollView>
        </View>
        <FeedbackModal
          visible={showBugModal}
          onClose={() => setShowBugModal(false)}
          type="bug"
        />
        <FeedbackModal
          visible={showFeatureModal}
          onClose={() => setShowFeatureModal(false)}
          type="feature"
        />
      </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  screen: { flex: 1 },
  container: {
    padding: 16,
    paddingTop: 40,
    paddingBottom: 80,
    backgroundColor: "#cda734ff",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDFCF9",
  },
  modalCard: {
    // backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexGrow: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#000",
    textAlign: "left",
    marginBottom: 24,
  },
  gradientWrapper: { borderRadius: 8, overflow: "hidden" },
  button: { padding: 14, alignItems: "center", justifyContent: "center" },
  buttonCancel: { padding: 8, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
    color: "#FFFFFF",
  },
  premiumBox: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 260,
    overflow: "hidden",
  },
  premiumText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 30,
    fontWeight: "500",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#5E5E5E",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkItem: { paddingVertical: 12 },
  linkText: { color: "#1A1A1A", fontSize: 16 },
  version: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 13,
    color: "#A0A0A0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackModal: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 16,
    width: "90%",
  },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  feedbackInput: {
    height: 100,
    borderColor: "#DDD",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
  },
  modalCardContainer: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 80,
    // backgroundColor: "#FDFCF9",
  },
});
