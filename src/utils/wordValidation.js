import Swal from "sweetalert2";
import api from "../axios";

/**
 * Constants for default values when creating non-existent words
 */
export const DEFAULT_WORD_VALUES = {
  LEVEL_ID: 2, // A2 level
  LEVEL_NAME: "A2",
  TOPIC_ID: 1, // Miscellaneous topic
  TOPIC_NAME: "Miscellaneous",
  PART_OF_SPEECH_ID: 3, // unknown part of speech
  PART_OF_SPEECH_NAME: "unknown",
};

/**
 * Checks if a word exists in the database
 * @param {string} wordValue - The word to check
 * @returns {Promise<boolean>} - True if word exists, false otherwise
 */
export const checkWordExists = async (wordValue) => {
  if (!wordValue || typeof wordValue !== "string") {
    return false;
  }

  const trimmedWord = wordValue.trim();
  if (!trimmedWord) {
    return false;
  }

  try {
    const response = await api.get(`/word/${encodeURIComponent(trimmedWord)}`);
    return response.data?.data?.id ? true : false;
  } catch (error) {
    // If 404, word doesn't exist
    if (error.response?.status === 404) {
      return false;
    }
    // For other errors, log and assume word doesn't exist to be safe
    console.error("Error checking word existence:", error);
    return false;
  }
};

/**
 * Checks multiple words for existence
 * @param {string[]} words - Array of words to check
 * @returns {Promise<{existing: string[], nonExisting: string[]}>}
 */
export const checkMultipleWordsExistence = async (words) => {
  if (!Array.isArray(words) || words.length === 0) {
    return { existing: [], nonExisting: [] };
  }

  const uniqueWords = [...new Set(words.map((w) => w.trim()).filter(Boolean))];

  const results = await Promise.all(
    uniqueWords.map(async (word) => ({
      word,
      exists: await checkWordExists(word),
    })),
  );

  return {
    existing: results.filter((r) => r.exists).map((r) => r.word),
    nonExisting: results.filter((r) => !r.exists).map((r) => r.word),
  };
};

/**
 * Shows a confirmation dialog for non-existent words
 * @param {string[]} nonExistingWords - Array of words that don't exist
 * @param {string} fieldLabel - Label for the field (e.g., "synonyms", "antonyms")
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
export const showNonExistentWordConfirmation = async (
  nonExistingWords,
  fieldLabel = "related words",
) => {
  if (!Array.isArray(nonExistingWords) || nonExistingWords.length === 0) {
    return true;
  }

  const wordsList = nonExistingWords
    .map((word) => `<strong>"${word}"</strong>`)
    .join(", ");

  const result = await Swal.fire({
    title: "Words Not Found",
    html: `
      <div style="text-align: left;">
        <p>The following ${fieldLabel} do not exist in the database:</p>
        <p style="margin: 10px 0; color: #dc2626;">${wordsList}</p>
        <p style="margin-top: 15px;">If you proceed, these words will be created automatically with default values:</p>
        <ul style="text-align: left; margin: 10px 0 10px 20px; color: #666;">
          <li>Level: <strong>${DEFAULT_WORD_VALUES.LEVEL_NAME}</strong></li>
          <li>Topic: <strong>${DEFAULT_WORD_VALUES.TOPIC_NAME}</strong></li>
          <li>Part of Speech: <strong>${DEFAULT_WORD_VALUES.PART_OF_SPEECH_NAME}</strong></li>
        </ul>
        <p style="margin-top: 15px; font-weight: bold;">Do you want to proceed?</p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, proceed",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "swal-wide",
    },
  });

  return result.isConfirmed;
};

/**
 * Validates relation words (synonyms, antonyms, similar words) and shows confirmation if needed
 * @param {Object} relations - Object containing synonyms, antonyms, and similarWords arrays
 * @returns {Promise<{valid: boolean, nonExisting: Object}>}
 */
export const validateRelationWords = async (relations) => {
  const { synonyms = [], antonyms = [], similarWords = [] } = relations;

  // Collect all unique words from all relation fields
  const allWords = [
    ...new Set([...synonyms, ...antonyms, ...similarWords]),
  ].filter(Boolean);

  if (allWords.length === 0) {
    return { valid: true, nonExisting: {} };
  }

  const { nonExisting } = await checkMultipleWordsExistence(allWords);

  if (nonExisting.length === 0) {
    return { valid: true, nonExisting: {} };
  }

  // Categorize non-existing words by field
  const categorized = {
    synonyms: nonExisting.filter((word) => synonyms.includes(word)),
    antonyms: nonExisting.filter((word) => antonyms.includes(word)),
    similarWords: nonExisting.filter((word) => similarWords.includes(word)),
  };

  // Build a readable label for the confirmation
  const fieldLabels = [];
  if (categorized.synonyms.length > 0) fieldLabels.push("synonyms");
  if (categorized.antonyms.length > 0) fieldLabels.push("antonyms");
  if (categorized.similarWords.length > 0) fieldLabels.push("similar words");

  const fieldLabel = fieldLabels.join(", ");

  const confirmed = await showNonExistentWordConfirmation(
    nonExisting,
    fieldLabel,
  );

  return {
    valid: confirmed,
    nonExisting: confirmed ? categorized : {},
  };
};

/**
 * Validates a single relation field and shows confirmation if needed
 * @param {string[]} words - Array of words to validate
 * @param {string} fieldName - Name of the field (synonyms, antonyms, similarWords)
 * @returns {Promise<boolean>} - True if validation passes or user confirms
 */
export const validateSingleRelationField = async (words, fieldName) => {
  if (!Array.isArray(words) || words.length === 0) {
    return true;
  }

  const { nonExisting } = await checkMultipleWordsExistence(words);

  if (nonExisting.length === 0) {
    return true;
  }

  const fieldLabels = {
    synonyms: "synonyms",
    antonyms: "antonyms",
    similarWords: "similar words",
  };

  return await showNonExistentWordConfirmation(
    nonExisting,
    fieldLabels[fieldName] || "related words",
  );
};
