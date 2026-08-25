// src/demo/demoMode.ts
//
// Demo mode lets a signed-out visitor explore a sample wedding on the real
// /app/* routes, served from a local store instead of the API (demoAdapter.ts).
// It exists to give the marketing site something linkable: a URL that shows the
// product working, with no signup and no typing.
//
// ── Three invariants, all load-bearing ────────────────────────────────────────
//
// 1. VITE_DEMO_ENABLED must be "true". Otherwise isDemoActive() is always false,
//    which short-circuits every integration point in the host app. That is the
//    kill switch: the whole feature turns off with one env var, no code change.
//    Same presence-of-config pattern as utils/turnstile.ts.
// 2. State lives in sessionStorage, so it dies with the tab and can never
//    surprise the next person to use a shared browser.
// 3. isDemoActive() returns false whenever a real access token exists. A
//    logged-in user must never see fabricated guests, and the check lives here
//    rather than at the call sites so it cannot be forgotten at one of them.
//
// Nothing a visitor does in demo mode is migrated on signup — the data is a
// fictional wedding, not theirs, so there is deliberately nothing to migrate.

import { tokenStore } from "../utils/tokenStore";

const DEMO_FLAG_KEY = "bigdays.demo.v1";

/**
 * Fixed GUID for the sample event. Hex-only so that normalizePath() in
 * utils/analytics.ts recognises it as an id segment and strips it.
 */
export const DEMO_EVENT_ID = "deadbeef-0000-4000-8000-000000000001";

/** Every storage key the demo may write, for cleanup. */
const DEMO_KEY_PREFIXES = ["bigdays.demo.", `floorplan-${DEMO_EVENT_ID}`];

/**
 * Build-time kill switch. False disables the route, the CTA, the adapter and
 * every guard in one go — see the invariants above.
 */
export const isDemoEnabled =
  import.meta.env.VITE_DEMO_ENABLED?.trim().toLowerCase() === "true";

export function isDemoActive(): boolean {
  if (!isDemoEnabled) return false;
  // Hard interlock: a real session always wins.
  if (tokenStore.get()) return false;
  try {
    return sessionStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function enterDemo(): void {
  if (!isDemoEnabled) return;
  try {
    sessionStorage.setItem(DEMO_FLAG_KEY, "1");
  } catch {
    // Storage disabled (private mode, embedded webview). The demo can't run.
  }
}

export function exitDemo(): void {
  clearDemoArtifacts();
}

/**
 * Removes demo state from both storages. Called on exit and from the logout
 * mutation, so a real session can never inherit leftovers. Deliberately does
 * NOT check isDemoEnabled — cleanup must still work after the switch is flipped
 * off, or stale keys would be stranded in a visitor's browser.
 */
export function clearDemoArtifacts(): void {
  try {
    sessionStorage.removeItem(DEMO_FLAG_KEY);
    for (const store of [sessionStorage, localStorage]) {
      Object.keys(store)
        .filter((k) => DEMO_KEY_PREFIXES.some((p) => k.startsWith(p)))
        .forEach((k) => store.removeItem(k));
    }
    // The demo selects its own event; don't leave that pointing at a fake id.
    if (localStorage.getItem("eventId") === DEMO_EVENT_ID) {
      localStorage.removeItem("eventId");
    }
  } catch {
    // Nothing to clean if storage is unavailable.
  }
}
