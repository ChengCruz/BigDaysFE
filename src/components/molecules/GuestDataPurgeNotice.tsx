import { useState } from "react";
import { Link } from "react-router";
import { InformationCircleIcon } from "@heroicons/react/solid";
import {
  daysUntilEvent,
  formatEventDate,
  guestDataPurgeDate,
} from "../../utils/eventUtils";

/** Days before the purge date from which the heads-up banner is shown. */
const WARNING_WINDOW_DAYS = 30;

const storageKey = (eventId: string) => `mbd.purgeNotice.${eventId}`;

function readDismissed(eventId: string): boolean {
  try {
    return localStorage.getItem(storageKey(eventId)) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(eventId: string) {
  try {
    localStorage.setItem(storageKey(eventId), "1");
  } catch {
    /* storage unavailable: the banner just hides for this visit */
  }
}

interface Props {
  eventId: string;
  eventDate?: string | null;
  guestDataPurgedAt?: string | null;
}

/**
 * One-time heads-up before guest data is removed (90 days after the event),
 * and a quiet note once it has been. Shown on the owner's event page only.
 */
export function GuestDataPurgeNotice({ eventId, eventDate, guestDataPurgedAt }: Props) {
  // Keyed by event so switching events re-reads that event's dismissal.
  const [dismissedFor, setDismissedFor] = useState<Record<string, boolean>>({});
  const dismissed = dismissedFor[eventId] ?? readDismissed(eventId);

  if (guestDataPurgedAt) {
    return (
      <p
        role="status"
        className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5"
      >
        <InformationCircleIcon className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Guest data was removed on {formatEventDate(guestDataPurgedAt)}, 90 days after the
          event. Names were replaced with anonymous labels and contact details were deleted.
        </span>
      </p>
    );
  }

  const purgeDate = guestDataPurgeDate(eventDate);
  const daysLeft = daysUntilEvent(purgeDate);
  if (!purgeDate || daysLeft === null) return null;
  // Outside the window, or the purge date has passed without a purge stamp
  // (the job may be pending): stay quiet rather than promise a date in the past.
  if (daysLeft > WARNING_WINDOW_DAYS || daysLeft < 0) return null;
  if (dismissed) return null;

  return (
    <div
      role="status"
      className="p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-accent dark:border-primary/30 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <InformationCircleIcon className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
      <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">
        Guest data for this event will be removed on {formatEventDate(purgeDate)}, 90 days after
        the event, as described in our{" "}
        <Link to="/privacy" className="text-primary underline">Privacy Notice</Link>. Export your
        guest list before then if you want to keep it.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/app/guests"
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90"
        >
          Go to guest list
        </Link>
        <button
          type="button"
          onClick={() => {
            writeDismissed(eventId);
            setDismissedFor((m) => ({ ...m, [eventId]: true }));
          }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:bg-accent dark:border-white/10 dark:text-white dark:hover:bg-white/10"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
