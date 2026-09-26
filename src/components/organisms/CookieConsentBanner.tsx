// src/components/organisms/CookieConsentBanner.tsx
//
// First-visit analytics-cookie prompt (LEGAL_TODO item 3). Strictly necessary
// cookies are never in question here — the app can't sign anyone in without
// them — so this only ever asks about analytics, and "Reject" is a genuine,
// equally-sized choice rather than a dark-pattern "OK".
//
// Reopening: the footer's "Cookie Preferences" link dispatches
// OPEN_COOKIE_PREFERENCES_EVENT on `window`, which re-shows this banner so the
// choice can be changed later, per LEGAL_TODO item 3's "add a way to change
// the choice".
//
// Positioned above HelpBubble.tsx (bottom-6 right-6) and the public RSVP
// music toggle (RsvpFormRenderer.tsx, also bottom-6 right-6) rather than on
// top of them, so `bottom-24` is deliberate, not a rounder number that was
// available.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Button } from "../atoms/Button";
import { getAnalyticsConsent, hasDecided, setAnalyticsConsent } from "../../utils/cookieConsent";
import { updateAnalyticsConsent } from "../../utils/analytics";

export const OPEN_COOKIE_PREFERENCES_EVENT = "bigdays:open-cookie-preferences";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => !hasDecided());
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const openForPreferences = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openForPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openForPreferences);
  }, []);

  // Move focus onto the card whenever it (re)appears, including a reopen from
  // the footer link, so a keyboard/screen-reader user gets an announcement and
  // a focus target instead of a card that opened somewhere off in the DOM.
  useEffect(() => {
    if (visible) headingRef.current?.focus();
  }, [visible]);

  const decide = useCallback((choice: "granted" | "denied") => {
    setAnalyticsConsent(choice);
    updateAnalyticsConsent(choice);
    setVisible(false);
  }, []);

  if (!visible) return null;

  const currentChoice = getAnalyticsConsent();

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-heading"
      className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-xs rounded-2xl border border-primary/15 bg-white p-4 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-accent"
    >
      <p
        id="cookie-consent-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-sm font-semibold text-text outline-none dark:text-white"
      >
        We use cookies
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-text/70 dark:text-white/70">
        Essential cookies keep MYBigDay working and can't be turned off.
        Optional analytics cookies help us see what to improve — only with
        your OK.{" "}
        <Link to="/privacy" className="underline hover:text-primary">
          Privacy Notice
        </Link>
      </p>
      {currentChoice && (
        <p className="mt-1.5 text-[11px] text-text/50 dark:text-white/50">
          Current choice: analytics {currentChoice === "granted" ? "accepted" : "rejected"}.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => decide("denied")}
          className="!px-3 !py-1.5 flex-1 text-xs"
        >
          Reject analytics
        </Button>
        <Button
          onClick={() => decide("granted")}
          className="!px-3 !py-1.5 flex-1 text-xs"
        >
          Accept analytics
        </Button>
      </div>
    </div>
  );
}
