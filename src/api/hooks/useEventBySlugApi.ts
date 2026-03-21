// src/api/hooks/useEventBySlugApi.ts
// Fetches full event RSVP template (event info + design + questions) by slug.
// Route: /rsvp/:slug  →  GET /rsvp/{slug}  (AllowAnonymous)
import { useQuery } from "@tanstack/react-query";
import client from "../client";
import { PublicEventEndpoints } from "../endpoints";
import type { RsvpDesign, ApiRsvpDesign } from "../../types/rsvpDesign";
import { mapToFrontendDesign } from "../../utils/rsvpDesignMapper";
import type { FormFieldConfig } from "./useFormFieldsApi";
import { TYPE_KEY_MAP } from "../../utils/eventUtils";

export interface EventRsvpTemplate {
  eventId: string;
  eventName: string;
  design: RsvpDesign;
  formFields: FormFieldConfig[];
}

/**
 * Fetch full event RSVP template by slug (no auth required).
 * Calls GET /rsvp/{slug} which returns EventRsvpTemplateDto:
 *   { event, rsvpDesign, questions }
 */
export function useEventBySlug(slug: string | undefined) {
  return useQuery<EventRsvpTemplate | null>({
    queryKey: ["event", "slug", slug],
    enabled: !!slug,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<EventRsvpTemplate | null> => {
      if (!slug) return null;

      const res = await client.get(PublicEventEndpoints.bySlug(slug));
      const data = res.data?.data ?? res.data;
      if (!data) return null;

      const { event, rsvpDesign, questions } = data;

      // Map rsvpDesign — handle both nested { design: {...} } and flat structures
      let design: RsvpDesign;
      if (rsvpDesign?.design) {
        design = mapToFrontendDesign(rsvpDesign as ApiRsvpDesign) as RsvpDesign;
      } else if (rsvpDesign?.blocks) {
        design = rsvpDesign as RsvpDesign;
      } else {
        return null;
      }

      design.eventGuid = event?.eventGuid ?? event?.eventID ?? "";

      // Map questions → FormFieldConfig[]
      const formFields: FormFieldConfig[] = (questions ?? []).map((q: any) => ({
        questionId: String(q.questionId ?? q.id ?? ""),
        id: String(q.questionId ?? q.id ?? ""),
        label: q.label ?? q.text ?? q.name ?? "",
        text: q.text ?? q.label ?? "",
        isRequired: q.isRequired ?? false,
        type: typeof q.type === "number" ? q.type : undefined,
        typeKey: typeof q.type === "number"
          ? (TYPE_KEY_MAP[q.type] ?? "text")
          : (q.typeKey ?? "text"),
        options: q.options,
        order: q.order ?? 0,
      }));

      design.formFieldConfigs = formFields;

      return {
        eventId: design.eventGuid,
        eventName: event?.eventName ?? "",
        design,
        formFields,
      };
    },
  });
}
