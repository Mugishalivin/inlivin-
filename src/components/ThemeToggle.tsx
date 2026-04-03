import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyThemePreference, getStoredThemePreference, resolveThemePreference, type ThemePreference } from "@/lib/theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => resolveThemePreference(getStoredThemePreference()) === "dark");

  useEffect(() => {
    const preference = dark ? "dark" : "light";
    applyThemePreference(preference);
  }, [dark]);

  useEffect(() => {
    const syncTheme = () => {
      const stored = getStoredThemePreference();
      setDark(resolveThemePreference(stored) === "dark");
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themechange", syncTheme as EventListener);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (getStoredThemePreference() === "system") {
        syncTheme();
      }
    };
    media.addEventListener("change", onSystemChange);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themechange", syncTheme as EventListener);
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  return (
    <button
      onClick={() => {
        const next = !dark;
        setDark(next);
        applyThemePreference((next ? "dark" : "light") as ThemePreference);
      }}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
      aria-label="Toggle theme"
    >
      <Sun size={18} className={`absolute transition-all duration-300 ${dark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
      <Moon size={18} className={`absolute transition-all duration-300 ${dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`} />
    </button>
  );
}
