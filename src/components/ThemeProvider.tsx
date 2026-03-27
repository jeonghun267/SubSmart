"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("subsmart-theme") as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function resolve() {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(theme);
      }
    }

    resolve();
    mediaQuery.addEventListener("change", resolve);
    return () => mediaQuery.removeEventListener("change", resolve);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.style.colorScheme = "dark";
      root.classList.add("dark");
    } else {
      root.style.colorScheme = "light";
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("subsmart-theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
