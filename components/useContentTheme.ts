"use client";

import { useEffect, useState } from "react";

export type ContentTheme = "world" | "corporations";
const STORAGE_KEY = "brandos-content-theme";

// Shared across the whole platform: reads/writes the same data-content-theme
// attribute + localStorage key that Chat's TopBar and LoginScreen use, so
// toggling here (or there) stays in sync everywhere.
export function useContentTheme(): [ContentTheme, () => void] {
  const [theme, setTheme] = useState<ContentTheme>("corporations");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-content-theme") as ContentTheme) || "world";
    setTheme(current);
  }, []);

  function toggle() {
    const next: ContentTheme = theme === "world" ? "corporations" : "world";
    document.documentElement.setAttribute("data-content-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  return [theme, toggle];
}
