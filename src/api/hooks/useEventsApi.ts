// src/api/hooks/useEventsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { EventsEndpoints } from "../endpoints";

export function useEventsApi() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await client.get(EventsEndpoints.all);
      return res.data;
    },
    // staleTime: 5 * 60_000, // optional: cache for 5m
  });
}

export function useEventApi(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await client.get(EventsEndpoints.byId(id));
      return res.data as { id: string; title: string; date: string };
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; date: string }) => {
      const res = await client.post(EventsEndpoints.create, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; date: string }) => {
      const res = await client.put(EventsEndpoints.update(id), data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event", id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.delete(EventsEndpoints.delete(id));
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
