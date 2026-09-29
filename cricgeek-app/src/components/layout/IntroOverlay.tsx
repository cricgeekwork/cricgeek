"use client";

import { useEffect, useState } from "react";

/**
 * IntroOverlay — one-time cricket-broadcast-style intro animation.
 *
 * Shown only on the very first visit (sessionStorage flag).
 * Total duration: ~1000ms.
 * Respects prefers-reduced-motion → skips entirely.
 */
export default function IntroOverlay() {
  const [phase, setPhase] = useState<"logo" | "sweep" | "done">("logo");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadyShown = false;
    try {
      alreadyShown = Boolean(sessionStorage.getItem("cg-intro-shown"));
    } catch {
      alreadyShown = true;
    }

    if (reducedMotion || alreadyShown) {
      const skipTimer = window.setTimeout(() => setPhase("done"), 0);
      return () => window.clearTimeout(skipTimer);
    }

    // Phase 1: logo visible for ~500ms
    const sweepTimer = setTimeout(() => setPhase("sweep"), 500);

    // Phase 2: sweep + fade out (~500ms), then done
    const doneTimer = setTimeout(() => {
      setPhase("done");
      try {
        sessionStorage.setItem("cg-intro-shown", "1");
      } catch { /* ignore */ }
    }, 1000);

    return () => {
      clearTimeout(sweepTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-cg-dark transition-opacity duration-500 ${
        phase === "sweep" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Logo */}
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-500 ${
          phase === "logo"
            ? "cg-intro-logo-in"
            : "opacity-0 scale-100"
        }`}
      >
        <div className="w-16 h-16 bg-cg-green rounded-xl flex items-center justify-center cg-intro-glow">
          <span className="text-black font-black text-2xl">CG</span>
        </div>
        <span className="text-white font-bold text-2xl tracking-tight">
          CricGeek
        </span>
      </div>

      {/* Green horizontal sweep line */}
      {phase === "sweep" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="cg-intro-sweep" />
        </div>
      )}
    </div>
  );
}
