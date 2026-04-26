// src/api/hooks/usePublicRsvpApi.ts
// Hooks for the public guest-facing RSVP submission page
import { useQuery, useMutation } from "@tanstack/react-query";
import client from "../client";
import { PublicRsvpEndpoints, RsvpDesignEndpoints } from "../endpoints";
import type { RsvpDesign, ApiRsvpDesign } from "../../types/rsvpDesign";
import { mapToFrontendDesign } from "../../utils/rsvpDesignMapper";
import { TYPE_KEY_MAP } from "../../utils/eventUtils";

/**
 * Fetch RSVP design by share token.
 * Tries the backend public token endpoint first, then falls back to the admin
 * design endpoint using eventGuid.
 *
 * Auth reality (verified 2026-04-18):
 *   - GET /RsvpDesign/share/{token}        — intended public, currently 404s
 *     (endpoint not documented in backend-context; see .claude/todo/rsvp-v3-preview-public-sync.md).
 *   - GET /RsvpDesign/{eventGuid}/design   — requires JWT (returns 401 without it).
 *     The fallback therefore only works when the caller is a logged-in admin in
 *     the same browser; real guests fall through to null and see "Invalid link".
 *   - Public guests should use the slug URL (/rsvp/:slug → useEventBySlug), which
 *     hits /event/eventRsvp/slug/{slug} and works with only apiKey+author headers.
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

      // 2. Admin-only fallback via eventGuid.
      // NOTE: GET /RsvpDesign/{eventGuid}/design requires JWT (401 without it) —
      // this path only succeeds when a logged-in admin is previewing in the same
      // browser. For real public guests, prefer the slug URL instead.
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
  /** Guest remarks / dietary notes */
  remarks?: string;
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
          remarks: payload.remarks ?? "",
          createdBy: payload.guestName,
          answers,
        })
        .then((r) => r.data);
    },
  });
}
