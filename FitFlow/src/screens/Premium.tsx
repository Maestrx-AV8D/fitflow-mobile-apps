// // // premium.tsx - FitFlow Premium Subscription Flow (Stripe + Supabase)

// // // import { LinearGradient } from 'expo-linear-gradient'
// // // import React, { useEffect, useState } from 'react'
// // // import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// // // import { supabase } from '../lib/api'

// // // export const useIsPremium = () => {
// // //   const [isPremium, setIsPremium] = useState(false)

// // //   useEffect(() => {
// // //     const check = async () => {
// // //       const {
// // //         data,
// // //         error
// // //       } = await supabase.from('is_premium').select('is_premium').maybeSingle()
// // //       if (error) console.warn('Premium check error', error)
// // //       setIsPremium(data?.is_premium ?? false)
// // //     }
// // //     check()
// // //   }, [])

// // //   return isPremium
// // // }

// // // export function Paywall({ navigation }: any) {
// // //   const handleSubscribe = async () => {
// // //     const {
// // //       data: { user }
// // //     } = await supabase.auth.getUser()
// // //     const { data, error } = await supabase.functions.invoke('create-stripe-session', { body: { user } })
// // //     if (data?.url) {
// // //       Linking.openURL(data.url)
// // //     } else {
// // //       Alert.alert('Error', 'Unable to start subscription. Try again.')
// // //     }
// // //   }

// // //   return (
// // //     <View style={styles.container}>
// // //       <LinearGradient colors={['#111', '#000']} style={styles.card}>
// // //         <Text style={styles.title}>Unlock Premium</Text>
// // //         <Text style={styles.subtitle}>3-day free trial · then £4.99/mo</Text>

// // //         <Text style={styles.bullet}>✓ AI SmartWorkouts</Text>
// // //         <Text style={styles.bullet}>✓ Unlimited Logs</Text>
// // //         <Text style={styles.bullet}>✓ Priority Support</Text>

// // //         <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
// // //           <Text style={styles.buttonText}>Start Free Trial</Text>
// // //         </TouchableOpacity>
// // //       </LinearGradient>
// // //     </View>
// // //   )
// // // }

// // // const styles = StyleSheet.create({
// // //   container: {
// // //     flex: 1,
// // //     backgroundColor: '#FDFCF9',
// // //     justifyContent: 'center',
// // //     padding: 24
// // //   },
// // //   card: {
// // //     borderRadius: 20,
// // //     padding: 32,
// // //     alignItems: 'center'
// // //   },
// // //   title: {
// // //     fontSize: 32,
// // //     fontWeight: '700',
// // //     color: '#fff',
// // //     marginBottom: 8
// // //   },
// // //   subtitle: {
// // //     fontSize: 16,
// // //     color: '#ccc',
// // //     marginBottom: 24
// // //   },
// // //   bullet: {
// // //     fontSize: 16,
// // //     color: '#fff',
// // //     marginBottom: 12
// // //   },
// // //   button: {
// // //     marginTop: 24,
// // //     backgroundColor: '#fff',
// // //     borderRadius: 8,
// // //     paddingVertical: 14,
// // //     paddingHorizontal: 32
// // //   },
// // //   buttonText: {
// // //     color: '#000',
// // //     fontSize: 16,
// // //     fontWeight: '600'
// // //   }
// // // })

// // import { LinearGradient } from 'expo-linear-gradient'
// // import React from 'react'
// // import {
// //   Alert,
// //   Dimensions,
// //   Linking,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   View
// // } from 'react-native'
// // import { supabase } from '../lib/api'

// // const width = Dimensions.get('window').width

// // export default function Paywall({ navigation }: any) {
// //   const handleSubscribe = async () => {
// //     const {
// //       data: { user }
// //     } = await supabase.auth.getUser()

// //     const { data, error } = await supabase.functions.invoke('create-stripe-session', {
// //       body: { user }
// //     })

// //     if (data?.url) {
// //       Linking.openURL(data.url)
// //     } else {
// //       Alert.alert('Error', 'Unable to start subscription. Try again.')
// //     }
// //   }

// //   const features = [
// //     { title: 'AI Coach', description: 'Smart workouts & intelligent training advice', ai: true },
// //     { title: 'Unlimited Logs', description: 'No limits. Track as much as you want' },
// //     { title: 'Import to Schedule', description: 'Push workouts into your calendar seamlessly' },
// //     { title: 'App Personalisation', description: 'Themes, widgets & layout settings' },
// //     { title: 'Protect Journal Entries', description: 'Lock logs with Face ID or passcode' }
// //   ]

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.headerTitle}>Looking for that extra boost?</Text>
// //       <Text style={styles.headerSub}>Unlock all FitFlow features, forever.</Text>

// //       <View style={styles.toggleWrapper}>
// //         <Text style={styles.toggleInactive}>Monthly</Text>
// //         <LinearGradient
// //           colors={['#B490FB', '#C07DFF']}
// //           style={styles.toggleActive}
// //         >
// //           <Text style={styles.toggleActiveText}>Yearly + AI</Text>
// //         </LinearGradient>
// //       </View>

// //       <View style={styles.card}>
// //         {features.map((item, i) => (
// //           <View key={i} style={styles.featureRow}>
// //             <Text style={styles.featureTitle}>{item.title}</Text>
// //             <Text style={styles.featureDesc}>{item.description}</Text>
// //             {item.ai && <Text style={styles.aiBadge}>AI</Text>}
// //           </View>
// //         ))}

// //         <View style={styles.priceBox}>
// //           <Text style={styles.priceMain}>£19.99 annually</Text>
// //           <Text style={styles.priceSub}>Cancel anytime</Text>
// //         </View>

// //         <TouchableOpacity onPress={handleSubscribe} style={styles.ctaButton}>
// //           <LinearGradient
// //             colors={['#B490FB', '#C07DFF']}
// //             style={styles.ctaGradient}
// //           >
// //             <Text style={styles.ctaText}>Try 7 days free</Text>
// //           </LinearGradient>
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   )
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#FDFCF9',
// //     padding: 20
// //   },
// //   headerTitle: {
// //     fontSize: 28,
// //     fontWeight: '700',
// //     color: '#1A1A1A',
// //     marginTop: 12
// //   },
// //   headerSub: {
// //     color: '#6A6A6A',
// //     fontSize: 15,
// //     marginBottom: 24
// //   },
// //   toggleWrapper: {
// //     flexDirection: 'row',
// //     alignSelf: 'center',
// //     marginBottom: 24,
// //     backgroundColor: '#ECECEC',
// //     borderRadius: 24,
// //     padding: 4
// //   },
// //   toggleInactive: {
// //     paddingVertical: 8,
// //     paddingHorizontal: 16,
// //     color: '#8D8D8D',
// //     fontWeight: '500'
// //   },
// //   toggleActive: {
// //     paddingVertical: 8,
// //     paddingHorizontal: 20,
// //     borderRadius: 20
// //   },
// //   toggleActiveText: {
// //     color: '#fff',
// //     fontWeight: '600'
// //   },
// //   card: {
// //     backgroundColor: '#fff',
// //     borderRadius: 20,
// //     padding: 24,
// //     shadowColor: '#000',
// //     shadowOpacity: 0.05,
// //     shadowRadius: 8,
// //     elevation: 2
// //   },
// //   featureRow: {
// //     marginBottom: 20
// //   },
// //   featureTitle: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#1A1A1A'
// //   },
// //   featureDesc: {
// //     color: '#6A6A6A',
// //     fontSize: 14
// //   },
// //   aiBadge: {
// //     position: 'absolute',
// //     right: 0,
// //     top: 0,
// //     backgroundColor: '#C07DFF',
// //     color: '#fff',
// //     fontWeight: '700',
// //     fontSize: 11,
// //     paddingHorizontal: 8,
// //     paddingVertical: 2,
// //     borderRadius: 6
// //   },
// //   priceBox: {
// //     marginTop: 16,
// //     alignItems: 'center'
// //   },
// //   priceMain: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     color: '#000'
// //   },
// //   priceSub: {
// //     fontSize: 13,
// //     color: '#6A6A6A',
// //     marginBottom: 16
// //   },
// //   ctaButton: {
// //     borderRadius: 32,
// //     overflow: 'hidden'
// //   },
// //   ctaGradient: {
// //     paddingVertical: 14,
// //     alignItems: 'center',
// //     borderRadius: 32
// //   },
// //   ctaText: {
// //     color: '#fff',
// //     fontWeight: '600',
// //     fontSize: 16
// //   }
// // })

// // src/screens/Premium.tsx
// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import type {
//   PurchasesOffering,
//   PurchasesPackage,
// } from "react-native-purchases";

// import { useEntitlements } from "../lib/entitlements";
// import {
//   getOfferings,
//   openManageSubscriptions,
//   purchasePackage,
//   restorePurchases,
// } from "../lib/revenuecat";
// import { useTheme } from "../theme/theme";

// type Term = "monthly" | "yearly";
// type PlanKey = "premium" | "ai"; // premium = Pro (non-AI), ai = Pro+AI

// // Fallback labels if price strings aren't loaded yet
// const FALLBACK_PRICING: Record<PlanKey, Record<Term, string>> = {
//   premium: { monthly: "£1.49", yearly: "£12.99" },
//   ai: { monthly: "£3.49", yearly: "£19.99" },
// };

// // Match package identifiers you defined in RevenueCat dashboard
// const PKG_ID: Record<PlanKey, Record<Term, string>> = {
//   premium: { monthly: "pro_monthly", yearly: "pro_yearly" },
//   ai: { monthly: "proai_monthly", yearly: "proai_yearly" },
// };

// type RCOfferingMap = {
//   premium?: { monthly?: PurchasesPackage; annual?: PurchasesPackage };
//   ai?: { monthly?: PurchasesPackage; annual?: PurchasesPackage };
// };

// // What changes on the page when the plan toggle switches
// const FEATURE_GROUPS: Record<
//   PlanKey,
//   { title: string; items: string[]; icon: React.ReactNode }[]
// > = {
//   premium: [
//     {
//       title: "Progress faster",
//       items: [
//         "PR badges & 1RM estimates",
//         "Warm-up / Main / Cool-down blocks",
//         "Volume charts by muscle group",
//       ],
//       icon: (
//         <MaterialCommunityIcons
//           name="rocket-launch-outline"
//           size={18}
//           color="#000"
//         />
//       ),
//     },
//     {
//       title: "Save time",
//       items: [
//         "One-tap Import to Log",
//         "Full template library + custom packs",
//         "Schedule import/export & CSV backup",
//       ],
//       icon: <Ionicons name="time-outline" size={18} color="#000" />,
//     },
//     {
//       title: "See your wins",
//       items: [
//         "Unlimited history & insights",
//         "Day-of-week heatmap",
//         "Ad-free across the app (AI pages may show ads)",
//       ],
//       icon: <Ionicons name="trophy-outline" size={18} color="#000" />,
//     },
//   ],
//   ai: [
//     {
//       title: "Progress faster",
//       items: [
//         "AI SmartWorkouts auto-progress sets, reps & weight",
//         "Personalised Warm-up / Main / Cool-down blocks",
//         "Deload & recovery suggestions",
//       ],
//       icon: (
//         <MaterialCommunityIcons
//           name="rocket-launch-outline"
//           size={18}
//           color="#000"
//         />
//       ),
//     },
//     {
//       title: "Save time",
//       items: [
//         "AI auto-fill when importing to Log/Schedule",
//         "Full template library + custom packs",
//         "Unlimited AI credits (fast lane)",
//       ],
//       icon: <Ionicons name="time-outline" size={18} color="#000" />,
//     },
//     {
//       title: "See your wins",
//       items: [
//         "Unlimited history & insights",
//         "PR badges & AI-estimated 1RMs",
//         "No ads anywhere (including AI pages)",
//       ],
//       icon: <Ionicons name="trophy-outline" size={18} color="#000" />,
//     },
//   ],
// };

// export default function Premium() {
//   const { colors } = useTheme();
//   const ent = useEntitlements();

//   const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
//   const [term, setTerm] = useState<Term>("yearly");
//   const [selected, setSelected] = useState<PlanKey>("ai");
//   const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
//   const [restoring, setRestoring] = useState(false);

//   // Load current offerings from RevenueCat (via tiny helper)
//   useEffect(() => {
//     (async () => {
//       try {
//         const o = await getOfferings();
//         setOfferings(o);
//       } catch (e: any) {
//         Alert.alert("Error", e?.message ?? String(e));
//       }
//     })();
//   }, []);

//   // UX: “You’re on …”
//   const youAreOn = useMemo(() => {
//     switch (ent.plan) {
//       case "pro_ai":
//         return "Pro + AI";
//       case "pro":
//         return "Pro";
//       default:
//         return "Free";
//     }
//   }, [ent.plan]);

//   // Helpers
//   // const findPackage = (
//   //   plan: PlanKey,
//   //   t: Term
//   // ): PurchasesPackage | undefined => {
//   //   const identifier = PKG_ID[plan][t];
//   //   return offerings?.availablePackages.find(
//   //     (p) => p.identifier === identifier
//   //   );
//   // };

//   function findPackage(
//   offerings: RCOfferingMap | null | undefined,
//   plan: PlanKey,
//   term: Term
// ): PurchasesPackage | undefined {
//   if (!offerings) return undefined;
//   const group = offerings[plan];
//   if (!group) return undefined;
//   return term === "yearly" ? group.annual : group.monthly;
// }

//   const displayPrice = (plan: PlanKey, t: Term) => {
//     const pkg = findPackage(offerings, selected /* plan */, term /* "monthly"|"annual" */);;
//     return pkg?.product.priceString ?? FALLBACK_PRICING[plan][t];
//   };

//   const subscribe = async (plan: PlanKey) => {
//     try {
//       setLoadingPlan(plan);
//       const identifier = findPackage(offerings, plan, term);
//       const newPlan = await purchasePackage(identifier); // helper fires refresh event
//       Alert.alert(
//         "Success",
//         `You're on ${
//           newPlan === "pro_ai" ? "Pro + AI" : newPlan === "pro" ? "Pro" : "Free"
//         } 🎉`
//       );
//     } catch (e: any) {
//       if (!e?.userCancelled) {
//         Alert.alert("Purchase failed", e?.message ?? String(e));
//       }
//     } finally {
//       setLoadingPlan(null);
//     }
//   };

//   const restore = async () => {
//     try {
//       setRestoring(true);
//       const newPlan = await restorePurchases(); // helper fires refresh event
//       Alert.alert(
//         "Restored",
//         `You're on ${
//           newPlan === "pro_ai" ? "Pro + AI" : newPlan === "pro" ? "Pro" : "Free"
//         }.`
//       );
//     } catch (e: any) {
//       Alert.alert("Restore failed", e?.message ?? String(e));
//     } finally {
//       setRestoring(false);
//     }
//   };

//   // UI bits
//   const TermToggle = () => (
//     <View
//       style={[styles.toggleWrap, { backgroundColor: colors.inputBackground }]}
//     >
//       <TouchableOpacity
//         onPress={() => setTerm("monthly")}
//         style={[
//           styles.toggleBtn,
//           term === "monthly" && {
//             backgroundColor: colors.surface,
//             shadowOpacity: 0.12,
//           },
//         ]}
//         activeOpacity={0.9}
//       >
//         <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
//           Monthly
//         </Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         onPress={() => setTerm("yearly")}
//         style={[
//           styles.toggleBtn,
//           term === "yearly" && {
//             backgroundColor: colors.surface,
//             shadowOpacity: 0.12,
//           },
//         ]}
//         activeOpacity={0.9}
//       >
//         <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
//           Yearly
//         </Text>
//         <Text style={[styles.toggleBadge, { color: colors.textSecondary }]}>
//           2 months free
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const Header = () => (
//     <LinearGradient
//       colors={[colors.primary, "#6EA6FF"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.header}
//     >
//       <Text style={styles.hEyebrow}>You’re on {youAreOn} {selected === "ai" ? "• AI ready" : ""}</Text>
//       <Text style={styles.hTitle}>
//         Train smarter with AI-powered progressions
//       </Text>
//       <Text style={styles.hSub}>
//         Faster gains, less guesswork. Unlock auto-progressions, deeper insights,
//         and an ad-free experience.
//       </Text>
//     </LinearGradient>
//   );

//   const Feature = ({
//     icon,
//     title,
//     items,
//   }: {
//     icon: React.ReactNode;
//     title: string;
//     items: string[];
//   }) => (
//     <View
//       style={[styles.featureBlock, { backgroundColor: colors.inputBackground }]}
//     >
//       <View style={styles.featureHeader}>
//         <View
//           style={[styles.featureIcon, { backgroundColor: "rgba(0,0,0,0.06)" }]}
//         >
//           {icon}
//         </View>
//         <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
//           {title}
//         </Text>
//       </View>
//       {items.map((t, i) => (
//         <View key={`${title}-${i}`} style={styles.featureRow}>
//           <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
//           <Text style={[styles.featureText, { color: colors.textSecondary }]}>
//             {t}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );

//   const PlanCard = ({
//     planKey,
//     title,
//     subtitle,
//     highlight,
//     includesAI,
//   }: {
//     planKey: PlanKey;
//     title: string;
//     subtitle: string;
//     highlight?: string;
//     includesAI?: boolean;
//   }) => {
//     const isActive =
//       (planKey === "premium" &&
//         (ent.plan === "pro" || ent.plan === "pro_ai")) ||
//       (planKey === "ai" && ent.plan === "pro_ai");

//     const price = displayPrice(planKey, term);

//     return (
//       <View style={[styles.planCard, { borderColor: "rgba(0,0,0,0.06)" }]}>
//         <View style={styles.planHead}>
//           <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
//             {title}
//           </Text>
//           {highlight ? (
//             <View style={[styles.badge, { backgroundColor: "#00000020" }]}>
//               <Text style={styles.badgeText}>{highlight}</Text>
//             </View>
//           ) : null}
//         </View>

//         <Text style={[styles.planSub, { color: colors.textSecondary }]}>
//           {subtitle}
//         </Text>

//         <View style={styles.priceRow}>
//           <Text style={[styles.price, { color: colors.textPrimary }]}>
//             {price}
//           </Text>
//           <Text style={[styles.per, { color: colors.textSecondary }]}>
//             {" "}
//             / {term === "yearly" ? "year" : "month"}
//           </Text>
//         </View>

//         {includesAI ? (
//           <View style={styles.aiRow}>
//             <MaterialCommunityIcons
//               name="robot-happy"
//               size={16}
//               color={colors.primary}
//             />
//             <Text style={[styles.aiText, { color: colors.textSecondary }]}>
//               Includes AI Coach with fast lane
//             </Text>
//           </View>
//         ) : (
//           <View style={styles.aiRow}>
//             <MaterialCommunityIcons
//               name="robot-confused"
//               size={16}
//               color={colors.textSecondary}
//             />
//             <Text style={[styles.aiText, { color: colors.textSecondary }]}>
//               AI Coach not included (ads may show on AI pages)
//             </Text>
//           </View>
//         )}

//         <TouchableOpacity
//           disabled={isActive || loadingPlan === planKey}
//           onPress={() => subscribe(planKey)}
//           activeOpacity={0.9}
//           style={{ borderRadius: 12, overflow: "hidden", marginTop: 12 }}
//         >
//           <LinearGradient
//             colors={
//               isActive ? ["#9AA0A6", "#9AA0A6"] : [colors.primary, "#4A6C6F"]
//             }
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={styles.cta}
//           >
//             {loadingPlan === planKey ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.ctaText}>
//                 {isActive
//                   ? "Active"
//                   : planKey === "ai"
//                   ? "Upgrade to Pro + AI"
//                   : "Upgrade to Pro"}
//               </Text>
//             )}
//           </LinearGradient>
//         </TouchableOpacity>

//         <Text style={[styles.smallPrint, { color: colors.textSecondary }]}>
//           Cancel anytime • Secure checkout
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <View style={[styles.screen, { backgroundColor: colors.background }]}>
//       <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
//         <Header />

//         <View style={{ paddingHorizontal: 16, marginTop: -30 }}>
//           <View style={[styles.card, { backgroundColor: colors.surface }]}>
//             {/* Plan toggle */}
//             <View
//               style={[
//                 styles.planToggleWrap,
//                 { backgroundColor: colors.inputBackground },
//               ]}
//             >
//               <TouchableOpacity
//                 onPress={() => setSelected("premium")}
//                 style={[
//                   styles.planToggleBtn,
//                   selected === "premium" && { backgroundColor: colors.surface },
//                 ]}
//               >
//                 <Text
//                   style={{
//                     fontWeight: "800",
//                     color:
//                       selected === "premium"
//                         ? colors.textPrimary
//                         : colors.textSecondary,
//                   }}
//                 >
//                   Pro
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 onPress={() => setSelected("ai")}
//                 style={[
//                   styles.planToggleBtn,
//                   selected === "ai" && { backgroundColor: colors.surface },
//                 ]}
//               >
//                 <Text
//                   style={{
//                     fontWeight: "800",
//                     color:
//                       selected === "ai"
//                         ? colors.textPrimary
//                         : colors.textSecondary,
//                   }}
//                 >
//                   Pro + AI
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             {/* Term toggle */}
//             <TermToggle />

//             {/* Outcome-based features */}
//             {/* Outcome-based features driven by selected plan */}
//             {FEATURE_GROUPS[selected].map((block, idx) => (
//               <Feature
//                 key={`${selected}-${block.title}-${idx}`}
//                 icon={React.cloneElement(block.icon as any, {
//                   color: colors.textPrimary,
//                 })}
//                 title={block.title}
//                 items={block.items}
//               />
//             ))}

//             {/* <Feature
//               icon={<MaterialCommunityIcons name="rocket-launch-outline" size={18} color={colors.textPrimary} />}
//               title="Progress faster"
//               items={[
//                 "AI SmartWorkouts: auto-progress sets, reps & weight",
//                 "Warm-up / Main / Cool-down blocks tailored to you",
//                 "PR detection & 1RM estimates",
//               ]}
//             />
//             <Feature
//               icon={<Ionicons name="time-outline" size={18} color={colors.textPrimary} />}
//               title="Save time"
//               items={[
//                 "One-tap Import to Log with pre-filled blocks",
//                 "Full templates library + custom packs",
//                 "Schedule import/export & CSV backup",
//               ]}
//             />
//             <Feature
//               icon={<Ionicons name="trophy-outline" size={18} color={colors.textPrimary} />}
//               title="See your wins"
//               items={[
//                 "Unlimited history & insights",
//                 "Volume charts by muscle group",
//                 "Day-of-week heatmap & badges",
//               ]}
//             /> */}
//           </View>

//           {/* Plans */}
//           {/* Plans (selected plan first) */}
//           <View style={{ opacity: 1 }}>
//           {selected === "premium" ? (
//             <>
//               <PlanCard
//                 planKey="premium"
//                 title="Pro"
//                 subtitle="All features, no ads (AI pages may still show ads)."
//                 highlight="Best value"
//                 includesAI={false}
//               />
//               <PlanCard
//                 planKey="ai"
//                 title="Pro + AI"
//                 subtitle="Everything in Pro, plus unlimited AI with fast lane."
//                 includesAI
//               />
//             </>
//           ) : (
//             <>
//               <PlanCard
//                 planKey="ai"
//                 title="Pro + AI"
//                 subtitle="Everything in Pro, plus unlimited AI with fast lane."
//                 includesAI
//               />
//               <PlanCard
//                 planKey="premium"
//                 title="Pro"
//                 subtitle="All features, no ads (AI pages may still show ads)."
//                 highlight="Best value"
//                 includesAI={false}
//               />
//             </>
//           )}

//           {/* <PlanCard
//             planKey="premium"
//             title="Pro"
//             subtitle="All features, no ads (AI pages may still show ads)."
//             highlight="Best value"
//             includesAI={false}
//           />
//           <PlanCard
//             planKey="ai"
//             title="Pro + AI"
//             subtitle="Everything in Pro, plus unlimited AI with fast lane."
//             includesAI
//           /> */}
//           </View>

//           {/* Restore / Footer */}
//           <View style={{ marginTop: 16, alignItems: "center" }}>
//             <TouchableOpacity
//               onPress={restore}
//               style={styles.restoreBtn}
//               disabled={restoring}
//               activeOpacity={0.8}
//             >
//               {restoring ? (
//                 <ActivityIndicator color={colors.textPrimary} />
//               ) : (
//                 <>
//                   <Ionicons
//                     name="refresh"
//                     size={16}
//                     color={colors.textPrimary}
//                   />
//                   <Text
//                     style={[styles.restoreTxt, { color: colors.textPrimary }]}
//                   >
//                     Restore purchases
//                   </Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={openManageSubscriptions}
//               style={{ paddingVertical: 6 }}
//             >
//               <Text
//                 style={{
//                   color: colors.textSecondary,
//                   textDecorationLine: "underline",
//                   fontSize: 12,
//                 }}
//               >
//                 Manage subscription
//               </Text>
//             </TouchableOpacity>

//             <Text style={[styles.legal, { color: colors.textSecondary }]}>
//               Prices shown in your local currency. Cancel anytime. By
//               subscribing you agree to the Terms & Privacy Policy.
//             </Text>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screen: { flex: 1 },

//   header: {
//     paddingTop: 64,
//     paddingBottom: 24,
//     paddingHorizontal: 18,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   hEyebrow: {
//     color: "#FFFFFFD0",
//     fontSize: 12,
//     fontWeight: "700",
//     marginBottom: 6,
//     letterSpacing: 0.4,
//     textTransform: "uppercase",
//   },
//   hTitle: { color: "#fff", fontSize: 24, fontWeight: "800", lineHeight: 30 },
//   hSub: { color: "#FFFFFFD0", marginTop: 8, fontSize: 14, lineHeight: 20 },

//   card: {
//     borderRadius: 16,
//     padding: 14,
//     shadowColor: "#000",
//     shadowOpacity: 0.06,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 6,
//   },

//   planToggleWrap: {
//     flexDirection: "row",
//     borderRadius: 12,
//     padding: 6,
//     marginBottom: 10,
//   },
//   planToggleBtn: {
//     flex: 1,
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   toggleWrap: {
//     flexDirection: "row",
//     borderRadius: 12,
//     padding: 6,
//     marginBottom: 8,
//   },
//   toggleBtn: {
//     flex: 1,
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 6,
//   },
//   toggleText: { fontWeight: "800", fontSize: 14 },
//   toggleBadge: { fontSize: 11, marginTop: 2 },

//   featureBlock: { borderRadius: 12, padding: 12, marginTop: 10 },
//   featureHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   featureIcon: {
//     width: 28,
//     height: 28,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 8,
//   },
//   featureTitle: { fontWeight: "800", fontSize: 15 },
//   featureRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
//   featureText: { marginLeft: 8, fontSize: 14 },

//   planCard: {
//     borderRadius: 16,
//     padding: 14,
//     marginTop: 14,
//     backgroundColor: "transparent",
//     borderWidth: StyleSheet.hairlineWidth,
//   },
//   planHead: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   planTitle: { fontSize: 18, fontWeight: "800" },
//   badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
//   badgeText: {
//     color: "#fff",
//     fontWeight: "800",
//     fontSize: 11,
//     letterSpacing: 0.3,
//   },

//   planSub: { fontSize: 13, marginTop: 6 },
//   priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
//   price: { fontSize: 26, fontWeight: "900", letterSpacing: -0.2 },
//   per: { marginLeft: 6, fontSize: 13 },

//   aiRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
//   aiText: { marginLeft: 6, fontSize: 13 },

//   cta: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
//   ctaText: { color: "#fff", fontWeight: "800", fontSize: 15 },

//   smallPrint: { textAlign: "center", marginTop: 8, fontSize: 12 },

//   restoreBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//   },
//   restoreTxt: { marginLeft: 6, fontWeight: "700" },

//   legal: {
//     textAlign: "center",
//     fontSize: 12,
//     paddingHorizontal: 16,
//     marginTop: 6,
//   },
// });

// src/screens/Premium.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PACKAGE_TYPE,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

import { useEntitlements } from "../lib/entitlements";
import {
  getOfferings,
  openManageSubscriptions,
  purchasePackage,
  restorePurchases,
} from "../lib/revenuecat";
import { useTheme } from "../theme/theme";

type Term = "monthly" | "yearly";
type PlanKey = "premium" | "ai"; // premium = Pro (non-AI), ai = Pro+AI

// Fallback labels if price strings aren't loaded yet
const FALLBACK_PRICING: Record<PlanKey, Record<Term, string>> = {
  premium: { monthly: "£1.49", yearly: "£12.99" },
  ai: { monthly: "£3.49", yearly: "£19.99" },
};

// Match package identifiers you defined in RevenueCat dashboard
const PKG_ID: Record<PlanKey, Record<Term, string>> = {
  premium: { monthly: "pro_monthly", yearly: "pro_yearly" },
  ai: { monthly: "proai_monthly", yearly: "proai_yearly" },
};

const FEATURE_GROUPS: Record<
  PlanKey,
  { title: string; items: string[]; icon: React.ReactNode }[]
> = {
  premium: [
    {
      title: "Progress faster",
      items: [
        "PR badges & 1RM estimates",
        "Warm-up / Main / Cool-down blocks",
        "Volume charts by muscle group",
      ],
      icon: <MaterialCommunityIcons name="rocket-launch-outline" size={18} />,
    },
    {
      title: "Save time",
      items: [
        "One-tap Import to Log",
        "Full template library + custom packs",
        "Schedule import/export & CSV backup",
      ],
      icon: <Ionicons name="time-outline" size={18} />,
    },
    {
      title: "See your wins",
      items: [
        "Unlimited history & insights",
        "Day-of-week heatmap",
        "Ad-free across the app (AI pages may show ads)",
      ],
      icon: <Ionicons name="trophy-outline" size={18} />,
    },
  ],
  ai: [
    {
      title: "Progress faster",
      items: [
        "AI SmartWorkouts auto-progress sets, reps & weight",
        "Personalised Warm-up / Main / Cool-down blocks",
        "Deload & recovery suggestions",
      ],
      icon: <MaterialCommunityIcons name="rocket-launch-outline" size={18} />,
    },
    {
      title: "Save time",
      items: [
        "AI auto-fill when importing to Log/Schedule",
        "Full template library + custom packs",
        "Unlimited AI credits (fast lane)",
      ],
      icon: <Ionicons name="time-outline" size={18} />,
    },
    {
      title: "See your wins",
      items: [
        "Unlimited history & insights",
        "PR badges & AI-estimated 1RMs",
        "No ads anywhere (including AI pages)",
      ],
      icon: <Ionicons name="trophy-outline" size={18} />,
    },
  ],
};

export default function Premium() {
  const { colors } = useTheme();
  const ent = useEntitlements();

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [term, setTerm] = useState<Term>("yearly");
  const [selected, setSelected] = useState<PlanKey>("ai");
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Load current offerings from RevenueCat
  useEffect(() => {
    (async () => {
      try {
        const o = await getOfferings(); // returns PurchasesOfferings
        setOfferings(o);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? String(e));
      }
    })();
  }, []);

  // Flatten all packages from offerings (current + all)
  const allPackages: PurchasesPackage[] = useMemo(() => {
    if (!offerings) return [];
    const currentPkgs = offerings.current?.availablePackages ?? [];
    const others = offerings.all
      ? Object.values(offerings.all).flatMap(
          (off) => off?.availablePackages ?? []
        )
      : [];
    // de-dup by identifier
    const byId = new Map<string, PurchasesPackage>();
    [...currentPkgs, ...others].forEach((p) => byId.set(p.identifier, p));
    return [...byId.values()];
  }, [offerings]);

  // Find a package by our custom identifier mapping
  // Fallback finder that tolerates different setups
  const findPackage = (
    plan: PlanKey,
    t: Term,
    allPackages: PurchasesPackage[],
    offerings: PurchasesOfferings | null
  ): PurchasesPackage | undefined => {
    // 1) exact match by identifier (your dashboard “package identifier”)
    const custom = allPackages.find((p) => p.identifier === PKG_ID[plan][t]);
    if (custom) return custom;

    // 2) fallback by package type (most common)
    const byType = allPackages.find((p) =>
      t === "monthly"
        ? p.packageType === PACKAGE_TYPE.MONTHLY
        : p.packageType === PACKAGE_TYPE.ANNUAL
    );
    if (byType) return byType;

    // 3) worst case: first available in current offering
    return offerings?.current?.availablePackages?.[0];
  };

  // Price text honoring plan + term args
  const displayPrice = (plan: PlanKey, t: Term) => {
    const pkg = findPackage(plan, t, allPackages, offerings);
    return pkg?.product.priceString ?? FALLBACK_PRICING[plan][t];
  };

  useEffect(() => {
    if (!offerings) return;
    const pkgs = allPackages.map((p) => ({
      identifier: p.identifier,
      packageType: p.packageType,
      storeProductId: p.product.identifier,
      price: p.product.priceString,
    }));
    console.log("RC offerings:", {
      current: offerings.current?.identifier,
      packages: pkgs,
    });
  }, [offerings, allPackages]);

  const youAreOn = useMemo(() => {
    switch (ent.plan) {
      case "pro_ai":
        return "Pro + AI";
      case "pro":
        return "Pro";
      default:
        return "Free";
    }
  }, [ent.plan]);

  const subscribe = async (plan: PlanKey) => {
    try {
      setLoadingPlan(plan);
      const pkg = findPackage(plan, term, allPackages, offerings);
      if (!pkg) {
        Alert.alert(
          "Not available",
          "This plan/term isn't available in your store region yet."
        );
        return;
      }
      const newPlan = await purchasePackage(pkg); // helper emits refresh to entitlements

      console.log("Purchased, new plan:", newPlan);
      Alert.alert(
        "Success",
        `You're on ${
          newPlan === "pro_ai" ? "Pro + AI" : newPlan === "pro" ? "Pro" : "Free"
        } 🎉`
      );
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert("Purchase failed", e?.message ?? String(e));
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  const restore = async () => {
    try {
      setRestoring(true);
      const newPlan = await restorePurchases();
      Alert.alert(
        "Restored",
        `You're on ${
          newPlan === "pro_ai" ? "Pro + AI" : newPlan === "pro" ? "Pro" : "Free"
        }.`
      );
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? String(e));
    } finally {
      setRestoring(false);
    }
  };

  const TermToggle = () => (
    <View
      style={[styles.toggleWrap, { backgroundColor: colors.inputBackground }]}
    >
      <TouchableOpacity
        onPress={() => setTerm("monthly")}
        style={[
          styles.toggleBtn,
          term === "monthly" && {
            backgroundColor: colors.surface,
            shadowOpacity: 0.12,
          },
        ]}
        activeOpacity={0.9}
      >
        <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
          Monthly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setTerm("yearly")}
        style={[
          styles.toggleBtn,
          term === "yearly" && {
            backgroundColor: colors.surface,
            shadowOpacity: 0.12,
          },
        ]}
        activeOpacity={0.9}
      >
        <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
          Yearly
        </Text>
        <Text style={[styles.toggleBadge, { color: colors.textSecondary }]}>
          2 months free
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Header = () => (
    <LinearGradient
      colors={[colors.primary, "#6EA6FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Text style={styles.hEyebrow}>
        You’re on {youAreOn} {selected === "ai" ? "• AI ready" : ""}
      </Text>
      <Text style={styles.hTitle}>
        Train smarter with AI-powered progressions
      </Text>
      <Text style={styles.hSub}>
        Faster gains, less guesswork. Unlock auto-progressions, deeper insights,
        and an ad-free experience.
      </Text>
    </LinearGradient>
  );

  const Feature = ({
    icon,
    title,
    items,
  }: {
    icon: React.ReactNode;
    title: string;
    items: string[];
  }) => (
    <View
      style={[styles.featureBlock, { backgroundColor: colors.inputBackground }]}
    >
      <View style={styles.featureHeader}>
        <View
          style={[styles.featureIcon, { backgroundColor: "rgba(0,0,0,0.06)" }]}
        >
          {React.cloneElement(icon as any, { color: colors.textPrimary })}
        </View>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      {items.map((t, i) => (
        <View key={`${title}-${i}`} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            {t}
          </Text>
        </View>
      ))}
    </View>
  );

  const PlanCard = ({
    planKey,
    title,
    subtitle,
    highlight,
    includesAI,
  }: {
    planKey: PlanKey;
    title: string;
    subtitle: string;
    highlight?: string;
    includesAI?: boolean;
  }) => {
    const isActive =
      (planKey === "premium" &&
        (ent.plan === "pro" || ent.plan === "pro_ai")) ||
      (planKey === "ai" && ent.plan === "pro_ai");

    const price = displayPrice(planKey, term);

    return (
      <View style={[styles.planCard, { borderColor: "rgba(0,0,0,0.06)" }]}>
        <View style={styles.planHead}>
          <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {highlight ? (
            <View style={[styles.badge, { backgroundColor: "#00000020" }]}>
              <Text style={styles.badgeText}>{highlight}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.planSub, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            {price}
          </Text>
          <Text style={[styles.per, { color: colors.textSecondary }]}>
            {" "}
            / {term === "yearly" ? "year" : "month"}
          </Text>
        </View>

        {includesAI ? (
          <View style={styles.aiRow}>
            <MaterialCommunityIcons
              name="robot-happy"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>
              Includes AI Coach with fast lane
            </Text>
          </View>
        ) : (
          <View style={styles.aiRow}>
            <MaterialCommunityIcons
              name="robot-confused"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>
              AI Coach not included (ads may show on AI pages)
            </Text>
          </View>
        )}

        <TouchableOpacity
          disabled={isActive || loadingPlan === planKey}
          onPress={() => subscribe(planKey)}
          activeOpacity={0.9}
          style={{ borderRadius: 12, overflow: "hidden", marginTop: 12 }}
        >
          <LinearGradient
            colors={
              isActive ? ["#9AA0A6", "#9AA0A6"] : [colors.primary, "#4A6C6F"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            {loadingPlan === planKey ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                {isActive
                  ? "Active"
                  : planKey === "ai"
                  ? "Upgrade to Pro + AI"
                  : "Upgrade to Pro"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.smallPrint, { color: colors.textSecondary }]}>
          Cancel anytime • Secure checkout
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <Header />

        <View style={{ paddingHorizontal: 16, marginTop: -30 }}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Plan toggle */}
            <View
              style={[
                styles.planToggleWrap,
                { backgroundColor: colors.inputBackground },
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelected("premium")}
                style={[
                  styles.planToggleBtn,
                  selected === "premium" && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color:
                      selected === "premium"
                        ? colors.textPrimary
                        : colors.textSecondary,
                  }}
                >
                  Pro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelected("ai")}
                style={[
                  styles.planToggleBtn,
                  selected === "ai" && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color:
                      selected === "ai"
                        ? colors.textPrimary
                        : colors.textSecondary,
                  }}
                >
                  Pro + AI
                </Text>
              </TouchableOpacity>
            </View>

            {/* Term toggle */}
            <TermToggle />

            {/* Features driven by selected plan */}
            {FEATURE_GROUPS[selected].map((block, idx) => (
              <Feature
                key={`${selected}-${block.title}-${idx}`}
                icon={block.icon}
                title={block.title}
                items={block.items}
              />
            ))}
          </View>

          {/* Plans (selected plan first) */}
          {selected === "premium" ? (
            <>
              <PlanCard
                planKey="premium"
                title="Pro"
                subtitle="All features, no ads (AI pages may still show ads)."
                highlight="Best value"
                includesAI={false}
              />
              {/* <PlanCard
                planKey="ai"
                title="Pro + AI"
                subtitle="Everything in Pro, plus unlimited AI with fast lane."
                includesAI
              /> */}
            </>
          ) : (
            <>
              <PlanCard
                planKey="ai"
                title="Pro + AI"
                subtitle="Everything in Pro, plus unlimited AI with fast lane."
                includesAI
              />
              {/* <PlanCard
                planKey="premium"
                title="Pro"
                subtitle="All features, no ads (AI pages may still show ads)."
                highlight="Best value"
                includesAI={false}
              /> */}
            </>
          )}

          {/* Restore / Footer */}
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <TouchableOpacity
              onPress={restore}
              style={styles.restoreBtn}
              disabled={restoring}
              activeOpacity={0.8}
            >
              {restoring ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={colors.textPrimary}
                  />
                  <Text
                    style={[styles.restoreTxt, { color: colors.textPrimary }]}
                  >
                    Restore purchases
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openManageSubscriptions}
              style={{ paddingVertical: 6 }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  textDecorationLine: "underline",
                  fontSize: 12,
                }}
              >
                Manage subscription
              </Text>
            </TouchableOpacity>

            <Text style={[styles.legal, { color: colors.textSecondary }]}>
              Prices shown in your local currency. Cancel anytime. By
              subscribing you agree to the Terms & Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  hEyebrow: {
    color: "#FFFFFFD0",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  hTitle: { color: "#fff", fontSize: 24, fontWeight: "800", lineHeight: 30 },
  hSub: { color: "#FFFFFFD0", marginTop: 8, fontSize: 14, lineHeight: 20 },

  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },

  planToggleWrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 6,
    marginBottom: 10,
  },
  planToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  toggleWrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 6,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  toggleText: { fontWeight: "800", fontSize: 14 },
  toggleBadge: { fontSize: 11, marginTop: 2 },

  featureBlock: { borderRadius: 12, padding: 12, marginTop: 10 },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  featureTitle: { fontWeight: "800", fontSize: 15 },
  featureRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  featureText: { marginLeft: 8, fontSize: 14 },

  planCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
  },
  planHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planTitle: { fontSize: 18, fontWeight: "800" },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.3,
  },

  planSub: { fontSize: 13, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  price: { fontSize: 26, fontWeight: "900", letterSpacing: -0.2 },
  per: { marginLeft: 6, fontSize: 13 },

  aiRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  aiText: { marginLeft: 6, fontSize: 13 },

  cta: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  smallPrint: { textAlign: "center", marginTop: 8, fontSize: 12 },

  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  restoreTxt: { marginLeft: 6, fontWeight: "700" },

  legal: {
    textAlign: "center",
    fontSize: 12,
    paddingHorizontal: 16,
    marginTop: 6,
  },
});
