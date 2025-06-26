// src/api/hooks/useRsvpsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { RsvpsEndpoints } from "../endpoints";

export interface Rsvp {
  id: string;
  guestName: string;
  status: string;
  guestType: string;
}

// Input shape when creating a new RSVP
export type CreateRsvpInput = Omit<Rsvp, "id">;

// Input shape when updating
export interface UpdateRsvpInput extends Partial<CreateRsvpInput> {
  id: string;
}

// export function useRsvpsApi() {
//   return useQuery({
//     queryKey: ["rsvps"],
//     queryFn: async () => (await client.get(RsvpsEndpoints.all)).data,
//     staleTime: 5 * 60_000,
//   });
// }

export function useRsvpsApi(eventId: string) {
  console.log("useRsvpsApi called with eventId:", eventId);
  return useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: () =>
      client
        .get<Rsvp[]>(RsvpsEndpoints.forEvent(eventId))
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useRsvpApi(eventId: string, id: string) {
  return useQuery({
    queryKey: ["rsvp", id],
    queryFn: async () => (await client.get(RsvpsEndpoints.byId(eventId,id))).data,
  });
}

// export function useCreateRsvp() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: { guestName: string; status: string }) =>
//       (await client.post(RsvpsEndpoints.create, data)).data,
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
//   });
// }

export function useCreateRsvp(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data :any) =>
      client.post(RsvpsEndpoints.create(eventId), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps", eventId] }),
  });
}


// export function useUpdateRsvp(id: string) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: { guestName: string; status: string }) =>
//       (await client.put(RsvpsEndpoints.update(id), data)).data,
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
//   });
// }
export interface UpdateRsvpInput {
  id: string;
  data: CreateRsvpInput;
}



// UPDATE now expects the full Rsvp (id + all fields)

export function useUpdateRsvp(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload :any) => {
      // now we read `cfg.id!` inside the mutation
      const res = await client.put(
        RsvpsEndpoints.update(eventId, payload.id!),
        payload
      );
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["rsvps", eventId] }),
  });
}


// export function useUpdateRsvp() {
//   const qc = useQueryClient();
//   return useMutation<Rsvp, Error, UpdateRsvpInput>({
//     mutationFn: ({ id, ...data }) =>
//       client.put<Rsvp>(RsvpsEndpoints.update(id), data).then((r) => r.data),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
//   });
// }

export function useDeleteRsvp(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.delete(RsvpsEndpoints.delete(eventId, id)).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps", eventId] }),
  });
}
