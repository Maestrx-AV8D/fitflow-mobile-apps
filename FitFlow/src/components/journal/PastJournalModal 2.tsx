// components/PastJournalModal.tsx
import { supabase } from "@/src/lib/api";
import { useTheme } from "@/src/theme/theme";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Entry {
  id: number;
  content: string;
  created_at: string;
  mood?: number;
  tags?: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tier: "free" | "premium" | "premium+ai";
}

export default function PastJournalModal({ visible, onClose, tier }: Props) {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (visible) {
      handleAccess();
    }
  }, [visible]);

  const handleAccess = async () => {
    if (tier === "free") {
      setAuthenticated(true);
      fetchEntries();
    } else {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        return Alert.alert("Biometrics Required", "Face ID not set up.");
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Journal History",
      });
      if (result.success) {
        setAuthenticated(true);
        fetchEntries();
      } else {
        Alert.alert("Access Denied", "Unable to authenticate.");
        onClose();
      }
    }
  };

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("journal")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Failed to load entries");
      return;
    }
    setEntries(data);
  };

  const renderItem = (entry: Entry) => (
    <View
      key={entry.id}
      style={[styles.entryCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.header}>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date(entry.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
        {entry.mood !== undefined && (
          <Text style={[styles.mood, { color: colors.textSecondary }]}>
            Mood: {entry.mood}/5
          </Text>
        )}
      </View>
      <Text style={[styles.content, { color: colors.textPrimary }]}>
        {entry.content}
      </Text>
      {entry.tags?.length > 0 && (
        <View style={styles.tagRow}>
          {entry.tags.map((tag) => (
            <Text
              key={tag}
              style={[
                styles.tag,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textSecondary,
                },
              ]}
            >
              {tag}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            Past Journal Entries
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ paddingHorizontal: 16 }}>
          {authenticated && entries.map(renderItem)}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
  },
  entryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
  },
  mood: {
    fontSize: 13,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: "500",
  },
});
