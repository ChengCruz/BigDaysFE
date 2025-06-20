// src/api/hooks/useSeatingApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { SeatingEndpoints } from "../endpoints";

export function useSeatingApi() {
  return useQuery({
    queryKey: ["seating"],
    queryFn: async () => (await client.get(SeatingEndpoints.all)).data,
    staleTime: 5 * 60_000,
  });
}

export function useSeatApi(id: string) {
  return useQuery({
    queryKey: ["seating", id],
    queryFn: async () => (await client.get(SeatingEndpoints.byId(id))).data,
  });
}

export function useCreateSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tableId: string; guestId: string }) =>
      (await client.post(SeatingEndpoints.create, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seating"] }),
  });
}

export function useUpdateSeat(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tableId: string; guestId: string }) =>
      (await client.put(SeatingEndpoints.update(id), data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seating"] }),
  });
}

export function useDeleteSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await client.delete(SeatingEndpoints.delete(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seating"] }),
  });
}
