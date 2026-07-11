import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { ContactEndpoints } from "../endpoints";
import { turnstileHeaders } from "../../utils/turnstile";

export interface ContactSupportPayload {
  /** Optional event the message relates to. */
  eventGuid?: string;
  /** Event name for the email body (server also has the guid). */
  eventName?: string;
  /** Category, e.g. "Bug Report", "Feature Request". */
  category: string;
  /** Free-text message body. */
  message: string;
  /** Cloudflare Turnstile token; sent as a header, not part of the body. */
  captchaToken?: string;
}

/**
 * Send a support / bug-report message. The backend resolves the sender's name and
 * email from the authenticated user, so those are not part of the payload.
 */
export function useSendSupportMessage() {
  return useMutation({
    mutationFn: async ({ captchaToken, ...payload }: ContactSupportPayload) => {
      const res = await client.post(ContactEndpoints.send, payload, { headers: turnstileHeaders(captchaToken) });
      return res.data;
    },
  });
}
