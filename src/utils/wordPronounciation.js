import { getBestGermanVoiceSync } from "./voiceSettings";

// Deliberately synchronous, all the way through — speechSynthesis.speak()
// has to run in the same tick as the click that triggered this, or mobile
// Safari/Chrome silently drop it (it stops counting as a user gesture).
// This used to `await getBestGermanVoice()` before calling speak(), which
// is exactly what broke it: the await handed control back to the browser
// between the click and the actual speak() call, so on a cold voice-list
// load the request got silently dropped — the user saw nothing happen and
// had to click again (by which point the voice list was cached and the
// second click's speak() call, still not gesture-safe in principle, just
// happened to be fast enough to often go through).
export const pronounceWord = (word) => {
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE";

  const preferredVoice = getBestGermanVoiceSync();
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  speechSynthesis.speak(utterance);
};
