// src/components/pages/Tables/CoupleSeatingPage.tsx
//
// Couple-mode seating. Same data and same endpoints as TablesPageV3: what
// changes is that the job comes first (who still needs a seat) and assignment
// works by tapping rather than dragging, because dragging does not work on a
// phone.
//
// ── Rules inherited from planner mode, not invented here ──────────────────
// 1. A party cannot be split. One RSVP is one Guest row carrying `pax`, and
//    AssignTable takes a single guestId. See docs/COUPLE_MODE.md.
// 2. Over-capacity is ALWAYS allowed, never blocked; it only warns. Tables
//    that would overfill are flagged amber but stay tappable. The warning
//    sentence and its amber toast styling are copied verbatim from
//    TablesPage.tsx:234 / GuestsPage.tsx:193 / TableAssignments.tsx:56.
// 3. Occupancy is summed `pax`, never a row count.
// 4. isFull = assigned >= capacity; isOver = assigned > capacity; red is
//    reserved for over-capacity.
//
// One thing couple mode adds: auto-assign returns `skippedGuestIds`, which
// every existing surface throws away. Here the skipped parties are named, with
// the reason, because "Skipped: 1" is not actionable.

import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  ExclamationIcon,
  SparklesIcon,
  UserGroupIcon,
  XIcon,
} from "@heroicons/react/solid";

import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { Button } from "../../atoms/Button";
import { StatsCard } from "../../atoms/StatsCard";
import { NoEventsState } from "../../molecules/NoEventsState";
import { TableFormModal } from "../../molecules/TableFormModal";

import { useEventContext } from "../../../context/EventContext";
import { useAuth } from "../../../api/hooks/useAuth";
import { useTablesApi, type TableBase } from "../../../api/hooks/useTablesApi";
import {
  useGuestsApi,
  useAssignGuestToTable,
  useUnassignGuestFromTable,
  useAutoAssignGuests,
  type Guest,
} from "../../../api/hooks/useGuestsApi";

/** Planner convention: `pax || noOfPax || 1`, so a 0-pax row still counts as 1. */
function paxOf(g: Guest): number {
  return g.pax || g.noOfPax || 1;
}

/** Amber toast used across the app for over-capacity. Not toast.error. */
function warnOverCapacity(tableName: string, after: number, capacity: number) {
  toast(`⚠️ ${tableName} is over capacity (${after}/${capacity}). Guest assigned anyway.`, {
    duration: 4000,
    style: { background: "#fef3c7", color: "#92400e" },
  });
}

interface AutoAssignResult {
  assignedCount?: number;
  skippedCount?: number;
  skippedGuestIds?: string[];
}

export default function CoupleSeatingPage() {
  const navigate = useNavigate();
  const { eventId, eventsLoading } = useEventContext()!;
  const { userRole } = useAuth();
  const isReadOnly = userRole === 6;

  const { data: tables = [], isLoading: tablesLoading, isError: tablesError } = useTablesApi(eventId!);
  const { data: guests = [], isLoading: guestsLoading } = useGuestsApi(eventId!);

  const assignGuest = useAssignGuestToTable(eventId!);
  const unassignGuest = useUnassignGuestFromTable(eventId!);
  const autoAssign = useAutoAssignGuests(eventId!);

  /** Party awaiting a table (tap a party, then tap a table). */
  const [picking, setPicking] = useState<Guest | null>(null);
  const [openTableId, setOpenTableId] = useState<string | null>(null);
  /** Parties the last auto-assign could not place (from skippedGuestIds). */
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [addTableOpen, setAddTableOpen] = useState(false);

  /** tableId → summed pax. */
  const occupancy = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of guests) {
      if (!g.tableId) continue;
      map.set(g.tableId, (map.get(g.tableId) ?? 0) + paxOf(g));
    }
    return map;
  }, [guests]);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const g of guests) {
      if (!g.tableId) continue;
      const list = map.get(g.tableId);
      if (list) list.push(g);
      else map.set(g.tableId, [g]);
    }
    return map;
  }, [guests]);

  const unseated = useMemo(() => guests.filter((g) => !g.tableId), [guests]);

  const stats = useMemo(() => {
    const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
    const seated = guests.filter((g) => g.tableId).reduce((s, g) => s + paxOf(g), 0);
    const waiting = unseated.reduce((s, g) => s + paxOf(g), 0);
    return { totalSeats, seated, waiting, free: Math.max(totalSeats - seated, 0) };
  }, [tables, guests, unseated]);

  const skippedParties = useMemo(
    () => guests.filter((g) => skippedIds.includes(g.guestId ?? g.id)),
    [guests, skippedIds]
  );

  // ─── Guards ─────────────────────────────────────────────────────────────────

  if (eventsLoading) return <PageLoader message="Loading…" />;
  if (!eventId)
    return (
      <NoEventsState
        title="No wedding yet"
        message="Create your wedding first, then you can start arranging tables."
      />
    );
  if (tablesLoading || guestsLoading) return <PageLoader message="Loading your seating…" />;
  if (tablesError)
    return (
      <ErrorState message="We couldn’t load your tables." onRetry={() => window.location.reload()} />
    );

  const freeSeats = (t: TableBase) => t.capacity - (occupancy.get(t.id) ?? 0);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleSeat = (table: TableBase) => {
    if (!picking) return;
    const guest = picking;
    const pax = paxOf(guest);
    const after = (occupancy.get(table.id) ?? 0) + pax;
    const willExceed = after > table.capacity;

    setPicking(null);
    assignGuest.mutate(
      { guestId: guest.guestId ?? guest.id, tableId: table.id },
      {
        onSuccess: () => {
          setSkippedIds((ids) => ids.filter((id) => id !== (guest.guestId ?? guest.id)));
          if (willExceed) warnOverCapacity(table.name, after, table.capacity);
          else toast.success(`${guest.guestName || guest.name} is at ${table.name}`);
        },
        onError: () => toast.error("Failed to assign guest to table"),
      }
    );
  };

  const handleUnseat = (guest: Guest) => {
    unassignGuest.mutate(guest.guestId ?? guest.id, {
      onSuccess: () => toast.success(`${guest.guestName || guest.name} has no table again`),
      onError: () => toast.error("Failed to unassign guest from table"),
    });
  };

  const handleAutoAssign = () => {
    autoAssign.mutate(undefined, {
      onSuccess: (data: AutoAssignResult | undefined) => {
        const assigned = data?.assignedCount ?? 0;
        const skipped = data?.skippedGuestIds ?? [];
        setSkippedIds(skipped);
        if (skipped.length) {
          toast(`Seated ${assigned}, but ${skipped.length} didn’t fit`, {
            duration: 4000,
            style: { background: "#fef3c7", color: "#92400e" },
          });
        } else {
          toast.success(`Seated ${assigned} ${assigned === 1 ? "party" : "parties"} for you`);
        }
      },
      onError: () => toast.error("Auto-assign failed."),
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const roomiest = [...tables].sort((a, b) => freeSeats(b) - freeSeats(a))[0];
  const biggestSkipped = [...skippedParties].sort((a, b) => paxOf(b) - paxOf(a))[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-text">Where everyone sits</h1>
        <p className="text-sm text-text/60">
          {stats.seated} of {stats.totalSeats} seats taken.
        </p>
      </div>

      {/* ─── Tables / Floor plan ──────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-full border border-primary/15 bg-white p-1">
        <NavLink
          to="/app/tables/v3"
          end
          className={({ isActive }) =>
            `flex-1 rounded-full px-3 py-2 text-center text-[12.5px] font-semibold transition-colors ${
              isActive ? "bg-sect-seating/15 text-sect-seating" : "text-text/55 hover:text-text"
            }`
          }
        >
          Tables
        </NavLink>
        <NavLink
          to="/app/tables/floorplan"
          className={({ isActive }) =>
            `flex-1 rounded-full px-3 py-2 text-center text-[12.5px] font-semibold transition-colors ${
              isActive ? "bg-sect-seating/15 text-sect-seating" : "text-text/55 hover:text-text"
            }`
          }
        >
          Floor plan
        </NavLink>
      </div>

      {/* All three are pax sums, so every label says "seats": couple mode's
          word for planner's "(pax)" suffix. The guests page's "No table yet"
          counts parties, so this one cannot borrow that wording. */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard label="Seats taken" value={stats.seated} variant="success" size="sm" />
        <StatsCard label="Seats needed" value={stats.waiting} variant="warning" size="sm" />
        <StatsCard label="Seats free" value={stats.free} variant="primary" size="sm" />
      </div>

      {/* ─── Auto-assign couldn't place these ─────────────────────────────── */}
      {skippedParties.length > 0 && biggestSkipped && roomiest && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-500 px-4 py-4 text-white shadow-md">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/20">
            <ExclamationIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">
              {skippedParties.length === 1
                ? `${biggestSkipped.guestName || biggestSkipped.name} couldn’t be seated`
                : `${skippedParties.length} parties couldn’t be seated`}
            </p>
            <p className="mb-3 text-[13px] text-white/90">
              {biggestSkipped.guestName || biggestSkipped.name} needs {paxOf(biggestSkipped)} seat
              {paxOf(biggestSkipped) === 1 ? "" : "s"}, and the roomiest table ({roomiest.name}) has{" "}
              {Math.max(freeSeats(roomiest), 0)} seat
              {freeSeats(roomiest) === 1 ? "" : "s"} left. A party has to sit together.
            </p>
            <div className="flex flex-wrap gap-2">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setAddTableOpen(true)}
                  className="rounded-full border border-white/55 px-3.5 py-1.5 text-xs font-semibold
                             transition-colors hover:border-white hover:bg-white/15"
                >
                  Add a table
                </button>
              )}
              <button
                type="button"
                onClick={() => setSkippedIds([])}
                className="rounded-full border border-white/55 px-3.5 py-1.5 text-xs font-semibold
                           transition-colors hover:border-white hover:bg-white/15"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── The job: who still needs a seat ──────────────────────────────── */}
      {picking ? (
        <div
          className="sticky top-0 z-10 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3
                     text-white shadow-md"
        >
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white/20 text-[13px] font-bold">
            {(picking.guestName || picking.name || "?").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              Seating {picking.guestName || picking.name}
            </p>
            <p className="text-[12.5px] text-white/80">
              {paxOf(picking)} {paxOf(picking) === 1 ? "seat" : "seats"}; now tap a table
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPicking(null)}
            aria-label="Cancel seating"
            className="rounded-full p-2 transition-colors hover:bg-white/15"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ) : unseated.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-4 py-3">
            <p className="text-sm text-text/70">
              {/* A row count, so it must not say "seats". The card above it
                  reads "Seats needed" and sums pax. */}
              <span className="text-[15px] font-bold text-text">{unseated.length}</span>{" "}
              still ha{unseated.length === 1 ? "s" : "ve"} no table
            </p>
            {!isReadOnly && (
              <Button
                variant="primary"
                className="!px-3 !py-1.5 !text-xs"
                loading={autoAssign.isPending}
                onClick={handleAutoAssign}
              >
                <SparklesIcon className="mr-1.5 h-3.5 w-3.5" />
                Seat everyone for me
              </Button>
            )}
          </div>
          <ul className="divide-y divide-primary/10">
            {unseated.map((g) => (
              <li key={g.guestId ?? g.id}>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => {
                    setPicking(g);
                    setOpenTableId(null);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
                             hover:bg-accent/40 disabled:cursor-default"
                >
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-sect-guests/12 text-[13px] font-bold text-sect-guests">
                    {(g.guestName || g.name || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-text">
                      {g.guestName || g.name}
                    </span>
                    <span className="block text-[12.5px] text-text/55">
                      {paxOf(g)} {paxOf(g) === 1 ? "seat" : "seats"}
                    </span>
                  </span>
                  {!isReadOnly && (
                    <span className="flex-shrink-0 rounded-full bg-sect-home/15 px-2.5 py-1 text-[11.5px] font-semibold text-sect-home">
                      Pick a table
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-accent/40 px-4 py-4">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-sect-guests/15">
            <SparklesIcon className="h-5 w-5 text-sect-guests" />
          </span>
          <div>
            <p className="text-[14.5px] font-semibold text-text">Everyone has a seat</p>
            <p className="text-[13px] text-text/60">Nothing left to sort here.</p>
          </div>
        </div>
      )}

      {/* ─── Tables ───────────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-text">Your tables</h2>
        <span className="text-[12.5px] text-text/45">
          {stats.free} seat{stats.free === 1 ? "" : "s"} free
        </span>
      </div>

      {tables.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/10 bg-white px-6 py-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sect-seating/12">
            <UserGroupIcon className="h-8 w-8 text-sect-seating" />
          </span>
          <p className="font-semibold text-text">No tables yet</p>
          <p className="max-w-[34ch] text-sm text-text/55">
            Add your first table and you can start seating people.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => {
            const filled = occupancy.get(t.id) ?? 0;
            const free = t.capacity - filled;
            const isOver = filled > t.capacity;
            const isFull = filled >= t.capacity;
            // Never disabled: over-capacity is warned, not blocked.
            const fits = picking ? free >= paxOf(picking) : false;
            const tight = picking ? !fits : false;

            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() =>
                    picking ? handleSeat(t) : setOpenTableId(openTableId === t.id ? null : t.id)
                  }
                  className={`flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                    fits
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : tight
                        ? "border-amber-400 bg-amber-50"
                        : "border-primary/10 bg-white hover:border-primary/30"
                  }`}
                >
                  <span className="text-[15px] font-bold text-text">{t.name}</span>

                  <span className="flex flex-wrap gap-1" aria-hidden="true">
                    {Array.from({ length: t.capacity }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-[13px] w-[13px] rounded-full ${
                          i < filled ? "bg-sect-seating" : "border border-primary/20 bg-accent/60"
                        }`}
                      />
                    ))}
                  </span>

                  <span
                    className={`text-[11.5px] font-semibold ${
                      isOver
                        ? "text-red-600"
                        : tight
                          ? "text-amber-600"
                          : fits
                            ? "text-primary"
                            : "text-text/45"
                    }`}
                  >
                    {isOver
                      ? "Over capacity"
                      : tight
                        ? `Only ${Math.max(free, 0)} left (will overfill)`
                        : fits
                          ? "Seat them here →"
                          : isFull
                            ? "Full"
                            : `${free} seat${free === 1 ? "" : "s"} free`}
                  </span>
                  <span className="sr-only">
                    {t.name}: {filled} of {t.capacity} seats filled
                  </span>
                </button>

                {/* Who is at this table */}
                {openTableId === t.id && (
                  <div className="mt-2 flex flex-col gap-2 rounded-xl border border-primary/10 bg-accent/40 p-3">
                    {(guestsByTable.get(t.id) ?? []).length === 0 ? (
                      <p className="py-2 text-center text-[12.5px] text-text/50">
                        No guests assigned yet
                      </p>
                    ) : (
                      (guestsByTable.get(t.id) ?? []).map((g) => (
                        <div
                          key={g.guestId ?? g.id}
                          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-text">
                              {g.guestName || g.name}
                            </span>
                            <span className="block text-[11px] text-text/50">
                              {paxOf(g)} {paxOf(g) === 1 ? "seat" : "seats"}
                            </span>
                          </span>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleUnseat(g)}
                              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-text/50
                                         transition-colors hover:bg-secondary/10 hover:text-secondary"
                            >
                              Move
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!isReadOnly && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setAddTableOpen(true)}>
            + Add a table
          </Button>
          <Button variant="ghost" onClick={() => navigate("/app/tables/floorplan")}>
            Open the floor plan
          </Button>
        </div>
      )}

      <TableFormModal isOpen={addTableOpen} onClose={() => setAddTableOpen(false)} />
    </div>
  );
}
