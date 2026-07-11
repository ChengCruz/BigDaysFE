// src/utils/practiceCheckIn.ts
// ---------------------------------------------------------------------------
// Self-contained "Practice Check-In" demo state.
//
// Lets an organiser rehearse the check-in flow on a set of SANDBOXED demo
// guests without touching any real event data (no BE calls, no real guest
// list, no QR tokens). Everything lives in localStorage.
//
// A checked-in demo guest automatically reverts to "Pending" after
// PRACTICE_RESET_MS (a few hours). This auto-reset is INTENTIONAL — it keeps
// the demo repeatable and stops it leaving stale "checked in" state lying
// around. It is NOT a bug, and the UI tells the user so.
// ---------------------------------------------------------------------------

/** How long a demo check-in stays "In" before it auto-reverts to Pending. */
export const PRACTICE_RESET_MS = 3 * 60 * 60 * 1000; // 3 hours

const STORAGE_KEY = "bigdays.practiceCheckIn.v1";

export interface PracticeGuest {
  id: string;
  name: string;
  phoneNo: string;
  pax: number;
  /** Family | Friend | VIP | Other — mirrors the real guest "flag". */
  guestType: string;
  /**
   * Stable demo QR payload for this guest. Rendered as a scannable QR in the
   * practice modal and recognised locally (never sent to the backend). The
   * distinctive prefix guarantees it can never collide with a real UUID token.
   */
  token: string;
}

/**
 * Static, sandboxed demo roster. The same three guests are reused everywhere —
 * they are never persisted to the backend and never appear in real stats.
 */
export const PRACTICE_GUESTS: PracticeGuest[] = [
  { id: "demo-1", name: "Alex Tan (demo)", phoneNo: "+60 12-345 6789", pax: 2, guestType: "Family", token: "bigdays-practice-qr-demo-1" },
  { id: "demo-2", name: "Priya Kumar (demo)", phoneNo: "+60 16-987 6543", pax: 1, guestType: "Friend", token: "bigdays-practice-qr-demo-2" },
  { id: "demo-3", name: "Wei Ming (demo)", phoneNo: "+60 19-222 3344", pax: 4, guestType: "VIP", token: "bigdays-practice-qr-demo-3" },
];

/**
 * Resolves a scanned/simulated QR payload to a demo guest id, or null if it
 * isn't one of our sandboxed demo QRs (e.g. a real guest QR, or random code).
 */
export function resolvePracticeToken(token: string): string | null {
  const trimmed = token.trim();
  return PRACTICE_GUESTS.find((g) => g.token === trimmed)?.id ?? null;
}

/** Map of demo guest id → epoch ms at which they were checked in. */
type CheckInMap = Record<string, number>;

function readRaw(): CheckInMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    // Keep only well-formed numeric entries.
    const out: CheckInMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeRaw(map: CheckInMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private-mode write errors */
  }
}

/**
 * Drops any check-ins older than the reset window and persists the pruned map
 * (only when something actually changed). Returns the live map.
 */
function pruneExpired(map: CheckInMap): CheckInMap {
  const now = Date.now();
  const next: CheckInMap = {};
  let changed = false;
  for (const [id, at] of Object.entries(map)) {
    if (now - at < PRACTICE_RESET_MS) next[id] = at;
    else changed = true;
  }
  if (changed) writeRaw(next);
  return next;
}

export interface PracticeStatus extends PracticeGuest {
  /** epoch ms of the demo check-in, or null when still pending. */
  checkedInAt: number | null;
  /** epoch ms when this guest will auto-revert to Pending, or null if pending. */
  resetsAt: number | null;
}

/** Current status of every demo guest, with expired check-ins already pruned. */
export function getPracticeStatuses(): PracticeStatus[] {
  const map = pruneExpired(readRaw());
  return PRACTICE_GUESTS.map((g) => {
    const at = map[g.id] ?? null;
    return { ...g, checkedInAt: at, resetsAt: at != null ? at + PRACTICE_RESET_MS : null };
  });
}

/** Records a demo check-in for the given guest id (no-op for unknown ids). */
export function checkInPractice(id: string): void {
  if (!PRACTICE_GUESTS.some((g) => g.id === id)) return;
  const map = pruneExpired(readRaw());
  map[id] = Date.now();
  writeRaw(map);
}

/** Reverts a single demo guest back to Pending. */
export function undoPractice(id: string): void {
  const map = pruneExpired(readRaw());
  if (id in map) {
    delete map[id];
    writeRaw(map);
  }
}

/** Reverts every demo guest back to Pending. */
export function resetAllPractice(): void {
  writeRaw({});
}
