// src/api/hooks/useMediaApi.ts
// Media upload hook — uploads images to BE cloud storage for the RSVP designer.
// Returns a stable HTTPS URL that can be saved in the design JSON and viewed by guests.
import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { MediaEndpoints } from "../endpoints";

interface UploadMediaPayload {
  file: File;
  eventGuid: string;
  context?: string;
}

export interface UploadMediaResult {
  mediaId: string;
  url: string;
}

export function useUploadMedia() {
  return useMutation<UploadMediaResult, Error, UploadMediaPayload>({
    mutationFn: async ({ file, eventGuid, context = "rsvp-design" }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("eventGuid", eventGuid);
      form.append("context", context);
      const res = await client.post<{ success: boolean; data: UploadMediaResult }>(
        MediaEndpoints.upload,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.data;
    },
  });
}

/** Deletes a media file from CDN by filename. Wired to DELETE /api/media/{fileName}.
 * TODO: implement the corresponding endpoint on BE. */
export function useDeleteMedia() {
  return useMutation<void, Error, { fileName: string }>({
    mutationFn: async ({ fileName }) => {
      await client.delete(MediaEndpoints.delete(fileName));
    },
  });
}
