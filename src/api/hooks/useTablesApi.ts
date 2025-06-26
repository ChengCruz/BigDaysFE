// src/api/hooks/useTablesApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { TablesEndpoints } from "../endpoints";

export function useTablesApi() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: async () => (await client.get(TablesEndpoints.all)).data,
    staleTime: 5 * 60_000,
  });
}

export function useTableApi(id: string) {
  console.log("useTableApi called with id:", id);
  return useQuery({
    queryKey: ["tables", id],
    queryFn: async () => (await client.get(TablesEndpoints.byId(id))).data,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; capacity: number }) =>
      (await client.post(TablesEndpoints.create, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useUpdateTable(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; capacity: number }) =>
      (await client.put(TablesEndpoints.update(id), data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await client.delete(TablesEndpoints.delete(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}
