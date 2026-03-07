// src/types/aiBackground.ts
// Type definitions for AI Background Generator feature

/**
 * Category constants
 */
export const CATEGORY_GROUPS: Record<string, BackgroundCategory[]> = {
  Outdoor: ["outdoor_garden", "outdoor_beach", "outdoor_vineyard"],
  Indoor: ["indoor_ballroom", "indoor_church", "indoor_loft"],
  Style: ["rustic", "modern", "romantic", "tropical"],
};

export type BackgroundCategory =
  | "outdoor_garden"
  | "outdoor_beach"
  | "outdoor_vineyard"
  | "indoor_ballroom"
  | "indoor_church"
  | "indoor_loft"
  | "rustic"
  | "modern"
  | "romantic"
  | "tropical";

export const CATEGORY_LABELS: Record<BackgroundCategory, string> = {
  outdoor_garden: "Garden",
  outdoor_beach: "Beach",
  outdoor_vineyard: "Vineyard",
  indoor_ballroom: "Ballroom",
  indoor_church: "Church",
  indoor_loft: "Loft",
  rustic: "Rustic",
  modern: "Modern",
  romantic: "Romantic",
  tropical: "Tropical",
};

export type GenerationStatus = "pending" | "generating" | "completed" | "failed";

/**
 * BACKEND API TYPES (Api prefix)
 */
export interface ApiAiBackground {
  backgroundGuid: string;
  eventGuid: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  status: string; // "Pending" | "Generating" | "Completed" | "Failed"
  errorMessage?: string;
  createdDate: string;
}

export interface ApiBackgroundPreset {
  presetId: string;
  name: string;
  description?: string;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  promptTemplate?: string;
  isDefault: boolean;
  order?: number;
}

/**
 * FRONTEND TYPES (no prefix)
 */
export interface AiBackground {
  id: string;
  eventId: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: BackgroundCategory;
  status: GenerationStatus;
  errorMessage?: string;
  createdDate: string;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  description?: string;
  category: BackgroundCategory;
  imageUrl: string;
  thumbnailUrl?: string;
  promptTemplate?: string;
  isDefault: boolean;
  order: number;
}

export interface GenerationFormState {
  prompt: string;
  photos: File[];
  selectedCategory?: BackgroundCategory;
  selectedPresetId?: string;
}
