// Voice settings utility for managing pronunciation preferences

const VOICE_SETTINGS_KEY = "sprachgenie_voice_settings";

/**
 * Get all available German voices from the browser
 * @returns {Promise<SpeechSynthesisVoice[]>} Array of available German voices
 */
export const getAvailableGermanVoices = () => {
  return new Promise((resolve) => {
    const loadVoices = () => {
      const allVoices = speechSynthesis.getVoices();
      const germanVoices = allVoices.filter(
        (voice) => voice.lang.startsWith("de-") || voice.lang.startsWith("de_"),
      );

      // If we found voices, resolve immediately
      if (germanVoices.length > 0) {
        resolve(germanVoices);
        return;
      }

      // If no German voices but voices are loaded, still resolve
      if (allVoices.length > 0) {
        resolve(germanVoices);
        return;
      }
    };

    // Try to get voices immediately
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      loadVoices();
    } else {
      // Wait for voiceschanged event with a timeout
      let timeout;
      const handleVoicesChanged = () => {
        clearTimeout(timeout);
        loadVoices();
      };

      speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged, {
        once: true,
      });

      // Fallback timeout in case voiceschanged never fires
      timeout = setTimeout(() => {
        speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged,
        );
        loadVoices();
      }, 1000);
    }
  });
};

/**
 * Get the saved voice preference from localStorage
 * @returns {Object|null} Saved voice settings or null
 */
export const getSavedVoiceSettings = () => {
  try {
    const saved = localStorage.getItem(VOICE_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Failed to load voice settings:", error);
    return null;
  }
};

/**
 * Save voice preference to localStorage
 * @param {Object} voiceSettings - Voice settings to save
 * @param {string} voiceSettings.name - Voice name
 * @param {string} voiceSettings.lang - Voice language
 */
export const saveVoiceSettings = (voiceSettings) => {
  try {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
  } catch (error) {
    console.error("Failed to save voice settings:", error);
  }
};

/**
 * Get the best available German voice
 * Prioritizes: 1) Saved preference, 2) Google voices, 3) Any German voice
 * @returns {Promise<SpeechSynthesisVoice|null>}
 */
export const getBestGermanVoice = async () => {
  const voices = await getAvailableGermanVoices();

  if (voices.length === 0) {
    return null;
  }

  // Check for saved preference
  const savedSettings = getSavedVoiceSettings();
  if (savedSettings) {
    const savedVoice = voices.find(
      (voice) =>
        voice.name === savedSettings.name && voice.lang === savedSettings.lang,
    );
    if (savedVoice) {
      return savedVoice;
    }
  }

  // Prioritize Google voices (usually highest quality)
  const googleVoice = voices.find((voice) =>
    voice.name.toLowerCase().includes("google"),
  );
  if (googleVoice) {
    return googleVoice;
  }

  // Prioritize female voices (often clearer for language learning)
  const femaleVoice = voices.find(
    (voice) =>
      voice.name.toLowerCase().includes("female") ||
      voice.name.toLowerCase().includes("anna") ||
      voice.name.toLowerCase().includes("hedda") ||
      voice.name.toLowerCase().includes("katja"),
  );
  if (femaleVoice) {
    return femaleVoice;
  }

  // Return first German voice as fallback
  return voices[0];
};

/**
 * Get voice by name and language
 * @param {string} name - Voice name
 * @param {string} lang - Voice language
 * @returns {Promise<SpeechSynthesisVoice|null>}
 */
export const getVoiceByNameAndLang = async (name, lang) => {
  const voices = await getAvailableGermanVoices();
  return (
    voices.find((voice) => voice.name === name && voice.lang === lang) || null
  );
};
