// Centralizes how Part-of-Speech names are ordered and capitalized for
// display. The backend stores names lowercase (e.g. "noun", "pronoun") and
// returns them in database id order, which doesn't match the order editors
// want them shown in (pronoun should appear after conjunction, not before
// preposition) — every place that lists POS names sorts through this same
// order instead of trusting API order.
export const PART_OF_SPEECH_DISPLAY_ORDER = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "phrase",
  "pronoun",
  "interjection",
  "numeral",
];

export const capitalizePartOfSpeechName = (name) => {
  const trimmed = String(name ?? "").trim();
  return trimmed
    ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    : trimmed;
};

// Sorts a list by PART_OF_SPEECH_DISPLAY_ORDER, reading each item's name via
// getName (defaults to item.name). Anything not in the canonical list (e.g.
// "unknown") keeps its relative order, appended after everything that is.
export const sortByPartOfSpeechDisplayOrder = (
  list,
  getName = (item) => item?.name,
) =>
  [...list].sort((a, b) => {
    const indexA = PART_OF_SPEECH_DISPLAY_ORDER.indexOf(
      String(getName(a) ?? "").toLowerCase(),
    );
    const indexB = PART_OF_SPEECH_DISPLAY_ORDER.indexOf(
      String(getName(b) ?? "").toLowerCase(),
    );
    const rankA =
      indexA === -1 ? PART_OF_SPEECH_DISPLAY_ORDER.length : indexA;
    const rankB =
      indexB === -1 ? PART_OF_SPEECH_DISPLAY_ORDER.length : indexB;
    return rankA - rankB;
  });
