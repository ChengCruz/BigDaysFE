// src/components/organisms/WhatsNewAnnouncer.tsx
//
// The gate for the "What's new" announcement. Mounted once, globally, next to
// ExportBackupReminder in AppLayout.
//
// Same shape as its neighbour and for the same reason: it renders on every
// authenticated page, so it must cost nothing for the majority of visits where
// there is nothing to announce. The modal body is only mounted once a release
// is actually pending.

import { useEffect, useState } from "react";

import { getPendingRelease } from "../../utils/whatsNew";
import { WhatsNewModal } from "../whatsNew/WhatsNewModal";

/** Let the page settle before interrupting, same as ExportBackupReminder. */
const OPEN_DELAY_MS = 1200;

export function WhatsNewAnnouncer() {
  const [open, setOpen] = useState(false);

  const pending = getPendingRelease();
  const pendingId = pending?.id;

  // Closing the modal records a dismissal (session or permanent, depending on
  // the tick), so the next getPendingRelease() returns null and this effect
  // can't re-arm the timer for it.
  useEffect(() => {
    if (!pendingId) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pendingId]);

  if (!pending || !open) return null;

  return <WhatsNewModal release={pending} onClose={() => setOpen(false)} />;
}
