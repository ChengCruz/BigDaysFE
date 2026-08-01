import type { FormFieldConfig } from "../api/hooks/useFormFieldsApi";

/** Formats an event date string as dd/MMM/yyyy, e.g. "01 Dec 2026" */
export function formatEventDate(dateStr?: string | null): string {
  if (!dateStr) return "Date pending";
  // The API may return a full datetime string (e.g. "2026-12-01T00:00:00" with no Z).
  // Without a timezone suffix, JS parses it as local time — in GMT+8 this shifts the
  // UTC value back by 8h and getUTCDate() returns the previous day (e.g. Nov 30).
  // Fix: always extract just the YYYY-MM-DD part and anchor it to UTC midnight.
  const datePart = dateStr.slice(0, 10); // "YYYY-MM-DD"
  const d = new Date(`${datePart}T00:00:00Z`);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en", { month: "short", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Whole days from today until the event date.
 *
 * Negative when the event has passed, 0 on the day itself, null when there is
 * no usable date. Uses the same YYYY-MM-DD slicing as formatEventDate above —
 * parsing the raw API string directly would land a day early in GMT+8. "Today"
 * is the user's local calendar day, also anchored to UTC midnight so the
 * subtraction compares like with like.
 */
export function daysUntilEvent(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today) / 86_400_000);
}

/**
 * Live countdown to the event — whole days, hours and minutes remaining.
 *
 * Anchors to the event's own start time when `timeStr` is given, so the hours
 * and minutes count down to the ceremony rather than to midnight on the day.
 * Event time is stored as local wall-clock time with no offset (see
 * formatEventTime below), so the target is built in local time on purpose —
 * this is the one place in this file that deliberately does NOT anchor to UTC.
 *
 * Returns null when there is no usable date, and zeroes once the moment passes.
 * Callers re-render on a timer; this reads Date.now() fresh on every call.
 */
export function countdownToEvent(
  dateStr?: string | null,
  timeStr?: string | null
): { days: number; hours: number; minutes: number } | null {
  if (!dateStr) return null;

  const parts = (timeStr ?? "").split(":").map(Number);
  const h = Number.isFinite(parts[0]) ? parts[0] : 0;
  const m = Number.isFinite(parts[1]) ? parts[1] : 0;
  const hhmm = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const target = new Date(`${dateStr.slice(0, 10)}T${hhmm}:00`);
  if (isNaN(target.getTime())) return null;

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

/**
 * Formats an event time string (HH:MM) as a 12-hour AM/PM string.
 *
 * NOTE: Event time is stored in the DB as local time (GMT+8) — no UTC conversion
 * is applied here. For UTC-stored datetimes (e.g. transactions, check-ins),
 * use utcToGmt8TimeDisplay() from dateUtils.ts instead.
 */
export function formatEventTime(dateStr?: string | null, timeStr?: string | null): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

export const TYPE_KEY_MAP: Record<number, FormFieldConfig["typeKey"]> = {
  0: "text", 1: "textarea", 2: "select", 3: "radio",
  4: "checkbox", 5: "email", 6: "number", 7: "date",
};
