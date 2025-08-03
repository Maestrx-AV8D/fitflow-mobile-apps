// === Dashboard.tsx ===
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  addDays,
  differenceInSeconds,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfWeek,
  subDays,
} from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import WeeklyWorkoutsChart from "../components/WeeklyWorkoutChart";
import { allInspirations, Inspiration } from "../constants/inspirations";
import {
  getEntryCount,
  getExercisesCompleted,
  getLast7DaysWorkouts,
  getLatestWorkoutDate,
  supabase,
} from "../lib/api";
import { useTheme } from "../theme/theme";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { colors, spacing, typography } = useTheme();
  const nav = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  const [name, setName] = useState("");
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [latestWorkout, setLatestWorkout] = useState("—");
  const [chartData, setChartData] = useState<any[]>([]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daySummary, setDaySummary] = useState<string>("");
  const [streak, setStreak] = useState<number>(0);

  const isMiddayOnWeekEnd = (date: Date) => {
    const isSunday = date.getDay() === 0; // Sunday = 0, Monday = 1
    const now = new Date();
    const isAfterMidday = now.getHours() >= 12;
    return isSunday && isAfterMidday;
  };

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user?.id)
        .single();
      const userName = data?.full_name?.split(" ")[0] || "";
      setName(userName);
      setTotalWorkouts(await getEntryCount());
      setExercisesCompleted(await getExercisesCompleted());
      const latest = await getLatestWorkoutDate();
      setLatestWorkout(latest ? format(new Date(latest), "dd/MM/yyyy") : "—");
      setChartData(await getLast7DaysWorkouts());

      const days = generateDateRange();
      setWeekDays(days);

      const today = new Date();
      const todayInRange = days.find((d) => isSameDay(d, today));
      const defaultDate = todayInRange || days[0];
      setSelectedDate(defaultDate);

      const index = days.findIndex((d) => isSameDay(d, defaultDate));
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true });
        }, 300);
      }

      await calculateStreak();
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = nav.addListener("focus", async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user?.id)
        .single();
      const userName = data?.full_name?.split(" ")[0] || "";
      setName(userName);
    });

    return unsubscribe;
  }, [nav]);

  useEffect(() => {
    if (selectedDate) fetchDaySummary();
  }, [selectedDate]);

  const fetchPersonalBests = async (userId: string, today: Date) => {
    const { data, error } = await supabase
      .from("entries")
      .select("type, distance, duration, date")
      .neq("date", today.toISOString()); // exclude today

    if (error || !data) return null;

    let bestDistance = 0;
    let bestDuration = 0;

    for (const w of data) {
      if (w.distance && w.distance > bestDistance) bestDistance = w.distance;
      if (w.duration && w.duration > bestDuration) bestDuration = w.duration;
    }

    return { bestDistance, bestDuration };
  };

  const fetchDaySummary = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const start = new Date(selectedDate!);
    const isToday = isSameDay(selectedDate!, new Date());

    if (isToday && isMiddayOnWeekEnd(selectedDate!)) {
      await generateWeeklySummary(user.id);
      return;
    }

    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate!);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .gte("date", start.toISOString())
      .lte("date", end.toISOString());

    if (error || !data) {
      setDaySummary("");
      return;
    }

    const filtered = data.filter((entry) =>
      ["Gym", "Run", "Swim", "Cycle"].includes(entry.type)
    );

    const fastingEntries = data.filter((entry) => entry.type === "Fasting");

    const workoutCount = filtered.length;
    const totalExercises = filtered.reduce(
      (sum, entry) => sum + (entry.exercises?.length || 0),
      0
    );

    const personalBests = await fetchPersonalBests(user.id, start);

    let bestDistanceToday = 0;
    let bestDurationToday = 0;
    let bestFastingMinutes = 0;

    data.forEach((entry) => {
      if (entry.distance && entry.distance > bestDistanceToday)
        bestDistanceToday = entry.distance;
      if (entry.duration && entry.duration > bestDurationToday)
        bestDurationToday = entry.duration;
    });

    fastingEntries.forEach((entry) => {
      if (entry.duration && entry.duration > bestFastingMinutes)
        bestFastingMinutes = entry.duration;
    });

    let highlight = "";

    if (bestDistanceToday > (personalBests?.bestDistance || 0)) {
      highlight = `🏅 New distance record: ${bestDistanceToday} km!`;
    } else if (bestDurationToday > (personalBests?.bestDuration || 0)) {
      highlight = `⏱️ Longest session yet: ${bestDurationToday} mins!`;
    } else if (bestFastingMinutes > 0) {
      highlight = `🔥 New fasting record: ${bestFastingMinutes} mins!`;
    } else if (workoutCount >= 2) {
      highlight = `Big day! You crushed ${workoutCount} workouts with ${totalExercises} exercises.`;
    } else if (totalExercises >= 8) {
      highlight = `High volume session: ${totalExercises} exercises. Solid effort.`;
    } else if (workoutCount === 1) {
      const workout = filtered[0];
      const activity = workout.type || "session";
      highlight = `You completed a focused ${activity} today.`;
    } else if (data.length === 0 && streak > 0) {
      highlight = `You stayed consistent with ${streak} day streak — even without a log. That’s discipline.`;
    } else {
      highlight = `You showed up — that’s what matters. Keep building.`;
    }

    setDaySummary(highlight);
  };

  const generateWeeklySummary = async (userId: string) => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const weekEnd = addDays(weekStart, 6);

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"))
      .eq("user_id", userId);

    if (error || !data) {
      setDaySummary("Couldn’t fetch your week summary. Try again later.");
      return;
    }

    const workouts = data.filter((e) =>
      ["Gym", "Run", "Cycle", "Swim"].includes(e.type)
    );
    const fasting = data.filter((e) => e.type === "Fasting");

    if (workouts.length === 0 && fasting.length === 0) {
      setDaySummary("No logs yet this week — fresh starts are powerful.");
      return;
    }

    const bestDistance = Math.max(...workouts.map((e) => e.distance || 0), 0);
    const bestDuration = Math.max(...workouts.map((e) => e.duration || 0), 0);
    const bestFast = Math.max(...fasting.map((e) => e.duration || 0), 0);
    const totalWorkouts = workouts.length;
    const totalExercises = workouts.reduce(
      (sum, e) => sum + (e.exercises?.length || 0),
      0
    );

    const summary = [
      bestDistance > 0 ? `Longest Distance: ${bestDistance} km` : null,
      bestDuration > 0 ? `Longest Session: ${bestDuration} mins` : null,
      bestFast > 0 ? `Longest Fast: ${bestFast} mins` : null,
      streak > 0 ? `🔥 ${streak} days steak` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setDaySummary(summary);
  };

  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  const calculateStreak = async () => {
    let streak = 0;
    let loggedToday = false;
    let dayCursor = new Date();

    while (true) {
      const start = new Date(dayCursor);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dayCursor);
      end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("entries")
        .select("id")
        .gte("date", start.toISOString())
        .lte("date", end.toISOString());

      if (isSameDay(dayCursor, new Date())) {
        loggedToday = data && data.length > 0;
      }

      if (!data || data.length === 0) break;

      streak++;
      dayCursor = subDays(dayCursor, 1);
    }

    setHasLoggedToday(loggedToday);
    setStreak(streak);
  };

  const generateDateRange = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 14 }, (_, i) => addDays(addDays(start, -7), i));
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    const base =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    return name ? `${base}, ${name}!` : `${base}.`;
  };

  const handleDatePress = (date: Date) => setSelectedDate(date);

  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  useEffect(() => {
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    // Seeded shuffle function
    const seededShuffle = (arr: Inspiration[], seed: number) => {
      const result = [...arr];
      let currentIndex = result.length;
      let randomIndex: number;

      const seededRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      while (currentIndex !== 0) {
        randomIndex = Math.floor(seededRandom() * currentIndex);
        currentIndex--;
        [result[currentIndex], result[randomIndex]] = [
          result[randomIndex],
          result[currentIndex],
        ];
      }

      return result;
    };

    const shuffled = seededShuffle(allInspirations, seed);
    const selected = shuffled.slice(0, 3).map((item, index) => ({
      ...item,
      id: String(index + 1),
      title: "GET INSPIRED",
    }));

    setInspirations(selected);
  }, []);

  const renderInspirationCarousel = () => (
    <View>
      <FlatList
        data={inspirations}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={width * 0.8 + 16}
        contentContainerStyle={{ paddingLeft: 4, marginBottom: 32 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.inspirationCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                typography.h3,
                {
                  color: colors.textPrimary,
                  marginBottom: 10,
                  textAlign: "center",
                },
              ]}
            >
              {item.icon}
            </Text>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.textPrimary,
                  marginBottom: 8,
                  textAlign: "center",
                },
              ]}
            >
              {item.content}
            </Text>
            {item.author && (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {item.author}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: colors.card }]}
            >
              <Text style={{ fontWeight: "600", color: colors.textPrimary }}>
                {item.cta}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  const renderDateContent = () => {
    const now = new Date();
    const getSummaryLabel = () => {
      if (!selectedDate) return "";
      return isMiddayOnWeekEnd(selectedDate)
        ? "Here's your weekly highlight:"
        : `Summary of ${format(selectedDate, "EEEE")}`;
    };

    if (!selectedDate) return null;

    if (isBefore(selectedDate, now)) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: spacing.sm,
            }}
          >
            {getSummaryLabel()}
          </Text>
          {daySummary ? (
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: spacing.md,
              }}
            >
              {daySummary}
            </Text>
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              No logs for this day.
            </Text>
          )}
        </View>
      );
    } else if (isAfter(selectedDate, now)) {
      const secondsLeft = differenceInSeconds(selectedDate, now);
      const days = Math.floor(secondsLeft / 86400);
      const hours = Math.floor((secondsLeft % 86400) / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);
      const seconds = secondsLeft % 60;

      return (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: spacing.sm,
              fontSize: 18,
            }}
          >
            Countdown to this day
          </Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 32,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: spacing.md,
            }}
          >
            {days > 0 ? `${days}d ` : ""}{hours}h {minutes}m {seconds}s
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: spacing.sm,
          }}
        >
          Daily Check-In
        </Text>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 20,
            fontWeight: "600",
            textAlign: "center",
            marginBottom: spacing.md,
          }}
        >
          Reflect on today!
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Header height constant
  // Reduce the height of the sticky header to visually match the screenshots (closer to ~84-90px)
  // and allow for enough space for the system status bar/notch.
  const HEADER_HEIGHT = 92;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Sticky Header */}
      <View
        style={[
          styles.topBar,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            elevation: 10,
            height: HEADER_HEIGHT,
            paddingHorizontal: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.background,
            // Move header content lower
            paddingTop: 54,
          },
        ]}
      >
        <View style={styles.streakBox}>
          <MaterialIcons
            name="local-fire-department"
            size={20}
            color="#FF6D00"
          />
          <Text
            style={{
              marginLeft: 5,
              fontWeight: "600",
              color: colors.textPrimary,
              fontSize: 17,
            }}
          >
            {streak}
          </Text>
        </View>
        <Text
          style={[
            typography.h2,
            {
              color: colors.textPrimary,
              // Reduce font size a bit for compactness
              fontSize: 22,
              lineHeight: 26,
              textAlign: "center",
              marginTop: 0,
              marginBottom: 0,
            },
          ]}
        >
          {getTimeGreeting()}
        </Text>
        <TouchableOpacity onPress={() => nav.navigate("Profile" as never)}>
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <View style={{ flex: 1, marginTop: HEADER_HEIGHT + 15 }}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            // Remove paddingTop, marginTop on wrapper instead
          ]}
        >
          {/* Everything below header */}
          <FlatList
            ref={flatListRef}
            data={weekDays}
            keyExtractor={(item) => item.toDateString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={width}
            decelerationRate="fast"
            snapToAlignment="start"
            // Reduce marginTop between greeting and date row
            contentContainerStyle={[styles.dateStrip, { marginTop: 0, marginBottom: 18 }]}
            renderItem={({ item }) => {
              const dayLabel = format(item, "E");
              const dateNumber = format(item, "d");
              const isSelected = selectedDate && isSameDay(item, selectedDate);
              const isToday = isSameDay(item, new Date());
              // Grey out if not today and not selected
              const isGreyedOut = !isToday && !isSelected;
              return (
                <TouchableOpacity
                  onPress={() => handleDatePress(item)}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: isSelected
                        ? colors.surface
                        : "transparent",
                      borderColor: isSelected ? colors.border : "transparent",
                      // Make date row slightly more compact
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? colors.textPrimary
                        : isGreyedOut
                        ? "#A0A0A0"
                        : colors.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                      textAlign: "center",
                      fontSize: 13.5,
                    }}
                  >
                    {dayLabel}
                  </Text>
                  <Text
                    style={{
                      color: isSelected
                        ? colors.textPrimary
                        : isGreyedOut
                        ? "#A0A0A0"
                        : colors.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: 15,
                      textAlign: "center",
                    }}
                  >
                    {dateNumber}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {renderDateContent()}

          <View style={styles.chartWrapper}>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginBottom: 8, textAlign: "center" },
              ]}
            >
              Workouts This Week
            </Text>
            <WeeklyWorkoutsChart data={chartData} />
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontWeight: "700",
              fontSize: 16,
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            Get Inspired
          </Text>
          {renderInspirationCarousel()}
        </ScrollView>
      </View>

      {/* FAB remains absolutely positioned above all content */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => nav.navigate("Log" as never)}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 100 },
  // topBar is now styled inline in the component to allow dynamic height/colors
  topBar: {
    // See component for actual style, kept here for type safety and reuse
  },
  streakBox: { flexDirection: "row", alignItems: "center" },
  dateStrip: { flexDirection: "row", marginBottom: 18 },
  dateItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inspirationCard: {
    width: width * 0.8,
    padding: 24,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  chartWrapper: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#15131D",
    marginBottom: 50,
    marginTop: 25,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    padding: 16,
    borderRadius: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
  },
  streakWarning: {
    position: "absolute",
    top: 2,
    //bottom: -20,
    zIndex: 10,
    padding: 8,
    right: 2
  },
});
