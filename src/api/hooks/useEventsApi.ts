import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { EventsEndpoints } from "../endpoints";
import type { FormFieldConfig } from "./useFormFieldsApi";
import type { ApiEvent } from "../../types/event";
import type { ApiResponse } from "../../types/api";
import { TYPE_KEY_MAP } from "../../utils/eventUtils";

// --- App-facing Event model ---
export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  noOfTable?: number;
  description?: string;
  location?: string;
  slug?: string;
  raw?: ApiEvent;
}

function toEvent(e: ApiEvent): Event {
  return {
    id: e.eventGuid.toString(),
    title: e.eventName,
    date: e.eventDate,
    time: e.eventTime,
    noOfTable: e.noOfTable,
    description: e.eventDescription,
    location: e.eventLocation,
    slug: e.slug,
    raw: e,
  };
}

/**
 * Get all events
 */
export function useEventsApi(includeDeleted = false, opts?: { enabled?: boolean }) {
  return useQuery<Event[]>({
    // include includeDeleted in the cache key so toggling updates cache correctly
    queryKey: ["events", includeDeleted],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      const res = await client.get<ApiResponse<ApiEvent[]>>(EventsEndpoints.allByUser);
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      if (includeDeleted) return items.map(toEvent);
      // Filter out deleted events (backend marks deactivated events with isDeleted = true)
      const active = items.filter((e) => !e.isDeleted);
      return active.map(toEvent);
    },
  });
}

/**
 * Get single event
 */
export function useEventApi(id: string, opts?: { enabled?: boolean }) {
  return useQuery<Event>({
    queryKey: ["event", id],
    enabled: opts?.enabled ?? Boolean(id),
    queryFn: async () => {
      const res = await client.get<ApiResponse<ApiEvent>>(
        EventsEndpoints.byId(id)
      );
      const item = res.data?.data;
      if (!item) throw new Error("Event not found");
      return toEvent(item);
    },
  });
}

/**
 * Create event
 */
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      date: string;
      time: string;
      description: string;
      location: string;
      userGuid: string;
      noOfTable: string;
    }) => {
      const res = await client.post(EventsEndpoints.create, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/**
 * Update event (no ID in endpoint, so send in body)
 */
export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      eventGuid: string;
      name: string;
      date: string;
      description: string;
      location: string;
      time: string;
      userGuid: string;
      noOfTable: number;
    }) => {
      const res = await client.post(EventsEndpoints.update, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event", variables.eventGuid] });
    },
  });
}

/**
 * Delete event (uses plural /events/{id})
 */
// export function useDeleteEvent() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (id: string) => {
//       const res = await client.delete(EventsEndpoints.delete(id));
//       return res.data;
//     },
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["events"] });
//     },
//   });
// }

/** Activate event */
export function useActivateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Most backends expect POST for activate/deactivate
      // If your API needs a body, send { eventID: id } instead of {}
      const res = await client.put(EventsEndpoints.activateEvent(id));
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/** Deactivate event */
export function useDeactivateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.put(EventsEndpoints.deactivateEvent(id));
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/** Fetch internal RSVP template (event + questions, no design) for a given event GUID. */
export function useEventRsvpInternal(eventId?: string) {
  return useQuery<FormFieldConfig[]>({
    queryKey: ["eventRsvpInternal", eventId],
    enabled: !!eventId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await client.get(EventsEndpoints.eventRsvpInternal(eventId!));
      const data = res.data?.data ?? res.data;
      const questions: any[] = data?.questions ?? [];
      return questions.map((q: any) => ({
        questionId: String(q.questionId ?? q.id ?? ""),
        id: String(q.questionId ?? q.id ?? ""),
        eventId: q.eventId,
        label: q.label ?? q.text ?? q.name ?? "",
        name: q.name ?? (q.label ?? q.text ?? "").toLowerCase().replace(/\s+/g, "_"),
        text: q.text ?? q.label ?? "",
        isRequired: q.isRequired ?? q.required ?? false,
        type: typeof q.type === "number" ? q.type : undefined,
        typeKey: typeof q.type === "number" ? TYPE_KEY_MAP[q.type] : (q.typeKey ?? q.type),
        options: Array.isArray(q.options) ? q.options : typeof q.options === "string" ? q.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        order: q.order ?? 0,
      } as FormFieldConfig));
    },
  });
}