// src/api/hooks/useRsvpDesignApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { RsvpDesignEndpoints } from "../endpoints";
import type {
  ApiRsvpDesign,
  ApiRsvpDesignResponse,
  RsvpDesign,
} from "../../types/rsvpDesign";
import { mapToBackendPayload, mapToFrontendDesign } from "../../utils/rsvpDesignMapper";

/**
 * Fetch RSVP Design for an event
 * Returns the design data transformed to frontend format
 */
export function useRsvpDesign(eventGuid: string) {
  return useQuery<Partial<RsvpDesign> | null>({
    queryKey: ["rsvpDesign", eventGuid],
    queryFn: async () => {
      try {
        const response = await client.get(RsvpDesignEndpoints.get(eventGuid));
        
        // Handle wrapped response format: { success, message, data }
        const apiResponse = response.data?.data ?? response.data;
        
        // If no design exists yet, return null
        if (!apiResponse || !apiResponse.design) {
          return null;
        }

        // Transform backend API response to frontend format
        return mapToFrontendDesign(apiResponse as ApiRsvpDesign);
      } catch (error: any) {
        // If 404, design doesn't exist yet - return null instead of error
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(eventGuid),
    staleTime: 5 * 60_000, // Cache for 5 minutes
  });
}

/**
 * Save or update RSVP Design
 * Accepts frontend design state and transforms it to backend payload
 */
export function useSaveRsvpDesign(eventGuid: string) {
  const qc = useQueryClient();

  return useMutation<
    ApiRsvpDesignResponse,
    Error,
    {
      design: RsvpDesign;
      isPublished?: boolean;
      isDraft?: boolean;
      shareToken?: string | null;
      publicLink?: string | null;
    }
  >({
    mutationFn: async ({ design, isPublished = false, isDraft = true, shareToken, publicLink }) => {
      // Transform frontend design to backend payload
      const payload = mapToBackendPayload(
        design,
        eventGuid,
        shareToken,
        publicLink,
        isPublished,
        isDraft
      );

      const response = await client.post(
        RsvpDesignEndpoints.save(eventGuid),
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the design data
      qc.invalidateQueries({ queryKey: ["rsvpDesign", eventGuid] });
      qc.refetchQueries({ queryKey: ["rsvpDesign", eventGuid] });
    },
  });
}

/**
 * Publish RSVP Design (mark as published)
 * Requires the version number from the latest saved design
 */
export function usePublishRsvpDesign(eventGuid: string) {
  const qc = useQueryClient();

  return useMutation<ApiRsvpDesignResponse, Error, { version: number }>({
    mutationFn: async ({ version }) => {
      const response = await client.put(
        RsvpDesignEndpoints.publish(eventGuid, version),
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rsvpDesign", eventGuid] });
      qc.refetchQueries({ queryKey: ["rsvpDesign", eventGuid] });
    },
  });
}


/**
 * Helper hook to check if design has been saved
 */
export function useHasRsvpDesign(eventGuid: string) {
  const { data, isLoading } = useRsvpDesign(eventGuid);
  
  return {
    hasDesign: data !== null,
    isLoading,
  };
}
