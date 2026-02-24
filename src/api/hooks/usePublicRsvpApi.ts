// src/api/hooks/usePublicRsvpApi.ts
// Hooks for the public guest-facing RSVP submission page
import { useQuery, useMutation } from "@tanstack/react-query";
import client from "../client";
import { PublicRsvpEndpoints } from "../endpoints";
import type { RsvpDesign, ApiRsvpDesign } from "../../types/rsvpDesign";
import { mapToFrontendDesign } from "../../utils/rsvpDesignMapper";

/**
 * Fetch RSVP design by share token (no auth required).
 * Tries the backend API first; falls back to the localStorage snapshot
 * that the designer saves when a link is generated (useful for dev/offline).
 */
export function usePublicRsvpDesign(token: string | undefined) {
  return useQuery<RsvpDesign | null>({
    queryKey: ["rsvpDesign", "public", token],
    enabled: !!token,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<RsvpDesign | null> => {
      // 1. Try backend API
      try {
        const res = await client.get(PublicRsvpEndpoints.designByToken(token!));
        const apiData = res.data?.data ?? res.data;
        if (apiData?.design) {
          const design = mapToFrontendDesign(apiData as ApiRsvpDesign) as RsvpDesign;
          // formFieldConfigs are embedded in the design payload
          if (!design.formFieldConfigs && apiData.design?.formFieldConfigs) {
            design.formFieldConfigs = apiData.design.formFieldConfigs;
          }
          return design;
        }
      } catch {
        // API unavailable or 404 — fall through to localStorage
      }

      // 2. localStorage snapshot (created by the designer)
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(`rsvp-share-${token}`);
        if (stored) {
          try {
            const snap = JSON.parse(stored);
            return {
              blocks: snap.blocks ?? [],
              flowPreset: snap.flowPreset ?? "serene",
              globalBackgroundType: snap.global?.backgroundType ?? "color",
              globalBackgroundAsset: snap.global?.backgroundAsset ?? "",
              globalBackgroundColor: snap.global?.backgroundColor ?? "#0f172a",
              globalOverlay: snap.global?.overlay ?? 0.3,
              accentColor: snap.global?.accentColor ?? "#f97316",
              globalMusicUrl: snap.global?.musicUrl ?? undefined,
              eventGuid: snap.eventGuid ?? undefined,
              formFieldConfigs: snap.formFieldConfigs ?? [],
            } as RsvpDesign;
          } catch {
            // Ignore corrupt snapshot
          }
        }
      }

      return null;
    },
  });
}

export interface RsvpSubmitPayload {
  eventId: string;
  guestName: string;
  guestEmail: string;
  /** "Yes" | "No" | "Maybe" — maps to backend status field */
  status: "Yes" | "No" | "Maybe";
  /** Guest category: "Family" | "Friend" | "VIP" | "Other" */
  guestType: string;
  /** Number of guests (pax) attending */
  noOfPax: number;
  /** Phone number */
  phoneNo?: string;
  /** Custom form field answers keyed by questionId */
  answers: Record<string, string | string[]>;
}

/**
 * Submit a guest's RSVP answers.
 */
export function useSubmitPublicRsvp() {
  return useMutation({
    mutationFn: (payload: RsvpSubmitPayload) =>
      client
        .post(PublicRsvpEndpoints.submit(payload.eventId), {
          guestName: payload.guestName,
          guestEmail: payload.guestEmail,
          status: payload.status,
          guestType: payload.guestType,
          noOfPax: payload.noOfPax,
          phoneNo: payload.phoneNo ?? "",
          answers: payload.answers,
          // Also spread answers for backends that expect flat payload
          ...payload.answers,
        })
        .then((r) => r.data),
  });
}
