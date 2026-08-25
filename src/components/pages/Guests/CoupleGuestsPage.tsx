// src/components/pages/Guests/CoupleGuestsPage.tsx
//
// Couple-mode guest list: RSVPs and Guests shown as ONE list instead of two
// pages. A couple thinks about "the people coming to my wedding", not about
// invitation records versus attendee records.
//
// ── The data model (verified against MyBigDays_Mono) ───────────────────────
// One RSVP creates exactly ONE Guest row, and `Guest.Pax` is the party size:
//
//     Rsvp (1) ──── (0..1) Guest        Guest.Pax = number of people
//
// RsvpGuestHandler.CreateAsync calls CreateGuestAsync once, never in a loop;
// RsvpDetailDto.Guest is singular; GetByRsvpIdAsync uses FirstOrDefaultAsync.
//
// So there are NO per-attendee records and no per-attendee names. A party is
// the atomic unit of both seating and check-in: AssignTable takes one guestId
// and seats all Pax, and one QR pass covers the whole party.
//
// A Guest row is absent when noOfPax is 0 (the backend soft-deletes it), so
// `guest` is optional here.
//
// No API changes: this reads the same endpoints the planner pages already use
// and joins them client-side on Guest.rsvpId.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  PencilIcon,
  SearchIcon,
} from "@heroicons/react/solid";
import { useQueryClient } from "@tanstack/react-query";

import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { Button } from "../../atoms/Button";
import { Dropdown, DropdownItem } from "../../atoms/Dropdown";
import { StatsCard } from "../../atoms/StatsCard";
import { NoEventsState } from "../../molecules/NoEventsState";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import QrStatusBadge from "../../molecules/QrStatusBadge";

import { useEventContext } from "../../../context/EventContext";
import { useAuth } from "../../../api/hooks/useAuth";
import { useGuestsApi, type Guest } from "../../../api/hooks/useGuestsApi";
import {
  useRsvpsApi,
  useCreateRsvp,
  useUpdateRsvp,
  type Rsvp,
} from "../../../api/hooks/useRsvpsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useQrListApi } from "../../../api/hooks/useQrApi";
import { useEventRsvpInternal } from "../../../api/hooks/useEventsApi";
import { useBudgetsApi } from "../../../api/hooks/useBudgetApi";
import { useTransactionsApi } from "../../../api/hooks/useTransactionApi";
import type { QrToken, QrStatus } from "../../../types/qr";
import { CURRENCY_CONFIG } from "../../../types/budget";
import type { Currency } from "../../../types/budget";
import { isDemoActive, DemoGate } from "../../../demo";
import { buildGuestRows } from "../../../utils/guestExport";
import { downloadCsv, downloadXlsx } from "../../../utils/exportUtils";

// ─── Model ────────────────────────────────────────────────────────────────────

type PartyState = "notComing" | "seated" | "needsSeat" | "awaitingGuest";

interface Party {
  key: string;
  name: string;
  phoneNo?: string;
  /** Seats this party takes, the guest included, not a plus-one count. */
  pax: number;
  remarks?: string;
  /** Absent for guest rows that were added without going through an RSVP. */
  rsvp?: Rsvp;
  /** The single Guest row. Absent when pax is 0, or not created yet. */
  guest?: Guest;
  /** Resolved table name, when seated. */
  table?: string;
  state: PartyState;
}

type Filter = "all" | "coming" | "needsSeat" | "notComing";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "coming", label: "Coming" },
  { key: "needsSeat", label: "No table yet" },
  // Matches the row badge below, which already said "Can’t make it". One phrase
  // for one state; the filter chip was the odd one out.
  { key: "notComing", label: "Can’t make it" },
];

function qrStatusOf(token: QrToken | undefined): QrStatus {
  if (!token) return "None";
  if (token.checkedInAt) return "CheckedIn";
  if (token.isRevoked) return "Revoked";
  return "Generated";
}

function partyStateOf(pax: number, guest: Guest | undefined): PartyState {
  if (pax <= 0) return "notComing";
  if (!guest) return "awaitingGuest";
  return guest.tableId ? "seated" : "needsSeat";
}

/** Human status, deliberately not UNASSIGNED/ASSIGNED. */
function StatusPill({ party }: { party: Party }) {
  const base =
    "flex-shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap";

  switch (party.state) {
    case "notComing":
      return <span className={`${base} bg-secondary/15 text-secondary`}>Can’t make it</span>;
    case "awaitingGuest":
      return <span className={`${base} bg-primary/10 text-primary`}>Just replied</span>;
    case "seated":
      return (
        <span className={`${base} bg-sect-seating/15 text-sect-seating`}>
          {party.table ?? "Seated"}
        </span>
      );
    default:
      return <span className={`${base} bg-sect-home/15 text-sect-home`}>No table yet</span>;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoupleGuestsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { eventId, eventsLoading } = useEventContext()!;
  const { userRole } = useAuth();
  const isReadOnly = userRole === 6;

  const { data: rsvps = [], isLoading: rsvpsLoading, isError: rsvpsError } = useRsvpsApi(eventId!);
  const { data: guests = [], isLoading: guestsLoading } = useGuestsApi(eventId!);
  const { data: tables = [] } = useTablesApi(eventId!);
  const { data: qrTokens = [] } = useQrListApi(eventId!);
  const { data: formFields = [], isLoading: formFieldsLoading } =
    useEventRsvpInternal(eventId ?? undefined);
  // Read-only, purely so the export carries gift amounts like planner mode
  // does, since couples have a Money section, so the data is theirs.
  const { data: budget } = useBudgetsApi(eventId!);
  const { data: transactions = [] } = useTransactionsApi(budget?.walletGuid ?? "", eventId!);

  const createRsvp = useCreateRsvp(eventId!);
  const updateRsvp = useUpdateRsvp(eventId!);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; rsvp?: Rsvp }>({ open: false });

  const tableMap = useMemo(() => new Map(tables.map((t) => [t.id, t.name])), [tables]);

  // Gift map: guestCode → amount, joined from budget transactions.
  const giftMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => (t.category as string) === "Gift")
      .forEach((t) => {
        if (t.referenceId) map.set(t.referenceId, t.amount);
      });
    return map;
  }, [transactions]);

  const currencySymbol = budget
    ? (CURRENCY_CONFIG[budget.currency as Currency]?.symbol ?? budget.currency)
    : "";

  const qrMap = useMemo(() => {
    const map = new Map<string, QrToken>();
    qrTokens.forEach((t) => map.set(t.guestId, t));
    return map;
  }, [qrTokens]);

  const answerLabels = useMemo(
    () => new Map(formFields.map((f) => [f.questionId, f.label])),
    [formFields]
  );

  /**
   * Join each RSVP to its single Guest row on rsvpId. Guests with no rsvpId, or
   * whose rsvpId no longer resolves, become parties of their own so nobody is
   * silently hidden from the couple.
   */
  const parties = useMemo<Party[]>(() => {
    const guestByRsvp = new Map<string, Guest>();
    const looseGuests: Guest[] = [];

    for (const g of guests) {
      // Defensive: if the backend ever emits more than one row per RSVP, keep
      // the lowest guestIndex rather than letting later rows silently win.
      if (!g.rsvpId) {
        looseGuests.push(g);
        continue;
      }
      const existing = guestByRsvp.get(g.rsvpId);
      if (!existing || (g.guestIndex ?? 0) < (existing.guestIndex ?? 0)) {
        guestByRsvp.set(g.rsvpId, g);
      }
    }

    const fromRsvps: Party[] = rsvps.map((r) => {
      // Guest.rsvpId holds the RSVP's *Guid*, not its int RsvpId; the list
      // endpoint returns both (RsvpDetailDto.RsvpId is an int, RsvpGuid is the
      // Guid), so joining on rsvpId misses every row and doubles the list.
      const rid = r.rsvpGuid ?? r.rsvpId ?? r.id;
      const guest = guestByRsvp.get(rid);
      guestByRsvp.delete(rid);
      const pax = r.noOfPax ?? guest?.pax ?? 0;
      return {
        key: `rsvp:${rid}`,
        name: r.guestName || r.name || "Unnamed guest",
        phoneNo: r.phoneNo,
        pax,
        remarks: r.remarks,
        rsvp: r,
        guest,
        table: guest?.tableId ? tableMap.get(guest.tableId) : undefined,
        state: partyStateOf(pax, guest),
      };
    });

    // Guest rows whose RSVP is gone, plus guests added without an RSVP.
    const orphans: Party[] = [...guestByRsvp.values(), ...looseGuests].map((g) => {
      const pax = g.pax ?? g.noOfPax ?? 1;
      return {
        key: `guest:${g.guestId ?? g.id}`,
        name: g.guestName || g.name || "Unnamed guest",
        phoneNo: g.phoneNo,
        pax,
        remarks: g.remarks,
        guest: g,
        table: g.tableId ? tableMap.get(g.tableId) : undefined,
        state: partyStateOf(pax, g),
      };
    });

    return [...fromRsvps, ...orphans];
  }, [rsvps, guests, tableMap]);

  const stats = useMemo(() => {
    const comingParties = parties.filter((p) => p.state !== "notComing");
    return {
      invited: parties.length,
      coming: comingParties.reduce((s, p) => s + p.pax, 0),
      needsSeat: parties.filter((p) => p.state === "needsSeat").length,
    };
  }, [parties]);

  // Step 1's status line. The designer can only insert questions that already
  // exist, so an empty list is worth nudging about rather than stating flatly.
  // Stays blank while loading so it never flashes "Not set up yet" wrongly;
  // that blank is a non-breaking space, not "", or the card would shrink and
  // jitter the row height once the fetch lands.
  const questionsHint = useMemo(() => {
    if (formFieldsLoading) return { label: " ", tone: "text-text/40" };
    if (formFields.length === 0) return { label: "Not set up yet", tone: "text-primary" };
    return {
      label: `${formFields.length} question${formFields.length === 1 ? "" : "s"}`,
      tone: "text-text/40",
    };
  }, [formFields, formFieldsLoading]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parties.filter((p) => {
      const okFilter =
        filter === "all" ||
        (filter === "coming" && p.state !== "notComing") ||
        (filter === "needsSeat" && p.state === "needsSeat") ||
        (filter === "notComing" && p.state === "notComing");
      const okSearch = !q || p.name.toLowerCase().includes(q);
      return okFilter && okSearch;
    });
  }, [parties, filter, search]);

  // ─── Export ─────────────────────────────────────────────────────────────────
  // Exports every guest, not the filtered view: this is a backup, and a
  // partial one is worse than useless.
  const exportRows = () => buildGuestRows({ guests, tables, giftMap, currencySymbol });

  // A demo visitor gets the prompt instead of the file. This is the one place
  // the demo withholds something that technically works, and it is deliberate:
  // the guest list is the thing worth keeping, so it is the honest moment to
  // ask for an account. Everything else they can see, they can use.
  const [exportGate, setExportGate] = useState(false);
  const [inviteGate, setInviteGate] = useState(false);
  const demo = isDemoActive();

  const handleExportXlsx = () =>
    demo
      ? setExportGate(true)
      : downloadXlsx(exportRows(), `guests-event-${eventId}.xlsx`, "Guests");
  const handleExportCsv = () =>
    demo ? setExportGate(true) : downloadCsv(exportRows(), `guests-event-${eventId}.csv`);

  // ─── Guards ─────────────────────────────────────────────────────────────────

  if (eventsLoading) return <PageLoader message="Loading…" />;
  if (!eventId)
    return (
      <NoEventsState
        title="No wedding yet"
        message="Create your wedding first, then your guest list has somewhere to live."
      />
    );
  if (rsvpsLoading || guestsLoading) return <PageLoader message="Loading your guests…" />;
  if (rsvpsError)
    return (
      <ErrorState
        message="We couldn’t load your guest list."
        onRetry={() => window.location.reload()}
      />
    );

  const answersOf = (r?: Rsvp) =>
    (r?.answers ?? [])
      .filter((a) => a.text)
      .map((a) => ({ label: answerLabels.get(a.questionId) ?? "", text: a.text }))
      .filter((a) => a.label);

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold text-text">Your guests</h1>
          <p className="text-sm text-text/60">Everyone you invited, and who’s replied.</p>
        </div>
        <Dropdown trigger={<Button variant="secondary">Export ▾</Button>}>
          <DropdownItem onClick={handleExportXlsx}>Export as XLSX</DropdownItem>
          <DropdownItem onClick={handleExportCsv}>Export as CSV</DropdownItem>
          <DropdownItem onClick={() => navigate("/app/guests/print")}>Print check-in sheet</DropdownItem>
        </Dropdown>
      </div>

      {/* ─── The three steps of getting guests in ────────────────────────── */}
      {/* Every card carries a third line so the row stays even in height. Only
          step 1 reflects real state, since the designer has no "is it done" signal
          we can read here, so it states what its ↗ does instead of guessing. */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {/* Questions come first: the designer inserts them as blocks, so they
            have to exist before the invite can be laid out. */}
        {/* /app/form-fields, not /app/events/:id/form-fields: the :id segment
            is decorative (the page reads eventId from context, and every write
            sends it in the body), and only this path matches the Guests section
            in coupleSections.ts. The other one highlights Home. */}
        <button
          type="button"
          onClick={() => navigate("/app/form-fields")}
          className="flex min-w-[128px] flex-1 flex-col gap-0.5 rounded-xl border border-primary/15
                     bg-white px-3 py-2.5 text-left transition-colors hover:border-primary/40"
        >
          <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-text/40">
            Step 1
          </span>
          <span className="text-[13px] font-semibold text-text">What to ask</span>
          <span className={`text-[10.5px] ${questionsHint.tone}`}>{questionsHint.label}</span>
        </button>
        {/* In the demo this asks before leaving, instead of navigating away.
            The designer must open in a new tab (see below), and a new tab is a
            new sessionStorage, so it would never carry the demo flag and the
            visitor would land on /login with no explanation. Signup is the
            honest destination — but going there is a one-way door, since
            exitDemo() clears the flag and their seating work with it, so it
            takes a confirmation rather than a single stray click. */}
        {demo ? (
          <button
            type="button"
            onClick={() => setInviteGate(true)}
            className="flex min-w-[128px] flex-1 flex-col gap-0.5 rounded-xl border border-primary/15
                       bg-white px-3 py-2.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-text/40">
              Step 2
            </span>
            <span className="text-[13px] font-semibold text-text">Design invite</span>
            <span className="text-[10.5px] text-primary">Free account needed</span>
          </button>
        ) : (
          /* The designer must open in a new tab, never an in-app navigation. */
          <a
            href="/app/rsvps/designer-v3"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-[128px] flex-1 flex-col gap-0.5 rounded-xl border border-primary/15
                       bg-white px-3 py-2.5 transition-colors hover:border-primary/40"
          >
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-text/40">
              Step 2
            </span>
            <span className="text-[13px] font-semibold text-text">Design invite ↗</span>
            <span className="text-[10.5px] text-text/40">Opens in a new tab</span>
          </a>
        )}
        <span
          className="flex min-w-[128px] flex-1 flex-col gap-0.5 rounded-xl border border-sect-guests
                     bg-sect-guests/10 px-3 py-2.5"
        >
          <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-text/40">
            Step 3
          </span>
          <span className="text-[13px] font-semibold text-sect-guests">Replies</span>
          <span className="text-[10.5px] text-text/40">You’re here</span>
        </span>
      </div>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard
          label="Replies"
          value={stats.invited}
          variant="primary"
          size="sm"
          icon={<UserGroupIcon className="h-4 w-4" />}
        />
        {/* "Replies" and "No table yet" are party counts, matching planner's
            "Total Guests" and "Unassigned". This one is a pax sum, so the
            label has to say so: planner writes "(pax)", couple says people. */}
        <StatsCard
          label="People coming"
          value={stats.coming}
          variant="success"
          size="sm"
          icon={<CheckCircleIcon className="h-4 w-4" />}
        />
        {/* A party count, like planner's "Unassigned", not the seating page's
            "Seats needed", which sums pax. Different names on purpose. */}
        <StatsCard
          label="No table yet"
          value={stats.needsSeat}
          variant="warning"
          size="sm"
          icon={<ExclamationCircleIcon className="h-4 w-4" />}
        />
      </div>

      {/* ─── Filters + search ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search guests by name"
            className="w-full rounded-xl border border-primary/15 bg-white py-2.5 pl-9 pr-3 text-sm
                       text-text placeholder-text/35 focus:border-primary/40 focus:outline-none
                       focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-primary text-white"
                  : "border border-primary/15 bg-white text-text/60 hover:border-primary/40 hover:text-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── The list ────────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/10 bg-white px-6 py-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sect-guests/12">
            <UserGroupIcon className="h-8 w-8 text-sect-guests" />
          </span>
          <p className="font-semibold text-text">
            {parties.length === 0 ? "Nobody on the list yet" : "Nobody matches that"}
          </p>
          <p className="max-w-[34ch] text-sm text-text/55">
            {parties.length === 0
              ? "Share your invite and replies will land here. You can also add someone yourself."
              : "Try a different filter, or clear your search."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-primary/10 overflow-hidden rounded-2xl border border-primary/10 bg-white">
          {visible.map((party) => {
            const isOpen = expanded === party.key;
            const answers = answersOf(party.rsvp);
            const guestKey = party.guest?.guestId ?? party.guest?.id;

            return (
              <li key={party.key}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : party.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-sect-guests/12 text-[13px] font-bold text-sect-guests">
                    {party.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-text">
                      {party.name}
                    </span>
                    <span className="block text-[12.5px] text-text/55">
                      {/* `pax` is the whole party, the guest included, so it
                          is a seat count, not a plus-one count. "Bringing 1"
                          read as "them plus one". Matches the seating page. */}
                      {party.state === "notComing"
                        ? "Not coming"
                        : `${party.pax} seat${party.pax === 1 ? "" : "s"}`}
                      {party.phoneNo ? ` · ${party.phoneNo}` : ""}
                    </span>
                  </span>

                  <StatusPill party={party} />

                  <ChevronDownIcon
                    className={`h-4 w-4 flex-shrink-0 text-text/35 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* ─── Expanded: their reply, seat and pass ────────────── */}
                {isOpen && (
                  <div className="flex flex-col gap-3 border-t border-primary/10 bg-accent/40 px-4 py-3">
                    {/* Seat + pass. One pass covers the whole party. */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                          party.table
                            ? "bg-sect-seating/15 text-sect-seating"
                            : "bg-sect-home/15 text-sect-home"
                        }`}
                      >
                        {party.table ?? "No table yet"}
                      </span>
                      {guestKey && <QrStatusBadge status={qrStatusOf(qrMap.get(guestKey))} />}
                      {party.guest?.guestCode && (
                        <span className="font-mono text-[11px] text-text/45">
                          {party.guest.guestCode}
                        </span>
                      )}
                    </div>

                    {answers.length > 0 && (
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                        {answers.map((a) => (
                          <div key={a.label} className="contents">
                            <dt className="text-[12px] font-semibold text-text/50">{a.label}</dt>
                            <dd className="text-[12px] text-text/80">{a.text}</dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    {party.remarks && (
                      <p className="text-[12.5px] italic text-text/60">“{party.remarks}”</p>
                    )}

                    {!isReadOnly && (
                      <div className="flex flex-wrap gap-2">
                        {party.state === "needsSeat" && (
                          <Button
                            variant="primary"
                            className="!px-3 !py-1.5 !text-xs"
                            onClick={() => navigate("/app/tables/v3")}
                          >
                            Give them a seat
                          </Button>
                        )}
                        {party.rsvp && (
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1.5 !text-xs"
                            onClick={() => setModal({ open: true, rsvp: party.rsvp })}
                          >
                            <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
                            Edit their reply
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!isReadOnly && (
        <Button variant="secondary" className="w-full" onClick={() => setModal({ open: true })}>
          + Add someone
        </Button>
      )}

      {/* Deletion stays in planner mode: it goes through the RSVP module, which
          also soft-deletes the Guest row and unseats the party.
          Hidden in the demo, where CoupleShell removes the advanced-view switch —
          the hint would point at a control that isn't on screen. */}
      {!demo && (
        <p className="text-center text-[11.5px] text-text/40">
          Need bulk import, exports, or to remove someone? Switch to advanced view from your account
          menu.
        </p>
      )}

      <DemoGate
        isOpen={exportGate}
        onClose={() => setExportGate(false)}
        action="export your guest list"
        reason="Exports pull your real guest list out of My Big Days as a spreadsheet, so there has to be an account holding it."
        source="guest_export"
      />

      <DemoGate
        isOpen={inviteGate}
        onClose={() => setInviteGate(false)}
        action="design your invite"
        reason="The invite designer opens in its own tab and publishes a link guests can reply to, so it needs an account to publish from."
        source="design_invite"
      />

      <RsvpFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        eventId={eventId!}
        initial={modal.rsvp}
        initialAnswers={modal.rsvp?.answers ?? []}
        onSave={async (data, id) => {
          try {
            if (id) await updateRsvp.mutateAsync({ rsvpGuid: id, ...data });
            else await createRsvp.mutateAsync(data);
            qc.invalidateQueries({ queryKey: ["rsvps", eventId] });
            qc.invalidateQueries({ queryKey: ["guests", eventId] });
          } catch (err) {
            console.error("Couple guests save error", err);
          } finally {
            setModal({ open: false });
          }
        }}
      />
    </div>
  );
}
