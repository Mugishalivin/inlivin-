import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyAppearancePreference, getStoredAppearancePreference, getStoredThemePreference, resolveThemePreference } from "@/lib/theme";
import { initializeStorageBuckets } from "@/lib/storage-init";

if (typeof window !== "undefined") {
  const preference = getStoredThemePreference();
  document.documentElement.classList.toggle("dark", resolveThemePreference(preference) === "dark");
  applyAppearancePreference(getStoredAppearancePreference());
  
  // Initialize storage buckets on app load
  initializeStorageBuckets().catch(err => {
    console.warn("Storage bucket initialization warning:", err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
