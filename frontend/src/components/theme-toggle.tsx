"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-default hover:bg-surface-container-low transition-colors cursor-pointer" aria-label="Toggle theme">
        <Moon className="size-4 text-secondary" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      className="p-2 rounded-default hover:bg-surface-container-low transition-colors cursor-pointer"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="size-4 text-secondary" />
      ) : (
        <Moon className="size-4 text-secondary" />
      )}
    </button>
  );
}
