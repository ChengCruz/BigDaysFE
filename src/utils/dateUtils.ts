/**
 * dateUtils.ts
 *
 * TIMEZONE RULE FOR THIS PROJECT:
 * --------------------------------
 * The backend stores all dates and times in UTC.
 * The app targets users in GMT+8 (Malaysia / Singapore / Philippines / HK).
 *
 * RULES:
 *  - When DISPLAYING data from the BE → convert UTC → GMT+8 before showing to user.
 *  - When POSTING data to the BE   → convert GMT+8 → UTC before sending.
 *
 * All timezone conversion should go through the helpers below so the rule
 * is enforced in one place and future developers know where to look.
 *
 * DO NOT use `new Date().toLocaleDateString()` or rely on the browser's local
 * timezone — the user's machine may be set to a different region and will
 * produce wrong results.
 */

const GMT8_OFFSET_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// ---------------------------------------------------------------------------
// UTC → GMT+8  (reading from BE / displaying to user)
// ---------------------------------------------------------------------------

/**
 * Given a UTC date string (YYYY-MM-DD) and UTC time string (HH:MM),
 * returns the equivalent date and time in GMT+8 as separate strings,
 * suitable for populating `<input type="date">` and `<input type="time">`.
 *
 * If no time is provided, the date is returned as-is (date-only fields
 * are treated as calendar dates and do not need timezone shifting).
 *
 * @example
 *   utcToGmt8Inputs("2025-09-03", "16:00") → { date: "2025-09-04", time: "00:00" }
 *   utcToGmt8Inputs("2025-09-03", undefined) → { date: "2025-09-03", time: "" }
 */
export function utcToGmt8Inputs(
  utcDate?: string | null,
  utcTime?: string | null
): { date: string; time: string } {
  if (!utcDate) return { date: "", time: "" };

  const timeStr = utcTime ? utcTime.slice(0, 5) : null; // "HH:MM"
  if (!timeStr) return { date: utcDate.slice(0, 10), time: "" };

  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return { date: utcDate.slice(0, 10), time: timeStr };

  const utc = new Date(
    `${utcDate.slice(0, 10)}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
  );
  if (isNaN(utc.getTime())) return { date: utcDate.slice(0, 10), time: timeStr };

  const gmt8 = new Date(utc.getTime() + GMT8_OFFSET_MS);
  const date = [
    gmt8.getUTCFullYear(),
    String(gmt8.getUTCMonth() + 1).padStart(2, "0"),
    String(gmt8.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const time = `${String(gmt8.getUTCHours()).padStart(2, "0")}:${String(gmt8.getUTCMinutes()).padStart(2, "0")}`;

  return { date, time };
}

/**
 * Given a UTC date string (YYYY-MM-DD) and UTC time string (HH:MM),
 * returns the time formatted as a 12-hour AM/PM string in GMT+8.
 *
 * @example
 *   utcToGmt8TimeDisplay("2025-09-03", "16:00") → "12:00 AM"
 */
export function utcToGmt8TimeDisplay(
  utcDate?: string | null,
  utcTime?: string | null
): string {
  if (!utcTime || !utcDate) return "";

  const [h, m] = utcTime.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return utcTime;

  const utc = new Date(
    `${utcDate.slice(0, 10)}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
  );
  if (isNaN(utc.getTime())) return utcTime;

  const gmt8 = new Date(utc.getTime() + GMT8_OFFSET_MS);
  const gh = gmt8.getUTCHours();
  const gm = gmt8.getUTCMinutes();
  const period = gh >= 12 ? "PM" : "AM";
  return `${gh % 12 || 12}:${String(gm).padStart(2, "0")} ${period}`;
}

// ---------------------------------------------------------------------------
// GMT+8 → UTC  (posting to BE)
// ---------------------------------------------------------------------------

/**
 * Given a GMT+8 date string (YYYY-MM-DD) and GMT+8 time string (HH:MM)
 * from a form input, returns the equivalent UTC date and time as separate
 * strings, ready to send to the backend API.
 *
 * @example
 *   gmt8ToUtcParts("2025-09-04", "00:00") → { date: "2025-09-03", time: "16:00" }
 */
export function gmt8ToUtcParts(
  gmt8Date: string,
  gmt8Time: string
): { date: string; time: string } {
  // Parse the GMT+8 input as if it were UTC, then subtract 8h to get real UTC
  const gmt8AsUtc = new Date(`${gmt8Date}T${gmt8Time}:00Z`);
  const utc = new Date(gmt8AsUtc.getTime() - GMT8_OFFSET_MS);
  return {
    date: utc.toISOString().slice(0, 10),  // "YYYY-MM-DD"
    time: utc.toISOString().slice(11, 16), // "HH:MM"
  };
}

// ---------------------------------------------------------------------------
// Date-only helpers (no time component)
// ---------------------------------------------------------------------------

/**
 * Converts a date-only string from an `<input type="date">` (YYYY-MM-DD, treated
 * as a calendar date in GMT+8) into a UTC ISO string for the backend.
 *
 * We use GMT+8 midnight as the canonical time so the calendar date is preserved
 * regardless of when the user saves — e.g. "2025-09-04" → "2025-09-03T16:00:00.000Z".
 *
 * Use this for fields like transactionDate, dueDate, etc.
 *
 * @example
 *   gmt8DateToUtcIso("2025-09-04") → "2025-09-03T16:00:00.000Z"
 */
export function gmt8DateToUtcIso(gmt8Date: string): string {
  // Treat the date as GMT+8 midnight, convert to UTC
  const gmt8AsUtc = new Date(`${gmt8Date}T00:00:00Z`);
  return new Date(gmt8AsUtc.getTime() - GMT8_OFFSET_MS).toISOString();
}

/**
 * Converts a UTC ISO datetime string from the backend back to a YYYY-MM-DD
 * date string in GMT+8, for populating `<input type="date">`.
 *
 * @example
 *   utcIsoToGmt8Date("2025-09-03T16:00:00.000Z") → "2025-09-04"
 */
export function utcIsoToGmt8Date(utcIso?: string | null): string {
  if (!utcIso) return "";
  const utc = new Date(utcIso);
  if (isNaN(utc.getTime())) return "";
  const gmt8 = new Date(utc.getTime() + GMT8_OFFSET_MS);
  return [
    gmt8.getUTCFullYear(),
    String(gmt8.getUTCMonth() + 1).padStart(2, "0"),
    String(gmt8.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
