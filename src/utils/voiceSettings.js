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

// Shared preference order — Prioritizes: 1) Saved preference, 2) Google
// voices, 3) female voices, 4) whatever's first. Used by both the async,
// wait-for-voiceschanged path (getBestGermanVoice, for non-gesture contexts
// like a settings dropdown) and the synchronous path (getBestGermanVoiceSync,
// for inside a click handler — see the comment there for why this can't
// just always be the async version).
const pickPreferredGermanVoice = (germanVoices) => {
  if (germanVoices.length === 0) {
    return null;
  }

  const savedSettings = getSavedVoiceSettings();
  if (savedSettings) {
    const savedVoice = germanVoices.find(
      (voice) =>
        voice.name === savedSettings.name && voice.lang === savedSettings.lang,
    );
    if (savedVoice) {
      return savedVoice;
    }
  }

  const googleVoice = germanVoices.find((voice) =>
    voice.name.toLowerCase().includes("google"),
  );
  if (googleVoice) {
    return googleVoice;
  }

  const femaleVoice = germanVoices.find(
    (voice) =>
      voice.name.toLowerCase().includes("female") ||
      voice.name.toLowerCase().includes("anna") ||
      voice.name.toLowerCase().includes("hedda") ||
      voice.name.toLowerCase().includes("katja"),
  );
  if (femaleVoice) {
    return femaleVoice;
  }

  return germanVoices[0];
};

/**
 * Get the best available German voice
 * Prioritizes: 1) Saved preference, 2) Google voices, 3) Any German voice
 * @returns {Promise<SpeechSynthesisVoice|null>}
 */
export const getBestGermanVoice = async () => {
  const voices = await getAvailableGermanVoices();
  return pickPreferredGermanVoice(voices);
};

// Synchronous voice pick — deliberately does NOT wait for the
// "voiceschanged" event the way getBestGermanVoice()/getAvailableGermanVoices()
// do. speechSynthesis.speak() has to run in the same synchronous tick as the
// click that triggered it, or mobile Safari/Chrome silently drop it (it no
// longer counts as originating from a user gesture) — that's the "takes
// multiple clicks to hear pronunciation" bug. Any `await` before speak(),
// including waiting for voices to load, breaks that chain. This just uses
// whichever voices speechSynthesis.getVoices() already has cached right
// now; warmUpVoiceList() below is what makes sure that list is usually
// already populated by the time a real click happens.
export const getBestGermanVoiceSync = () => {
  if (typeof speechSynthesis === "undefined") {
    return null;
  }

  const allVoices = speechSynthesis.getVoices();
  const germanVoices = allVoices.filter(
    (voice) => voice.lang.startsWith("de-") || voice.lang.startsWith("de_"),
  );

  return pickPreferredGermanVoice(germanVoices);
};

// Chrome (and some other browsers) only populate speechSynthesis.getVoices()
// asynchronously, and only after it's been called at least once — calling
// it here, once, as soon as this module loads (well before any click can
// happen) gets that population started early instead of waiting for the
// first pronunciation click to discover the list is still empty.
export const warmUpVoiceList = () => {
  if (typeof speechSynthesis === "undefined") {
    return;
  }

  speechSynthesis.getVoices();
};

warmUpVoiceList();

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
