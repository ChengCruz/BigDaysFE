// src/context/UiModeContext.tsx
//
// Which shell the app renders: the couple-facing one (five sections, bottom tab
// bar on mobile) or the planner-facing one (today's fourteen-item sidebar).
//
// The role picks the default; the user can always override it and the choice
// sticks in localStorage. Nobody is locked out of planner features — see
// docs/COUPLE_MODE.md.
//
// NOTE — the UI calls these "simple view" and "advanced view"; the code keeps
// "couple" and "planner". The stored value is a persisted user preference, so
// renaming the union would silently reset everyone's saved choice to the role
// default. Change labels, not identifiers.

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../api/hooks/useAuth";

export type UiMode = "couple" | "planner";

const STORAGE_KEY = "uiMode";

/**
 * BE UserRole enum (see src/utils/jwtUtils.ts ROLE_MAP):
 * 1 SuperAdmin · 2 Admin · 3 User (Member) · 4 Vendor · 5 Guest · 6 Staff
 *
 * Members are couples planning their own event, so they get couple mode.
 * Everyone else runs other people's events and defaults to planner mode.
 * Role 6 (Crew) never reaches a shell — AppLayout redirects it to check-in.
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
  const mode = override ?? defaultMode;

  useEffect(() => {
    try {
      if (override) localStorage.setItem(STORAGE_KEY, override);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private browsing — the in-memory value still applies for this session */
    }
  }, [override]);

  const setMode = useCallback((m: UiMode | null) => setOverride(m), []);
  const toggle = useCallback(
    () => setOverride((prev) => ((prev ?? defaultMode) === "couple" ? "planner" : "couple")),
    [defaultMode]
  );

  const value = useMemo(
    () => ({ mode, defaultMode, override, setMode, toggle }),
    [mode, defaultMode, override, setMode, toggle]
  );

  return <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>;
}
