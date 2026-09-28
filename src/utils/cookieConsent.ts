// src/utils/cookieConsent.ts
// ---------------------------------------------------------------------------
// Analytics-cookie consent choice (LEGAL_TODO item 3).
//
// Only analytics cookies are gated here — strictly necessary/session cookies
// are not optional (the app can't sign anyone in without them), so there is
// nothing to ask consent for there. "granted"/"denied" mirrors GA4 Consent
// Mode v2's own vocabulary so the value can be handed to gtag() unchanged.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "bigdays.cookieConsent.v1";

export type ConsentChoice = "granted" | "denied";

interface CookieConsentState {
  analytics: ConsentChoice;
  /** Epoch ms of the choice, informational only. */
  decidedAt: number;
}

function readState(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const { analytics, decidedAt } = parsed as Partial<CookieConsentState>;
    if (analytics !== "granted" && analytics !== "denied") return null;
    return {
      analytics,
      decidedAt: typeof decidedAt === "number" && Number.isFinite(decidedAt) ? decidedAt : 0,
    };
  } catch {
    return null;
  }
}

function writeState(state: CookieConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode write errors */
  }
}

/** Undefined means "no choice made yet" — the banner should still be showing. */
export function getAnalyticsConsent(): ConsentChoice | undefined {
  return readState()?.analytics;
}

export function setAnalyticsConsent(choice: ConsentChoice): void {
  writeState({ analytics: choice, decidedAt: Date.now() });
}

export function hasDecided(): boolean {
  return readState() !== null;
}
