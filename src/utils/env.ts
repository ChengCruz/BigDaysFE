// src/utils/env.ts

/** Returns true for local dev and staging; false for production. */
export function isDevOrStaging(): boolean {
  // Local .env files set VITE_APP_ENV; the CI workflows write VITE_ENV. Accept
  // either, otherwise this is always false in every deployed build.
  const env = (import.meta.env.VITE_APP_ENV ?? import.meta.env.VITE_ENV) as string | undefined;
  return env === "local" || env === "staging";
}
