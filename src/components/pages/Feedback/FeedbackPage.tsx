import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChatAlt2Icon, CheckCircleIcon, CheckIcon, StarIcon } from "@heroicons/react/solid";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { Button } from "../../atoms/Button";
import { PageLoader } from "../../atoms/PageLoader";
import { useAuth } from "../../../api/hooks/useAuth";
import { useUserByGuidApi } from "../../../api/hooks/useUsersApi";
import {
  FEEDBACK_FORM_VERSION,
  useFeedbackEligibility,
  useMyFeedback,
  useSubmitFeedback,
  type FeedbackEligibilityEvent,
  type SavedFeedback,
} from "../../../api/hooks/useFeedbackApi";
import { formatEventDate } from "../../../utils/eventUtils";

/**
 * Mirrors the sidebar sections. RSVPs and Guests are one module for feedback, and so
 * are Check-in and Crew.
 */
const MODULES = [
  { key: "dashboard", name: "Dashboard" },
  { key: "events", name: "Events" },
  { key: "rsvpDesigner", name: "RSVP Card Designer" },
  { key: "rsvpQuestions", name: "RSVP Questions" },
  { key: "rsvpGuests", name: "RSVPs & Guests" },
  { key: "tables", name: "Tables" },
  { key: "floorPlan", name: "Floor Plan" },
  { key: "budget", name: "Budget" },
  { key: "qrCheckIn", name: "QR Check-in (incl. Crew)" },
  { key: "checklist", name: "Checklist" },
] as const;

/** Every other module hangs off an event, so it is always counted and cannot be unticked. */
const LOCKED_MODULE = "events";

const LEVELS = [
  { label: "Poor", value: 1 },
  { label: "OK", value: 2 },
  { label: "Good", value: 3 },
  { label: "Great", value: 4 },
] as const;

const MAX_PICKS = 2;

/** Matches the server-side limit on each free-text answer. */
const TEXT_MAX = 2000;
/** Show the remaining-characters hint once fewer than this many are left. */
const TEXT_HINT_AT = 200;

const GENERIC_ERROR = "Couldn't send your feedback. Please try again in a moment.";

const fieldClass =
  "w-full rounded-xl border border-primary/15 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-accent dark:text-white";

const readOnlyClass =
  "w-full rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5 text-sm text-text/70 dark:border-white/10 dark:bg-white/5 dark:text-white/60";

const labelClass = "block text-xs font-semibold text-text/60 dark:text-white/50 mb-1.5";

const sectionClass = "border-t border-primary/10 pt-5 flex flex-col gap-4 dark:border-white/10";

const hintClass = "text-xs text-text/40 dark:text-white/30";

const chipBase =
  "rounded-full border px-3 py-1.5 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const chipOff = "border-primary/15 bg-white text-text/70 dark:border-white/10 dark:bg-accent dark:text-white/70";
const chipOn = "border-primary bg-primary text-white font-semibold";

/**
 * A chip button. In the live form a blocked chip is dimmed; in the read-only view every
 * chip is disabled, so only the unpicked ones are dimmed and the picks stay bright.
 */
function chipClass(on: boolean, readOnly: boolean): string {
  if (readOnly) return `${chipBase} cursor-default ${on ? chipOn : `${chipOff} opacity-50`}`;
  return `${chipBase} ${
    on ? chipOn : `${chipOff} hover:border-primary/40`
  } disabled:opacity-40 disabled:cursor-not-allowed`;
}

type PanelState = "form" | "thanks" | "notEligible" | "alreadySent";

/** A panel forced by a submit result, tied to the event it was about. */
type Override = { eventGuid: string; panel: Exclude<PanelState, "form"> };

/** Everything the user answers. The live form edits it; the read-only view shows a saved copy. */
interface FormValues {
  overall: number;
  ease: number;
  recommend: number | null;
  used: Record<string, boolean>;
  ratings: Record<string, number>;
  liked: string[];
  improve: string[];
  likedText: string;
  improveText: string;
  canContact: boolean;
}

const EMPTY_VALUES: FormValues = {
  overall: 0,
  ease: 0,
  recommend: null,
  used: { [LOCKED_MODULE]: true },
  ratings: {},
  liked: [],
  improve: [],
  likedText: "",
  improveText: "",
  canContact: false,
};

type Updater = (fn: (v: FormValues) => FormValues) => void;

function savedToValues(s: SavedFeedback): FormValues {
  const used: Record<string, boolean> = { [LOCKED_MODULE]: true };
  s.answers.modulesUsed.forEach((k) => {
    used[k] = true;
  });
  return {
    overall: s.overall,
    ease: s.ease,
    recommend: s.recommend,
    used,
    ratings: { ...s.answers.moduleRatings },
    liked: s.answers.likedModules,
    improve: s.answers.improveModules,
    likedText: s.answers.liked,
    improveText: s.answers.improve,
    canContact: s.canContact,
  };
}

/** A UTC timestamp from the API as a local date. A missing zone suffix is read as UTC. */
function formatSubmittedAt(value: string): string {
  if (!value) return "";
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const d = new Date(hasZone || value.length <= 10 ? value : `${value}Z`);
  if (isNaN(d.getTime())) return formatEventDate(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** The `message` of an API error body, or "" when there is none. */
function serverMessage(err: unknown): string {
  const data: unknown = isAxiosError(err) ? err.response?.data : undefined;
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message.trim();
  }
  return "";
}

/** Next selection for a "pick up to 2" group where "none" is exclusive. */
function togglePick(current: string[], value: string): string[] {
  if (current.includes(value)) return current.filter((v) => v !== value);
  if (value === "none") return ["none"];
  if (current.includes("none") || current.length >= MAX_PICKS) return current;
  return [...current, value];
}

function StatePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900 flex flex-col items-center gap-2">
      <h2 className="text-lg font-bold text-text dark:text-white">{title}</h2>
      <div className="max-w-md text-sm text-text/60 dark:text-white/50 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function CharsLeft({ value }: { value: string }) {
  const left = TEXT_MAX - value.length;
  if (left >= TEXT_HINT_AT) return null;
  return (
    <p className={`${hintClass} mt-1 text-right`} aria-live="polite">
      {left} {left === 1 ? "character" : "characters"} left
    </p>
  );
}

function StarRow({
  label,
  value,
  onChange,
  low,
  high,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
  readOnly: boolean;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5`}
            disabled={readOnly}
            onClick={() => onChange(n)}
            className={`grid h-10 w-10 place-items-center rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-default ${
              n <= value
                ? "border-secondary/50 bg-secondary/10 text-secondary"
                : `border-primary/15 bg-white text-text/30 dark:border-white/10 dark:bg-accent dark:text-white/30 ${
                    readOnly ? "" : "hover:border-primary/40"
                  }`
            }`}
          >
            <StarIcon className="h-5 w-5" />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-text/40 dark:text-white/30">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function PickGroup({
  labelId,
  label,
  options,
  selected,
  onToggle,
  readOnly,
}: {
  labelId: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  readOnly: boolean;
}) {
  return (
    <div>
      <span id={labelId} className={labelClass}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value);
          const blocked =
            !on && (selected.includes("none") || (selected.length >= MAX_PICKS && o.value !== "none"));
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              disabled={readOnly || blocked}
              onClick={() => onToggle(o.value)}
              className={chipClass(on, readOnly)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Shown in the Event field and in each switcher option. */
const eventLabel = (e: FeedbackEligibilityEvent) => `${e.eventName} (${formatEventDate(e.eventDate)})`;

/**
 * The feedback email links to /app/feedback?event=<eventGuid>. The form is keyed on
 * that param so moving to a different event (from the email or the Event switcher)
 * starts from a clean slate.
 */
export default function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = searchParams.get("event")?.trim() ?? "";
  const selectEvent = (eventGuid: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("event", eventGuid);
        return next;
      },
      { replace: true },
    );
  return <FeedbackForm key={eventParam} eventParam={eventParam} onSelectEvent={selectEvent} />;
}

function FeedbackForm({
  eventParam,
  onSelectEvent,
}: {
  eventParam: string;
  onSelectEvent: (eventGuid: string) => void;
}) {
  const { user, userGuid } = useAuth();
  const { data: profile } = useUserByGuidApi(userGuid ?? "");
  const eligibility = useFeedbackEligibility();
  const submit = useSubmitFeedback();

  // Name and email are shown for context only; the API reads both from the JWT.
  const name = profile?.fullName?.trim() ?? "";
  const email = user?.email ?? "";

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  // Set after a submit or when the API answers 403/409. It only applies to the event
  // it was set for, so it can never leak onto a different event.
  const [override, setOverride] = useState<Override | null>(null);

  const events = useMemo(() => eligibility.data?.events ?? [], [eligibility.data]);
  const overrideGuid = override?.eventGuid ?? "";

  // Events the page can show (a form or saved answers), latest first. With two or
  // more the Event field becomes a switcher.
  const switchable = useMemo(
    () =>
      events
        .filter((e) => e.status === "Eligible" || e.status === "AlreadySubmitted")
        .sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
    [events],
  );
  const eventChoices = switchable.length >= 2 ? switchable : undefined;
  // After a submit: the latest other event still waiting for an answer, if any.
  const nextUnanswered = switchable.find(
    (e) => e.status === "Eligible" && e.eventGuid.toLowerCase() !== overrideGuid.toLowerCase(),
  );

  // Which event the form is locked to, and which panel the eligibility data implies.
  // With a param we never fall back to another event. Without one we take the most
  // recent eligible event (or, failing that, the most recent submitted one so its
  // answers can be shown), and once a submit has answered we stay on that event even
  // after the eligibility list refreshes.
  const { target, basePanel } = useMemo((): {
    target: FeedbackEligibilityEvent | undefined;
    basePanel: PanelState;
  } => {
    const wanted = eventParam || overrideGuid;
    if (wanted) {
      const match = events.find((e) => e.eventGuid.toLowerCase() === wanted.toLowerCase());
      const panel: PanelState =
        match?.status === "Eligible"
          ? "form"
          : match?.status === "AlreadySubmitted"
            ? "alreadySent"
            : "notEligible";
      return { target: match, basePanel: panel };
    }
    const latest = (status: FeedbackEligibilityEvent["status"]) =>
      events.filter((e) => e.status === status).sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0];
    const eligible = latest("Eligible");
    if (eligible) return { target: eligible, basePanel: "form" };
    const submitted = latest("AlreadySubmitted");
    if (submitted) return { target: submitted, basePanel: "alreadySent" };
    return { target: undefined, basePanel: "notEligible" };
  }, [events, eventParam, overrideGuid]);

  const activeOverride =
    override && target && override.eventGuid === target.eventGuid ? override : null;
  const panel: PanelState = activeOverride ? activeOverride.panel : basePanel;

  // Already sent: fetch the saved answers so they can be shown read-only.
  const saved = useMyFeedback(panel === "alreadySent" ? target?.eventGuid : undefined);

  const canSend =
    basePanel === "form" &&
    Boolean(target) &&
    values.overall > 0 &&
    values.ease > 0 &&
    values.recommend !== null;

  const handleSubmit = async () => {
    const { recommend } = values;
    if (!canSend || !target || recommend === null) return;
    const eventGuid = target.eventGuid;
    const modulesUsed = MODULES.filter((m) => values.used[m.key]).map((m) => m.key as string);
    const moduleRatings: Record<string, number> = {};
    modulesUsed.forEach((k) => {
      if (values.ratings[k]) moduleRatings[k] = values.ratings[k];
    });
    try {
      await submit.mutateAsync({
        eventGuid,
        formVersion: FEEDBACK_FORM_VERSION,
        overall: values.overall,
        ease: values.ease,
        recommend,
        modulesUsed,
        moduleRatings,
        likedModules: values.liked,
        improveModules: values.improve,
        liked: values.likedText.trim(),
        improve: values.improveText.trim(),
        canContact: values.canContact,
      });
      setOverride({ eventGuid, panel: "thanks" });
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) setOverride({ eventGuid, panel: "alreadySent" });
      else if (status === 403) setOverride({ eventGuid, panel: "notEligible" });
      else if (status === 400) toast.error(serverMessage(err) || GENERIC_ERROR);
      else toast.error(GENERIC_ERROR);
    }
  };

  const renderBody = () => {
    if (eligibility.isLoading && !activeOverride) return <PageLoader />;
    if (eligibility.isError && !activeOverride) {
      return (
        <StatePanel title="We couldn't load this form">
          <p>Please refresh the page and try again.</p>
        </StatePanel>
      );
    }
    if (panel === "thanks") {
      return (
        <StatePanel title={`Thank you${name ? `, ${name.split(" ")[0]}` : ""}`}>
          <CheckCircleIcon className="mx-auto h-12 w-12 text-accent" />
          <p>Your feedback is saved. We read every response and use it to decide what to fix next.</p>
          {nextUnanswered && (
            <>
              <p className="mt-2">You have another event waiting for feedback.</p>
              <Button type="button" onClick={() => onSelectEvent(nextUnanswered.eventGuid)}>
                Give feedback for {eventLabel(nextUnanswered)}
              </Button>
            </>
          )}
        </StatePanel>
      );
    }
    if (panel === "alreadySent") {
      if (saved.isLoading) return <PageLoader />;
      if (saved.data && target) {
        return (
          <FeedbackFormView
            target={target}
            name={name}
            email={email}
            values={savedToValues(saved.data)}
            readOnly
            submittedAt={saved.data.submittedAt}
            eventChoices={eventChoices}
            onSelectEvent={onSelectEvent}
          />
        );
      }
      // No saved answer (404) or the fetch failed: the plain panel.
      return (
        <StatePanel title="You already sent feedback for this event">
          <p>
            Thanks again. If you have something new to add,{" "}
            <Link to="/app/contact" className="font-semibold text-primary hover:underline">
              Contact Us
            </Link>{" "}
            is the best place for it.
          </p>
        </StatePanel>
      );
    }
    if (panel === "notEligible") {
      return (
        <StatePanel title="This form isn't open for your account yet">
          <p>
            We ask for feedback after an event has taken place and you have tried a few parts of
            MyBigDays. Once that happens, we'll email you.
          </p>
          <p>
            Found a bug or have a question now? Use{" "}
            <Link to="/app/contact" className="font-semibold text-primary hover:underline">
              Contact Us
            </Link>
            .
          </p>
        </StatePanel>
      );
    }
    return (
      <FeedbackFormView
        target={target}
        name={name}
        email={email}
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        canSend={canSend}
        submitting={submit.isPending}
        eventChoices={eventChoices}
        onSelectEvent={onSelectEvent}
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white flex-shrink-0">
            <ChatAlt2Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text dark:text-white">How was MyBigDays for you?</h1>
            <p className="text-sm text-text/60 dark:text-white/50">
              Your event is done. Tell us what worked and what got in your way. It takes about 3 minutes.
            </p>
          </div>
        </div>
      </div>

      {renderBody()}
    </div>
  );
}

/**
 * The form layout. Editable when `onChange` is given; with `readOnly` every control is
 * disabled, the saved answers are shown and there is no Send button.
 */
function FeedbackFormView({
  target,
  name,
  email,
  values,
  onChange,
  onSubmit,
  canSend = false,
  submitting = false,
  readOnly = false,
  submittedAt,
  eventChoices,
  onSelectEvent,
}: {
  target: FeedbackEligibilityEvent | undefined;
  name: string;
  email: string;
  values: FormValues;
  onChange?: Updater;
  onSubmit?: () => void;
  canSend?: boolean;
  submitting?: boolean;
  readOnly?: boolean;
  submittedAt?: string;
  /** Two or more events to choose from; the Event field is then a select. */
  eventChoices?: FeedbackEligibilityEvent[];
  onSelectEvent?: (eventGuid: string) => void;
}) {
  const update: Updater = (fn) => {
    if (!readOnly && onChange) onChange(fn);
  };
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    update((v) => ({ ...v, [key]: value }));

  const { used, ratings } = values;
  const usedModules = MODULES.filter((m) => used[m.key]);
  const pickOptions = [
    ...usedModules.map((m) => ({ value: m.key as string, label: m.name as string })),
    { value: "other", label: "Other" },
    { value: "none", label: "None" },
  ];

  const toggleUsed = (key: string, checked: boolean) => {
    if (key === LOCKED_MODULE) return;
    update((v) => {
      if (checked) return { ...v, used: { ...v.used, [key]: true } };
      const nextRatings = { ...v.ratings };
      delete nextRatings[key];
      return {
        ...v,
        used: { ...v.used, [key]: false },
        ratings: nextRatings,
        liked: v.liked.filter((x) => x !== key),
        improve: v.improve.filter((x) => x !== key),
      };
    });
  };

  const setRating = (key: string, level: number) =>
    update((v) => {
      const next = { ...v.ratings };
      if (next[key] === level) delete next[key];
      else next[key] = level;
      return { ...v, ratings: next };
    });

  const textClass = readOnly
    ? `${readOnlyClass} resize-none min-h-[96px] leading-relaxed`
    : `${fieldClass} resize-y min-h-[96px] leading-relaxed`;
  const sentOn = submittedAt ? formatSubmittedAt(submittedAt) : "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly) onSubmit?.();
      }}
      aria-label={readOnly ? "Your feedback" : undefined}
      className="rounded-2xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 flex flex-col gap-5"
    >
      {readOnly && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-text dark:border-white/10 dark:bg-white/5 dark:text-white">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">
              {sentOn ? `You sent this feedback on ${sentOn}. Thank you.` : "You sent this feedback. Thank you."}
            </p>
            <p className="text-text/60 dark:text-white/50">
              Your answers can't be changed. If you have something else to add, use{" "}
              <Link to="/app/contact" className="font-semibold text-primary hover:underline">
                Contact Us
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* About you: locked, like the Contact Us form */}
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="fb-event" className={labelClass}>
            Event
          </label>
          {eventChoices && target ? (
            // A way to move between events, not an answer, so it stays usable in the read-only view.
            <select
              id="fb-event"
              value={target.eventGuid}
              onChange={(e) => onSelectEvent?.(e.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              {eventChoices.map((e) => (
                <option key={e.eventGuid} value={e.eventGuid}>
                  {eventLabel(e)}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="fb-event"
              type="text"
              value={target ? eventLabel(target) : ""}
              readOnly
              className={readOnlyClass}
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fb-name" className={labelClass}>
              Your Name
            </label>
            <input id="fb-name" type="text" value={name} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label htmlFor="fb-email" className={labelClass}>
              Email
            </label>
            <input id="fb-email" type="email" value={email} readOnly className={readOnlyClass} />
          </div>
        </div>
      </div>

      {/* Overall */}
      <div className={sectionClass}>
        <h2 className="text-sm font-bold text-text dark:text-white">Overall</h2>
        <StarRow
          label="How was your overall experience?"
          value={values.overall}
          onChange={(n) => set("overall", n)}
          low="Frustrating"
          high="Great"
          readOnly={readOnly}
        />
        <StarRow
          label="How easy was it to get things done?"
          value={values.ease}
          onChange={(n) => set("ease", n)}
          low="Hard"
          high="Easy"
          readOnly={readOnly}
        />
      </div>

      {/* Modules used */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-sm font-bold text-text dark:text-white">Which modules did you use?</h2>
          <p className={`${hintClass} mt-1`}>
            Events is always included, because every other module hangs off an event. Tick the
            others you used and a rating appears for each.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-primary/10 divide-y divide-primary/10 dark:border-white/10 dark:divide-white/10">
          {MODULES.map((m) => {
            const locked = m.key === LOCKED_MODULE;
            const isUsed = Boolean(used[m.key]);
            return (
              <div key={m.key} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <label
                  htmlFor={`fb-use-${m.key}`}
                  className={`flex items-center gap-2.5 text-[13px] font-semibold text-text dark:text-white ${
                    readOnly ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <input
                    id={`fb-use-${m.key}`}
                    type="checkbox"
                    checked={isUsed}
                    disabled={locked || readOnly}
                    onChange={(e) => toggleUsed(m.key, e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  {m.name}
                  {locked && (
                    <span className="font-normal text-text/40 dark:text-white/30">(always included)</span>
                  )}
                </label>
                {isUsed && (
                  <div role="radiogroup" aria-label={`${m.name} rating`} className="flex gap-1">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        role="radio"
                        aria-checked={ratings[m.key] === l.value}
                        disabled={readOnly}
                        onClick={() => setRating(m.key, l.value)}
                        className={chipClass(ratings[m.key] === l.value, readOnly)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Favourites and pain points */}
      <div className={sectionClass}>
        <h2 className="text-sm font-bold text-text dark:text-white">Your favourites and pain points</h2>
        <PickGroup
          labelId="fb-liked-label"
          label="Which 2 modules did you like the most?"
          options={pickOptions}
          selected={values.liked}
          onToggle={(x) => update((v) => ({ ...v, liked: togglePick(v.liked, x) }))}
          readOnly={readOnly}
        />
        <PickGroup
          labelId="fb-improve-label"
          label="Which 2 modules need the most improvement?"
          options={pickOptions}
          selected={values.improve}
          onToggle={(x) => update((v) => ({ ...v, improve: togglePick(v.improve, x) }))}
          readOnly={readOnly}
        />
        {!readOnly && (
          <p className={hintClass}>
            Pick up to 2 in each. Only the modules you ticked are listed. Choose Other or None if
            fewer than 2 apply.
          </p>
        )}
      </div>

      {/* In your words */}
      <div className={sectionClass}>
        <h2 className="text-sm font-bold text-text dark:text-white">In your words</h2>
        <div>
          <label htmlFor="fb-liked" className={labelClass}>
            What did MyBigDays do well?
          </label>
          <textarea
            id="fb-liked"
            value={values.likedText}
            onChange={(e) => set("likedText", e.target.value)}
            disabled={readOnly}
            rows={3}
            maxLength={TEXT_MAX}
            placeholder={readOnly ? "No answer given." : "For example: the table plan saved us a whole weekend."}
            className={textClass}
          />
          {!readOnly && <CharsLeft value={values.likedText} />}
        </div>
        <div>
          <label htmlFor="fb-improve" className={labelClass}>
            What was confusing, slow or missing?
          </label>
          <textarea
            id="fb-improve"
            value={values.improveText}
            onChange={(e) => set("improveText", e.target.value)}
            disabled={readOnly}
            rows={3}
            maxLength={TEXT_MAX}
            placeholder={readOnly ? "No answer given." : "Tell us where you got stuck or what you wished it could do."}
            className={textClass}
          />
          {!readOnly && <CharsLeft value={values.improveText} />}
        </div>
      </div>

      {/* One last thing */}
      <div className={sectionClass}>
        <h2 className="text-sm font-bold text-text dark:text-white">One last thing</h2>
        <div>
          <span id="fb-nps-label" className={labelClass}>
            How likely are you to recommend MyBigDays to a friend planning an event?
          </span>
          <div role="radiogroup" aria-labelledby="fb-nps-label" className="grid grid-cols-6 sm:grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={values.recommend === n}
                disabled={readOnly}
                onClick={() => set("recommend", n)}
                className={`rounded-[10px] border py-2 text-[13px] tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-default ${
                  values.recommend === n
                    ? "border-primary bg-primary font-bold text-white"
                    : `border-primary/15 bg-white text-text dark:border-white/10 dark:bg-accent dark:text-white ${
                        readOnly ? "opacity-50" : "hover:border-primary/40"
                      }`
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-text/40 dark:text-white/30">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>
        <label
          htmlFor="fb-contact"
          className={`flex items-start gap-2.5 text-[13px] text-text dark:text-white ${
            readOnly ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <input
            id="fb-contact"
            type="checkbox"
            checked={values.canContact}
            disabled={readOnly}
            onChange={(e) => set("canContact", e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            You can contact me about my feedback.{" "}
            <span className="text-text/40 dark:text-white/30">We would only use your account email.</span>
          </span>
        </label>
      </div>

      {!readOnly && (
        <div className="flex items-center justify-end gap-3 border-t border-primary/10 pt-5 dark:border-white/10">
          <p className="mr-auto flex items-center gap-1.5 text-xs text-text/50 dark:text-white/40">
            <CheckIcon className="h-4 w-4 text-primary/60" />
            Sent securely from your account.
          </p>
          <Button type="submit" loading={submitting} disabled={!canSend}>
            Send Feedback
          </Button>
        </div>
      )}
    </form>
  );
}
