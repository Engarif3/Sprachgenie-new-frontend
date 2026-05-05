import { getBestGermanVoice } from "./voiceSettings";

// let canPronounce = true;

// export const pronounceWord = (word) => {
//   if (!canPronounce) return;

//   canPronounce = false;

//   const utterance = new SpeechSynthesisUtterance(word);
//   utterance.lang = "de-DE"; // German pronunciation
//   speechSynthesis.speak(utterance);

//   // Cooldown period (e.g., 500ms)
//   setTimeout(() => {
//     canPronounce = true;
//   }, 900);
// };

export const pronounceWord = async (word) => {
  // Cancel any queued or ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE";

  // Try to get the best/preferred German voice
  try {
    const preferredVoice = await getBestGermanVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  } catch (error) {
    console.warn("Failed to load preferred voice, using default:", error);
  }

  speechSynthesis.speak(utterance);
};
