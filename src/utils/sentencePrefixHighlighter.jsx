/**
 * Utility for highlighting separable verb prefixes in sentences
 * Only works for separable verbs (prefixType === "SEPARABLE")
 */

export const highlightPrefixInSentence = (word, sentence) => {
  // Only highlight for separable verbs with a prefix
  if (!word || word.prefixType !== "SEPARABLE" || !word.prefix) {
    return sentence;
  }

  const prefix = word.prefix.toLowerCase();
  const prefixLength = prefix.length;

  // Split sentence into words and punctuation
  const parts = sentence.split(/(\s+|[.,!?;:])/);

  const highlightedParts = parts.map((part) => {
    // Only process actual words (not whitespace or punctuation)
    if (part.trim() === "" || /[.,!?;:]/.test(part)) {
      return part;
    }

    const lowerPart = part.toLowerCase();

    // Check if word starts with the prefix
    if (lowerPart.startsWith(prefix)) {
      return (
        <span key={Math.random()}>
          <span className="text-orange-500 font-bold">
            {part.slice(0, prefixLength)}
          </span>
          {part.slice(prefixLength)}
        </span>
      );
    }

    return part;
  });

  return highlightedParts;
};
