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

export function useCheckInScanApi(eventId: string) {
  const qc = useQueryClient();
  return useMutation<CheckInResult, Error, string>({
    mutationFn: async (token: string) => {
      const res = await client.post(CheckInEndpoints.scan, { token });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", eventId] });
    },
  });
}

// Force check-in: generates a QR token for a guest who doesn't have one, then checks them in.
// Uses generateAll as a workaround since there's no single-guest generate endpoint yet.
export function useForceCheckInApi(eventId: string) {
  const qc = useQueryClient();
  return useMutation<CheckInResult & { token: string }, Error, string>({
    mutationFn: async (guestId: string) => {
      await client.post(QrEndpoints.generateAll(eventId));
      const res = await client.get(QrEndpoints.listByEvent(eventId));
      const payload = res.data?.data ?? res.data;
      const tokens: QrToken[] = Array.isArray(payload) ? payload : [];
      const tokenRec = tokens.find((t) => t.guestId === guestId);
      if (!tokenRec) throw new Error("Token could not be created for this guest");
      const checkInRes = await client.post(CheckInEndpoints.scan, { token: tokenRec.token });
      const result: CheckInResult = checkInRes.data?.data ?? checkInRes.data;
      return { ...result, token: tokenRec.token };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", eventId] });
    },
  });
}

export function useUndoCheckInApi() {
  const qc = useQueryClient();
  return useMutation<CheckInResult, Error, { token: string; eventId: string }>({
    mutationFn: async ({ token }) => {
      const res = await client.post(CheckInEndpoints.undo, { token });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["qr", eventId] });
    },
  });
}
