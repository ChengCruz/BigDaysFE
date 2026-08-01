// src/components/organisms/ExportBackupReminder.tsx
//
// The gate for the paper-backup reminder. Mounted once, globally, next to
// HelpBubble in AppLayout.
//
// Deliberately hook-free beyond the event context: it renders on every
// authenticated page, so it must cost nothing for the ~majority of users who
// aren't inside the reminder window. The modal body — which is where the API
// hooks live — is only mounted once the reminder is actually due.

import { useEffect, useState } from "react";

import { useEventContext } from "../../context/EventContext";
import { daysUntilEvent } from "../../utils/eventUtils";
import { getDueStage } from "../../utils/exportReminder";
import { ExportBackupReminderModal } from "../pages/Guests/ExportBackupReminderModal";

/** Let the page settle before interrupting, same as HelpBubble's first-run hint. */
const OPEN_DELAY_MS = 1200;

export function ExportBackupReminder() {
  const { eventId, event } = useEventContext()!;
  const [open, setOpen] = useState(false);

  const daysLeft = daysUntilEvent(event?.date ?? event?.raw?.eventDate);
  const stage = getDueStage(eventId, daysLeft);

  // No need to reset `open` when the stage clears — the render guard below
  // already hides the modal, and closing it re-runs getDueStage (which now
  // sees the dismissal) so this effect won't re-arm the timer.
  useEffect(() => {
    if (!stage) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [stage, eventId]);

  if (!stage || !open || !eventId || daysLeft == null) return null;

  return (
    <ExportBackupReminderModal
      eventId={eventId}
      daysLeft={daysLeft}
      stage={stage}
      onClose={() => setOpen(false)}
    />
  );
}
