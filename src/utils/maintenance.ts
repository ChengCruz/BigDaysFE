// src/utils/maintenance.ts
// Tracks whether the API is down for maintenance. While the flag file exists on the
// VPS, nginx answers every API call with 503 {"maintenance": true}. During the
// restart of the container it answers 502/504, or the browser sees a network error.
// The API client reports failures here and MaintenanceScreen reads the flag.

type Listener = () => void;

let active = false;
let probing: Promise<boolean> | null = null;
const listeners = new Set<Listener>();

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
  set(next: boolean) {
    if (active === next) return;
    active = next;
    listeners.forEach((l) => l());
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

/** True only when /health answers 2xx. nginx answers 503 while the flag file exists. */
export async function checkApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(healthUrl(), { cache: "no-store", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
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
  if (active) return;
  const err = error as ApiFailure | null;
  if (!err || err.code === "ERR_CANCELED") return;

  const status = err.response?.status;
  if (status === 503 && err.response?.data?.maintenance === true) {
    maintenanceStore.set(true);
    return;
  }

  const unreachable = !err.response && Boolean(err.request);
  if (status !== 502 && status !== 503 && status !== 504 && !unreachable) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  probing ??= checkApiHealth().finally(() => {
    probing = null;
  });
  void probing.then((healthy) => {
    if (!healthy) maintenanceStore.set(true);
  });
}
