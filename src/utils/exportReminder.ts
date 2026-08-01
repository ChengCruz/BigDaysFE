// src/utils/exportReminder.ts
// ---------------------------------------------------------------------------
// State for the paper-backup reminder.
//
// WHY THIS EXISTS: a couple reached their venue, found the Wi-Fi and mobile
// data unusable, and could not log in to check anyone in. The app is useless
// offline, so as the big day approaches we nag the user into taking an offline
// copy of their guest list.
//
// The nag is deliberately persistent — it returns every browser session until
// the user acts. The only way to quiet it is the "don't show again" tick, which
// is a 15-day SNOOZE rather than a permanent opt-out: someone who dismisses at
// 30 days out gets one more prompt at the 15-day mark, which is exactly when
// the copy switches to its final wording.
// ---------------------------------------------------------------------------

/** Reminders start once the event is this many days away or nearer. */
export const START_THRESHOLD_DAYS = 30;
/** At or below this, the modal switches to its "last reminder" wording. */
export const FINAL_THRESHOLD_DAYS = 14;
/** How long the "don't show again" tick suppresses the reminder. */
export const SNOOZE_DAYS = 15;

const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;

const STORAGE_KEY = "bigdays.exportReminder.v1";
const SESSION_KEY = "bigdays.exportReminder.session";

export type ReminderStage = "standard" | "final";

interface ReminderState {
  /** Epoch ms; the reminder stays hidden until this moment. */
  snoozedUntil?: number;
}

type StateMap = Record<string, ReminderState>;

function readSnoozes(): StateMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    // Keep only well-formed entries — a corrupt blob must not wedge the modal
    // permanently open or permanently shut.
    const out: StateMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const until = (value as ReminderState)?.snoozedUntil;
      if (typeof until === "number" && Number.isFinite(until)) {
        out[id] = { snoozedUntil: until };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeSnoozes(map: StateMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
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

/**
 * Which stage to show right now, or null when the reminder stays hidden.
 *
 * Nothing fires on the event day itself or after it — by then a paper backup
 * can no longer be printed in time, so the prompt would only be noise.
 */
export function getDueStage(
  eventId: string | undefined,
  daysLeft: number | null
): ReminderStage | null {
  if (!eventId || daysLeft == null) return null;
  if (daysLeft > START_THRESHOLD_DAYS || daysLeft <= 0) return null;
  if (readSessionDismissals()[eventId]) return null;

  const snoozedUntil = readSnoozes()[eventId]?.snoozedUntil;
  if (snoozedUntil != null && Date.now() < snoozedUntil) return null;

  return daysLeft <= FINAL_THRESHOLD_DAYS ? "final" : "standard";
}

/** Hides the reminder for the rest of this browser session (a plain close). */
export function dismissForSession(eventId: string): void {
  try {
    const map = readSessionDismissals();
    map[eventId] = true;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {
    /* ignore — worst case the modal reappears on the next route change */
  }
}

/** Hides the reminder for SNOOZE_DAYS (the "don't show again" tick). */
export function snooze(eventId: string): void {
  const map = readSnoozes();
  map[eventId] = { snoozedUntil: Date.now() + SNOOZE_MS };
  writeSnoozes(map);
  dismissForSession(eventId);
}
