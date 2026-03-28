import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "app-theme";
const themes = ["night", "light", "purple", "turquoise"];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || "night");

  useEffect(() => {
    const normalizedTheme = themes.includes(theme) ? theme : "night";
    document.documentElement.dataset.theme = normalizedTheme;
    localStorage.setItem(STORAGE_KEY, normalizedTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themes, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
