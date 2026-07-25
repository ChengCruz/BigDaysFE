import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { ContactEndpoints } from "../endpoints";
import { turnstileHeaders } from "../../utils/turnstile";

export type ContactType = "Bug Report" | "Feedback" | "Other";

export interface ContactSupportPayload {
  /** What the message is about. "Bug Report" also carries a `module`. */
  type: ContactType;
  /** Which app area the bug is in — sent for "Bug Report" only. */
  module?: string;
  /** Sender's display name. The login email is resolved server-side from the JWT. */
  name: string;
  /** Optional contact phone number. */
  phone?: string;
  /** Free-text message body. */
  message: string;
  /** Cloudflare Turnstile token; sent as a header, not part of the body. */
  captchaToken?: string;
}

/**
 * Send a Contact Us message. The backend resolves the sender's email from the
 * authenticated user (JWT) and emails it to the support inboxes — nothing is
 * persisted to the database.
 */
export function useSendSupportMessage() {
  return useMutation({
    mutationFn: async ({ captchaToken, ...payload }: ContactSupportPayload) => {
      const res = await client.post(ContactEndpoints.send, payload, {
        headers: turnstileHeaders(captchaToken),
      });
      return res.data;
    },
  });
}
