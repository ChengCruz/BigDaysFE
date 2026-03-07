// src/utils/aiBackgroundMapper.ts
// Data transformation utilities for AI Background feature

import type {
  ApiAiBackground,
  ApiBackgroundPreset,
  AiBackground,
  BackgroundPreset,
  GenerationStatus,
  BackgroundCategory,
} from "../types/aiBackground";

/**
 * Map backend background to frontend format
 */
export function mapApiBackground(api: ApiAiBackground): AiBackground {
  return {
    id: api.backgroundGuid,
    eventId: api.eventGuid,
    prompt: api.prompt,
    imageUrl: api.imageUrl,
    thumbnailUrl: api.thumbnailUrl,
    category: api.category as BackgroundCategory | undefined,
    status: api.status.toLowerCase() as GenerationStatus,
    errorMessage: api.errorMessage,
    createdDate: api.createdDate,
  };
}

/**
 * Map backend preset to frontend format
 */
export function mapApiPreset(api: ApiBackgroundPreset): BackgroundPreset {
  return {
    id: api.presetId,
    name: api.name,
    description: api.description,
    category: api.category as BackgroundCategory,
    imageUrl: api.imageUrl,
    thumbnailUrl: api.thumbnailUrl,
    promptTemplate: api.promptTemplate,
    isDefault: api.isDefault,
    order: api.order ?? 0,
  };
}
