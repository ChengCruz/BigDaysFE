import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { FloorPlanEndpoints } from "../endpoints";
import type { FloorItem } from "../../components/pages/Tables/useFloorPlanState";

export function useGetFloorPlan(eventId: string) {
  return useQuery<FloorItem[]>({
    queryKey: ["floorplan", eventId],
    queryFn: async () => {
      const res = await client.get(FloorPlanEndpoints.get(eventId));
      // Unwrap envelope: { isSuccess, data: { eventGuid, items } }
      const payload = res.data?.data ?? res.data;
      return payload?.items ?? [];
    },
    enabled: Boolean(eventId),
    staleTime: 5 * 60_000,
  });
}

export function useSaveFloorPlan(eventId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, FloorItem[]>({
    mutationFn: (items) =>
      client.put(FloorPlanEndpoints.save(eventId), { items }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["floorplan", eventId] });
    },
  });
}
