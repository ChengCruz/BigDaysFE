// src/utils/rsvpContentWidths.ts
// Single source of truth for the RSVP page's content width.
//
// The width is a REAL PHONE VIEWPORT, not an abstract size: the desktop card is
// sized to a device so what a couple designs is literally what a guest holds.
// Three surfaces must agree on it (the designer canvas, the designer preview
// overlay, and the public guest page), so they all read these values.
//
// The stored keys stay "compact" | "standard" | "wide" for backwards
// compatibility (they're already persisted in saved designs and in the shared
// RsvpDesign type). Only the pixel values and labels changed:
//   compact  384 → 360   standard 512 → 393   wide 672 → 440
//
// `full` (edge-to-edge) is accepted on read for old designs but is NOT
// selectable: full-bleed content was reviewed and rejected. Deleting the cap
// gives guests a ~1376px-wide "Full name" input, and a full-bleed image block at
// 16/7 stands 630px tall. Do not reintroduce it.

/** Selectable widths. */
export type ContentWidthKey = "compact" | "standard" | "wide";

/** What may arrive from a saved design; includes the retired "full". */
export type StoredContentWidth = ContentWidthKey | "full";

export const DEFAULT_CONTENT_WIDTH: ContentWidthKey = "standard";

export interface ContentWidthOption {
  key: ContentWidthKey;
  /** CSS viewport width in px. */
  px: number;
  /**
   * Desktop-only max-width. The `sm:` prefix is load-bearing: below Tailwind's
   * 640px breakpoint the card must stay fluid so a 440px handset uses all 440px
   * instead of getting a 393px column with dead space either side.
   * Written as literals so Tailwind's scanner can see them.
   */
  cardClass: string;
  device: string;
  hint: string;
}

export const CONTENT_WIDTHS: Record<ContentWidthKey, ContentWidthOption> = {
  compact: {
    key: "compact",
    px: 360,
    cardClass: "sm:max-w-[360px]",
    device: "Android",
    hint: "Galaxy A · narrow floor",
  },
  standard: {
    key: "standard",
    px: 393,
    cardClass: "sm:max-w-[393px]",
    device: "iPhone 15/16",
    hint: "Pixel 8 · most common",
  },
  wide: {
    key: "wide",
    px: 440,
    cardClass: "sm:max-w-[440px]",
    device: "iPhone Pro Max",
    hint: "widest iPhone",
  },
};

export const CONTENT_WIDTH_ORDER: ContentWidthKey[] = ["compact", "standard", "wide"];

/** Coerce anything stored (including the retired "full") to a selectable key. */
export function normalizeContentWidth(value?: string | null): ContentWidthKey {
  if (value === "compact" || value === "standard" || value === "wide") return value;
  return DEFAULT_CONTENT_WIDTH;
}

export function contentWidthOption(value?: string | null): ContentWidthOption {
  return CONTENT_WIDTHS[normalizeContentWidth(value)];
}

export function contentWidthPx(value?: string | null): number {
  return contentWidthOption(value).px;
}

export function contentWidthClass(value?: string | null): string {
  return contentWidthOption(value).cardClass;
}

// ─── Persistence bridge ──────────────────────────────────────────────────────
// The backend theme DTO doesn't keep contentWidth, so the mapper smuggles it out
// as a pixel number in `layout.width`. Encode with the current px values; decode
// accepts the legacy numbers too so designs saved before this change still open.

export function contentWidthToLayoutPx(value?: string | null): number {
  return contentWidthPx(value);
}

const LAYOUT_PX_TO_KEY: Record<number, ContentWidthKey> = {
  // current
  360: "compact",
  393: "standard",
  440: "wide",
  // legacy, pre-device widths
  384: "compact",
  512: "standard",
  672: "wide",
};

/**
 * Returns undefined when there's nothing meaningful stored (0 was the old
 * encoding for "full"), letting the caller fall back to the default.
 */
export function contentWidthFromLayoutPx(px?: number | null): ContentWidthKey | undefined {
  if (!px) return undefined;
  return LAYOUT_PX_TO_KEY[px];
}
