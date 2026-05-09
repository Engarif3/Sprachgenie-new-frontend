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

  const isSeparator = (value) =>
    value.trim() === "" || /^[.,!?;:]$/.test(value);

  const getNextNonSpaceIndex = (startIndex) => {
    let nextIndex = startIndex + 1;
    while (nextIndex < parts.length && parts[nextIndex].trim() === "") {
      nextIndex += 1;
    }
    return nextIndex;
  };

  const getToken = (index) => {
    if (index < 0 || index >= parts.length) return "";
    return parts[index].trim().toLowerCase();
  };

  const isConjunctionSeparator = (token) =>
    [
      "und",
      "oder",
      "sowie",
      "beziehungsweise",
      "sondern",
      "aber",
      "doch",
    ].includes(token);

  const isClauseEnd = (index) => {
    const nextIndex = getNextNonSpaceIndex(index);
    if (nextIndex >= parts.length) return true;
    const nextToken = getToken(nextIndex);
    return (
      /^[,!?;.]$/.test(parts[nextIndex]) || isConjunctionSeparator(nextToken)
    );
  };

  const isModalAuxiliary = (token) =>
    [
      "kann",
      "kannst",
      "können",
      "könnt",
      "muss",
      "musst",
      "müssen",
      "soll",
      "sollst",
      "sollen",
      "darf",
      "darfst",
      "dürfen",
      "mag",
      "mögen",
      "möchte",
      "will",
      "willst",
      "wollen",
    ].includes(token);

  const isAuxiliary = (token) =>
    [
      "werden",
      "wird",
      "wurden",
      "wurde",
      "werde",
      "worden",
      "sein",
      "bin",
      "bist",
      "ist",
      "sind",
      "seid",
      "war",
      "warst",
      "waren",
      "wart",
      "habe",
      "hast",
      "hat",
      "haben",
      "habt",
      "hatte",
      "hattest",
      "hatten",
      "hattet",
      "würde",
      "würdest",
      "würden",
      "würdet",
      "hätte",
      "hättest",
      "hätten",
      "hättet",
    ].includes(token);

  const isValidAuxiliaryChain = (index) => {
    const nextIndex = getNextNonSpaceIndex(index);
    const nextToken = getToken(nextIndex);
    const nextNextIndex = getNextNonSpaceIndex(nextIndex);
    const nextNextToken = getToken(nextNextIndex);

    if (isAuxiliary(nextToken)) {
      return true;
    }

    if (isModalAuxiliary(nextToken) && isAuxiliary(nextNextToken)) {
      return true;
    }

    return false;
  };

  const highlightedParts = parts.map((part, index) => {
    // Keep whitespace and punctuation unchanged
    if (isSeparator(part)) {
      return part;
    }

    const lowerPart = part.toLowerCase();
    const isEndOfClause = isClauseEnd(index);
    const isAuxChain = isValidAuxiliaryChain(index);

    if ((isEndOfClause || isAuxChain) && lowerPart.startsWith(prefix)) {
      return (
        <span key={`${part}-${index}`}>
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
