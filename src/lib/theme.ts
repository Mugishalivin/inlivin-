export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveThemePreference(preference: ThemePreference) {
  if (preference === "system") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return "light";
  const resolved = resolveThemePreference(preference);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(new Event("themechange"));
  return resolved;
}

