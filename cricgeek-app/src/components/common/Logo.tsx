import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /**
   * Variation of the logo:
   * - "horizontal": Uses the official Horizontal Logo PNG from the zip
   * - "icon": Uses the official App icon 1 PNG (dark mode) / App icon 2 PNG (light mode)
   * - "stacked": Uses the official stacked Logo PNG from the zip
   */
  variant?: "horizontal" | "icon" | "stacked";

  /**
   * Theme variation:
   * - "adaptive": Automatically adapts to dark and light mode
   * - "dark": High-contrast dark theme
   * - "light": Light theme
   * - "white": Official white Logo PNG
   */
  theme?: "adaptive" | "dark" | "light" | "white";

  /** Predefined sizes */
  size?: "sm" | "md" | "lg" | "xl" | "custom";

  /** Optional custom dimensions */
  width?: number;
  height?: number;

  /** Optional CSS classes */
  className?: string;

  /** If provided, wraps the logo in a Next.js Link */
  href?: string;

  /** Priority loading for above-the-fold images */
  priority?: boolean;

  /** Optional alternative text */
  alt?: string;
}

export default function Logo({
  variant = "horizontal",
  theme = "adaptive",
  size = "md",
  width,
  height,
  className,
  href,
  priority = true,
  alt = "CricGeek",
}: LogoProps) {
  let content: React.ReactNode = null;

  if (variant === "icon") {
    // Official App Icon from zip (App icon 1.png in darkmode, App icon 2.png in lightmode)
    const iconDim =
      width ??
      (size === "sm" ? 32 : size === "lg" ? 56 : size === "xl" ? 64 : 40);

    const roundedClass =
      size === "lg" || size === "xl" ? "rounded-xl" : "rounded-lg";

    if (theme === "dark") {
      content = (
        <Image
          src="/brand/App icon1.png"
          alt={alt}
          width={iconDim}
          height={iconDim}
          priority={priority}
          className={cn(`${roundedClass} object-contain shrink-0`, className)}
        />
      );
    } else if (theme === "light") {
      content = (
        <Image
          src="/brand/App icon 2.png"
          alt={alt}
          width={iconDim}
          height={iconDim}
          priority={priority}
          className={cn(`${roundedClass} object-contain shrink-0`, className)}
        />
      );
    } else {
      // Adaptive: Mobile darkmode uses App icon 1.png, lightmode uses App icon 2.png
      content = (
        <div
          className={cn("relative shrink-0 flex items-center justify-center", roundedClass, className)}
          style={{ width: iconDim, height: iconDim }}
        >
          <Image
            src="/brand/App icon1.png"
            alt={alt}
            width={iconDim}
            height={iconDim}
            priority={priority}
            className={cn("hidden dark:block w-full h-full object-contain", roundedClass)}
          />
          <Image
            src="/brand/App icon 2.png"
            alt={alt}
            width={iconDim}
            height={iconDim}
            priority={priority}
            className={cn("block dark:hidden w-full h-full object-contain", roundedClass)}
          />
        </div>
      );
    }
  } else if (variant === "stacked") {
    // Official stacked Logo PNG from zip (white Logo PNG.png / Logo Color version 2.png)
    // Aspect ratio: 1913 x 927 (~2.06:1)
    const stackedHeight = height ?? (size === "xl" ? 78 : size === "lg" ? 64 : 48);
    const stackedWidth = width ?? Math.round(stackedHeight * 2.06);

    if (theme === "white" || theme === "dark") {
      content = (
        <Image
          src="/brand/white Logo PNG.png"
          alt={alt}
          width={stackedWidth}
          height={stackedHeight}
          priority={priority}
          className={cn("object-contain shrink-0", className)}
        />
      );
    } else if (theme === "light") {
      content = (
        <Image
          src="/brand/Logo Color version 2.png"
          alt={alt}
          width={stackedWidth}
          height={stackedHeight}
          priority={priority}
          className={cn("object-contain shrink-0", className)}
        />
      );
    } else {
      content = (
        <div
          className={cn("relative shrink-0 flex items-center justify-center", className)}
          style={{ width: stackedWidth, height: stackedHeight }}
        >
          <Image
            src="/brand/white Logo PNG.png"
            alt={alt}
            width={stackedWidth}
            height={stackedHeight}
            priority={priority}
            className="hidden dark:block w-full h-full object-contain"
          />
          <Image
            src="/brand/Logo Color version 2.png"
            alt={alt}
            width={stackedWidth}
            height={stackedHeight}
            priority={priority}
            className="block dark:hidden w-full h-full object-contain"
          />
        </div>
      );
    }
  } else {
    // Official Horizontal Logo PNG from zip
    // Aspect ratio: 2513 x 406 (~6.19:1)
    // Sized to fit navbar perfectly without squeezing: height 24px -> width 148px
    const hDim = height ?? (size === "sm" ? 22 : size === "lg" ? 30 : size === "xl" ? 36 : 24);
    const wDim = width ?? Math.round(hDim * 6.19);

    if (theme === "dark" || theme === "white") {
      content = (
        <Image
          src="/brand/horizontal-logo-dark.png"
          alt={alt}
          width={wDim}
          height={hDim}
          priority={priority}
          className={cn("object-contain shrink-0", className)}
        />
      );
    } else if (theme === "light") {
      content = (
        <Image
          src="/brand/Horizontal Logo.png"
          alt={alt}
          width={wDim}
          height={hDim}
          priority={priority}
          className={cn("object-contain shrink-0", className)}
        />
      );
    } else {
      // Adaptive: Dark mode uses horizontal-logo-dark.png, light mode uses Horizontal Logo.png from zip
      content = (
        <div
          className={cn("relative shrink-0 flex items-center", className)}
          style={{ width: wDim, height: hDim }}
        >
          <Image
            src="/brand/horizontal-logo-dark.png"
            alt={alt}
            width={wDim}
            height={hDim}
            priority={priority}
            className="hidden dark:block w-full h-full object-contain"
          />
          <Image
            src="/brand/Horizontal Logo.png"
            alt={alt}
            width={wDim}
            height={hDim}
            priority={priority}
            className="block dark:hidden w-full h-full object-contain"
          />
        </div>
      );
    }
  }

  if (href) {
    return (
      <Link href={href} className="flex items-center focus:outline-none shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
