// src/utils/turnstile.ts
// Cloudflare Turnstile (CAPTCHA) helpers.
//
// The site key is PUBLIC and read from VITE_TURNSTILE_SITE_KEY. When it is
// absent (e.g. local dev), the widget renders nothing and forms skip the
// CAPTCHA gate — mirroring the backend, which disables verification when no
// secret key is configured. This keeps local/dev friction-free.

export const TURNSTILE_SITE_KEY =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? "";

// Optional DEDICATED site key for the public, guest-facing RSVP form.
// Turnstile keys are bound to hostnames, not URL paths — so ONE key covers every
// per-event RSVP slug. This separate key is only about running RSVP on its own
// widget (e.g. "Managed"/invisible mode, its own analytics) apart from the admin
// forms. When unset it falls back to the shared key above.
export const TURNSTILE_SITE_KEY_RSVP =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY_RSVP as string | undefined)?.trim() ||
  TURNSTILE_SITE_KEY;

/** True when the shared site key is configured (admin forms: login, register, contact). */
export const isTurnstileEnabled = TURNSTILE_SITE_KEY.length > 0;

/** True when a site key (dedicated or shared) is configured for the public RSVP form. */
export const isRsvpTurnstileEnabled = TURNSTILE_SITE_KEY_RSVP.length > 0;

/** Header the backend reads the Turnstile token from (see BE TurnstileActionFilter). */
export const TURNSTILE_HEADER = "CF-Turnstile-Response";

/** Build the request headers that carry the Turnstile token, if one is present. */
export function turnstileHeaders(token?: string | null): Record<string, string> {
  return token ? { [TURNSTILE_HEADER]: token } : {};
}
