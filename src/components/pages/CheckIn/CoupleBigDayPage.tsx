// src/components/pages/CheckIn/CoupleBigDayPage.tsx
//
// Couple-mode Big Day. Same route (/app/checkin) and the same scanner — what
// changes is that the day-of helper list is reachable from the section that
// already owns it.
//
// `coupleSections.ts` maps BOTH /app/checkin and /app/crew to the Big Day tab,
// so standing on crew lights this tab up. Until this page existed the tab still
// navigated to check-in and nothing on it led onward, so crew hung off the rail
// footer instead — an event-scoped list wedged between two account-level links,
// and on mobile it lived in the avatar menu where nobody looks for it.
//
// The row below is now the ONLY path to /app/crew in couple mode. If you rework
// this page, keep one.
//
// The scanner itself is `CheckInPage`, untouched and shared with planner mode
// and with the crew role — this file only prepends to it.

import { Link } from "react-router";
import { ChevronRightIcon, IdentificationIcon } from "@heroicons/react/solid";

import CheckInPage from "./CheckInPage";
import { useEventContext } from "../../../context/EventContext";
import { useCrewListApi } from "../../../api/hooks/useCrewApi";

export default function CoupleBigDayPage() {
  const { eventId } = useEventContext()!;
  const { data: crew = [], isLoading } = useCrewListApi(eventId);

  const active = crew.filter((c) => c.isActive).length;

  // Three states, because "0 helpers" and "3 helpers, all switched off" are
  // different problems on the morning of the wedding.
  const summary = isLoading
    ? "Checking who's helping…"
    : active > 0
      ? `${active} ${active === 1 ? "person" : "people"} can scan guests in on the day`
      : crew.length > 0
        ? "Everyone you added is switched off right now"
        : "No one yet — you'll be checking guests in on your own";

  return (
    <>
      {/* Hidden until an event exists, because CheckInPage below renders
          NoEventsState in that case and a helper row would dangle above it. */}
      {eventId && (
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Link
            to="/app/crew"
            className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white px-4 py-3.5
                       transition-colors hover:border-primary/25 hover:bg-primary/5"
          >
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-sect-bigday/12 text-sect-bigday">
              <IdentificationIcon className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-text">Your helpers</span>
              <span className="block truncate text-[12.5px] text-text/55">{summary}</span>
            </span>

            <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {isLoading ? "…" : crew.length > 0 ? "Manage" : "Add helpers"}
            </span>
            <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-text/30" />
          </Link>
        </div>
      )}

      <CheckInPage />
    </>
  );
}
