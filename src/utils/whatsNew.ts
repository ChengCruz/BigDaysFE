// src/utils/whatsNew.ts
// ---------------------------------------------------------------------------
// State for the "What's new" announcement.
//
// WHY THIS EXISTS: we ship features and nobody finds out. A couple logs in
// after a deploy, sees a page that moved, and works it out alone.
//
// Dismissal works the same way as the export reminder (utils/exportReminder.ts):
// a plain close only quiets the announcement for the rest of this browser
// session, and it comes back next time. The ONLY thing that retires a release
// permanently is the "don't show this again" tick, or reading the full history
// at /app/whats-new, which is a stronger signal than closing a modal.
//
// The announcement still goes quiet on its own once `announceUntil` passes, so
// nothing nags forever.
//
// A first-ever login is NOT a special case: a live release fires there too.
//
// Everyone sees the same notes. An earlier version filtered items by UI mode;
// it was dropped because a change now lands in both views, so the split only
// created two versions of the truth to keep in step.
// ---------------------------------------------------------------------------
import { ANNOUNCE_WINDOW_DAYS, RELEASES, type Release } from "../components/whatsNew/releases";

const STORAGE_KEY = "bigdays.whatsNew.v1";
const SESSION_KEY = "bigdays.whatsNew.session";

const DAY_MS = 24 * 60 * 60 * 1000;

interface WhatsNewState {
  /** Epoch ms of this browser's first look. Informational. */
  firstSeenAt: number;
  /** Release ids retired for good: the "don't show again" tick, or the page. */
  seen: string[];
}

function readState(): WhatsNewState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    // A corrupt blob must not wedge the modal permanently open or permanently
    // shut, so every field is validated rather than trusted.
    const { firstSeenAt, seen } = parsed as Partial<WhatsNewState>;
    return {
      firstSeenAt:
        typeof firstSeenAt === "number" && Number.isFinite(firstSeenAt) ? firstSeenAt : 0,
      seen: Array.isArray(seen) ? seen.filter((id): id is string => typeof id === "string") : [],
    };
  } catch {
    return null;
  }
}

function writeState(state: WhatsNewState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode write errors */
  }
}

function readSessionDismissals(): Record<string, true> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, true>;
  } catch {
    return {};
  }
}

/** The moment an announcement goes quiet, whether or not anyone saw it. */
function announceDeadline(release: Release): number {
  if (release.announceUntil) {
    const explicit = Date.parse(release.announceUntil);
    if (Number.isFinite(explicit)) return explicit;
  }
  const published = Date.parse(release.date);
  if (!Number.isFinite(published)) return Number.POSITIVE_INFINITY;
  return published + ANNOUNCE_WINDOW_DAYS * DAY_MS;
}

/** Announceable right now, ignoring whether this browser has seen it. */
function isLive(release: Release, now: number): boolean {
  return release.announce === true && now <= announceDeadline(release);
}

/**
 * The release to announce right now, or null when nothing is due.
 *
 * A browser with no record is treated as never having seen anything, so a live
 * release fires on the very first login. It is not suppressed: someone new
 * still benefits from being pointed at the newest thing in the app, and the
 * only alternative is that the first release they ever hear about is the
 * *second* one we ship.
 *
 * The one place this stays quiet is an account with no event yet, since AppLayout
 * doesn't mount the announcer during that onboarding (see routes.tsx).
 */
export function getPendingRelease(): Release | null {
  const now = Date.now();
  const state = readState() ?? { firstSeenAt: now, seen: [] };
  const dismissedThisSession = readSessionDismissals();

  return (
    RELEASES.find(
      (release) =>
        isLive(release, now) &&
        !state.seen.includes(release.id) &&
        !dismissedThisSession[release.id]
    ) ?? null
  );
}

/**
 * Quiets a release for the rest of this browser session: a plain close, or
 * following a "Show me" link. It returns next session, which is the point:
 * closing a modal is not the same as saying you've read it.
 */
export function dismissForSession(id: string): void {
  try {
    const map = readSessionDismissals();
    map[id] = true;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {
    /* ignore; worst case the modal reappears on the next route change */
  }
}

/** Retires a release for good: the "don't show again" tick, or reading the page. */
export function markSeen(id: string): void {
  const state = readState() ?? { firstSeenAt: Date.now(), seen: [] };
  dismissForSession(id);
  if (state.seen.includes(id)) return;
  writeState({ ...state, seen: [...state.seen, id] });
}

/**
 * Whether the What's New link deserves a dot.
 *
 * Covers quiet releases too: those never open the modal, so this is the only
 * signal a user gets that the page has something new on it.
 */
export function hasUnseenRelease(): boolean {
  // No record means nothing has been read yet, not that nothing is new.
  const seen = readState()?.seen ?? [];
  return RELEASES.some((release) => !seen.includes(release.id));
}

/** Marks every release as read: what opening the page means. */
export function markAllSeen(): void {
  const state = readState() ?? { firstSeenAt: Date.now(), seen: [] };
  const merged = [...new Set([...state.seen, ...RELEASES.map((r) => r.id)])];
  if (merged.length === state.seen.length) return;
  writeState({ ...state, seen: merged });
}
