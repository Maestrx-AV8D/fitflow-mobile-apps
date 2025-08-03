// components/JournalInputCard.tsx
import { supabase } from "@/src/lib/api";
import { moodLabel } from "@/src/lib/utils/MoodUtils";
import { useTheme } from "@/src/theme/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";



const TAG_OPTIONS = ["Gratitude", "Work", "Goals", "Health", "Relationships", "Ideas"];

export default function JournalInputCard({ onStartAI }: { onStartAI: () => void }) {
  const { colors } = useTheme();
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [userTier, setUserTier] = useState<"free" | "premium" | "premium+ai">("free");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("tier").eq("id", user?.id).single();
      setUserTier(data?.tier || "free");
    })();
  }, []);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setSaved(false);
  };

  const saveEntry = async () => {
    if (!entry.trim() && mood === 0 && tags.length === 0) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) return Alert.alert("Error", "User not found.");

    const { error } = await supabase.from("journal").insert({
      content: entry,
      mood,
      tags,
      user_id: user.id,
    });
    if (error) return Alert.alert("Failed to save entry");

    setEntry("");
    setMood(0);
    setTags([]);
    setSaved(true);
  };

  const isValid = entry.trim() !== "" || mood > 0 || tags.length > 0;

  const handleAI = () => {
    //if (userTier !== "premium+ai") return Alert.alert("Upgrade", "This feature is for Premium+AI users.");
    onStartAI();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>      
      <TextInput
        value={entry}
        onChangeText={(text) => { setEntry(text); setSaved(false); }}
        placeholder="Write something..."
        placeholderTextColor={colors.textSecondary}
        multiline
        style={[styles.input, { color: colors.textPrimary }]}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Mood</Text>
      <Slider
        style={{ width: "100%", height: 32 }}
        minimumValue={0}
        maximumValue={5}
        step={1}
        value={mood}
        onValueChange={(v) => { setMood(v); setSaved(false); }}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
      />
      <Text style={{ textAlign: "center", color: colors.textPrimary, marginBottom: 25 }}>{moodLabel(mood)}</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Tags</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {TAG_OPTIONS.map((tag) => {
          const selected = tags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[styles.tag, {
                backgroundColor: selected ? colors.primary : colors.inputBackground,
                marginRight: 8,
              }]}
            >
              <Text style={{ color: selected ? colors.surface : colors.textSecondary }}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: "row", marginTop: 20, justifyContent: 'flex-end' }}>
      <TouchableOpacity
        // disabled={userTier !== "premium+ai"}
        onPress={handleAI}
        style={[styles.iconButton, {
          backgroundColor: userTier !== "premium+ai" ? colors.warning : colors.success,
        }]}
      >
        {/* <Text style={{ color: colors.surface }}>Reflect with AI</Text> */}
        <Ionicons name="sparkles" size={24} color={colors.primary} />
      </TouchableOpacity>

      {saved ? (
        <Text style={{ color: colors.success, marginTop: 8 }}>✓ Saved</Text>
      ) : (
        <TouchableOpacity
          onPress={saveEntry}
          disabled={!isValid}
          style={[styles.saveButton, {
            backgroundColor: isValid ? colors.success : colors.border,
          }]}
        >
          {/* <Text style={{ color: colors.surface }}>Save Entry</Text> */}
          <MaterialIcons name="check" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View></View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: 16, borderRadius: 16, marginVertical: 20 },
  input: { minHeight: 100, fontSize: 18, marginBottom: 60 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 6 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontSize: 12, fontWeight: "500" },
  saveButton: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  iconButton: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
});
