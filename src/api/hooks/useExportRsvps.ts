// src/api/hooks/useExportRsvps.ts
import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { EventsEndpoints } from "../endpoints";
import { trackAction } from "../../utils/analytics";

export function useExportRsvps(eventId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await client.get(EventsEndpoints.exportRsvps(eventId), {
        responseType: "blob",
      });
      return res.data as Blob;
    },
    onSuccess: () => trackAction("rsvps", "exported", { format: "xlsx" }),
  });
}
