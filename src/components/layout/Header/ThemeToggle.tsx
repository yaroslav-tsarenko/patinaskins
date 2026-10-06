"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({ variant = "icon", className }: { variant?: "icon" | "row"; className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  const label = `Switch to ${next} theme`;

  if (variant === "row") {
    return (
      <button type="button" onClick={toggleTheme} className={cn("flex min-h-14 w-full cursor-pointer items-center justify-between text-step-0 text-ink", className)}>
        <span>{theme === "light" ? "Dark theme" : "Light theme"}</span>
        {theme === "light" ? <Moon size={20} aria-hidden="true" /> : <Sun size={20} aria-hidden="true" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn("flex size-8 cursor-pointer items-center justify-center text-ink-muted transition-colors duration-[160ms] hover-device:hover:bg-brand-soft hover-device:hover:text-ink", className)}
    >
      {theme === "light" ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
    </button>
  );
}
