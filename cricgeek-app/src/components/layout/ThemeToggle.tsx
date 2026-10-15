"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "relative inline-flex h-8 w-[3.25rem] shrink-0 cursor-pointer items-center",
        "rounded-full border transition-colors duration-300 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-cg-green focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[var(--bg-base)]",
        isDark
          ? "border-gray-600 bg-gray-700/80"
          : "border-[#DAD7C9] bg-[#1E3B2E]",
      ].join(" ")}
    >
      {/* Track icons */}
      <span
        className={[
          "absolute left-1.5 flex h-4 w-4 items-center justify-center transition-opacity duration-300",
          isDark ? "opacity-70" : "opacity-0",
        ].join(" ")}
        aria-hidden="true"
      >
        <Moon size={11} className="text-cg-green" />
      </span>

      <span
        className={[
          "absolute right-1.5 flex h-4 w-4 items-center justify-center transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-70",
        ].join(" ")}
        aria-hidden="true"
      >
        <Sun size={11} className="text-[#F6F4EA]" />
      </span>

      {/* Thumb */}
      <span
        className={[
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md",
          "transition-all duration-300",
          isDark
            ? "translate-x-0.5 bg-gray-900"
            : "translate-x-[1.625rem] bg-[#44705A]",
        ].join(" ")}
        aria-hidden="true"
      >
        {isDark ? (
          <Moon size={13} className="text-cg-green" />
        ) : (
          <Sun size={13} className="text-[#F3F1E8]" />
        )}
      </span>
    </button>
  );
}
