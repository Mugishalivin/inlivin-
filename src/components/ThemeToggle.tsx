import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { applyThemePreference, getStoredThemePreference, resolveThemePreference, type ThemePreference } from "@/lib/theme";

export function ThemeToggle() {
  const { authUser } = useAuth();
  const [dark, setDark] = useState(() => resolveThemePreference(getStoredThemePreference()) === "dark");
  const themeMutation = useMutation({
    mutationFn: async (theme_mode: ThemePreference) => {
      if (!authUser) return;
      const { error } = await supabase.from("user_settings").upsert(
        { user_id: authUser.id, theme_mode },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
  });

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
      const preference = (next ? "dark" : "light") as ThemePreference;
      setDark(next);
      applyThemePreference(preference);
      if (authUser) {
        void themeMutation.mutateAsync(preference).catch(() => {});
      }
    }}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
      aria-label="Toggle theme"
    >
      <Sun size={18} className={`absolute transition-all duration-300 ${dark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
      <Moon size={18} className={`absolute transition-all duration-300 ${dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`} />
    </button>
  );
}
