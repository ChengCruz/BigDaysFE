// src/components/organisms/FeedbackNudgeBanner.tsx
//
// A short-lived banner for a handful of people we emailed for feedback and
// have not heard back from. The backend decides who sees it (private list in
// server config); this component only renders the answer and remembers a close.
//
// Inline at the top of the page content rather than fixed to the screen, so it
// cannot sit on top of the cookie banner, the help bubble or CoupleShell's
// mobile tab bar. Delete this file, its hook and the AppLayout line once
// feedback collection is done.

import { useState } from "react";
import { MailIcon, XIcon } from "@heroicons/react/solid";

import { useAuth } from "../../api/hooks/useAuth";
import { useFeedbackNudge } from "../../api/hooks/useFeedbackNudgeApi";
import { closeNudge, isNudgeClosed } from "../../utils/feedbackNudge";

export function FeedbackNudgeBanner() {
  const { user, userGuid } = useAuth();
  const { data: show } = useFeedbackNudge(userGuid, true);
  const [closedFor, setClosedFor] = useState<Record<string, boolean>>({});

  if (!show || !userGuid) return null;
  if (closedFor[userGuid] ?? isNudgeClosed(userGuid)) return null;

  return (
    <div
      role="status"
      data-testid="feedback-nudge-banner"
      className="mb-4 p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-accent dark:border-primary/30 flex items-start gap-3"
    >
      <MailIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm text-gray-700 dark:text-gray-200 flex-1 min-w-0 space-y-1.5">
        <p className="font-medium">Hi {user?.email},</p>
        <p>
          I'm Jason, the person who built MYBigDay. Thank you for using our platform to plan
          your big day.
        </p>
        <p>
          I sent you an email with a few questions, from "Jason from MYBigDay"
          (admin@bigdaysmanager.com). Reply if you'd like to, and no worries if you don't. Maybe
          it ended up in your junk folder.
        </p>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={() => {
          closeNudge(userGuid);
          setClosedFor((m) => ({ ...m, [userGuid]: true }));
        }}
        className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 shrink-0"
      >
        <XIcon className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
