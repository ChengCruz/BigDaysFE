// src/context/UiModeContext.tsx
//
// Which shell the app renders: the couple-facing one (five sections, bottom tab
// bar on mobile) or the planner-facing one (today's fourteen-item sidebar).
//
// The role picks the default; the user can always override it and the choice
// sticks in localStorage. Nobody is locked out of planner features; see
// docs/COUPLE_MODE.md.
//
// NOTE: the UI calls these "simple view" and "advanced view"; the code keeps
// "couple" and "planner". The stored value is a persisted user preference, so
// renaming the union would silently reset everyone's saved choice to the role
// default. Change labels, not identifiers.

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../api/hooks/useAuth";
import { isDemoActive } from "../demo";

export type UiMode = "couple" | "planner";

const STORAGE_KEY = "uiMode";

/**
 * BE UserRole enum (see src/utils/jwtUtils.ts ROLE_MAP):
 * 1 SuperAdmin · 2 Admin · 3 User (Member) · 4 Vendor · 5 Guest · 6 Staff
 *
 * Members are couples planning their own event, so they get couple mode.
 * Everyone else runs other people's events and defaults to planner mode.
 * Role 6 (Crew) never reaches a shell; AppLayout redirects it to check-in.
 */
const MEMBER_ROLE = 3;

interface UiModeCtx {
  /** The mode actually in effect. */
  mode: UiMode;
  /** What the role alone would choose, ignoring any saved override. */
  defaultMode: UiMode;
  /** null when the user has not overridden the role default. */
  override: UiMode | null;
  /** Pass null to clear the override and fall back to the role default. */
  setMode: (m: UiMode | null) => void;
  toggle: () => void;
}

const UiModeContext = createContext<UiModeCtx>({
  mode: "planner",
  defaultMode: "planner",
  override: null,
  setMode: () => {},
  toggle: () => {},
});

export const useUiMode = () => useContext(UiModeContext);

function readOverride(): UiMode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "couple" || raw === "planner" ? raw : null;
  } catch {
    return null;
  }
}

export function UiModeProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const [override, setOverride] = useState<UiMode | null>(readOverride);

  const defaultMode: UiMode = userRole === MEMBER_ROLE ? "couple" : "planner";
  // A demo visitor has no role, so the role default would put them in planner
  // mode's fourteen-item sidebar — the exact "too enterprise" first impression
  // docs/COUPLE_MODE.md was written to avoid.
  //
  // This wins over a stored override, not merely over the role default, because
  // CoupleShell hides the "advanced view" switch in the demo: a returning
  // planner whose browser has uiMode=planner would otherwise be dropped into
  // planner mode with no control to leave it. It deliberately does not WRITE to
  // localStorage, so their real saved preference is untouched when they return.
  const demo = isDemoActive();
  const mode: UiMode = demo ? "couple" : (override ?? defaultMode);

  useEffect(() => {
    try {
      if (override) localStorage.setItem(STORAGE_KEY, override);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private browsing; the in-memory value still applies for this session */
    }
  }, [override]);

  const setMode = useCallback((m: UiMode | null) => setOverride(m), []);
  // Flips the mode actually on screen. Reading `mode` rather than
  // `override ?? defaultMode` matters wherever the two differ — in the demo the
  // role default is planner while couple is what's rendered, so deriving from
  // the default would make the first click a visual no-op.
  const toggle = useCallback(
    () => setOverride(mode === "couple" ? "planner" : "couple"),
    [mode]
  );

  const value = useMemo(
    () => ({ mode, defaultMode, override, setMode, toggle }),
    [mode, defaultMode, override, setMode, toggle]
  );

  return <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>;
}
