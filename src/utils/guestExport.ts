// src/utils/guestExport.ts
// ---------------------------------------------------------------------------
// Builds the guest export rows.
//
// Kept as a pure function (no hooks, no API) so the planner Guests page, the
// couple-mode guest list and the paper-backup reminder modal all emit a
// byte-identical file. Add a column here and every caller gets it.
// ---------------------------------------------------------------------------

import type { Guest } from "../api/hooks/useGuestsApi";
import type { TableBase } from "../api/hooks/useTablesApi";
import type { ExportRow } from "./exportUtils";

export interface GuestExportInput {
  guests: Guest[];
  tables: TableBase[];
  /** guestCode → gift amount, joined from budget transactions. */
  giftMap: Map<string, number>;
  /** Empty when the event has no budget set up, but the column still renders. */
  currencySymbol: string;
}

/** Party size, matching the fallback chain the guest card uses. */
function paxOf(g: Guest): number {
  return g.pax || g.noOfPax || 1;
}

/** Phone with a leading "+", matching the guest card's display rule. */
function phoneOf(g: Guest): string {
  const phone = g.phoneNo ?? "";
  if (!phone) return "";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

export function buildGuestRows({
  guests,
  tables,
  giftMap,
  currencySymbol,
}: GuestExportInput): ExportRow[] {
  const tableMap = new Map(tables.map((t) => [t.id, t.name]));
  // Header carries the currency so the numbers aren't ambiguous on paper.
  const giftHeader = currencySymbol ? `Gift (${currencySymbol})` : "Gift";

  return guests.map((g) => ({
    "Guest Name": g.guestName ?? g.name ?? "",
    "Guest Code": g.guestCode ?? "",
    "Phone": phoneOf(g),
    "Pax": paxOf(g),
    "Guest Type": g.guestType ?? "Other",
    "Table": g.tableId ? (tableMap.get(g.tableId) ?? "") : "",
    "Seating": g.tableId ? "Assigned" : "Unassigned",
    [giftHeader]: giftMap.get(g.guestCode ?? "") ?? "",
    "Notes": g.remarks ?? g.notes ?? "",
  }));
}
