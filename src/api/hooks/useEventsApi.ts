import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { EventsEndpoints } from "../endpoints";

// --- API payload ---
type ApiEvent = {
  eventID: string;
  eventGUID: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  noOfTable?: number;
  eventDescription?: string;
};

type ApiResponse<T> = {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errorCode?: string | null;
};

// --- App-facing Event model ---
export interface Event {
  id: string;
  title: string;
  date: string;
  noOfTable?: number;
  description?: string;
  location?: string;
  raw?: ApiEvent;
}

function toEvent(e: ApiEvent): Event {
  return {
    id: e.eventGUID.toString(),
    title: e.eventName,
    date: e.eventDate,
    noOfTable: e.noOfTable,
    description: e.eventDescription,
    location: e.eventLocation,
    raw: e,
  };
}

/**
 * Get all events
 */
export function useEventsApi() {
  return useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await client.get<ApiResponse<ApiEvent[]>>(
        EventsEndpoints.all
      );
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      return items.map(toEvent);
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
      description: string;
      location: string;
      userID: string;
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
      eventID: string;
      name: string;
      date: string;
      description: string;
      location: string;
      time: string;
      userID: number;
      noOfTable: number;
    }) => {
      const res = await client.post(EventsEndpoints.update, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event", variables.eventID] });
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
      console.log("[mutate] activate", id);
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
      console.log("[mutate] deactivate", id);
      const res = await client.put(EventsEndpoints.deactivateEvent(id));
      return res.data;
    },
    onMutate: (id) => {
      console.log("[onMutate] deactivating", id);
    },
    onSuccess: (_data, id) => {
      console.log("[onSuccess] deactivated", id);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err, id) => {
      console.error("[onError] deactivating", id, err);
    },
  });
}