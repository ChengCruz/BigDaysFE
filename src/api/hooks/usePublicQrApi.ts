import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { PublicQrEndpoints } from "../endpoints";

export interface QrLookupResult {
  token: string;
  guestName: string;
  noOfPax: number;
}

export function useQrLookupApi(eventId: string) {
  return useMutation<QrLookupResult, Error, { name: string; phone: string }>({
    mutationFn: async ({ name, phone }) => {
      const res = await client.post(PublicQrEndpoints.lookup(eventId), { name, phone });
      return res.data?.data ?? res.data;
    },
  });
}
