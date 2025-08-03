


import { generateAIInsights, summarizeMoodAndTags, supabase } from "@/src/lib/api";
import { inferMoodFromText, inferTagsFromText, moodLabel } from "@/src/lib/utils/MoodUtils";
import { useTheme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userGoals: string;
  refreshDashboard: () => void;
}

export default function AIChatModal({ visible, onClose, userName, userGoals, refreshDashboard }: AIChatModalProps) {
  const { colors, typography } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(30 * 60);
  const [isTyping, setIsTyping] = useState(false);
  const [typingDotCount, setTypingDotCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMood, setPreviewMood] = useState<number | null>(null);
  const [previewTags, setPreviewTags] = useState<string[]>([]);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMessages([
      {
        role: "ai",
        content: `Welcome back ${userName}. I'll be guiding your reflection today based on your goal: "${userGoals}". Feel free to share your thoughts.`,
      },
    ]);
    setInput("");
    setTimer(30 * 60);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSessionComplete();
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (!isTyping) return;
    const dots = setInterval(() => {
      setTypingDotCount((count) => (count + 1) % 4);
    }, 500);
    return () => clearInterval(dots);
  }, [isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const aiResponse = await generateAIInsights(input.trim(), userName, userGoals);
      setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, something went wrong." }]);
    }

    setIsTyping(false);
  };

  const handleSessionComplete = async () => {
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 0) {
      onClose();
      return;
    }

    const combinedText = messages.map((m) => m.content).join("\n");
    const inferredMood = inferMoodFromText(combinedText);
    const inferredTags = inferTagsFromText(combinedText);
    const summary = await summarizeMoodAndTags(messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`));

    setPreviewMood(inferredMood);
    setPreviewTags(inferredTags);
    setSummaryText(summary);
    setShowPreview(true);
  };

  const savePreviewedEntry = async () => {
    const combinedText = messages.map((m) => m.content).join("\n");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      console.warn("No user found");
      setShowPreview(false);
      onClose();
      return;
    }

    const { error: insertError } = await supabase.from("journal").insert({
      content: combinedText,
      mood: previewMood,
      tags: previewTags,
      user_id: user.id,
    });

    if (!insertError) {
      await supabase.from("journal_summary").insert({
        user_id: user.id,
        summary: summaryText,
        mood: previewMood,
        tags: previewTags,
      });
    }

    if (insertError) {
      console.warn("Error saving journal entry:", insertError);
    } else {
      Alert.alert("Reflection Saved", "Your mood, tags, and summary have been recorded.");
    }

    setShowPreview(false);
    onClose();
    refreshDashboard();
  };


  const formatTimer = (t: number) => {
    const min = Math.floor(t / 60).toString().padStart(2, "0");
    const sec = (t % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const getInitial = (role: "user" | "ai") => (role === "user" ? "U" : "AI");

  return (
    <Modal visible={visible} onRequestClose={onClose} >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          <View style={styles.header}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Reflect with Lara</Text>
            <Text style={{ color: colors.textSecondary }}>Session ends in {formatTimer(timer)}</Text>
          </View>

          <FlatList
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ paddingBottom: 80, paddingTop: 10 }}
            renderItem={({ item }) => (
              <View style={[styles.messageRow, { alignSelf: item.role === "user" ? "flex-end" : "flex-start"}]}>  
                <View style={styles.initialCircle}>
                  <Text style={styles.initialText}>{getInitial(item.role)}</Text>
                </View>
                <View
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor:
                        item.role === "user" ? colors.warning : colors.success,
                    },
                  ]}
                >
                  <Text style={{ color: item.role === "user" ? "#fff" : colors.textPrimary }}>{item.content}</Text>
                </View>
              </View>
            )}
          />

          {isTyping && (
            <View style={styles.messageRow}>
              <View style={styles.initialCircle}><Text style={styles.initialText}>AI</Text></View>
              <View style={[styles.messageBubble, { backgroundColor: colors.inputBackground }]}>
                <Text style={{ color: colors.textPrimary }}>{"AI is typing" + ".".repeat(typingDotCount)}</Text>
              </View>
            </View>
          )}

          <View style={[styles.inputRow, { backgroundColor: colors.textSecondary }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your reflection..."
              placeholderTextColor={colors.primary}
              style={[styles.input, { color: colors.textPrimary }]}
              multiline
            />
            <TouchableOpacity onPress={sendMessage}>
              <MaterialIcons name="send" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSessionComplete} style={styles.endButton}>
            <MaterialIcons name="logout" size={28} color={colors.error} />
          </TouchableOpacity>

          <Modal visible={showPreview} transparent animationType="fade">
            <View style={styles.previewOverlay}>
              <View style={[styles.previewBox, { backgroundColor: colors.card }]}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>Before we save...</Text>
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>
                  Mood: {previewMood} — {moodLabel(previewMood || 0)}
                </Text>
                <Text style={{ marginTop: 4, color: colors.textSecondary }}>Tags:</Text>
                <View style={styles.tagRow}>
                  {previewTags.map((tag) => (
                    <Text
                      key={tag}
                      style={[styles.tag, { backgroundColor: colors.inputBackground }]}
                    >
                      {tag}
                    </Text>
                  ))}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                  <TouchableOpacity onPress={() => setShowPreview(false)}>
                    <Text style={{ color: colors.error }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={savePreviewedEntry}>
                    <Text style={{ color: colors.primary, fontWeight: "bold" }}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 100 },
  header: { marginBottom: 10, marginTop: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderRadius:30,
    borderColor: "rgba(206, 177, 48, 0.85)",
    width: "100%",
    marginBottom: 10
  },
  input: { flex: 1, fontSize: 16,  maxHeight: 300 },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "80%",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  initialCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  initialText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  endButton: { position: "absolute", top: 16, right: 16 },
  previewOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  previewBox: {
    width: "85%",
    padding: 20,
    borderRadius: 16,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: "500",
    marginRight: 6,
  },
});
