// Conversation topics are authored as "English title - German title."
// (e.g. "A spontaneous weekend trip - Ein spontaner Wochenendausflug."),
// also accepting an en dash ("–") in place of the hyphen.
// Also accepts a possible future "English title (German title)" format,
// so both are supported without needing another change later.
export const splitConversationTopic = (topic) => {
  const trimmed = (topic || "").trim();

  if (!trimmed) {
    return { english: "", german: null };
  }

  const dashParts = trimmed.split(/\s+[-–]\s+/);
  if (dashParts.length === 2 && dashParts[0].trim() && dashParts[1].trim()) {
    return { english: dashParts[0].trim(), german: dashParts[1].trim() };
  }

  const parenMatch = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return { english: parenMatch[1].trim(), german: parenMatch[2].trim() };
  }

  return { english: trimmed, german: null };
};
