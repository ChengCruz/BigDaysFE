import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { measurementId, trackPageView } from "../../utils/analytics";

// Never send URLs that carry a credential or a guest-identifying token in the
// path or query. `/app` is deliberately NOT in this list: authenticated usage is
// the majority of real activity, and excluding it left us blind to activation and
// retention. Its identifier segments are stripped by normalizePath() in
// utils/analytics.ts before anything is sent.
const PRIVATE_PATH_PREFIXES = [
  "/reset-password", // ?email=&token= password-reset deep link
  "/verify-email",   // carries the address being verified
  "/qr/lookup",      // guest self-service, /qr/lookup/:eventId
];

function isTrackablePath(pathname: string): boolean {
  // Track the generic /rsvp marketing page, but never event-specific RSVP URLs
  // (/rsvp/:slug, /rsvp/submit/:token, /rsvp/share/:token).
  if (pathname.startsWith("/rsvp/")) return false;

  return !PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function GoogleAnalytics() {
  const { pathname } = useLocation();
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!measurementId) return;
    if (!isTrackablePath(pathname)) {
      lastTrackedPath.current = undefined;
      return;
    }
    // Dedupe on the raw pathname, not the normalized one: moving between two
    // different events is two pageviews even though both report as :id.
    if (lastTrackedPath.current === pathname) return;

    trackPageView(pathname);
    lastTrackedPath.current = pathname;
  }, [pathname]);

  return null;
}
