// src/utils/maintenance.ts
// Tracks whether the API is down for maintenance. While the flag file exists on the
// VPS, nginx answers every API call with 503 {"maintenance": true}. During the
// restart of the container it answers 502/504, or the browser sees a network error.
// The API client reports failures here, startHealthWatch checks /health when the app
// loads, and MaintenanceScreen reads the flag.

type Listener = () => void;

let active = false;
// True once nginx answered with the maintenance marker (a planned window, not a crash).
let planned = false;
let probing: Promise<ProbeResult> | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export const maintenanceStore = {
  /**
   * Set when the session restore on startup could not run because the API was down.
   * The screen then reloads the page once the API is back, instead of only hiding.
   */
  reloadWhenBack: false,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => active,
  getPlanned: () => planned,
  set(next: boolean) {
    if (active === next) return;
    active = next;
    if (!next) planned = false;
    notify();
  },
  /** nginx sent the maintenance marker, so this is the planned window. */
  markPlanned() {
    if (planned) return;
    planned = true;
    notify();
  },
};

const HEALTH_TIMEOUT_MS = 8000;

/** The API's unversioned liveness probe: VITE_API_BASE is `<origin>/api/v1`, health is `<origin>/health`. */
export function healthUrl(): string {
  const base = import.meta.env.VITE_API_BASE ?? "";
  try {
    return new URL("/health", new URL(base, window.location.href)).toString();
  } catch {
    return "/health";
  }
}

export interface ProbeResult {
  healthy: boolean;
  /** The 503 carried the maintenance marker. */
  planned: boolean;
}

/** One /health call. Healthy only on 2xx; nginx answers 503 + marker while the flag file exists. */
export async function probeApi(): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(healthUrl(), { cache: "no-store", signal: controller.signal });
    if (res.ok) return { healthy: true, planned: false };
    let marker = false;
    if (res.status === 503) {
      try {
        marker = ((await res.json()) as { maintenance?: unknown })?.maintenance === true;
      } catch {
        marker = false;
      }
    }
    return { healthy: false, planned: marker };
  } catch {
    return { healthy: false, planned: false };
  } finally {
    clearTimeout(timer);
  }
}

/** True only when /health answers 2xx. */
export async function checkApiHealth(): Promise<boolean> {
  return (await probeApi()).healthy;
}

/** Switch the screen on from a failed probe. */
function applyProbe(result: ProbeResult) {
  if (result.healthy) return;
  if (result.planned) maintenanceStore.markPlanned();
  maintenanceStore.set(true);
}

interface ApiFailure {
  code?: string;
  request?: unknown;
  response?: { status?: number; data?: { maintenance?: unknown } };
}

/** A 502, 503, 504 or no answer at all: the server could not be reached, as opposed to refusing the request. */
export function isServerUnavailable(error: unknown): boolean {
  const err = error as ApiFailure | null;
  if (!err || err.code === "ERR_CANCELED") return false;
  const status = err.response?.status;
  if (status === undefined) return Boolean(err.request);
  return status === 502 || status === 503 || status === 504;
}

/**
 * Called by the API client for every failed call. A 503 carrying the maintenance
 * marker switches the screen on at once. A 502, 503, 504 or a network error could also
 * be a single slow endpoint or an offline browser, so those only switch it on when
 * the browser is online and the health check fails too.
 */
export function reportApiFailure(error: unknown): void {
  const err = error as ApiFailure | null;
  if (!err || err.code === "ERR_CANCELED") return;

  const status = err.response?.status;
  if (status === 503 && err.response?.data?.maintenance === true) {
    maintenanceStore.markPlanned();
    maintenanceStore.set(true);
    return;
  }
  if (active) return;

  const unreachable = !err.response && Boolean(err.request);
  if (status !== 502 && status !== 503 && status !== 504 && !unreachable) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  probing ??= probeApi().finally(() => {
    probing = null;
  });
  void probing.then(applyProbe);
}

/**
 * Checks /health once when the app loads, and again when the tab becomes visible or
 * the browser comes back online. This is what puts pages that make no API call of
 * their own (the landing page) into maintenance together with the rest of the site.
 * `skip` lets the caller opt out, for example in demo mode, which needs no API.
 */
export function startHealthWatch(skip?: () => boolean): () => void {
  let running = false;
  const run = async () => {
    if (running || active) return;
    if (skip?.()) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    running = true;
    try {
      applyProbe(await probeApi());
    } finally {
      running = false;
    }
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") void run();
  };

  void run();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", run);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", run);
  };
}
