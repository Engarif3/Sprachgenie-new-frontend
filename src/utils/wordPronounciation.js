// Pronunciation function using Web Speech API
// export const pronounceWord = (word) => {
//   const utterance = new SpeechSynthesisUtterance(word);
//   utterance.lang = "de-DE"; // German pronunciation
//   speechSynthesis.speak(utterance);
// };

let canPronounce = true;

export const pronounceWord = (word) => {
  if (!canPronounce) return;

  canPronounce = false;

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE"; // German pronunciation
  speechSynthesis.speak(utterance);

  // Cooldown period (e.g., 500ms)
  setTimeout(() => {
    canPronounce = true;
  }, 900);
};
