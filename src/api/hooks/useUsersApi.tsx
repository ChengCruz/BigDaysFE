// src/api/hooks/useUsersApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { UsersEndpoints } from "../endpoints";

export function useUsersListApi() {
  return useQuery({
    queryKey: ["users", "list"],
    queryFn: async () => (await client.get(UsersEndpoints.all)).data.data,
    staleTime: 5 * 60_000,
    enabled: false, // Don't auto-fetch, only fetch when manually triggered
  });
}

export function useUserByGuidApi(guid: string) {
  return useQuery({
    queryKey: ["user", "guid", guid],
    queryFn: async () => (await client.get(UsersEndpoints.byGuid(guid))).data.data,
    enabled: !!guid,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fullName: string; email: string; password?: string; role?: number }) =>
      (await client.post(UsersEndpoints.create, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; fullName: string; email: string; role?: number }) =>
      (await client.post(UsersEndpoints.update, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) =>
      (await client.put(UsersEndpoints.deactivate(userId))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) =>
      (await client.put(UsersEndpoints.activate(userId))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (data: { id: number; email: string; oldPassword: string; newPassword: string }) =>
      (await client.post(UsersEndpoints.updatePassword, data)).data,
  });
}
