// src/components/pages/Guests/GuestCheckInPrintView.tsx
//
// The paper fallback for check-in day.
//
// Venue Wi-Fi and mobile data fail often enough that we've had couples unable
// to log in and check anyone in. This is the offline answer: one sheet, a tick
// box per party, sorted the way someone actually works a door.
//
// Printing is driven by the `.print-sheet` rules in index.css: the global
// print block hides everything else on the page, so the app chrome never
// reaches the paper.

import { useMemo } from "react";
import { useNavigate } from "react-router";
import { PrinterIcon, ArrowLeftIcon } from "@heroicons/react/solid";

import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { Button } from "../../atoms/Button";
import { NoEventsState } from "../../molecules/NoEventsState";
import { useEventContext } from "../../../context/EventContext";
import { useGuestsApi } from "../../../api/hooks/useGuestsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { formatEventDate } from "../../../utils/eventUtils";

export default function GuestCheckInPrintView() {
  const navigate = useNavigate();
  const { eventId, event, eventsLoading } = useEventContext()!;
  const { data: guests = [], isLoading, isError } = useGuestsApi(eventId!);
  const { data: tables = [], isLoading: tablesLoading } = useTablesApi(eventId!);

  const tableMap = useMemo(() => new Map(tables.map((t) => [t.id, t.name])), [tables]);

  // Sorted by table then name: a door list is worked table by table, and
  // unassigned parties belong at the end rather than scattered through it.
  const rows = useMemo(() => {
    return guests
      .map((g) => ({
        id: g.id,
        name: g.guestName ?? g.name ?? "",
        code: g.guestCode ?? "",
        pax: g.pax || g.noOfPax || 1,
        table: g.tableId ? (tableMap.get(g.tableId) ?? "") : "",
        phone: g.phoneNo ? (g.phoneNo.startsWith("+") ? g.phoneNo : `+${g.phoneNo}`) : "",
      }))
      .sort((a, b) => {
        if (!a.table && b.table) return 1;
        if (a.table && !b.table) return -1;
        const byTable = a.table.localeCompare(b.table, undefined, { numeric: true });
        return byTable !== 0 ? byTable : a.name.localeCompare(b.name);
      });
  }, [guests, tableMap]);

  const totalPax = useMemo(() => rows.reduce((sum, r) => sum + r.pax, 0), [rows]);

  if (eventsLoading) return <PageLoader message="Loading…" />;
  if (!eventId)
    return (
      <NoEventsState
        title="No event selected"
        message="Pick an event before printing a check-in sheet."
      />
    );
  if (isLoading || tablesLoading) return <PageLoader message="Loading guests…" />;
  if (isError)
    return <ErrorState message="Failed to load guests." onRetry={() => window.location.reload()} />;

  return (
    <>
      {/* Screen-only controls */}
      <div className="print-hide mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Check-in sheet</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Print this and keep it at the door, since it works even when the venue Wi-Fi doesn't.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/app/guests")}>
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Back to guests
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <PrinterIcon className="mr-1.5 h-4 w-4" />
            Print this sheet
          </Button>
        </div>
      </div>

      {/* The sheet itself: the only thing that reaches the printer. */}
      <div className="print-sheet rounded-xl border border-gray-200 bg-white p-6 text-black dark:border-white/10">
        <div className="mb-4 border-b border-gray-300 pb-3">
          <h2 className="text-2xl font-semibold">{event?.title ?? "Guest check-in"}</h2>
          <p className="mt-1 text-sm">
            {formatEventDate(event?.date ?? event?.raw?.eventDate)} · {rows.length}{" "}
            {rows.length === 1 ? "party" : "parties"} · {totalPax} pax
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm">No guests to print yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-400 text-left">
                <th className="w-10 py-2">In</th>
                <th className="py-2">Guest Name</th>
                <th className="py-2">Code</th>
                <th className="w-14 py-2">Pax</th>
                <th className="py-2">Table</th>
                <th className="py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-300">
                  <td className="py-2">
                    <span className="inline-block h-4 w-4 border border-gray-600" />
                  </td>
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2 font-mono text-xs">{r.code}</td>
                  <td className="py-2">{r.pax}</td>
                  <td className="py-2">{r.table || "—"}</td>
                  <td className="py-2">{r.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
