import React from "react";

type LogoTone = "auto" | "full" | "dark" | "light";

interface BrandLogoProps {
  /** Rendered height in px (width scales automatically). */
  height?: number | string;
  /**
   * Color treatment:
   * - `full`  — full-color logo (rose + gold)
   * - `dark`  — single-color ink mark, for light surfaces
   * - `light` — single-color cream mark, for dark surfaces
   * - `auto`  — ink in light mode, cream in dark mode (Tailwind `dark:`)
   */
  tone?: LogoTone;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

const SRC = {
  full: "/mybigday-logo.png",
  dark: "/mybigday-logo-dark.png",
  light: "/mybigday-logo-light.png",
} as const;

// Intrinsic size of the trimmed asset — set as width/height attrs so the browser
// reserves the right space before the PNG loads (avoids layout shift).
const INTRINSIC_W = 1401;
const INTRINSIC_H = 1107;

/**
 * App brand logo. Served from /public so the URL stays stable across builds.
 * The PNGs have transparent backgrounds, so they sit cleanly on any surface.
 */
export function BrandLogo({
  height = 48,
  tone = "full",
  className,
  style,
  alt = "My Big Day",
}: BrandLogoProps) {
  const imgStyle: React.CSSProperties = {
    height,
    width: "auto",
    display: "block",
    ...style,
  };

  if (tone === "auto") {
    const cx = (vis: string) => `${vis}${className ? ` ${className}` : ""}`;
    return (
      <>
        <img
          src={SRC.dark}
          alt={alt}
          width={INTRINSIC_W}
          height={INTRINSIC_H}
          className={cx("block dark:hidden")}
          style={imgStyle}
        />
        <img
          src={SRC.light}
          alt=""
          aria-hidden
          width={INTRINSIC_W}
          height={INTRINSIC_H}
          className={cx("hidden dark:block")}
          style={imgStyle}
        />
      </>
    );
  }

  return (
    <img
      src={SRC[tone]}
      alt={alt}
      width={INTRINSIC_W}
      height={INTRINSIC_H}
      className={className}
      style={imgStyle}
    />
  );
}
