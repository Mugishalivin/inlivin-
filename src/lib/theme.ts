export type ThemePreference = "light" | "dark" | "system";
export type ThemeAccent = "sunset" | "ocean" | "forest" | "midnight";
export type FeedDensity = "comfortable" | "compact" | "dense";

export type AppearancePreference = {
  themeAccent?: ThemeAccent;
  feedDensity?: FeedDensity;
  reducedMotion?: boolean;
  largeText?: boolean;
  highContrastMode?: boolean;
  compactMode?: boolean;
  sidebarMode?: string;
};

export const THEME_STORAGE_KEY = "theme";
export const APPEARANCE_STORAGE_KEY = "appearance";

const ACCENT_PRESETS: Record<ThemeAccent, { primary: string; accent: string }> = {
  sunset: {
    primary: "12 80% 55%",
    accent: "175 60% 38%",
  },
  ocean: {
    primary: "198 88% 48%",
    accent: "184 82% 41%",
  },
  forest: {
    primary: "140 58% 38%",
    accent: "120 38% 36%",
  },
  midnight: {
    primary: "264 84% 62%",
    accent: "199 95% 47%",
  },
};

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredAppearancePreference(): AppearancePreference {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AppearancePreference;
    return parsed ?? {};
  } catch {
    return {};
  }
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
  document.documentElement.style.colorScheme = resolved;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(new Event("themechange"));
  return resolved;
}

export function resetThemePreference() {
  if (typeof window === "undefined") return;
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  window.dispatchEvent(new Event("themechange"));
}

export function applyAppearancePreference(preference: AppearancePreference) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const accent = ACCENT_PRESETS[preference.themeAccent ?? "sunset"] ?? ACCENT_PRESETS.sunset;
  const density = preference.feedDensity ?? (preference.compactMode ? "compact" : "comfortable");

  root.dataset.themeAccent = preference.themeAccent ?? "sunset";
  root.dataset.feedDensity = density;
  root.dataset.largeText = preference.largeText ? "true" : "false";
  root.dataset.highContrast = preference.highContrastMode ? "true" : "false";
  root.dataset.reducedMotion = preference.reducedMotion ? "true" : "false";
  root.dataset.sidebarMode = preference.sidebarMode ?? "auto";
  root.style.setProperty("--primary", accent.primary);
  root.style.setProperty("--ring", accent.primary);
  root.style.setProperty("--accent", accent.accent);
  root.style.setProperty("--sidebar-primary", accent.primary);
  root.style.setProperty("--sidebar-ring", accent.primary);
  root.style.setProperty("--radius", density === "dense" ? "0.45rem" : density === "compact" ? "0.55rem" : "0.625rem");
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({
    themeAccent: preference.themeAccent ?? "sunset",
    feedDensity: density,
    reducedMotion: !!preference.reducedMotion,
    largeText: !!preference.largeText,
    highContrastMode: !!preference.highContrastMode,
    compactMode: !!preference.compactMode,
    sidebarMode: preference.sidebarMode ?? "auto",
  }));
  window.dispatchEvent(new Event("appearancechange"));
}

export function resetAppearancePreference() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.removeAttribute("data-theme-accent");
  root.removeAttribute("data-feed-density");
  root.removeAttribute("data-large-text");
  root.removeAttribute("data-high-contrast");
  root.removeAttribute("data-reduced-motion");
  root.removeAttribute("data-sidebar-mode");
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--sidebar-primary");
  root.style.removeProperty("--sidebar-ring");
  root.style.removeProperty("--radius");
  window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
  window.dispatchEvent(new Event("appearancechange"));
}
