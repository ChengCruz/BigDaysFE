// src/api/hooks/useRsvpsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { RsvpsEndpoints } from "../endpoints";

export function useRsvpsApi() {
  return useQuery({
    queryKey: ["rsvps"],
    queryFn: async () => (await client.get(RsvpsEndpoints.all)).data,
    staleTime: 5 * 60_000,
  });
}

export function useRsvpApi(id: string) {
  return useQuery({
    queryKey: ["rsvp", id],
    queryFn: async () => (await client.get(RsvpsEndpoints.byId(id))).data,
  });
}

export function useCreateRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { guestName: string; status: string }) =>
      (await client.post(RsvpsEndpoints.create, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
  });
}

export function useUpdateRsvp(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { guestName: string; status: string }) =>
      (await client.put(RsvpsEndpoints.update(id), data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
  });
}

export function useDeleteRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await client.delete(RsvpsEndpoints.delete(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
  });
}
