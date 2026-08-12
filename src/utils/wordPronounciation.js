import Swal from "sweetalert2";
import { getBestGermanVoiceSync } from "./voiceSettings";

// Chrome bundles a high-quality Google German voice; most other browsers
// fall back to a much weaker system voice. Rather than sniffing the browser
// itself (unreliable — Edge/Opera/Brave all report as "Chrome" in their user
// agent), this checks what actually matters: whether a Google voice was
// actually resolved for this browser. Shown once per tab session (not on
// every click) so it's a helpful nudge, not a nag.
const CHROME_HINT_SESSION_KEY = "sprachgenie_chrome_voice_hint_shown";

const maybeShowChromeVoiceHint = (preferredVoice) => {
  const isGoogleVoice = preferredVoice?.name?.toLowerCase().includes("google");
  if (isGoogleVoice) return;

  try {
    if (sessionStorage.getItem(CHROME_HINT_SESSION_KEY)) return;
    sessionStorage.setItem(CHROME_HINT_SESSION_KEY, "1");
  } catch {
    // Private-browsing storage restrictions etc. — just skip the
    // once-per-session dedupe rather than blocking the hint entirely.
  }

  void Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: "For the best German pronunciation, try Google Chrome",
    showConfirmButton: false,
    timer: 4500,
    timerProgressBar: true,
  });
};

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

  maybeShowChromeVoiceHint(preferredVoice);
};
