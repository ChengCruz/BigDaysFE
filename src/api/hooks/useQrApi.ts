import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { CheckInEndpoints, QrEndpoints } from "../endpoints";
import type { CheckInResult, GenerateQrResult, QrToken } from "../../types/qr";

export function useQrListApi(eventId: string) {
  return useQuery<QrToken[]>({
    queryKey: ["qr", eventId],
    queryFn: async () => {
      const res = await client.get(QrEndpoints.listByEvent(eventId));
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    },
    enabled: Boolean(eventId),
  });
}

export function useGenerateQrApi() {
  const qc = useQueryClient();
  return useMutation<GenerateQrResult, Error, string>({
    mutationFn: async (eventId: string) => {
      const res = await client.post(QrEndpoints.generateAll(eventId));
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, eventId) => {
      qc.invalidateQueries({ queryKey: ["qr", eventId] });
    },
  });
}

export function useRevokeQrApi() {
  const qc = useQueryClient();
  return useMutation<void, Error, { token: string; eventId: string }>({
    mutationFn: async ({ token }) => {
      await client.patch(QrEndpoints.revoke(token));
    },
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["qr", eventId] });
    },
  });
}

export function useCheckInScanApi() {
  return useMutation<CheckInResult, Error, string>({
    mutationFn: async (token: string) => {
      const res = await client.post(CheckInEndpoints.scan, { token });
      return res.data?.data ?? res.data;
    },
  });
}
