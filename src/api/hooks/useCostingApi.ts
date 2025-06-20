// src/api/hooks/useCostingApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { CostingEndpoints } from "../endpoints";

export function useCostingApi() {
  return useQuery({
    queryKey: ["costing"],
    queryFn: async () => (await client.get(CostingEndpoints.all)).data,
    staleTime: 5 * 60_000,
  });
}

export function useCostApi(id: string) {
  return useQuery({
    queryKey: ["cost", id],
    queryFn: async () => (await client.get(CostingEndpoints.byId(id))).data,
  });
}

export function useCreateCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { description: string; amount: number }) =>
      (await client.post(CostingEndpoints.create, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["costing"] }),
  });
}

export function useUpdateCost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { description: string; amount: number }) =>
      (await client.put(CostingEndpoints.update(id), data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["costing"] }),
  });
}

export function useDeleteCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await client.delete(CostingEndpoints.delete(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["costing"] }),
  });
}
