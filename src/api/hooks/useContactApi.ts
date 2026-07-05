import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { ContactEndpoints } from "../endpoints";

export interface ContactSupportPayload {
  /** Optional event the message relates to. */
  eventGuid?: string;
  /** Event name for the email body (server also has the guid). */
  eventName?: string;
  /** Category, e.g. "Bug Report", "Feature Request". */
  category: string;
  /** Free-text message body. */
  message: string;
}

/**
 * Send a support / bug-report message. The backend resolves the sender's name and
 * email from the authenticated user, so those are not part of the payload.
 */
export function useSendSupportMessage() {
  return useMutation({
    mutationFn: async (payload: ContactSupportPayload) => {
      const res = await client.post(ContactEndpoints.send, payload);
      return res.data;
    },
  });
}
