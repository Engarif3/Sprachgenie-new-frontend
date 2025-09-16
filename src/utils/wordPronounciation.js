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

export const pronounceWord = (word) => {
  // Cancel any queued or ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE";
  speechSynthesis.speak(utterance);
};
