// src/utils/rsvpBackdrops.ts
// Preset backdrops shown behind the phone frame — in the designer preview and on
// the public guest page (desktop only; on mobile the frame is full-bleed).
//
// Lives in utils rather than alongside the panel because both the settings panel
// and rsvpDesignMapper need it, and the mapper must not import a component.
//
// `label` is the persistence key: the backend theme DTO only stores
// `previewBackdropLabel`, so labels must stay stable. Asset paths are free to
// change (they did — the originals were 1920x1080 PNGs averaging 2.4MB each).

export interface BackdropOption {
  label: string;
  /** Full-size asset used as the actual backdrop */
  value: string;
  /** 240x135 asset used in the picker grid; empty for "None" */
  thumb: string;
}

const asset = (name: string) => ({
  value: `/backgrounds/${name}.webp`,
  thumb: `/backgrounds/thumbs/${name}.webp`,
});

export const BACKDROP_OPTIONS: BackdropOption[] = [
  { label: "None",               value: "", thumb: "" },
  { label: "Misty Mountains",    ...asset("bg-01-misty-mountains") },
  { label: "Sumi Mountains",     ...asset("bg-01b-sumi-mountains") },
  { label: "Sunset Mountains",   ...asset("bg-01c-sunset-mountains") },
  { label: "Silk Ribbons",       ...asset("bg-02-silk-ribbons") },
  { label: "Blush Ribbons",      ...asset("bg-02b-blush-ribbons") },
  { label: "Dusty Blue Ribbons", ...asset("bg-02c-dustyblue-ribbons") },
  { label: "Garden",             ...asset("bg-03-garden-bottom") },
  { label: "Lavender Field",     ...asset("bg-03b-lavender-field") },
  { label: "Wildflower Peach",   ...asset("bg-03c-wildflower-peach") },
  { label: "Ocean Horizon",      ...asset("bg-04-ocean-horizon") },
  { label: "Tropical Water",     ...asset("bg-04b-tropical-water") },
  { label: "Golden Hour Coast",  ...asset("bg-04c-goldenhour-coast") },
  { label: "Herbarium",          ...asset("bg-05-herbarium") },
  { label: "Pressed Flowers",    ...asset("bg-05b-pressed-flowers") },
  { label: "Eucalyptus",         ...asset("bg-05c-eucalyptus") },
  { label: "Celestial Midnight", ...asset("bg-06-celestial-midnight") },
  { label: "Celestial Plum",     ...asset("bg-06b-celestial-plum") },
  { label: "Celestial Emerald",  ...asset("bg-06c-celestial-emerald") },
  { label: "Minimal Gold",       ...asset("bg-06-minimal-gold") },
  { label: "Rose Gold Arch",     ...asset("bg-06c-rosegold-arch") },
];

/** Neutral page color behind a preset; plain white when no backdrop is chosen. */
export const backdropColorFor = (imageUrl: string) => (imageUrl ? "#f3f4f6" : "#ffffff");

/**
 * Resolve the persisted `previewBackdropLabel` back to a renderable asset URL.
 * Returns null for an unknown/missing label so callers can fall back cleanly.
 */
export function resolveBackdropLabel(
  label: string | undefined | null
): { previewBackdropImage: string; previewBackdropColor: string } | null {
  if (label == null) return null;
  const match = BACKDROP_OPTIONS.find((o) => o.label === label);
  if (!match) return null;
  return {
    previewBackdropImage: match.value,
    previewBackdropColor: backdropColorFor(match.value),
  };
}
