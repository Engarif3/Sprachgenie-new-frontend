export const setToLocalStorage = (key, data) => {
  if (!key || typeof window === "undefined") {
    return "";
  }

  // Stringify data if it's an object/array
  const value = typeof data === "object" ? JSON.stringify(data) : data;
  return localStorage.setItem(key, value);
};

export const getFromLocalStorage = (key) => {
  if (!key || typeof window === "undefined") {
    return "";
  }

  const value = localStorage.getItem(key);
  
  // Try to parse as JSON, return as is if it fails
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const removeFromLocalStorage = (key) => {
  if (!key || typeof window === "undefined") {
    return "";
  }

  return localStorage.removeItem(key);
};