// src/api/hooks/useCrewApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { CrewEndpoints } from "../endpoints";

export interface CrewMember {
  crewGuid: string;
  crewCode: string;
  name: string;
  isActive: boolean;
  eventGuid: string;
  createdDate?: string;
  lastUpdated?: string;
}

export interface CreateCrewPayload {
  name: string;
  crewCode?: string;
  pin: string;
  eventId: string;
}

export interface UpdateCrewPayload {
  crewGuid: string;
  name: string;
  isActive: boolean;
  pin?: string;
}

export function useCrewListApi(eventGuid: string | undefined) {
  return useQuery<CrewMember[]>({
    queryKey: ["crew", eventGuid],
    queryFn: async () => {
      const res = await client.get(CrewEndpoints.byEvent(eventGuid!));
      return res.data.data ?? res.data;
    },
    enabled: !!eventGuid,
    staleTime: 2 * 60_000,
  });
}

export function useCreateCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCrewPayload) =>
      client.post(CrewEndpoints.create, payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crew"] }),
  });
}

export function useUpdateCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCrewPayload) =>
      client.put(CrewEndpoints.update, payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crew"] }),
  });
}

export function useDeleteCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (crewGuid: string) =>
      client.delete(CrewEndpoints.delete(crewGuid)).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crew"] }),
  });
}
