import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    // First-time visitors (no stored preference yet) default to dark mode,
    // regardless of their OS/browser color-scheme setting.
    const initial = stored || "dark";

    // Apply dark class immediately
    if (initial === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    return initial;
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    if (theme === "light") root.classList.remove("dark");
    else root.classList.add("dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
