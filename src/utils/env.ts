// src/utils/env.ts

/** Returns true for local dev and staging; false for production. */
export function isDevOrStaging(): boolean {
  const env = import.meta.env.VITE_APP_ENV as string | undefined;
  return env === "local" || env === "staging";
}
