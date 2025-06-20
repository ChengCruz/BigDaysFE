// src/api/hooks/useUsersApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { UsersEndpoints } from "../endpoints";

export function useUsersApi() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await client.get(UsersEndpoints.all)).data,
    staleTime: 5 * 60_000,
  });
}

export function useUserApi(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => (await client.get(UsersEndpoints.byId(id))).data,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string }) =>
      (await client.post(UsersEndpoints.create, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string }) =>
      (await client.put(UsersEndpoints.update(id), data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await client.delete(UsersEndpoints.delete(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
