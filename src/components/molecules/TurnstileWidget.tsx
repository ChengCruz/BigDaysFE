// src/components/molecules/TurnstileWidget.tsx
// Dependency-free Cloudflare Turnstile widget. Loads Cloudflare's script on
// demand and renders the widget explicitly (no npm package required).
// Renders nothing when its effective site key is empty, so local/dev is
// completely unaffected.
import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "../../utils/turnstile";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Shared across all widget instances so the script is fetched only once.
let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile load failed")));
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile load failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface TurnstileWidgetProps {
  /** Called with a fresh token when the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when a previously-issued token expires — clear any stored token. */
  onExpire?: () => void;
  /** Called when the widget hard-errors (e.g. script blocked, network). */
  onError?: () => void;
  /** Site key override. Defaults to the shared VITE_TURNSTILE_SITE_KEY. */
  siteKey?: string;
  /** Optional label to distinguish widgets in Cloudflare analytics. */
  action?: string;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

/**
 * Renders a Cloudflare Turnstile challenge.
 *
 * Single-use tokens: after a form is submitted the token is consumed, so remount
 * this widget (e.g. via a changing `key`) to obtain a fresh one for a retry.
 */
export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  siteKey = TURNSTILE_SITE_KEY,
  action,
  theme = "auto",
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Keep the latest callbacks in refs so the widget is created once (not on
  // every parent re-render) yet never invokes a stale closure.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  const enabled = siteKey.trim().length > 0;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          action,
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onErrorRef.current?.(),
        });
      })
      .catch(() => {
        // Script blocked/unreachable — surface as a hard error so the form can
        // show a fallback and stay gated.
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null;
      }
    };
  }, [enabled, siteKey, theme, action]);

  if (!enabled) return null;
  return <div ref={containerRef} className={className} />;
}
