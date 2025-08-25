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
  subDays
} from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { allInspirations, Inspiration } from "../constants/inspirations";
import {
  getEntryCount,
  getExercisesCompleted,
  getLatestWorkoutDate,
  supabase
} from "../lib/api";
import { useTheme } from "../theme/theme";

// ---- Simple, theme-aware weekly bars (no 3rd‑party chart) ----
type WeeklyPoint = { date: Date; count: number };

const makeWeeklyBuckets = (raw: any[]): WeeklyPoint[] => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const buckets: WeeklyPoint[] = Array.from({ length: 7 }, (_, i) => ({
    date: addDays(weekStart, i),
    count: 0,
  }));

  if (!Array.isArray(raw) || raw.length === 0) return buckets;

  // Helper: map day label -> index (Mon=0 .. Sun=6)
  const dayIdx: Record<string, number> = {
    Mon: 0, Monday: 0,
    Tue: 1, Tuesday: 1,
    Wed: 2, Wednesday: 2,
    Thu: 3, Thursday: 3,
    Fri: 4, Friday: 4,
    Sat: 5, Saturday: 5,
    Sun: 6, Sunday: 6,
  };

  // Case A: array items carry a `day` label and per-type counts
  const looksLikeLabeledWeek = typeof raw[0] === 'object' && raw[0] && 'day' in raw[0];
  if (looksLikeLabeledWeek) {
    raw.forEach((row: any) => {
      const idx = dayIdx[String(row.day)] ?? -1;
      if (idx >= 0 && idx < 7) {
        // Sum all numeric fields except `day`
        const total = Object.keys(row).reduce((sum, key) => {
          if (key === 'day') return sum;
          const v = Number((row as any)[key]);
          return sum + (isFinite(v) ? v : 0);
        }, 0);
        buckets[idx].count += total;
      }
    });
    return buckets;
  }

  // Case B: generic normalization: support `{date,count}` or raw entries with `date`
  const cleaned = raw
    .map((d: any) => {
      const rawDate = d?.date ?? d?.day ?? d; // support simple arrays of dates too
      let parsed: Date | null = null;
      if (rawDate instanceof Date) parsed = rawDate;
      else if (typeof rawDate === 'string') {
        // Try parse ISO or y-m-d; ignore 3-letter day names here
        const maybe = new Date(rawDate);
        parsed = isNaN(maybe.getTime()) ? null : maybe;
      }
      const val = Number(d?.count ?? d?.value ?? 1); // default to 1 per entry if no count
      return { date: parsed, count: isFinite(val) ? val : 0 };
    })
    .filter((it: any) => it.date);

  const startTs = weekStart.getTime();
  const endTs = addDays(weekStart, 6).getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  cleaned.forEach((it: any) => {
    const t = (it.date as Date).getTime();
    if (t >= startTs && t <= endTs) {
      const idx = Math.max(0, Math.min(6, Math.floor((t - startTs) / MS_PER_DAY)));
      buckets[idx].count += it.count;
    }
  });

  return buckets;
};

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { colors, spacing, typography } = useTheme();
  // Safe chart width helpers (avoid NaN from undefined spacing values)
  const chartHorizontalPadding = (spacing as any)?.lg ?? (spacing as any)?.l ?? 16;
  const chartWidth = Math.max(280, width - chartHorizontalPadding * 2);
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
      await refreshWeekData();

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
      await refreshWeekData();
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
      .eq("user_id", userId) // scope to current user
      .neq("date", format(today, "yyyy-MM-dd")); // exclude today by date (avoid TZ issues)

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

    if (!selectedDate || !user?.id) {
      setDaySummary("");
      return;
    }

    // Use date-only comparisons to avoid timezone boundary bugs
    const dayStr = format(selectedDate, "yyyy-MM-dd");

    // Fetch all entries for this user on the selected day
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dayStr);

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

    const personalBests = await fetchPersonalBests(user.id, selectedDate);

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
      streak > 0 ? `🔥 ${streak} days streak` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setDaySummary(summary);
  };

  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  const calculateStreak = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setHasLoggedToday(false);
      setStreak(0);
      return;
    }

    let s = 0;
    let loggedToday = false;
    let dayCursor = new Date();

    while (true) {
      const dayStr = format(dayCursor, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", dayStr);

      if (error) break;

      if (isSameDay(dayCursor, new Date())) {
        loggedToday = !!(data && data.length > 0);
      }

      if (!data || data.length === 0) break;

      s++;
      dayCursor = subDays(dayCursor, 1);
    }

    setHasLoggedToday(loggedToday);
    setStreak(s);
  };

  const refreshWeekData = async () => {
    // Limit data to the *current* week (Mon..Sun) and current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setChartData([]);
      return;
    }

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"));

    const weekData = error || !Array.isArray(data) ? [] : data;
    setChartData(weekData);
  };

  const refreshWeekData = async () => {
    // Limit data to the *current* week (Mon..Sun)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"));

    const weekData = error || !Array.isArray(data) ? [] : data;
    // Feed raw entries; makeWeeklyBuckets() will normalize by date
    setChartData(weekData);
  };

  const generateDateRange = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i)); // Mon..Sun only
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
      return `Summary of ${format(selectedDate, "EEEE")}`;
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

  // ---- Weekly derived stats (for added components; non-destructive)
  const weeklyStats = useMemo(() => {
    const buckets = makeWeeklyBuckets(chartData);
    const counts = buckets.map((b) => Number(b.count) || 0);
    const total = counts.reduce((s, n) => s + n, 0);
    const activeDays = counts.filter((n) => n > 0).length;
    const bestIdx = counts.reduce((best, n, i) => (n > counts[best] ? i : best), 0);
    const best = { index: counts.some((n) => n > 0) ? bestIdx : -1, value: counts[bestIdx] || 0 };
    const goal = 5; // soft weekly goal
    const pct = goal > 0 ? Math.min(1, total / goal) : 0;
    return { total, activeDays, best, goal, pct };
  }, [chartData]);

  const renderWeeklyKPI = () => {
    const items = [
      { label: "Workouts", value: String(weeklyStats.total) },
      { label: "Active Days", value: `${weeklyStats.activeDays}/7` },
      {
        label: "Best Day",
        value:
          weeklyStats.best.index >= 0
            ? format(
                addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weeklyStats.best.index),
                "EEE"
              )
            : "—",
      },
    ];

    return (
      <View style={styles.kpiRow}>
        {items.map((it, i) => (
          <View
            key={it.label}
            style={[
              styles.kpiCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              i !== items.length - 1 ? { marginRight: 10 } : { marginRight: 0 },
            ]}
         >
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{it.label}</Text>
            <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{it.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderWeeklyAchievements = () => (
    <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
      Weekly Achievements
    </Text>
  );

  const renderGoalProgress = () => (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Weekly Goal</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {Math.round(weeklyStats.pct * 100)}%
        </Text>
      </View>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.inputBackground, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${weeklyStats.pct * 100}%` },
          ]}
        />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
        {weeklyStats.total} / {weeklyStats.goal} sessions
      </Text>
    </View>
  );

  const renderDayLabels = () => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        {labels.map((l) => (
          <Text
            key={l}
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              width: Math.max(1, (width - 64) / 7),
              textAlign: "center",
            }}
          >
            {l}
          </Text>
        ))}
      </View>
    );
  };

  // Header height constant
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
            paddingTop: 67,
            marginBottom: 0,
          },
        ]}
      >
        <View style={styles.streakBox}>
          <MaterialIcons
            name="local-fire-department"
            size={22}
            color={hasLoggedToday ? "#FF6D00" : "#9E9E9E"} // grey if missed today
          />
          {!hasLoggedToday && streak > 0 && (
            <MaterialIcons
              name="warning"
              size={16}
              color={"#FF6D00"} // grey if missed today
              style={styles.streakWarning}
            />
          )}
          <Text
            style={{
              marginLeft: 5,
              fontWeight: "600",
              color: colors.textPrimary,
              fontSize: 17
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
      <View style={{ flex: 1, marginTop: HEADER_HEIGHT + 10 }}>
        <ScrollView contentContainerStyle={[styles.container]}>
          {/* Existing date carousel */}
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
            contentContainerStyle={[styles.dateStrip, { marginTop: 0, marginBottom: 18 }]}
            renderItem={({ item }) => {
              const dayLabel = format(item, "E");
              const dateNumber = format(item, "d");
              const isSelected = selectedDate && isSameDay(item, selectedDate);
              const isToday = isSameDay(item, new Date());
              const isGreyedOut = !isToday && !isSelected;
              return (
                <TouchableOpacity
                  onPress={() => handleDatePress(item)}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: isSelected ? colors.surface : "transparent",
                      borderColor: isSelected ? colors.border : "transparent",
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

          {renderWeeklyAchievements()}
          {renderWeeklyKPI()}

          {/* Themed weekly chart section */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ marginVertical: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Weekly Activity
              </Text>
              {(() => {
                const buckets = makeWeeklyBuckets(chartData);
                const labels = buckets.map((b) => format(b.date, "EEE"));
                const max = Math.max(1, ...buckets.map((b) => b.count));
                const BAR_MAX_H = 120;

                return (
                  <View style={{ marginTop: 14 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: BAR_MAX_H + 8 }}>
                      {buckets.map((b, i) => {
                        const h = Math.round((b.count / max) * BAR_MAX_H);
                        const has = b.count > 0;
                        return (
                          <View key={i} style={{ alignItems: "center", width: (chartWidth - 32) / 7 }}>
                            <View
                              style={{
                                width: 16,
                                height: BAR_MAX_H,
                                borderRadius: 8,
                                backgroundColor: colors.inputBackground,
                                borderWidth: StyleSheet.hairlineWidth,
                                borderColor: colors.border,
                                justifyContent: "flex-end",
                                overflow: "hidden",
                              }}
                            >
                              <View
                                style={{
                                  height: h,
                                  backgroundColor: colors.accent,
                                  opacity: has ? 0.95 : 0.25,
                                  borderTopLeftRadius: 8,
                                  borderTopRightRadius: 8,
                                }}
                              />
                            </View>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                              {labels[i]}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}
            </View>
            {renderGoalProgress()}
          </View>

          {/* Original date-based summary & inspiration remain (preserved functionality) */}

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

      {/* FAB */}
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
  // New themed chart card
  chartCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  // KPIs
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "stretch",
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "600",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
  },
  chartWrapperCompact: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
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
