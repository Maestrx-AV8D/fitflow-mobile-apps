// // // import Slider from "@react-native-community/slider";
// // // import * as LocalAuthentication from 'expo-local-authentication';
// // // import React, { useEffect, useState } from "react";
// // // import {
// // //     Alert,
// // //     KeyboardAvoidingView,
// // //     Platform,
// // //     ScrollView,
// // //     StyleSheet,
// // //     Text,
// // //     TextInput,
// // //     TouchableOpacity,
// // //     View,
// // // } from "react-native";
// // // import { generateAIInsights, supabase } from "../lib/api";
// // // import { useTheme } from "../theme/theme";

// // // interface JournalEntry {
// // //   id: number;
// // //   content: string;
// // //   created_at: string;
// // //   mood?: number;
// // //   tags?: string[];
// // // }

// // // const TAG_OPTIONS = [
// // //   "Gratitude",
// // //   "Work",
// // //   "Goals",
// // //   "Health",
// // //   "Relationships",
// // //   "Ideas",
// // // ];

// // // export default function Journal() {
// // //   const { colors, typography } = useTheme();
// // //   const [entry, setEntry] = useState("");
// // //   const [mood, setMood] = useState(0);
// // //   const [entries, setEntries] = useState<JournalEntry[]>([]);
// // //   const [tags, setTags] = useState<string[]>([]);
// // //   const [saved, setSaved] = useState(false);
// // //   const [showHistory, setShowHistory] = useState(false);
// // //   const [userTier, setUserTier] = useState<"free" | "premium" | "premium+ai">(
// // //     "free"
// // //   );

// // //   useEffect(() => {
// // //     const fetchTier = async () => {
// // //       const {
// // //         data: { user },
// // //       } = await supabase.auth.getUser();
// // //       const { data } = await supabase
// // //         .from("profiles")
// // //         .select("tier")
// // //         .eq("id", user?.id)
// // //         .single();
// // //       setUserTier(data?.tier || "free");
// // //     };
// // //     fetchTier();
// // //   }, []);

// // //   useEffect(() => {
// // //     fetchEntries();
// // //   }, []);

// // //   async function fetchEntries() {
// // //     const { data, error } = await supabase
// // //       .from("journal")
// // //       .select("*")
// // //       .order("created_at", { ascending: false });

// // //     if (error) {
// // //       console.error(error);
// // //       Alert.alert("Error loading journal entries");
// // //     } else {
// // //       setEntries(data);
// // //     }
// // //   }

// // //   async function saveEntry() {
// // //     if (!entry.trim() && mood === 0 && tags.length === 0) return;
// // //     const {
// // //       data: { user },
// // //       error: userError,
// // //     } = await supabase.auth.getUser();

// // //     if (userError || !user?.id) {
// // //       Alert.alert("Error", "User not found.");
// // //       return;
// // //     }

// // //     const { data, error } = await supabase
// // //       .from("journal")
// // //       .insert({
// // //         content: entry,
// // //         mood,
// // //         tags,
// // //         user_id: user.id, // ✅ required for RLS
// // //       })
// // //       .select()
// // //       .single();

// // //     if (error) {
// // //       console.error(error);
// // //       Alert.alert("Failed to save entry");
// // //       return;
// // //     }

// // //     setEntries([data, ...entries]);
// // //     setEntry("");
// // //     setMood(0);
// // //     setTags([]);
// // //     setSaved(true);
// // //   }

// // //   const toggleTag = (tag: string) => {
// // //     setTags((prev) =>
// // //       prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
// // //     );
// // //   };

// // //   const renderItem = (item: JournalEntry) => (
// // //     <View
// // //       style={[styles.entryCard, { backgroundColor: colors.card }]}
// // //       key={item.id}
// // //     >
// // //       <View style={styles.entryHeader}>
// // //         <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
// // //           {new Date(item.created_at).toLocaleDateString("en-GB", {
// // //             day: "numeric",
// // //             month: "short",
// // //             year: "numeric",
// // //           })}
// // //         </Text>
// // //         {item.mood !== undefined && (
// // //           <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
// // //             Mood: {item.mood}/5
// // //           </Text>
// // //         )}
// // //       </View>
// // //       <Text style={[styles.entryText, { color: colors.textPrimary }]}>
// // //         {item.content}
// // //       </Text>
// // //       {item.tags?.length > 0 && (
// // //         <View style={styles.tagRow}>
// // //           {item.tags.map((tag) => (
// // //             <Text
// // //               key={tag}
// // //               style={[
// // //                 styles.tag,
// // //                 {
// // //                   backgroundColor: colors.inputBackground,
// // //                   color: colors.textSecondary,
// // //                 },
// // //               ]}
// // //             >
// // //               {tag}
// // //             </Text>
// // //           ))}
// // //         </View>
// // //       )}
// // //     </View>
// // //   );

// // //   const handleHistoryToggle = async () => {
// // //   if (!showHistory && (userTier === "premium" || userTier === "premium+ai")) {
// // //     const result = await LocalAuthentication.authenticateAsync({
// // //       promptMessage: "Unlock Journal",
// // //     });
// // //     if (!result.success) return;
// // //   }
// // //   setShowHistory((prev) => !prev);
// // // };

// // //   const isValid = entry.trim() !== "" || mood > 0 || tags.length > 0;

// // //   return (
// // //     <KeyboardAvoidingView
// // //       style={[styles.container, { backgroundColor: colors.background }]}
// // //       behavior={Platform.OS === "ios" ? "padding" : undefined}
// // //     >
// // //       <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
// // //         <Text style={[typography.h2, { color: colors.textPrimary }]}>
// // //           Journal
// // //         </Text>
// // //         <Text style={[styles.prompt, { color: colors.textSecondary }]}>
// // //           Reflect on today or clear your mind
// // //         </Text>

// // //         <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
// // //           <TextInput
// // //             value={entry}
// // //             onChangeText={(text) => {
// // //               setEntry(text);
// // //               setSaved(false);
// // //             }}
// // //             placeholder="Write something..."
// // //             placeholderTextColor={colors.textSecondary}
// // //             multiline
// // //             style={[styles.input, { color: colors.textPrimary }]}
// // //           />

// // //           <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
// // //             How are you feeling?
// // //           </Text>
// // //           <Slider
// // //             style={styles.slider}
// // //             minimumValue={0}
// // //             maximumValue={5}
// // //             step={1}
// // //             value={mood}
// // //             onValueChange={(v) => {
// // //               setMood(v);
// // //               setSaved(false);
// // //             }}
// // //             minimumTrackTintColor={colors.primary}
// // //             maximumTrackTintColor={colors.border}
// // //           />
// // //           <Text style={[styles.moodValue, { color: colors.textPrimary }]}>
// // //             Mood: {mood}/5
// // //           </Text>

// // //           <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
// // //             Tags
// // //           </Text>
// // //           <ScrollView
// // //             horizontal
// // //             showsHorizontalScrollIndicator={false}
// // //             style={{ marginBottom: 12 }}
// // //           >
// // //             {TAG_OPTIONS.map((tag) => {
// // //               const selected = tags.includes(tag);
// // //               return (
// // //                 <TouchableOpacity
// // //                   key={tag}
// // //                   onPress={() => {
// // //                     toggleTag(tag);
// // //                     setSaved(false);
// // //                   }}
// // //                   style={[
// // //                     styles.tag,
// // //                     {
// // //                       backgroundColor: selected
// // //                         ? colors.primary
// // //                         : colors.inputBackground,
// // //                       marginRight: 8,
// // //                     },
// // //                   ]}
// // //                 >
// // //                   <Text
// // //                     style={{
// // //                       color: selected ? colors.surface : colors.textSecondary,
// // //                     }}
// // //                   >
// // //                     {tag}
// // //                   </Text>
// // //                 </TouchableOpacity>
// // //               );
// // //             })}
// // //           </ScrollView>
// // //           {userTier === "premium+ai" && entry.trim() !== "" && (
// // //             <TouchableOpacity
// // //               onPress={() => generateAIInsights(entry)}
// // //               style={[
// // //                 styles.button,
// // //                 { backgroundColor: colors.accent, marginTop: 10 },
// // //               ]}
// // //             >
// // //               <Text style={{ color: colors.surface, fontWeight: "600" }}>
// // //                 Reflect with AI
// // //               </Text>
// // //             </TouchableOpacity>
// // //           )}

// // //           {saved ? (
// // //             <View
// // //               style={{
// // //                 flexDirection: "row",
// // //                 justifyContent: "space-between",
// // //                 alignItems: "center",
// // //               }}
// // //             >
// // //               <Text style={{ color: colors.success, fontWeight: "600" }}>
// // //                 ✓ Saved
// // //               </Text>
// // //               <TouchableOpacity
// // //                 onPress={() => {
// // //                   setEntry("");
// // //                   setMood(0);
// // //                   setTags([]);
// // //                   setSaved(false);
// // //                 }}
// // //               >
// // //                 <Text style={{ color: colors.primary, fontWeight: "600" }}>
// // //                   + New Entry
// // //                 </Text>
// // //               </TouchableOpacity>
// // //             </View>
// // //           ) : (
// // //             <TouchableOpacity
// // //               onPress={saveEntry}
// // //               disabled={!isValid}
// // //               style={[
// // //                 styles.button,
// // //                 {
// // //                   backgroundColor: isValid ? colors.primary : colors.border,
// // //                 },
// // //               ]}
// // //             >
// // //               <Text style={{ color: colors.surface, fontWeight: "600" }}>
// // //                 Save Entry
// // //               </Text>
// // //             </TouchableOpacity>
// // //           )}
// // //         </View>

// // //         <TouchableOpacity
// // //           onPress={() => setShowHistory(!showHistory)}
// // //           style={{ alignSelf: "center", marginBottom: 20 }}
// // //         >
// // //           <Text style={{ color: colors.primary, fontWeight: "500" }}>
// // //             {showHistory ? "Hide Past Journal" : "View Past Journal"}
// // //           </Text>
// // //         </TouchableOpacity>

// // //         {showHistory && entries.map(renderItem)}
// // //       </ScrollView>
// // //     </KeyboardAvoidingView>
// // //   );
// // // }

// // // const styles = StyleSheet.create({
// // //   container: {
// // //     flex: 1,
// // //     paddingTop: 70,
// // //     paddingHorizontal: 16,
// // //   },
// // //   prompt: {
// // //     fontSize: 14,
// // //     marginBottom: 12,
// // //   },
// // //   inputCard: {
// // //     borderRadius: 16,
// // //     padding: 16,
// // //     marginBottom: 24,
// // //     shadowColor: "#000",
// // //     shadowOpacity: 0.04,
// // //     shadowRadius: 6,
// // //     elevation: 2,
// // //   },
// // //   input: {
// // //     minHeight: 100,
// // //     fontSize: 14,
// // //     marginBottom: 12,
// // //   },
// // //   sliderLabel: {
// // //     fontSize: 13,
// // //     fontWeight: "500",
// // //     marginBottom: 4,
// // //   },
// // //   slider: {
// // //     width: "100%",
// // //     height: 32,
// // //   },
// // //   moodValue: {
// // //     textAlign: "center",
// // //     marginBottom: 12,
// // //     fontSize: 13,
// // //     fontWeight: "500",
// // //   },
// // //   button: {
// // //     alignSelf: "flex-end",
// // //     paddingHorizontal: 20,
// // //     paddingVertical: 10,
// // //     borderRadius: 20,
// // //   },
// // //   entryCard: {
// // //     padding: 14,
// // //     borderRadius: 16,
// // //     marginBottom: 12,
// // //     shadowColor: "#000",
// // //     shadowOpacity: 0.04,
// // //     shadowRadius: 6,
// // //     elevation: 2,
// // //   },
// // //   entryHeader: {
// // //     flexDirection: "row",
// // //     justifyContent: "space-between",
// // //     marginBottom: 6,
// // //   },
// // //   entryDate: {
// // //     fontSize: 12,
// // //   },
// // //   entryText: {
// // //     fontSize: 14,
// // //     lineHeight: 20,
// // //   },
// // //   tag: {
// // //     paddingHorizontal: 12,
// // //     paddingVertical: 6,
// // //     borderRadius: 16,
// // //     fontSize: 12,
// // //     fontWeight: "500",
// // //   },
// // //   tagRow: {
// // //     flexDirection: "row",
// // //     flexWrap: "wrap",
// // //     marginTop: 8,
// // //     gap: 6,
// // //   },
// // // });

// // import Slider from "@react-native-community/slider";
// // import * as LocalAuthentication from "expo-local-authentication";
// // import React, { useEffect, useState } from "react";
// // import {
// //     Alert,
// //     KeyboardAvoidingView,
// //     Platform,
// //     ScrollView,
// //     StyleSheet,
// //     Text,
// //     TextInput,
// //     TouchableOpacity,
// //     View,
// // } from "react-native";
// // import { generateAIInsights, supabase } from "../lib/api";
// // import { useTheme } from "../theme/theme";

// // interface JournalEntry {
// //   id: number;
// //   content: string;
// //   created_at: string;
// //   mood?: number;
// //   tags?: string[];
// // }

// // const TAG_OPTIONS = ["Gratitude", "Work", "Goals", "Health", "Relationships", "Ideas"];

// // export default function Journal() {
// //   const { colors, typography } = useTheme();
// //   const [entry, setEntry] = useState("");
// //   const [mood, setMood] = useState(0);
// //   const [entries, setEntries] = useState<JournalEntry[]>([]);
// //   const [tags, setTags] = useState<string[]>([]);
// //   const [saved, setSaved] = useState(false);
// //   const [showHistory, setShowHistory] = useState(false);
// //   const [userTier, setUserTier] = useState<"free" | "premium" | "premium+ai">("free");

// //   useEffect(() => {
// //     fetchTier();
// //     fetchEntries();
// //   }, []);

// //   const fetchTier = async () => {
// //     const {
// //       data: { user },
// //     } = await supabase.auth.getUser();
// //     const { data } = await supabase.from("profiles").select("tier").eq("id", user?.id).single();
// //     setUserTier(data?.tier || "free");
// //   };

// //   const fetchEntries = async () => {
// //     const { data, error } = await supabase
// //       .from("journal")
// //       .select("*")
// //       .order("created_at", { ascending: false });
// //     if (error) Alert.alert("Error loading journal entries");
// //     else setEntries(data);
// //   };

// //   const saveEntry = async () => {
// //     if (!entry.trim() && mood === 0 && tags.length === 0) return;
// //     const {
// //       data: { user },
// //       error: userError,
// //     } = await supabase.auth.getUser();
// //     if (userError || !user?.id) return Alert.alert("Error", "User not found.");

// //     const { data, error } = await supabase
// //       .from("journal")
// //       .insert({ content: entry, mood, tags, user_id: user.id })
// //       .select()
// //       .single();

// //     if (error) return Alert.alert("Failed to save entry");

// //     setEntries([data, ...entries]);
// //     setEntry("");
// //     setMood(0);
// //     setTags([]);
// //     setSaved(true);
// //   };

// //   const toggleTag = (tag: string) => {
// //     setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
// //   };

// //   const handleHistoryToggle = async () => {
// //     if (!showHistory && (userTier === "premium" || userTier === "premium+ai")) {
// //       const compatible = await LocalAuthentication.hasHardwareAsync();
// //       const enrolled = await LocalAuthentication.isEnrolledAsync();
// //       if (!compatible || !enrolled) {
// //         return Alert.alert("Unavailable", "Biometric authentication not set up.");
// //       }
// //       const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Journal" });
// //       if (!result.success) return;
// //     }
// //     setShowHistory((prev) => !prev);
// //   };

// //   const renderItem = (item: JournalEntry) => (
// //     <View style={[styles.entryCard, { backgroundColor: colors.card }]} key={item.id}>
// //       <View style={styles.entryHeader}>
// //         <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
// //           {new Date(item.created_at).toLocaleDateString("en-GB", {
// //             day: "numeric",
// //             month: "short",
// //             year: "numeric",
// //           })}
// //         </Text>
// //         {item.mood !== undefined && (
// //           <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
// //             Mood: {item.mood}/5
// //           </Text>
// //         )}
// //       </View>
// //       <Text style={[styles.entryText, { color: colors.textPrimary }]}>{item.content}</Text>
// //       {item.tags?.length > 0 && (
// //         <View style={styles.tagRow}>
// //           {item.tags.map((tag) => (
// //             <Text key={tag} style={[styles.tag, { backgroundColor: colors.inputBackground, color: colors.textSecondary }]}>
// //               {tag}
// //             </Text>
// //           ))}
// //         </View>
// //       )}
// //     </View>
// //   );

// //   const isValid = entry.trim() !== "" || mood > 0 || tags.length > 0;

// //   return (
// //     <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
// //       <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
// //         <Text style={[typography.h2, { color: colors.textPrimary }]}>Journal</Text>
// //         <Text style={[styles.prompt, { color: colors.textSecondary }]}>Reflect on today or clear your mind</Text>

// //         <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
// //           <TextInput
// //             value={entry}
// //             onChangeText={(text) => {
// //               setEntry(text);
// //               setSaved(false);
// //             }}
// //             placeholder="Write something..."
// //             placeholderTextColor={colors.textSecondary}
// //             multiline
// //             style={[styles.input, { color: colors.textPrimary }]}
// //           />

// //           <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>How are you feeling?</Text>
// //           <Slider
// //             style={styles.slider}
// //             minimumValue={0}
// //             maximumValue={5}
// //             step={1}
// //             value={mood}
// //             onValueChange={(v) => {
// //               setMood(v);
// //               setSaved(false);
// //             }}
// //             minimumTrackTintColor={colors.primary}
// //             maximumTrackTintColor={colors.border}
// //           />
// //           <Text style={[styles.moodValue, { color: colors.textPrimary }]}>Mood: {mood}/5</Text>

// //           <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Tags</Text>
// //           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
// //             {TAG_OPTIONS.map((tag) => {
// //               const selected = tags.includes(tag);
// //               return (
// //                 <TouchableOpacity
// //                   key={tag}
// //                   onPress={() => {
// //                     toggleTag(tag);
// //                     setSaved(false);
// //                   }}
// //                   style={[styles.tag, {
// //                     backgroundColor: selected ? colors.primary : colors.inputBackground,
// //                     marginRight: 8,
// //                   }]}
// //                 >
// //                   <Text style={{ color: selected ? colors.surface : colors.textSecondary }}>{tag}</Text>
// //                 </TouchableOpacity>
// //               );
// //             })}
// //           </ScrollView>

// //           {userTier !== "premium+ai" && entry.trim() !== "" && (
// //             <TouchableOpacity
// //               onPress={() => generateAIInsights(entry).then((response) => Alert.alert("AI Insight", response))}
// //               style={[styles.button, { backgroundColor: colors.accent, marginTop: 10 }]}
// //             >
// //               <Text style={{ color: colors.surface, fontWeight: "600" }}>Reflect with AI</Text>
// //             </TouchableOpacity>
// //           )}

// //           {saved ? (
// //             <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
// //               <Text style={{ color: colors.success, fontWeight: "600" }}>✓ Saved</Text>
// //               <TouchableOpacity onPress={() => { setEntry(""); setMood(0); setTags([]); setSaved(false); }}>
// //                 <Text style={{ color: colors.primary, fontWeight: "600" }}>+ New Entry</Text>
// //               </TouchableOpacity>
// //             </View>
// //           ) : (
// //             <TouchableOpacity
// //               onPress={saveEntry}
// //               disabled={!isValid}
// //               style={[styles.button, { backgroundColor: isValid ? colors.primary : colors.border }]}
// //             >
// //               <Text style={{ color: colors.surface, fontWeight: "600" }}>Save Entry</Text>
// //             </TouchableOpacity>
// //           )}
// //         </View>

// //         <TouchableOpacity onPress={handleHistoryToggle} style={{ alignSelf: "center", marginBottom: 20 }}>
// //           <Text style={{ color: colors.primary, fontWeight: "500" }}>
// //             {showHistory ? "Hide Past Journal" : "View Past Journal"}
// //           </Text>
// //         </TouchableOpacity>

// //         {showHistory && entries.map(renderItem)}
// //       </ScrollView>
// //     </KeyboardAvoidingView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, paddingTop: 70, paddingHorizontal: 16 },
// //   prompt: { fontSize: 14, marginBottom: 12 },
// //   inputCard: { borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
// //   input: { minHeight: 100, fontSize: 14, marginBottom: 12 },
// //   sliderLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
// //   slider: { width: "100%", height: 32 },
// //   moodValue: { textAlign: "center", marginBottom: 12, fontSize: 13, fontWeight: "500" },
// //   button: { alignSelf: "flex-end", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
// //   entryCard: { padding: 14, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
// //   entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
// //   entryDate: { fontSize: 12 },
// //   entryText: { fontSize: 14, lineHeight: 20 },
// //   tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontSize: 12, fontWeight: "500" },
// //   tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 },
// // });

// import React, { useState } from "react";
// import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// import AIChatModal from "../components/journal/AIChatModal";
// import JournalInputCard from "../components/journal/JournalInputCard";
// import PastJournalModal from "../components/journal/PastJournalModal";
// import { useTheme } from "../theme/theme";

// export default function Journal() {
//   const { colors, typography } = useTheme();
//   const [showHistory, setShowHistory] = useState(false);
//   const [showAIChat, setShowAIChat] = useState(false);

//   const handleAutoPopulate = (newMood: number, newTags: string[]) => {
//   setMood(newMood);
//   setTags((prev) => [...new Set([...prev, ...newTags])]);
//   setSaved(false);
// };

//   return (
//     <View style={[styles.container, { backgroundColor: colors.background }]}>
//       <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
//         <Text style={[typography.h2, { color: colors.textPrimary }]}>Journal</Text>
//         <Text style={[styles.prompt, { color: colors.textSecondary }]}>
//           Reflect on today or clear your mind
//         </Text>

//         <JournalInputCard onStartAI={() => setShowAIChat(true)} />
//         <TouchableOpacity
//           onPress={() => setShowHistory(true)}
//           style={{ alignSelf: "center", marginBottom: 20 }}
//         >
//           <Text style={{ color: colors.primary, fontWeight: "500" }}>
//             View Past Journal
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>

//       <PastJournalModal visible={showHistory} onClose={() => setShowHistory(false)}  />
//       <AIChatModal visible={showAIChat} onClose={() => setShowAIChat(false)} onAutoPopulate={handleAutoPopulate} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 70, paddingHorizontal: 16 },
//   prompt: { fontSize: 14, marginBottom: 12 },
// });

import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AIChatModal from "../components/journal/AIChatModal";
import JournalInputCard from "../components/journal/JournalInputCard";
import PastJournalModal from "../components/journal/PastJournalModal";
import { supabase } from "../lib/api";
import { useTheme } from "../theme/theme";

export default function Journal() {
  const { colors, typography } = useTheme();
  const [showHistory, setShowHistory] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userTier, setUserTier] = useState<"free" | "premium" | "premium+ai">("free");
  const [userGoals, setUserGoals] = useState(
    "Improving health and consistency"
  );


  useEffect(() => {
    // Fetch user's name and goals if stored in Supabase profile
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, goals")
        .eq("user_id", user?.id)
        .single();
      if (!error && data) {
        setUserName(data.full_name?.split(" ")[0] || "User");
        setUserGoals(data.goals.goalType || "Improving health and consistency");
      }
    })();
  }, []);

  useEffect(() => {
    const fetchTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user?.id)
        .single();
      setUserTier(data?.tier || "free");
    };
    fetchTier();
  }, []);

  const refreshDashboard = () => {
    // E.g., you could set a state flag or trigger a Supabase refetch here
    console.log("Dashboard refresh triggered after journaling");
  };
  const handleCloseAI = () => {
    setShowAIChat(false); // Hide modal
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>
          Journal
        </Text>
        <Text style={[styles.prompt, { color: colors.textSecondary }]}>
          Reflect on today or clear your mind
        </Text>

        <JournalInputCard onStartAI={() => setShowAIChat(true)} />

        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          //style={{ alignSelf: "center", marginBottom: 20}}
          style={[styles.viewJournal, {
            backgroundColor: colors.success,
          }]}
        >
          <Text style={{ color: colors.primary, fontWeight: "500" }}>
            View Past Journal
          </Text>
        </TouchableOpacity>
      </ScrollView>
        <PastJournalModal
          visible={showHistory}
          onClose={() => setShowHistory(false)}
          tier={userTier}
        />
        <AIChatModal
          visible={showAIChat}
          onClose={handleCloseAI}
          userName={userName}
          userGoals={userGoals}
          refreshDashboard={refreshDashboard}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70, paddingHorizontal: 16},
  prompt: { fontSize: 18, marginBottom: 12, marginTop:10 },
  viewJournal: { alignSelf: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
});
