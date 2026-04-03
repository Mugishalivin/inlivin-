import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyAppearancePreference, getStoredAppearancePreference, getStoredThemePreference, resolveThemePreference } from "@/lib/theme";

if (typeof window !== "undefined") {
  const preference = getStoredThemePreference();
  document.documentElement.classList.toggle("dark", resolveThemePreference(preference) === "dark");
  applyAppearancePreference(getStoredAppearancePreference());
}

createRoot(document.getElementById("root")!).render(<App />);
