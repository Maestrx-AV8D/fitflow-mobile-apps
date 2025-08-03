// // //

// // //

// // import { Ionicons } from "@expo/vector-icons";
// // import DateTimePicker from "@react-native-community/datetimepicker";
// // import { useNavigation } from "@react-navigation/native";
// // import * as Notifications from "expo-notifications";
// // import React, { useEffect, useState } from "react";
// // import {
// //     Linking,
// //     Platform,
// //     StyleSheet,
// //     Switch,
// //     Text,
// //     TouchableOpacity,
// //     View
// // } from "react-native";
// // import { supabase } from "../lib/api";
// // import { useTheme } from "../theme/theme";

// // export default function NotificationSettings() {
// //   const { colors, spacing, typography } = useTheme();
// //   const navigation = useNavigation();
// //   const [permissionsGranted, setPermissionsGranted] = useState(false);
// //   const [settings, setSettings] = useState({
// //     workout: false,
// //     fast: false,
// //     ai: false,
// //     streak: false,
// //   });
// //   const [workoutTime, setWorkoutTime] = useState("08:00");
// //   const [fastTime, setFastTime] = useState("21:00");
// //   const [showTimePicker, setShowTimePicker] = useState<null | "workout" | "fast" | null>(null);

// //   useEffect(() => {
// //     checkPermissions();
// //     fetchSettings();
// //   }, []);

// //   useEffect(() => {
// //     (async () => {
// //       const { status } = await Notifications.requestPermissionsAsync();
// //       if (status !== 'granted') {
// //         alert('Enable notifications in settings to receive reminders');
// //       }
// //     })();
// //   }, []);

// //   const checkPermissions = async () => {
// //     const { status } = await Notifications.getPermissionsAsync();
// //     setPermissionsGranted(status === "granted");
// //   };

// //   const fetchSettings = async () => {
// //     const {
// //       data: { user },
// //     } = await supabase.auth.getUser();
// //     const { data } = await supabase
// //       .from("notification_settings")
// //       .select("*")
// //       .eq("user_id", user?.id)
// //       .single();

// //     if (data) {
// //       setSettings(data);
// //       if (data.workoutTime) setWorkoutTime(data.workoutTime);
// //       if (data.fastTime) setFastTime(data.fastTime);
// //     }
// //   };

// //   const updateSetting = async (key: keyof typeof settings, value: boolean) => {
// //     const {
// //       data: { user },
// //     } = await supabase.auth.getUser();

// //     const updated = { ...settings, [key]: value };
// //     setSettings(updated);

// //     await supabase
// //       .from("notification_settings")
// //       .upsert({ user_id: user.id, ...updated, workoutTime, fastTime });
// //   };

// //   const updateTime = async (type: "workout" | "fast", date: Date) => {
// //     const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
// //     const {
// //       data: { user },
// //     } = await supabase.auth.getUser();

// //     if (type === "workout") setWorkoutTime(timeStr);
// //     if (type === "fast") setFastTime(timeStr);

// //     await supabase
// //       .from("notification_settings")
// //       .upsert({
// //         user_id: user.id,
// //         ...settings,
// //         workoutTime: type === "workout" ? timeStr : workoutTime,
// //         fastTime: type === "fast" ? timeStr : fastTime,
// //       });

// //     setShowTimePicker(null);
// //   };

// //   const openSettings = () => {
// //     if (Platform.OS === "ios") {
// //       Linking.openURL("app-settings:");
// //     } else {
// //       Linking.openSettings();
// //     }
// //   };

// //   const renderRow = (title, description, value, onChange, time, onTimePress) => (
// //     <View style={styles.rowContainer}>
// //       <View style={{ flex: 1 }}>
// //         <Text style={[styles.label, { color: colors.textPrimary }]}>
// //           {title}
// //         </Text>
// //         <Text style={[styles.description, { color: colors.textSecondary }]}> {description}</Text>
// //       </View>
// //       {time && (
// //         <TouchableOpacity onPress={onTimePress}>
// //           <Text style={[styles.time, { color: colors.textSecondary }]}>{time}</Text>
// //         </TouchableOpacity>
// //       )}
// //       <Switch
// //         trackColor={{ false: colors.border, true: colors.primary }}
// //         thumbColor={value ? colors.card : "#f4f3f4"}
// //         value={value}
// //         onValueChange={onChange}
// //       />
// //     </View>
// //   );

// //   return (
// //     <View style={[styles.screen, { backgroundColor: colors.background }]}>
// //       <View style={styles.header}>
// //         <TouchableOpacity onPress={() => navigation.goBack()}>
// //           <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
// //         </TouchableOpacity>
// //         <Text style={[typography.h1, { color: colors.textPrimary }]}>notifications.</Text>
// //         <View style={{ width: 28 }} />
// //       </View>

// //       {!permissionsGranted && (
// //         <View style={[styles.warningBox, { backgroundColor: colors.card }]}>
// //           <Text style={[styles.warningText, { color: colors.textSecondary }]}>WARNING</Text>
// //           <Text style={[styles.warningDesc, { color: colors.textSecondary }]}>Notifications are not enabled. To receive reminders you need to give permissions in Settings</Text>
// //           <TouchableOpacity onPress={openSettings} style={[styles.openBtn, { backgroundColor: colors.surface }]}>
// //             <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Open Settings</Text>
// //           </TouchableOpacity>
// //         </View>
// //       )}

// //       <Text style={styles.sectionTitle}>DAILY REMINDERS</Text>
// //       {renderRow(
// //         "Workout Reminder",
// //         "Reminder to log or complete a workout",
// //         settings.workout,
// //         (val) => updateSetting("workout", val),
// //         workoutTime,
// //         () => setShowTimePicker("workout")
// //       )}
// //       {renderRow(
// //         "Fasting Reminder",
// //         "Reminder to track your fasts",
// //         settings.fast,
// //         (val) => updateSetting("fast", val),
// //         fastTime,
// //         () => setShowTimePicker("fast")
// //       )}

// //       <Text style={styles.sectionTitle}>OTHER NOTIFICATIONS</Text>
// //       {renderRow(
// //         "Streak-Saving Reminder",
// //         "Get reminded to log before your streak resets",
// //         settings.streak,
// //         (val) => updateSetting("streak", val)
// //       )}

// //       {showTimePicker && (
// //         <DateTimePicker
// //           mode="time"
// //           value={new Date()}
// //           display="spinner"
// //           onChange={(event, date) => {
// //             if (date) updateTime(showTimePicker, date);
// //           }}
// //         />
// //       )}
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   screen: { flex: 1, padding: 20 },
// //   header: {
// //     marginTop: 60,
// //     marginBottom: 30,
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     alignItems: "center",
// //   },
// //   warningBox: {
// //     borderRadius: 16,
// //     padding: 20,
// //     marginBottom: 30,
// //   },
// //   warningText: {
// //     fontWeight: "700",
// //     letterSpacing: 1,
// //     marginBottom: 8,
// //   },
// //   warningDesc: {
// //     fontSize: 15,
// //     marginBottom: 14,
// //   },
// //   openBtn: {
// //     paddingVertical: 10,
// //     paddingHorizontal: 20,
// //     borderRadius: 999,
// //     alignSelf: "center",
// //   },
// //   sectionTitle: {
// //     color: "#888",
// //     fontSize: 13,
// //     fontWeight: "600",
// //     letterSpacing: 1,
// //     marginBottom: 10,
// //     marginTop: 20,
// //   },
// //   rowContainer: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     marginBottom: 22,
// //   },
// //   label: {
// //     fontSize: 16,
// //     fontWeight: "600",
// //     marginBottom: 2,
// //   },
// //   description: {
// //     fontSize: 14,
// //   },
// //   time: {
// //     marginRight: 10,
// //     fontWeight: "600",
// //   },
// // });

// // NotificationSettings.tsx
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useNavigation } from "@react-navigation/native";
// import * as Notifications from "expo-notifications";
// import React, { useEffect, useState } from "react";
// import {
//     Linking,
//     Modal,
//     Platform,
//     Pressable,
//     StyleSheet,
//     Switch,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { supabase } from "../lib/api";
// import { useTheme } from "../theme/theme";

// export default function NotificationSettings() {
//   const { colors, spacing, typography } = useTheme();
//   const navigation = useNavigation();
//   const [permissionsGranted, setPermissionsGranted] = useState(false);
//   const [settings, setSettings] = useState({
//     workout: true,
//     fast: true,
//     journal: true,
//     streak: true,
//   });
//   const [workoutTime, setWorkoutTime] = useState("08:00");
//   const [fastTime, setFastTime] = useState("12:00");
//   const [journalTime, setJournalTime] = useState("21:00");
//   const [showTimePicker, setShowTimePicker] = useState<
//     null | "workout" | "fast" | "journal"
//   >(null);

//   useEffect(() => {
//     checkPermissions();
//     fetchSettings();
//   }, []);

//   const checkPermissions = async () => {
//     const { status } = await Notifications.getPermissionsAsync();
//     setPermissionsGranted(status === "granted");
//   };

//   const fetchSettings = async () => {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     const { data } = await supabase
//       .from("notification_settings")
//       .select("*")
//       .eq("user_id", user?.id)
//       .single();

//     if (data) {
//       setSettings({
//         workout: data.workout ?? true,
//         fast: data.fast ?? true,
//         journal: data.journal ?? true,
//         streak: data.streak ?? true,
//       });
//       if (data.workoutTime) setWorkoutTime(data.workoutTime);
//       if (data.fastTime) setFastTime(data.fastTime);
//       if (data.journalTime) setJournalTime(data.journalTime);
//     }
//   };

//   const updateSetting = async (key: keyof typeof settings, value: boolean) => {
//     if (!permissionsGranted) return;
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     const updated = { ...settings, [key]: value };
//     setSettings(updated);

//     await supabase.from("notification_settings").upsert({
//       user_id: user.id,
//       ...updated,
//       workoutTime,
//       fastTime,
//       journalTime,
//     });
//   };

//   const updateTime = async (
//     type: "workout" | "fast" | "journal",
//     date: Date
//   ) => {
//     const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date
//       .getMinutes()
//       .toString()
//       .padStart(2, "0")}`;
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (type === "workout") setWorkoutTime(timeStr);
//     if (type === "fast") setFastTime(timeStr);
//     if (type === "journal") setJournalTime(timeStr);

//     await supabase.from("notification_settings").upsert({
//       user_id: user.id,
//       ...settings,
//       workoutTime: type === "workout" ? timeStr : workoutTime,
//       fastTime: type === "fast" ? timeStr : fastTime,
//       journalTime: type === "journal" ? timeStr : journalTime,
//     });

//     setShowTimePicker(null);
//   };

//   const openSettings = () => {
//     if (Platform.OS === "ios") {
//       Linking.openURL("app-settings:");
//     } else {
//       Linking.openSettings();
//     }
//   };

//   const renderRow = (
//     title,
//     description,
//     value,
//     onChange,
//     time,
//     onTimePress
//   ) => (
//     <View style={styles.rowContainer}>
//       <View style={{ flex: 1 }}>
//         <Text style={[styles.label, { color: colors.textPrimary }]}>
//           {title}
//         </Text>
//         <Text style={[styles.description, { color: colors.textSecondary }]}>
//           {description}
//         </Text>
//       </View>
//       <View style={styles.coloumContainer}>
//       {time && (
//         <TouchableOpacity onPress={onTimePress} disabled={!permissionsGranted}>
//           <Text style={[styles.time, { color: colors.textPrimary }]} disabled={!permissionsGranted}>
//             {time}
//           </Text>
//         </TouchableOpacity>
//       )}
//       <Switch
//         trackColor={{ false: colors.border, true: colors.primary }}
//         thumbColor={value ? colors.card : "#f4f3f4"}
//         value={value}
//         onValueChange={onChange}
//         disabled={!permissionsGranted}
//       />
//       </View>
//     </View>
//   );

//   return (
//     <View style={[styles.screen, { backgroundColor: colors.background }]}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
//         </TouchableOpacity>
//         <Text style={[typography.h1, { color: colors.textPrimary }]}>
//           notifications.
//         </Text>
//         <View style={{ width: 28 }} />
//       </View>

//       {!permissionsGranted && (
//         <View style={[styles.warningBox, { backgroundColor: colors.card }]}>
//           <Text
//             style={[
//               styles.warningText,
//               { color: colors.warning, alignSelf: "center" },
//             ]}
//           >
//             WARNING
//           </Text>
//           <Text style={[styles.warningDesc, { color: colors.textSecondary }]}>
//             Notifications are not enabled. To receive reminders you need to give
//             permissions in Settings
//           </Text>
//           <TouchableOpacity
//             onPress={openSettings}
//             style={[styles.openBtn, { backgroundColor: colors.surface }]}
//           >
//             <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
//               Open Settings
//             </Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <Text style={styles.sectionTitle}>DAILY REMINDERS</Text>
//       {renderRow(
//         "Workout Reminder",
//         "Reminder to log or complete a workout",
//         settings.workout,
//         (val) => updateSetting("workout", val),
//         workoutTime,
//         () => setShowTimePicker("workout")
//       )}
//       {renderRow(
//         "Fasting Reminder",
//         "Reminder to track your fasts",
//         settings.fast,
//         (val) => updateSetting("fast", val),
//         fastTime,
//         () => setShowTimePicker("fast")
//       )}

//       <Text style={styles.sectionTitle}>OTHER NOTIFICATIONS</Text>
//       {renderRow(
//         "Streak-Saving Reminder",
//         "Get reminded to log before your streak resets",
//         settings.streak,
//         (val) => updateSetting("streak", val)
//       )}
//       {renderRow(
//         "Journal Reminder",
//         "Reflect on your day and jot your thoughts",
//         settings.journal,
//         (val) => updateSetting("journal", val),
//         journalTime,
//         () => setShowTimePicker("journal")
//       )}
//       <Modal
//         transparent
//         visible={!!showTimePicker}
//         animationType="fade"
//         onRequestClose={() => setShowTimePicker(null)}
//       >
//         <Pressable
//           style={{
//             flex: 1,
//             backgroundColor: "rgba(0,0,0,0.5)",
//             justifyContent: "center",
//             marginTop: 400
//           }}
//           onPress={() => setShowTimePicker(null)}
//         >
//           <View
//             style={{
//               backgroundColor: colors.surface,
//               marginHorizontal: 30,
//               borderRadius: 16,
//             }}
//           >
//             <DateTimePicker
//               mode="time"
//               value={new Date()}
//               display="spinner"
//               textColor={colors.textPrimary}
//               onChange={(event, date) => {
//                 if (date) updateTime(showTimePicker!, date);
//               }}
//             />
//           </View>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screen: { flex: 1, padding: 20 },
//   header: {
//     marginTop: 60,
//     marginBottom: 30,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   warningBox: {
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 30,
//   },
//   warningText: {
//     fontWeight: "700",
//     letterSpacing: 1,
//     marginBottom: 8,
//   },
//   warningDesc: {
//     fontSize: 15,
//     marginBottom: 14,
//   },
//   openBtn: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 999,
//     alignSelf: "center",
//   },
//   sectionTitle: {
//     color: "#888",
//     fontSize: 13,
//     fontWeight: "600",
//     letterSpacing: 1,
//     marginBottom: 10,
//     marginTop: 20,
//   },
//   rowContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 22,
//   },
//   coloumContainer:{
//     flexDirection: "column",
//     alignItems: "center",
//     marginBottom: 22,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   description: {
//     fontSize: 14,
//   },
//   time: {
//     //marginRight: 10,
//     fontWeight: "600",
//     marginBottom: 10
//   },
// });

// NotificationSettings.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/api";
import {
    scheduleAllReminders
} from "../lib/notification";
import { useTheme } from "../theme/theme";

export default function NotificationSettings() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [settings, setSettings] = useState({
    workout: true,
    fast: true,
    journal: true,
    streak: true,
  });
  const [workoutTime, setWorkoutTime] = useState("08:00");
  const [fastTime, setFastTime] = useState("12:00");
  const [journalTime, setJournalTime] = useState("21:00");
  const [showTimePicker, setShowTimePicker] = useState<
    null | "workout" | "fast" | "journal"
  >(null);
  const [tempTime, setTempTime] = useState(new Date());

  useEffect(() => {
    checkPermissions();
    fetchSettings();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionsGranted(status === "granted");
  };

  const fetchSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (data) {
      setSettings({
        workout: data.workout ?? true,
        fast: data.fast ?? true,
        journal: data.journal ?? true,
        streak: data.streak ?? true,
      });
      if (data.workoutTime) setWorkoutTime(data.workoutTime);
      if (data.fastTime) setFastTime(data.fastTime);
      if (data.journalTime) setJournalTime(data.journalTime);
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    if (!permissionsGranted) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    await supabase.from("notification_settings").upsert({
      user_id: user?.id,
      ...updated,
      workoutTime,
      fastTime,
      journalTime,
    });

    await scheduleAllReminders(); // ← reschedule everything
  };

  const updateTime = async (
    type: "workout" | "fast" | "journal",
    date: Date
  ) => {
    const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updatedTimes = {
      workoutTime: type === "workout" ? timeStr : workoutTime,
      fastTime: type === "fast" ? timeStr : fastTime,
      journalTime: type === "journal" ? timeStr : journalTime,
    };

    if (type === "workout") setWorkoutTime(timeStr);
    if (type === "fast") setFastTime(timeStr);
    if (type === "journal") setJournalTime(timeStr);

    await supabase.from("notification_settings").upsert({
      user_id: user?.id,
      ...settings,
      ...updatedTimes,
    });

    setShowTimePicker(null);
    await scheduleAllReminders(); // ← reschedule
  };

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

//   useEffect(() => {
//     fetchSettings().then(() => {
//       getActiveNotifications().then(console.log);
//     });
//   }, []);

  const renderRow = (
    title,
    description,
    value,
    onChange,
    time,
    onTimePress
  ) => (
    <View style={styles.rowContainer}>
      <View style={{ flex: 1, opacity: permissionsGranted ? 1 : 0.5 }}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <View style={styles.coloumContainer}>
        {time && (
          <TouchableOpacity
            onPress={onTimePress}
            disabled={!permissionsGranted}
          >
            <Text
              style={[
                styles.time,
                {
                  color: colors.textPrimary,
                  opacity: permissionsGranted ? 1 : 0.5,
                },
              ]}
            >
              {time}
            </Text>
          </TouchableOpacity>
        )}
        <Switch
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value ? colors.card : "#f4f3f4"}
          value={value}
          onValueChange={onChange}
          disabled={!permissionsGranted}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>
          notifications.
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {!permissionsGranted && (
        <View style={[styles.warningBox, { backgroundColor: colors.card }]}>
          <Text
            style={[
              styles.warningText,
              { color: colors.warning, alignSelf: "center" },
            ]}
          >
            WARNING
          </Text>
          <Text style={[styles.warningDesc, { color: colors.textSecondary }]}>
            Notifications are not enabled. To receive reminders you need to give
            permissions in Settings
          </Text>
          <TouchableOpacity
            onPress={openSettings}
            style={[styles.openBtn, { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
              Open Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>DAILY REMINDERS</Text>
      {renderRow(
        "Workout Reminder",
        "Reminder to log or complete a workout",
        settings.workout,
        (val) => updateSetting("workout", val),
        workoutTime,
        () => setShowTimePicker("workout")
      )}
      {renderRow(
        "Fasting Reminder",
        "Reminder to track your fasts",
        settings.fast,
        (val) => updateSetting("fast", val),
        fastTime,
        () => setShowTimePicker("fast")
      )}

      <Text style={styles.sectionTitle}>OTHER NOTIFICATIONS</Text>
      {renderRow(
        "Streak-Saving Reminder",
        "Get reminded to log before your streak resets",
        settings.streak,
        (val) => updateSetting("streak", val)
      )}
      {renderRow(
        "Journal Reminder",
        "Reflect on your day and jot your thoughts",
        settings.journal,
        (val) => updateSetting("journal", val),
        journalTime,
        () => setShowTimePicker("journal")
      )}

      <Modal
        transparent
        visible={!!showTimePicker}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
            marginBottom: 100,
          }}
          onPress={() => setShowTimePicker(null)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              paddingTop: 20,
              borderRadius: 16,
              marginHorizontal: 20,
            }}
          >
            <DateTimePicker
              mode="time"
              value={tempTime}
              display="spinner"
              textColor={colors.textPrimary}
              onChange={(event, date) => date && setTempTime(date)}
              style={{ backgroundColor: colors.surface, alignSelf: "center" }}
            />
          </View>
          <View
            style={{
              backgroundColor: colors.surface,
              marginTop: 10,
              borderRadius: 16,
              marginHorizontal: 20,
            }}
          >
            <TouchableOpacity
              style={{ alignItems: "center", padding: 16 }}
              onPress={updateTime}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "600",
                  color: colors.textSecondary,
                }}
              >
                done
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20 },
  header: {
    marginTop: 60,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningBox: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  warningText: {
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  warningDesc: {
    fontSize: 15,
    marginBottom: 14,
  },
  openBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignSelf: "center",
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  coloumContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
  },
  time: {
    fontWeight: "600",
    marginBottom: 10,
  },
});
