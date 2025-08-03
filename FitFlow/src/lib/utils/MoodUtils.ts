export function moodLabel(score: number): string {
  switch (score) {
    case 0:
      return "No mood selected";
    case 1:
      return "Terrible 😞";
    case 2:
      return "Not great 😕";
    case 3:
      return "I'm fine 😐";
    case 4:
      return "Good 🙂";
    case 5:
      return "Amazing 😄";
    default:
      return "Unknown";
  }
}

export const inferMoodFromText = (text: string): number => {
  const lowered = text.toLowerCase();
  if (lowered.includes("depressed") || lowered.includes("hopeless")) return 1;
  if (lowered.includes("tired") || lowered.includes("sad")) return 2;
  if (lowered.includes("okay") || lowered.includes("neutral")) return 3;
  if (lowered.includes("happy") || lowered.includes("motivated")) return 4;
  if (lowered.includes("great") || lowered.includes("excited")) return 5;
  return 3; // Default neutral
};

export const inferTagsFromText = (text: string): string[] => {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("thank") || lower.includes("grateful")) tags.push("Gratitude");
  if (lower.includes("gym") || lower.includes("fitness")) tags.push("Health");
  if (lower.includes("project") || lower.includes("deadline")) tags.push("Work");
  if (lower.includes("goal") || lower.includes("plan")) tags.push("Goals");
  if (lower.includes("friend") || lower.includes("family")) tags.push("Relationships");
  if (lower.includes("idea") || lower.includes("thought")) tags.push("Ideas");
  return tags;
};