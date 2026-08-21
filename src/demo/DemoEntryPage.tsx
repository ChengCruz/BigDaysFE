// src/demo/DemoEntryPage.tsx
//
// The /demo route. Turns demo mode on, then hands off to the real app.
//
// The hand-off is a full page load rather than a client-side navigate, on
// purpose: EventProvider decides whether to run its events query during render,
// and it has no way to notice that a sessionStorage flag changed underneath it.
// Reloading with the flag already set means every provider initialises in demo
// mode on its first render, with no re-entrancy to reason about. A one-time
// entry route can afford one reload, and it guarantees a clean slate.

import { useEffect } from "react";
import { Navigate } from "react-router";

import { PageLoader } from "../components/atoms/PageLoader";
import { tokenStore } from "../utils/tokenStore";
import { enterDemo, isDemoEnabled } from "./demoMode";
import { resetDemoStore } from "./demoStore";

const DEMO_LANDING = "/app/guests";

export default function DemoEntryPage() {
  const disabled = !isDemoEnabled;
  // Already signed in: never shadow a real session with sample data.
  const loggedIn = Boolean(tokenStore.get());

  useEffect(() => {
    if (disabled || loggedIn) return;
    enterDemo();
    // Always open on the pristine wedding, so a shared link looks the same for
    // everyone regardless of what a previous visit left in this tab.
    resetDemoStore();
    window.location.replace(DEMO_LANDING);
  }, [disabled, loggedIn]);

  // Kill switch off: the route shouldn't exist. Send them somewhere real.
  if (disabled) return <Navigate to="/" replace />;
  if (loggedIn) return <Navigate to="/app" replace />;

  return <PageLoader />;
}
