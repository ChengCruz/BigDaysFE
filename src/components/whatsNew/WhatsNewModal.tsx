// src/components/whatsNew/WhatsNewModal.tsx
//
// The announcement itself. Mounted only when a release is actually pending
// (see WhatsNewAnnouncer).
//
// Closing this is not the same as reading it. A plain close ("Got it" or the
// X) only quiets the release for the rest of this browser session; it returns
// next time. The "don't show this again" tick is the only thing here that
// retires it for good.
//
// Same bargain as the export-backup reminder, and for the same reason: someone
// who closes a modal on their way to something else has not been told anything.

import { useState } from "react";
import { useNavigate } from "react-router";
import { SparklesIcon } from "@heroicons/react/solid";

import { Modal } from "../molecules/Modal";
import { Button } from "../atoms/Button";
import { ReleaseItemRow } from "./ReleaseItemRow";
import type { Release } from "./releases";
import { dismissForSession, markSeen } from "../../utils/whatsNew";

interface WhatsNewModalProps {
  release: Release;
  onClose: () => void;
}

export function WhatsNewModal({ release, onClose }: WhatsNewModalProps) {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const dismiss = () => {
    if (dontShowAgain) markSeen(release.id);
    else dismissForSession(release.id);
    onClose();
  };

  const seeEverything = () => {
    // The page marks everything read on arrival, so this is a full retirement
    // regardless of the tick.
    dismiss();
    navigate("/app/whats-new");
  };

  return (
    <Modal isOpen onClose={dismiss} showCloseButton title="What's new" className="max-w-xl">
      <div className="space-y-5" data-testid="whats-new-modal">
        <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 dark:border-white/10 dark:bg-white/5">
          <SparklesIcon className="h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            {/* One step above the body text, one below the modal's own "What's
                new" heading; the release name is the thing to read first. */}
            <p className="text-base font-bold text-text dark:text-white">{release.title}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {release.intro ?? "Here's what changed since you were last here."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {release.items.map((item) => (
            <ReleaseItemRow key={item.text} item={item} />
          ))}
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-white/10">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            Don't show this again
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={seeEverything}
              className="text-left text-sm text-gray-500 underline-offset-2 hover:text-primary hover:underline dark:text-gray-400"
            >
              See everything that's changed
            </button>
            <Button variant="primary" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
