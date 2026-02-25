// src/api/hooks/usePublicRsvpApi.ts
// Hooks for the public guest-facing RSVP submission page
import { useQuery, useMutation } from "@tanstack/react-query";
import client from "../client";
import { PublicRsvpEndpoints, RsvpDesignEndpoints } from "../endpoints";
import type { RsvpDesign, ApiRsvpDesign } from "../../types/rsvpDesign";
import { mapToFrontendDesign } from "../../utils/rsvpDesignMapper";

const TYPE_KEY_MAP: Record<number, string> = {
  0: "text", 1: "textarea", 2: "select", 3: "radio",
  4: "checkbox", 5: "email", 6: "number", 7: "date",
};

/**
 * Fetch RSVP design by share token (no auth required).
 * Tries the backend public endpoint first, then the localStorage snapshot,
 * then the admin design endpoint using eventGuid (only needs apiKey+author headers,
 * no JWT — so external users can load the design cross-device when the link
 * includes ?event={eventGuid}).
 */
export function usePublicRsvpDesign(
  token: string | undefined,
  eventGuid?: string | null,
) {
  return useQuery<RsvpDesign | null>({
    queryKey: ["rsvpDesign", "public", token, eventGuid],
    enabled: !!token || !!eventGuid,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<RsvpDesign | null> => {
      // 1. Try backend public endpoint (token)
      if (token) {
        try {
          const res = await client.get(PublicRsvpEndpoints.designByToken(token));
          const apiData = res.data?.data ?? res.data;
          if (apiData?.design) {
            const design = mapToFrontendDesign(apiData as ApiRsvpDesign) as RsvpDesign;
            if (!design.formFieldConfigs && apiData.design?.formFieldConfigs) {
              design.formFieldConfigs = apiData.design.formFieldConfigs;
            }
            return design;
          }
        } catch {
          // API unavailable or 404 — fall through
        }
      }

      // 2. localStorage snapshot (created by the designer — same-browser fallback)
      if (token && typeof window !== "undefined") {
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
              eventGuid: snap.eventGuid ?? eventGuid ?? undefined,
              formFieldConfigs: snap.formFieldConfigs ?? [],
            } as RsvpDesign;
          } catch {
            // Ignore corrupt snapshot
          }
        }
      }

      // 3. Load design via eventGuid from the admin endpoint
      // GET /RsvpDesign/{eventGuid}/design only requires apiKey+author headers (no JWT),
      // so it works for unauthenticated guests when the share link includes ?event=.
      if (eventGuid) {
        try {
          const designRes = await client.get(RsvpDesignEndpoints.get(eventGuid));
          const apiData = designRes.data?.data ?? designRes.data;
          if (apiData?.design) {
            const design = mapToFrontendDesign(apiData as ApiRsvpDesign) as RsvpDesign;
            design.eventGuid = eventGuid;

            // Fetch form field configs if not embedded in design payload
            if (!design.formFieldConfigs?.length) {
              try {
                const fieldsRes = await client.get(`/question/GetQuestions/${eventGuid}`);
                const raw: any[] = fieldsRes.data?.data ?? [];
                design.formFieldConfigs = raw.map((r) => ({
                  questionId: String(r.questionId ?? r.id ?? ""),
                  id: String(r.questionId ?? r.id ?? ""),
                  label: r.label ?? r.text ?? r.name ?? "",
                  text: r.text ?? r.label ?? "",
                  isRequired: r.isRequired ?? false,
                  type: typeof r.type === "number" ? r.type : undefined,
                  typeKey: typeof r.type === "number"
                    ? (TYPE_KEY_MAP[r.type] ?? "text")
                    : (r.typeKey ?? "text"),
                  options: r.options,
                  order: r.order ?? 0,
                }));
              } catch {
                design.formFieldConfigs = [];
              }
            }
            return design;
          }
        } catch {
          // Design not accessible — fall through to null
        }
      }

      return null;
    },
  });
}

export interface RsvpSubmitPayload {
  eventId: string;
  guestName: string;
  /** Number of guests (pax) attending */
  noOfPax: number;
  /** Phone number */
  phoneNo?: string;
  /** Custom form field answers keyed by questionId */
  answers: Record<string, string | string[]>;
}

/**
 * Submit a guest's RSVP answers.
 * Uses POST /rsvp/Create which only requires apiKey+author headers (no JWT),
 * making it accessible to unauthenticated public guests.
 */
export function useSubmitPublicRsvp() {
  return useMutation({
    mutationFn: (payload: RsvpSubmitPayload) => {
      // Convert answers from Record<questionId, string|string[]>
      // to the API's CreateAnswerRequest[] format: { questionId, text }[]
      const answers = Object.entries(payload.answers).map(([questionId, value]) => ({
        questionId,
        text: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
      }));

      return client
        .post(PublicRsvpEndpoints.submit(), {
          eventId: payload.eventId,
          guestName: payload.guestName,
          noOfPax: payload.noOfPax,
          phoneNo: payload.phoneNo ?? "",
          createdBy: payload.guestName,
          answers,
        })
        .then((r) => r.data);
    },
  });
}
