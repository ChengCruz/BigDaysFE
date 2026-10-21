import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrandLogo } from "../atoms/BrandLogo";
import { Button } from "../atoms/Button";
import { checkApiHealth, maintenanceStore } from "../../utils/maintenance";

const RECHECK_SECONDS = 30;

/**
 * Full-page screen shown while the API is down for maintenance. It sits over the app
 * instead of replacing it, so a page the user was on keeps its unsaved state. It checks
 * the API every 30 seconds and goes away on its own once the API answers again.
 */
export default function MaintenanceScreen() {
  const on = useSyncExternalStore(maintenanceStore.subscribe, maintenanceStore.getSnapshot);
  return on ? <MaintenanceView /> : null;
}

/** Mounted only while maintenance is on, so every outage starts its countdown from 30. */
function MaintenanceView() {
  const queryClient = useQueryClient();
  const [secondsLeft, setSecondsLeft] = useState(RECHECK_SECONDS);
  const [checking, setChecking] = useState(false);
  const busy = useRef(false);
  const remaining = useRef(RECHECK_SECONDS);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setChecking(true);
    const healthy = await checkApiHealth();
    busy.current = false;
    setChecking(false);
    if (healthy) {
      if (maintenanceStore.reloadWhenBack) {
        // The session restore never ran, so start the app over from the same URL.
        window.location.reload();
        return;
      }
      maintenanceStore.set(false);
      // Queries that failed during the outage load again.
      void queryClient.invalidateQueries();
    } else {
      remaining.current = RECHECK_SECONDS;
      setSecondsLeft(RECHECK_SECONDS);
    }
  }, [queryClient]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (remaining.current > 0) remaining.current -= 1;
      setSecondsLeft(remaining.current);
      if (remaining.current === 0 && !busy.current) void check();
    }, 1000);
    return () => clearInterval(timer);
  }, [check]);

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-background px-4 py-10 text-text dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-full max-w-md items-center">
        <div
          role="status"
          aria-live="polite"
          className="flex w-full flex-col items-center gap-3 rounded-2xl border border-primary/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900"
        >
          <BrandLogo tone="full" height={72} alt="MYBigDay" />
          <span className="mt-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Scheduled maintenance
          </span>
          <h1 className="mt-2 text-balance text-2xl font-bold">
            We&apos;re updating{" "}
            {/* Brand name coloured like the logo: gold "MY", rose "BigDay". */}
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, whiteSpace: "nowrap" }}>
              <span style={{ color: "var(--color-gold, #A9895A)" }}>MY</span>
              <span style={{ color: "var(--color-terracotta, #B4543A)" }}>BigDay</span>
            </span>
          </h1>
          <p className="max-w-[40ch] text-balance text-sm text-text/70 dark:text-white/70">
            We&apos;re releasing an update with new features and fixes.
          </p>
          <p className="max-w-[40ch] text-balance text-sm text-text/70 dark:text-white/70">
            We&apos;ll be back in a few minutes.
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm tabular-nums text-text/70 dark:text-white/70">
            <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500 motion-safe:animate-pulse" />
            {checking ? "Checking now..." : `Checking again in ${secondsLeft}s`}
          </p>
          <Button onClick={() => void check()} loading={checking}>
            Try again now
          </Button>
          <p className="mt-2 max-w-[44ch] text-balance border-t border-primary/10 pt-4 text-xs text-text/50 dark:border-white/10 dark:text-white/50">
            Sharing an RSVP link with guests? It will work again as soon as we are back.
          </p>
        </div>
      </div>
    </div>
  );
}

