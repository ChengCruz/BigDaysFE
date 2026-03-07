// src/utils/backgroundPresets.ts
// Default preset scenery images + merge utility

import type { BackgroundPreset } from "../types/aiBackground";

export const DEFAULT_PRESETS: BackgroundPreset[] = [
  {
    id: "default-garden",
    name: "Garden Romance",
    description: "Lush green garden with blooming flowers",
    category: "outdoor_garden",
    imageUrl: "/presets/garden.jpg",
    promptTemplate: "A beautiful lush garden wedding setting with blooming flowers, elegant arches, and soft natural lighting",
    isDefault: true,
    order: 1,
  },
  {
    id: "default-beach",
    name: "Beach Sunset",
    description: "Sandy beach with golden sunset",
    category: "outdoor_beach",
    imageUrl: "/presets/beach.jpg",
    promptTemplate: "A romantic beach wedding scene at golden hour with gentle waves, white sand, and a warm sunset sky",
    isDefault: true,
    order: 2,
  },
  {
    id: "default-vineyard",
    name: "Vineyard Estate",
    description: "Elegant vineyard with rolling hills",
    category: "outdoor_vineyard",
    imageUrl: "/presets/vineyard.jpg",
    promptTemplate: "An elegant vineyard wedding backdrop with rolling green hills, grapevines, and rustic charm",
    isDefault: true,
    order: 3,
  },
  {
    id: "default-ballroom",
    name: "Grand Ballroom",
    description: "Luxurious ballroom with chandeliers",
    category: "indoor_ballroom",
    imageUrl: "/presets/ballroom.jpg",
    promptTemplate: "A luxurious grand ballroom wedding with crystal chandeliers, marble floors, and elegant drapery",
    isDefault: true,
    order: 4,
  },
  {
    id: "default-church",
    name: "Classic Church",
    description: "Traditional church with stained glass",
    category: "indoor_church",
    imageUrl: "/presets/church.jpg",
    promptTemplate: "A beautiful traditional church interior with stained glass windows, wooden pews, and warm candlelight",
    isDefault: true,
    order: 5,
  },
  {
    id: "default-loft",
    name: "Industrial Loft",
    description: "Modern industrial loft space",
    category: "indoor_loft",
    imageUrl: "/presets/loft.jpg",
    promptTemplate: "A stylish industrial loft wedding venue with exposed brick, string lights, and modern decor",
    isDefault: true,
    order: 6,
  },
  {
    id: "default-rustic",
    name: "Rustic Barn",
    description: "Charming rustic barn setting",
    category: "rustic",
    imageUrl: "/presets/rustic.jpg",
    promptTemplate: "A charming rustic barn wedding with wooden beams, wildflowers, burlap accents, and warm lantern light",
    isDefault: true,
    order: 7,
  },
  {
    id: "default-modern",
    name: "Modern Minimalist",
    description: "Clean modern aesthetic",
    category: "modern",
    imageUrl: "/presets/modern.jpg",
    promptTemplate: "A sleek modern minimalist wedding with clean lines, geometric decor, and a sophisticated palette",
    isDefault: true,
    order: 8,
  },
  {
    id: "default-romantic",
    name: "Romantic Fairytale",
    description: "Dreamy romantic atmosphere",
    category: "romantic",
    imageUrl: "/presets/romantic.jpg",
    promptTemplate: "A dreamy romantic fairytale wedding with soft pink florals, flowing fabrics, and enchanting lighting",
    isDefault: true,
    order: 9,
  },
  {
    id: "default-tropical",
    name: "Tropical Paradise",
    description: "Vibrant tropical destination",
    category: "tropical",
    imageUrl: "/presets/tropical.jpg",
    promptTemplate: "A vibrant tropical paradise wedding with lush palms, exotic flowers, and crystal clear ocean views",
    isDefault: true,
    order: 10,
  },
];

/**
 * Merge backend presets with defaults.
 * Backend presets override defaults by matching ID.
 */
export function mergePresets(
  backendPresets: BackgroundPreset[],
  defaults: BackgroundPreset[] = DEFAULT_PRESETS
): BackgroundPreset[] {
  const backendMap = new Map(backendPresets.map((p) => [p.id, p]));
  const merged = defaults.map((d) => backendMap.get(d.id) ?? d);

  // Add any backend presets not in defaults
  for (const bp of backendPresets) {
    if (!defaults.some((d) => d.id === bp.id)) {
      merged.push(bp);
    }
  }

  return merged.sort((a, b) => a.order - b.order);
}
