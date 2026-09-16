// src/utils/analytics.ts
//
// GA4 event plumbing, shared by the route-level pageview tracker
// (components/analytics/GoogleAnalytics.tsx) and by the handful of call sites
// that report a conversion step.
//
// Everything here is a no-op when VITE_GA_MEASUREMENT_ID is unset or malformed,
// which is the case for local, test and Playwright builds. That is deliberate:
// nothing should have to guard its own trackEvent call.

import { getAnalyticsConsent } from "./cookieConsent";

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

/**
 * Loads gtag.js on first use. Called lazily so untracked visits stay script-free.
 *
 * GA4 Consent Mode v2: default is "denied" until the cookie banner records a
 * choice (LEGAL_TODO item 3), so the very first gtag call — even on a build
 * with no prior decision — must set consent before "config" ever runs, or GA
 * ends up storage-capable by default for a moment.
 */
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

  window.gtag("consent", "default", {
    analytics_storage: getAnalyticsConsent() === "granted" ? "granted" : "denied",
    wait_for_update: 500,
  });
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });
  // A login that happened before gtag loaded (the usual order: auth resolves
  // from a stored token, then the first trackEvent pulls gtag in) would
  // otherwise be attributed to an anonymous client.
  applyUserId();

  if (!document.getElementById("google-analytics-gtag")) {
    const script = document.createElement("script");
    script.id = "google-analytics-gtag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  initializedMeasurementId = id;
}

/**
 * Applies a fresh consent choice from the cookie banner (LEGAL_TODO item 3).
 *
 * A "denied" pick when gtag has never loaded is a no-op rather than a reason
 * to load it: `ensureInitialized` would read the same "denied" straight back
 * out of storage anyway, so loading gtag.js purely to tell it "denied" would
 * make "Reject" the one choice that causes a network request — the opposite
 * of what a genuine reject option is for.
 */
export function updateAnalyticsConsent(choice: "granted" | "denied"): void {
  if (!measurementId) return;
  if (choice === "denied" && !window.gtag) return;
  ensureInitialized(measurementId);
  window.gtag?.("consent", "update", { analytics_storage: choice });
}

/** Per-visit opt-in via ?ga_debug=1, so DebugView can be used without a build. */
function debugMode(): boolean {
  return new URLSearchParams(window.location.search).get("ga_debug") === "1";
}

// ─── Ambient context ────────────────────────────────────────────────────────
//
// Two things every event should carry, neither of which the call site knows.
//
// `ui_mode` matters more than it looks: couple and planner mode render
// different components on the SAME routes (routes.tsx swaps Couple* pages in),
// so without it `/app/dashboard` is two different pages reported as one, and
// no usage number can be attributed to either shell.

/**
 * Merged into every event. Empty until the providers below report in.
 *
 * `is_demo` matters as much as `ui_mode`, and for a sharper reason: demo mode is
 * an axios adapter (src/demo/demoAdapter.ts), so a demo visitor's writes resolve
 * as successful mutations and every `onSuccess` in the app runs normally. Their
 * clicking through the sample wedding would otherwise land in `feature_used`
 * indistinguishable from a real couple seating their real guests, and the
 * feature-usage table would mostly measure the demo. Filter it out in GA (§4).
 */
const ambient: { ui_mode?: string; is_demo?: boolean } = {};

/** Kept so a login mid-session can be applied even if gtag loads later. */
let pendingUserId: string | undefined;

function applyUserId(): void {
  if (!pendingUserId || !window.gtag) return;
  // "set" rather than a fresh "config": config would re-register the stream and
  // can re-trigger a page_view on some gtag versions, and we send those by hand.
  window.gtag("set", { user_id: pendingUserId });
}

/**
 * Which shell the user is in, and whether this is the sample wedding. Called by
 * UiModeProvider, which is the only place that knows either: the effective mode
 * includes the role-derived default and the demo override, neither of which
 * localStorage records (UiModeContext.tsx stores an explicit override only).
 */
export function setAnalyticsContext(next: { ui_mode: string; is_demo: boolean }): void {
  ambient.ui_mode = next.ui_mode;
  ambient.is_demo = next.is_demo;
}

/**
 * Ties this browser to an account, so a visitor who browsed anonymously and
 * signed up later is one user rather than two. Pass the user GUID — never an
 * email or a name; Google's terms prohibit sending PII, and a GUID is the
 * pseudonymous id `user_id` is designed for.
 *
 * Pass null on logout so the next person on a shared laptop is not attributed
 * to the previous one.
 */
export function setAnalyticsUser(userId: string | null): void {
  if (!measurementId) return;
  pendingUserId = userId ?? undefined;
  if (!userId) {
    window.gtag?.("set", { user_id: null });
    return;
  }
  applyUserId();
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
    ...ambient,
    ...params,
  });
}

/**
 * The usage inventory: one event name, `feature_used`, carrying `module` and
 * `action`.
 *
 * Deliberately not one event name per action. There are ~60 write actions in
 * this app; as distinct names they would be 60 rows to register, they would eat
 * into GA4's 500-event-name cap, and — the real problem — an action nobody ever
 * performs would simply never appear, so "which features are unused" could only
 * be answered by remembering what you expected to see. As one event with two
 * parameters it is a single breakdown table, and a zero row is visible as a
 * zero.
 *
 * The named milestone events (`event_created`, `guest_added`, `guest_seated`,
 * `sign_up_*`, `login`) still fire alongside this for the handful of steps that
 * are funnel rungs and are already registered as key events in GA. That means a
 * guest creation produces BOTH `guest_added` and a `feature_used` row — never
 * add the two together. `feature_used` is the complete inventory; the named
 * events are a labelled subset of it.
 */
export function trackAction(
  module: string,
  action: string,
  params: Record<string, unknown> = {},
): void {
  trackEvent("feature_used", { module, action, ...params });
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
    ...ambient,
    page_title: document.title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}
