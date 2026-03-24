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
