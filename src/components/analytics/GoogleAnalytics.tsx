import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type GtagArguments = [command: string, ...args: unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArguments) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

// Do not send authenticated pages or URLs containing user/event access tokens.
const PRIVATE_PATH_PREFIXES = [
  "/app",
  "/reset-password",
  "/verify-email",
  "/qr/lookup",
];

let initializedMeasurementId: string | undefined;

function isTrackablePath(pathname: string): boolean {
  // Track the generic /rsvp marketing page, but never event-specific RSVP URLs.
  if (pathname.startsWith("/rsvp/")) return false;

  return !PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function initializeGoogleAnalytics(id: string): void {
  if (initializedMeasurementId === id) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(..._args: GtagArguments) {
      // Match Google's canonical snippet: gtag queues its arguments object.
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

export function GoogleAnalytics() {
  const { pathname } = useLocation();
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;
    if (!isTrackablePath(pathname)) {
      lastTrackedPath.current = undefined;
      return;
    }
    if (lastTrackedPath.current === pathname) return;

    initializeGoogleAnalytics(measurementId);
    window.gtag?.("event", "page_view", {
      send_to: measurementId,
      debug_mode: new URLSearchParams(window.location.search).get("ga_debug") === "1",
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
    });
    lastTrackedPath.current = pathname;
  }, [pathname]);

  return null;
}
