// src/utils/analytics.ts
//
// GA4 event plumbing, shared by the route-level pageview tracker
// (components/analytics/GoogleAnalytics.tsx) and by the handful of call sites
// that report a conversion step.
//
// Everything here is a no-op when VITE_GA_MEASUREMENT_ID is unset or malformed,
// which is the case for local, test and Playwright builds. That is deliberate:
// nothing should have to guard its own trackEvent call.

type GtagArguments = [command: string, ...args: unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArguments) => void;
  }
}

const rawMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

/** Undefined unless a well-formed G-XXXX id was supplied at build time. */
export const measurementId =
  rawMeasurementId && /^G-[A-Z0-9]+$/i.test(rawMeasurementId) ? rawMeasurementId : undefined;

let initializedMeasurementId: string | undefined;

/** Loads gtag.js on first use. Called lazily so untracked visits stay script-free. */
function ensureInitialized(id: string): void {
  if (initializedMeasurementId === id) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    // Reproduces Google's canonical snippet verbatim, which pushes the live
    // `arguments` object rather than a rest array. gtag.js inspects what it finds
    // in dataLayer, so this is one of the few places where the older form is the
    // safer one — hence the targeted exceptions rather than a rewrite.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gtag(..._args: GtagArguments) {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });

  if (!document.getElementById("google-analytics-gtag")) {
    const script = document.createElement("script");
    script.id = "google-analytics-gtag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  initializedMeasurementId = id;
}

/** Per-visit opt-in via ?ga_debug=1, so DebugView can be used without a build. */
function debugMode(): boolean {
  return new URLSearchParams(window.location.search).get("ga_debug") === "1";
}

const GUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INT_SEGMENT = /^\d+$/;

/**
 * Replaces identifier segments with ":id" so we report the route template rather
 * than the row it pointed at — `/app/events/8f3a…/edit` becomes
 * `/app/events/:id/edit`. Authenticated paths embed event and guest GUIDs, and
 * those are our users' data, not ours to hand to Google.
 */
export function normalizePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) =>
      GUID_SEGMENT.test(segment) || INT_SEGMENT.test(segment) ? ":id" : segment,
    )
    .join("/");
}

/** Fire a GA4 event. Safe to call unconditionally; no-ops without a measurement id. */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!measurementId) return;
  ensureInitialized(measurementId);
  window.gtag?.("event", name, {
    send_to: measurementId,
    debug_mode: debugMode(),
    ...params,
  });
}

const ONCE_PREFIX = "bigdays.analyticsOnce.";

/**
 * Fire at most once per tab. For milestones where the first occurrence is the
 * signal and repeats are noise — "did they interact with the demo at all".
 */
export function trackEventOnce(name: string, params: Record<string, unknown> = {}): void {
  if (!measurementId) return;
  const key = `${ONCE_PREFIX}${name}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or storage disabled: fall through and send it anyway.
  }
  trackEvent(name, params);
}

/** Route-change pageview. `pathname` is normalized here, not by the caller. */
export function trackPageView(pathname: string): void {
  if (!measurementId) return;
  const path = normalizePath(pathname);
  ensureInitialized(measurementId);
  window.gtag?.("event", "page_view", {
    send_to: measurementId,
    debug_mode: debugMode(),
    page_title: document.title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}
