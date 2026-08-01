// src/components/pages/Dashboard/CoupleHomePage.tsx
//
// Couple-mode Home. Same single endpoint as MemberDashboardPage
// (GET /Dashboard/summary via useDashboardApi) — no new endpoint, no extra
// query, no backend change. What changes is that the page answers one question
// ("what do we do next?") instead of laying out six equal panels.
//
// ── Counting rules: party, exactly as the backend counts ──────────────────
// Every number in `tableStats` is a ROW count, and one Guest row is one RSVP
// *party*, not one person (docs/COUPLE_MODE.md → "The Guest / RSVP model").
// So this page speaks in parties and never converts to head count client-side:
//
//   tableStats.assignedGuests    parties that have a table
//   tableStats.unassignedGuests  parties still needing one
//   assigned + unassigned        every party on the list
//
// The one genuine head count on the page is `rsvpStats.totalGuestsConfirmed`,
// which the backend computes as SUM(NoOfPax) over confirmed RSVPs
// (DashboardHandler.BuildRsvpStats). That one is labelled "people"; nothing
// else is.
//
// `tableStats.occupiedSeats` is deliberately unused. The backend assigns it
// `= assignedGuests` (DashboardHandler.cs:199, comment "Assuming 1 guest = 1
// seat"), so it is a party count wearing a seat label — pairing it with
// `totalSeats` in one ratio would mix units and under-report. The seating
// meter below is parties/parties instead, which is unit-clean and needs
// nothing from the backend.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationIcon,
  LocationMarkerIcon,
  MailIcon,
  QrcodeIcon,
  SparklesIcon,
  TableIcon,
} from "@heroicons/react/solid";

import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { StatsCard } from "../../atoms/StatsCard";
import { BrandWordmark } from "../../atoms/BrandWordmark";
import { NoEventsState } from "../../molecules/NoEventsState";

import { useEventContext } from "../../../context/EventContext";
import { useDashboardApi } from "../../../api/hooks/useDashboardApi";
import {
  formatEventDate,
  formatEventTime,
  daysUntilEvent,
  countdownToEvent,
} from "../../../utils/eventUtils";
import {
  ALMOST_THERE_MSGS,
  ALMOST_THERE_DAYS,
  FAR_MSGS,
  randomMsg,
} from "../../../utils/countdownMessages";

/** Relative time for the activity feed. Mirrors MemberDashboardPage. */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp.endsWith("Z") ? timestamp : `${timestamp}Z`);
  const mins = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * The readiness ring. Percent comes from the backend already rounded to 1dp and
 * already guarded against a zero-item checklist (DashboardHandler.BuildChecklistStats),
 * so this only has to draw it.
 */
function ReadinessRing({ percent }: { percent: number }) {
  const RADIUS = 26;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * CIRCUMFERENCE;

  return (
    <span className="relative grid h-16 w-16 flex-shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="6" className="stroke-primary/12" />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          className="stroke-sect-home transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="absolute text-[13px] font-bold text-text">{Math.round(percent)}%</span>
    </span>
  );
}

/** The single next action, plus the optional progress meter that belongs to it. */
interface NextAction {
  tone: "primary" | "amber" | "calm";
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  cta?: { label: string; to: string };
  /** Parties seated / parties total — only set when the action is seating. */
  meter?: { done: number; total: number; caption: string };
}

export default function CoupleHomePage() {
  const navigate = useNavigate();
  const { eventId, eventsLoading } = useEventContext()!;
  const { data: dashboard, isLoading, isError } = useDashboardApi(eventId || "");

  // A minute tick drives both the countdown tiles and the overnight rollover of
  // `days`. Both are read fresh on every render rather than memoised, so the
  // tick is the only thing they need — memoising on eventDate alone would have
  // frozen them for as long as the page stayed open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const eventDate = dashboard?.eventStats?.eventDate;
  const eventTime = dashboard?.eventStats?.eventTime;

  // Whole calendar days, for the next-action ladder below. Slices YYYY-MM-DD and
  // anchors to UTC midnight — parsing the raw API string lands a day early in
  // GMT+8 (see eventUtils.ts:6-11).
  const days = daysUntilEvent(eventDate);

  // The display countdown, which counts to the ceremony time rather than to
  // midnight. It can read one day lower than `days` late in the evening — that
  // is correct, and why the ladder does not use it.
  const countdown = countdownToEvent(eventDate, eventTime);

  // Picked once per mount so the line doesn't reshuffle on every tick.
  const almostMsg = useMemo(() => randomMsg(ALMOST_THERE_MSGS), []);
  const farMsg = useMemo(() => randomMsg(FAR_MSGS), []);

  const next = useMemo<NextAction | null>(() => {
    if (!dashboard) return null;
    const { rsvpStats: r, tableStats: t, budgetStats: b } = dashboard;

    const parties = t.assignedGuests + t.unassignedGuests;
    const seatingMeter = {
      done: t.assignedGuests,
      total: parties,
      caption: `${t.assignedGuests} of ${parties} ${plural(parties, "party", "parties")} seated`,
    };

    if (days !== null && days < 0)
      return {
        tone: "calm",
        Icon: SparklesIcon,
        title: "Your big day has passed",
        body: "The celebration is over but your story together goes on. Everything here stays available.",
      };

    if (days === 0)
      return {
        tone: "primary",
        Icon: QrcodeIcon,
        title: "It's today 💍",
        body: "Open check-in and start scanning passes as everyone arrives.",
        cta: { label: "Open check-in", to: "/app/checkin" },
      };

    if (r.totalRsvpsReceived === 0)
      return {
        tone: "primary",
        Icon: MailIcon,
        title: "Invite your first guests",
        body: "Nobody has been invited yet. Add your guest list and share the invitation link.",
        cta: { label: "Start inviting", to: "/app/guests" },
      };

    if (t.totalTables === 0 && parties > 0)
      return {
        tone: "primary",
        Icon: TableIcon,
        title: "Add your first table",
        body: `${parties} ${plural(parties, "party has", "parties have")} said yes, but there is nowhere to seat them yet.`,
        cta: { label: "Add a table", to: "/app/tables/v3" },
      };

    if (t.unassignedGuests > 0)
      return {
        tone: "primary",
        Icon: TableIcon,
        title: `${t.unassignedGuests} ${plural(t.unassignedGuests, "party", "parties")} still ${plural(t.unassignedGuests, "needs", "need")} a seat`,
        body: "A party always sits together, so each one takes a whole group of seats.",
        cta: { label: "Sort the seating", to: "/app/tables/v3" },
        meter: seatingMeter,
      };

    if (r.pendingCount > 0)
      return {
        tone: "amber",
        Icon: MailIcon,
        title: `${r.pendingCount} ${plural(r.pendingCount, "invite is", "invites are")} still waiting on a reply`,
        body: "A gentle nudge usually does it — you can see who hasn't answered on your guest list.",
        cta: { label: "See who's pending", to: "/app/guests" },
      };

    if (b.status === "over_budget")
      return {
        tone: "amber",
        Icon: CurrencyDollarIcon,
        title: "You're over budget",
        body: `Spending is at ${b.spentPercentage}% of what you set aside. Worth a look before the next payment.`,
        cta: { label: "Check the money", to: "/app/budget" },
      };

    return {
      tone: "calm",
      Icon: CheckCircleIcon,
      title: "Everything's on track",
      body: "Replies are in, everyone has a seat and the money is under control. Enjoy the wait.",
      meter: parties > 0 ? seatingMeter : undefined,
    };
  }, [dashboard, days]);

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (!eventId) {
    if (eventsLoading) return <PageLoader message="Loading…" />;
    return (
      <NoEventsState
        title={<>Welcome to <BrandWordmark /> ✨</>}
        message="Create your wedding to start planning — your countdown, guest list and seating all live here."
      />
    );
  }
  if (isLoading || (!dashboard && !isError)) return <PageLoader message="Loading your big day…" />;
  if (isError || !dashboard)
    return (
      <ErrorState
        message="We couldn’t load your big day."
        onRetry={() => window.location.reload()}
      />
    );

  const { eventStats: e, rsvpStats: r, tableStats: t, checklistStats: c } = dashboard;
  const replied = r.comingCount + r.notComingCount;

  const toneClasses: Record<NextAction["tone"], { card: string; chip: string; cta: string }> = {
    primary: {
      card: "bg-primary text-white shadow-md",
      chip: "bg-white/20",
      cta: "border-white/55 hover:border-white hover:bg-white/15",
    },
    amber: {
      card: "bg-amber-500 text-white shadow-md",
      chip: "bg-white/20",
      cta: "border-white/55 hover:border-white hover:bg-white/15",
    },
    calm: {
      card: "border border-primary/10 bg-accent/40 text-text",
      chip: "bg-sect-home/15 text-sect-home",
      cta: "border-primary/25 text-text hover:border-primary/50 hover:bg-white",
    },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─── The day itself ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-button to-secondary p-6 text-white shadow-xl shadow-primary/25 sm:p-8">
        <div className="absolute top-0 right-0 h-64 w-64 -translate-y-32 translate-x-32 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/2 h-48 w-48 translate-y-24 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{e.eventName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/80">
              {e.eventDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                  {formatEventDate(e.eventDate)}
                </span>
              )}
              {e.eventTime && (
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4 flex-shrink-0" />
                  {formatEventTime(e.eventDate, e.eventTime)}
                </span>
              )}
              {e.eventLocation && (
                <span className="flex items-center gap-1.5">
                  <LocationMarkerIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{e.eventLocation}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            {days === null ? (
              <p className="text-[15px] font-medium text-white/90">Set a date to start the countdown</p>
            ) : days > 0 && countdown ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["Days", countdown.days],
                      ["Hours", countdown.hours],
                      ["Minutes", countdown.minutes],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm sm:px-4"
                    >
                      <p className="text-3xl font-bold leading-none sm:text-4xl">{value}</p>
                      <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wider text-white/70">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[13px] font-medium text-white/90">
                  {countdown.days < ALMOST_THERE_DAYS ? almostMsg : farMsg}
                </p>
              </>
            ) : days === 0 ? (
              <p className="text-2xl font-bold">Today is the day 💍</p>
            ) : (
              <p className="text-[15px] font-medium text-white/90">
                {Math.abs(days)} {plural(Math.abs(days), "day", "days")} ago 🤍
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── The one thing next ───────────────────────────────────────────── */}
      {next && (
        <div className={`flex items-start gap-3 rounded-2xl px-4 py-4 ${toneClasses[next.tone].card}`}>
          <span
            className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${toneClasses[next.tone].chip}`}
          >
            <next.Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">{next.title}</p>
            <p className={`text-[13px] ${next.tone === "calm" ? "text-text/65" : "text-white/90"}`}>
              {next.body}
            </p>

            {next.meter && next.meter.total > 0 && (
              <div className="mt-3">
                <div
                  className={`h-2 w-full overflow-hidden rounded-full ${
                    next.tone === "calm" ? "bg-primary/10" : "bg-white/25"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      next.tone === "calm" ? "bg-sect-seating" : "bg-white"
                    }`}
                    style={{ width: `${Math.round((next.meter.done / next.meter.total) * 100)}%` }}
                  />
                </div>
                <p
                  className={`mt-1.5 text-[12px] ${
                    next.tone === "calm" ? "text-text/55" : "text-white/85"
                  }`}
                >
                  {next.meter.caption}
                </p>
              </div>
            )}

            {next.cta && (
              <button
                type="button"
                onClick={() => navigate(next.cta!.to)}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${toneClasses[next.tone].cta}`}
              >
                {next.cta.label}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── How ready you are ────────────────────────────────────────────── */}
      {/* totalItems === 0 is the normal state for an event whose checklist was
          never seeded — POST /Checklist/Seed is manual, nothing seeds on event
          creation — so it gets an invitation rather than a demoralising 0%. */}
      <button
        type="button"
        onClick={() => navigate("/app/checklist")}
        className="flex w-full items-center gap-4 rounded-2xl border border-primary/10 bg-white px-4 py-4 text-left transition-colors hover:border-primary/30"
      >
        {c.totalItems > 0 ? (
          <>
            <ReadinessRing percent={c.percentComplete} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-text">
                You’re {Math.round(c.percentComplete)}% ready
              </span>
              <span className="block text-[13px] text-text/60">
                {c.remainingItems === 0
                  ? "Everything on your checklist is done 🤍"
                  : `${c.remainingItems} ${plural(c.remainingItems, "thing", "things")} left before the big day.`}
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl bg-sect-home/12">
              <ClipboardCheckIcon className="h-7 w-7 text-sect-home" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-text">Start your checklist</span>
              <span className="block text-[13px] text-text/60">
                Keep track of everything you need to do before the big day.
              </span>
            </span>
          </>
        )}
        <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-text/35" />
      </button>

      {/* ─── Where things stand ───────────────────────────────────────────── */}
      {/* Replies and parties are row counts; "people coming" is the backend's
          own SUM(NoOfPax). Labelled separately on purpose — see
          docs/COUPLE_MODE.md, open question 1. */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard
          label="Replied"
          value={`${replied}/${r.totalRsvpsReceived}`}
          variant="primary"
          size="sm"
        />
        <StatsCard label="People coming" value={r.totalGuestsConfirmed} variant="success" size="sm" />
        <StatsCard
          label="Need a seat"
          value={t.unassignedGuests}
          variant={t.unassignedGuests > 0 ? "warning" : "success"}
          size="sm"
        />
      </div>

      {/* ─── Lately ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white">
        <div className="border-b border-primary/10 px-4 py-3">
          <h2 className="font-display text-lg text-text">Lately</h2>
          <p className="text-[12.5px] text-text/55">The last few things that happened</p>
        </div>
        {dashboard.recentActivity.length > 0 ? (
          <ul className="max-h-[380px] divide-y divide-primary/10 overflow-y-auto">
            {dashboard.recentActivity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-accent">
                  <span className="text-base">{a.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] text-text">{a.description}</span>
                  {a.details && (
                    <span className="block text-[12px] text-text/55">{a.details}</span>
                  )}
                </span>
                <span className="flex-shrink-0 text-[11.5px] text-text/45">
                  {formatRelativeTime(a.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sect-home/12">
              <ExclamationIcon className="h-7 w-7 text-sect-home" />
            </span>
            <p className="font-semibold text-text">Nothing yet</p>
            <p className="max-w-[34ch] text-[13px] text-text/55">
              Replies and updates will show up here as they come in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
