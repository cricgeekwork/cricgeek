"use client";

import { useEffect } from "react";

const AD_SIZES = {
  leaderboard: { width: 1200, height: 90 },
  rectangle: { width: 300, height: 250 },
  "half-page": { width: 300, height: 500 },
  "mobile-banner": { width: 320, height: 50 },
} as const;

type AdSize = keyof typeof AD_SIZES;

interface AdSlotProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  size?: AdSize;
  className?: string;
  /** Homepage placeholders; other pages omit this and keep existing AdSense behavior. */
  placeholder?: boolean;
}

function formatMinHeight(format: AdSlotProps["format"]) {
  if (format === "horizontal") return 90;
  if (format === "rectangle") return 250;
  return 100;
}

function Placeholder({
  width,
  height,
  className,
}: {
  width?: number;
  height: number;
  className: string;
}) {
  const label = width ? `ad  ${width} x ${height}` : `ad  ${height}px`;
  return (
    <div
      className={`box-border bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-base font-medium w-full max-w-full overflow-hidden ${className}`}
      style={{
        width: width ? "100%" : undefined,
        maxWidth: width,
        height,
        minHeight: height,
      }}
      aria-label="Advertisement"
    >
      <span>{label}</span>
    </div>
  );
}

export default function AdSlot({
  slot,
  format = "auto",
  size,
  className = "",
  placeholder = false,
}: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const showPlaceholder = placeholder || !clientId;
  const dims = size ? AD_SIZES[size] : null;

  useEffect(() => {
    if (!clientId || showPlaceholder) return;
    try {
      // @ts-expect-error - adsbygoogle is injected externally
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded
    }
  }, [clientId, showPlaceholder]);

  if (showPlaceholder) {
    return (
      <Placeholder
        width={dims?.width}
        height={dims?.height ?? formatMinHeight(format)}
        className={className}
      />
    );
  }

  return (
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...(dims
            ? { width: "100%", maxWidth: dims.width, height: dims.height }
            : undefined),
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
