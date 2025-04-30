// Pronunciation function using Web Speech API
export const pronounceWord = (word) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE"; // German pronunciation
  speechSynthesis.speak(utterance);
};
