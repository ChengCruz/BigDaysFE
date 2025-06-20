// src/api/hooks/useImportRsvps.ts
import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { EventsEndpoints } from "../endpoints";

export function useImportRsvps(eventId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await client.post(
        EventsEndpoints.importRsvps(eventId),
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data; // array of created RSVPs
    },
  });
}
