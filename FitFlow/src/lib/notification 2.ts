// // lib/notifications.ts
// import * as Notifications from 'expo-notifications';
// import { supabase } from './api';

// const STREAK_NOTIFICATION_ID = 'streak-reminder';

// export async function scheduleStreakReminder(hour = 19, minute = 30) {
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const endOfDay = new Date(today);
//   endOfDay.setHours(23, 59, 59, 999);

//   const { data, error } = await supabase
//     .from('entries')
//     .select('id')
//     .gte('date', today.toISOString())
//     .lte('date', endOfDay.toISOString());

//   if (error) return;
//   const hasLoggedToday = data && data.length > 0;
//   if (hasLoggedToday) return; // Don't schedule if already logged

//   const now = new Date();
//   const targetTime = new Date();
//   targetTime.setHours(hour, minute, 0, 0);

//   if (targetTime <= now) return; // Don't schedule if time has passed

//   await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);

//   await Notifications.scheduleNotificationAsync({
//     identifier: STREAK_NOTIFICATION_ID,
//     content: {
//       title: "Don't lose your streak!",
//       body: "Log today’s activity before midnight to keep your progress alive.",
//       sound: true,
//     },
//     trigger: {
//       hour,
//       minute,
//       repeats: false,
//     },
//   });
// }

// export async function cancelStreakReminder() {
//   try {
//     await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);
//   } catch (err) {
//     console.warn('Could not cancel streak reminder:', err);
//   }
// }


// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { supabase } from './api';

let cachedSettings: any = null;

const getNextTriggerDate = (timeStr: string): Date => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);
  return trigger;
};

export async function fetchNotificationSettings(forceRefresh = false) {
  if (cachedSettings && !forceRefresh) return cachedSettings;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  cachedSettings = data;
  return data;
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAllReminders() {
  const settings = await fetchNotificationSettings();
  if (!settings) return;

  await cancelAllReminders();

  const schedule = async (title: string, body: string, timeStr: string) => {
    const trigger = getNextTriggerDate(timeStr);
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        hour: trigger.getHours(),
        minute: trigger.getMinutes(),
        repeats: true,
      },
    });
  };

  if (settings.workout) {
    await schedule("Workout Reminder", "Log your workout or hit the gym.", settings.workoutTime);
  }
  if (settings.fast) {
    await schedule("Fasting Reminder", "Track your fast or plan your next one.", settings.fastTime);
  }
  if (settings.journal) {
    await schedule("Journal Reminder", "Take a moment to log your thoughts.", settings.journalTime);
  }
  if (settings.streak) {
    await schedule("Save Your Streak!", "Don’t forget to log today before time runs out.", '20:00');
  }
}

export async function scheduleStreakReminderOnce(hour = 19, minute = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('entries')
    .select('id')
    .gte('date', today.toISOString())
    .lte('date', endOfDay.toISOString());

  if (error) return;
  const hasLoggedToday = data && data.length > 0;
  if (hasLoggedToday) return;

  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(hour, minute, 0, 0);
  if (targetTime <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't lose your streak!",
      body: "Log today’s activity before midnight to keep your progress alive.",
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: false,
    },
  });
}

export async function getActiveNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map(n => ({ title: n.content.title, trigger: n.trigger }));
}
