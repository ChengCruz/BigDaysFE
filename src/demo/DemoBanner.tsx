// src/demo/DemoBanner.tsx
//
// Persistent strip across the top of the demo. Two jobs, in this order:
// tell the visitor nothing here is real, and give them one obvious way out into
// a real account.
//
// Deliberately not dismissible. A visitor who forgets they're in a sample
// wedding and starts entering their own guest list would lose it when the tab
// closes, so the reminder has to outlast their attention span.

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { SparklesIcon, RefreshIcon } from "@heroicons/react/solid";

import { Button } from "../components/atoms/Button";
import { trackEvent, trackEventOnce } from "../utils/analytics";
import { resetDemoStore } from "./demoStore";
import { exitDemo } from "./demoMode";

export function DemoBanner() {
  const navigate = useNavigate();

  // demo_start is fired here rather than on the /demo entry route, because that
  // route hands off with a full page load and an async-loaded gtag would not
  // have flushed the beacon in time. This mounts on every demo page, and
  // trackEventOnce collapses that to one event per tab.
  useEffect(() => {
    trackEventOnce("demo_start");
  }, []);

  const startOwn = () => {
    trackEvent("demo_cta_click");
    // Leave demo mode before routing so the register page and everything after
    // it talks to the real API.
    exitDemo();
    navigate("/register");
  };

  const reset = () => {
    resetDemoStore();
    // The store is the source of truth for every query; a reload is the simplest
    // honest way to get all of them to re-read it at once.
    window.location.reload();
  };

  return (
    /*
     * Chrome, not content: CoupleShell renders this between its <header> and
     * <main>, outside the scroll container. It was briefly a `sticky` element
     * inside <main>, which meant page content slid underneath and left headings
     * half-covered. Sitting in the frame instead, it is always visible and never
     * overlaps anything, and it needs no negative margins to reach the edges.
     */
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-primary/20 bg-primary/10 px-4 py-2.5 md:px-6 dark:border-white/10 dark:bg-white/5">
      <p className="flex items-center gap-2 text-sm text-text dark:text-white">
        <SparklesIcon className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
        <span>
          <span className="font-semibold">Sample wedding.</span>{" "}
          <span className="text-text/70 dark:text-white/70">
            Change anything you like — nothing here is saved.
          </span>
        </span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={reset}
          className="!px-2.5 !py-1.5 text-xs"
          title="Put the sample wedding back how it was"
        >
          <RefreshIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </Button>
        <Button onClick={startOwn} className="!px-3 !py-1.5 text-sm">
          Start my own wedding
        </Button>
      </div>
    </div>
  );
}
