export const countWords = (text) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
