// src/api/hooks/useMeApi.ts
import { useQuery } from "@tanstack/react-query";
import client from "../client";
import { AuthEndpoints } from "../endpoints";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => client.get(AuthEndpoints.me).then(res => res.data),
    staleTime: 5 * 60 * 1000, // cache for 5m
  });
}
