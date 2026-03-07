// src/api/hooks/useAiBackgroundApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { AiBackgroundEndpoints } from "../endpoints";
import { mapApiBackground, mapApiPreset } from "../../utils/aiBackgroundMapper";
import { mergePresets, DEFAULT_PRESETS } from "../../utils/backgroundPresets";
import type {
  AiBackground,
  BackgroundPreset,
  ApiAiBackground,
  ApiBackgroundPreset,
  BackgroundCategory,
} from "../../types/aiBackground";

/**
 * List all AI backgrounds for an event
 */
export function useBackgroundsApi(eventId: string) {
  return useQuery<AiBackground[]>({
    queryKey: ["backgrounds", eventId],
    queryFn: async () => {
      const res = await client.get(AiBackgroundEndpoints.all(eventId));
      const list: ApiAiBackground[] = res.data?.data ?? res.data ?? [];
      return list.map(mapApiBackground);
    },
    enabled: Boolean(eventId),
  });
}

/**
 * Get a single AI background by ID
 */
export function useBackgroundApi(id: string) {
  return useQuery<AiBackground | null>({
    queryKey: ["background", id],
    queryFn: async () => {
      const res = await client.get(AiBackgroundEndpoints.byId(id));
      const data: ApiAiBackground | undefined = res.data?.data ?? res.data;
      return data ? mapApiBackground(data) : null;
    },
    enabled: Boolean(id),
  });
}

/**
 * Poll generation status — enabled only while generating
 */
export function useBackgroundStatus(id: string, enabled: boolean) {
  return useQuery<AiBackground | null>({
    queryKey: ["background", id],
    queryFn: async () => {
      const res = await client.get(AiBackgroundEndpoints.status(id));
      const data: ApiAiBackground | undefined = res.data?.data ?? res.data;
      return data ? mapApiBackground(data) : null;
    },
    enabled: Boolean(id) && enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}

/**
 * Fetch presets, merging with local defaults
 */
export function useBackgroundPresets(category?: BackgroundCategory) {
  return useQuery<BackgroundPreset[]>({
    queryKey: ["backgroundPresets", category ?? "all"],
    queryFn: async () => {
      try {
        const url = category
          ? AiBackgroundEndpoints.presetsByCategory(category)
          : AiBackgroundEndpoints.presets;
        const res = await client.get(url);
        const list: ApiBackgroundPreset[] = res.data?.data ?? res.data ?? [];
        return mergePresets(list.map(mapApiPreset));
      } catch {
        // Fallback to defaults if backend unavailable
        return category
          ? DEFAULT_PRESETS.filter((p) => p.category === category)
          : DEFAULT_PRESETS;
      }
    },
  });
}

/**
 * Generate a new AI background (multipart upload)
 */
export function useGenerateBackground() {
  const qc = useQueryClient();

  return useMutation<AiBackground, Error, { photos: File[]; prompt: string; eventGuid: string }>({
    mutationFn: async ({ photos, prompt, eventGuid }) => {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("eventGuid", eventGuid);
      photos.forEach((photo) => formData.append("photos", photo));

      const res = await client.post(AiBackgroundEndpoints.generate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data: ApiAiBackground = res.data?.data ?? res.data;
      return mapApiBackground(data);
    },
    onSuccess: (bg) => {
      qc.invalidateQueries({ queryKey: ["backgrounds", bg.eventId] });
    },
  });
}

/**
 * Delete an AI background
 */
export function useDeleteBackground() {
  const qc = useQueryClient();

  return useMutation<void, Error, { id: string; eventId: string }>({
    mutationFn: async ({ id }) => {
      await client.delete(AiBackgroundEndpoints.delete(id));
    },
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["backgrounds", eventId] });
    },
  });
}
