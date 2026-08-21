// src/demo/demoSeed.ts
//
// The sample wedding. Shapes here are the *wire* shapes (ApiGuest, ApiTable,
// ApiEvent, raw RSVP rows) because the adapter hands them to the real hooks,
// which run their own normalizers over them. Do not pre-normalize.
//
// ── The data model this has to respect (see CLAUDE.md) ────────────────────────
// One RSVP creates exactly ONE Guest row, and Guest.pax is the party size
// INCLUDING the person who replied. A party of one is pax 1, not 0. When a party
// declines (noOfPax 0) the backend soft-deletes the Guest row, so a declined RSVP
// has no Guest at all — that asymmetry is modelled here on purpose, because
// CoupleGuestsPage's "awaitingGuest"/"notComing" states depend on it.
//
// Totals: 14 RSVPs · 12 guest rows · 32 pax · 9 parties seated · 3 needing a
// table · 2 declined. Deliberately includes one over-capacity table so the
// warning state is visible, and one empty table.

import type { ApiGuest } from "../types/guest";
import type { ApiTable } from "../utils/tableUtils";
import type { ApiEvent } from "../types/event";
import type { BudgetApiResponse } from "../types/budget";
import type { ApiTransaction } from "../types/transaction";
import type { ChecklistItem } from "../api/hooks/useChecklistApi";
import type { FloorItem } from "../components/pages/Tables/useFloorPlanState";
import { DEMO_EVENT_ID } from "./demoMode";

const guestId = (n: number) => `c0ffee00-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rsvpId = (n: number) => `beefcafe-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tableId = (n: number) => `fadedead-0000-4000-8000-${String(n).padStart(12, "0")}`;

/**
 * The next 14 March. Computed rather than hardcoded so the demo never shows a
 * wedding that has already happened — a past date would make the whole page read
 * as abandoned, and the countdown would go negative.
 */
function nextMarch14(): Date {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 2, 14, 18, 0, 0);
  return thisYear > now ? thisYear : new Date(now.getFullYear() + 1, 2, 14, 18, 0, 0);
}

export const DEMO_EVENT_DATE = nextMarch14();

export const demoEvent: ApiEvent = {
  eventID: "1",
  eventGuid: DEMO_EVENT_ID,
  userGuid: "0b5ea7ed-0000-4000-8000-000000000001",
  eventName: "Aisha & Wei Ming",
  eventDate: DEMO_EVENT_DATE.toISOString(),
  eventTime: "18:00",
  eventLocation: "The Glasshouse, Seputeh",
  noOfTable: 6,
  eventDescription:
    "A sample wedding so you can see how My Big Days works. Change anything you like — nothing here is saved.",
  isDeleted: false,
  slug: "aisha-and-wei-ming-demo",
  eventCode: "DEMO24",
  rsvpDueDate: new Date(DEMO_EVENT_DATE.getTime() - 30 * 864e5).toISOString(),
  isExpired: false,
};

export const demoTables: ApiTable[] = [
  { tableId: tableId(1), tableName: "Family — Bride",  maxSeats: 10 },
  { tableId: tableId(2), tableName: "Family — Groom",  maxSeats: 10 },
  { tableId: tableId(3), tableName: "School Friends",  maxSeats: 8 },
  { tableId: tableId(4), tableName: "Work",            maxSeats: 8 },
  { tableId: tableId(5), tableName: "Elders",          maxSeats: 6 },
  { tableId: tableId(6), tableName: "Overflow",        maxSeats: 4 },
];

/** name, pax, table (null = needs a seat), group, phone, note */
type Party = [string, number, string | null, string, string, string?];

const PARTIES: Party[] = [
  // ── Seated (9 parties, 27 pax) ────────────────────────────────────────────
  ["Aunt Mei Ling",      4, tableId(1), "Family",    "+60 12-345 6701"],
  ["Uncle Tan Boon Huat", 2, tableId(1), "Family",   "+60 12-345 6702", "Wheelchair access needed"],
  ["Aunty Fatimah",      3, tableId(1), "Family",    "+60 12-345 6703"],
  ["Marcus Tay",         5, tableId(2), "Family",    "+60 12-345 6704"],
  ["Rahman & Siti",      2, tableId(3), "Friends",   "+60 12-345 6705"],
  ["Priya Raman",        3, tableId(3), "Friends",   "+60 12-345 6706", "Vegetarian ×2"],
  ["Jason Lim",          1, tableId(3), "Friends",   "+60 12-345 6707"],
  ["Nurul Huda",         2, tableId(4), "Colleague", "+60 12-345 6708"],
  // Table 6 holds 4; this party of 5 puts it over capacity on purpose.
  ["The Wong Family",    5, tableId(6), "Family",    "+60 12-345 6709", "Bringing the kids"],

  // ── Coming, not yet seated (3 parties, 5 pax) ─────────────────────────────
  ["Kavitha & Suresh",   2, null,       "Friends",   "+60 12-345 6710"],
  ["Daniel Ooi",         1, null,       "Colleague", "+60 12-345 6711"],
  ["Hui Xin",            2, null,       "Friends",   "+60 12-345 6712", "Might be late"],

  // ── Declined: pax 0, so no Guest row exists for these ─────────────────────
  ["Gerald Ng",          0, null,       "Colleague", "+60 12-345 6713", "Away that week"],
  ["Aunty Rose",         0, null,       "Family",    "+60 12-345 6714"],
];

/** Raw RSVP rows, as /rsvp/GetRsvp/List/{eventId} returns them. */
export const demoRsvps = PARTIES.map(([name, pax, table, , phone, note], i) => ({
  rsvpGuid: rsvpId(i + 1),
  rsvpId: i + 1, // the int the FE must never key on; present so the demo mirrors the DTO
  eventGuid: DEMO_EVENT_ID,
  guestName: name,
  noOfPax: pax,
  phoneNo: phone,
  remarks: note ?? "",
  tableId: table ?? undefined,
  answers: [],
}));

/** Guest rows. Declined parties (pax 0) are absent, matching the soft delete. */
export const demoGuests: ApiGuest[] = PARTIES.flatMap(
  ([name, pax, table, group, phone, note], i) =>
    pax === 0
      ? []
      : [
          {
            guestId: guestId(i + 1),
            eventId: 1,
            eventGuid: DEMO_EVENT_ID,
            rsvpId: rsvpId(i + 1),
            tableId: table,
            guestIndex: i + 1,
            guestCode: `G${String(i + 1).padStart(3, "0")}`,
            name,
            phoneNo: phone,
            pax,
            groupId: group,
            flag: group,
            notes: note ?? "",
            isDeleted: false,
          } satisfies ApiGuest,
        ],
);

// ─── Money ───────────────────────────────────────────────────────────────────
// Backend entity is still called Wallet, so the wire fields keep that name
// (see types/budget.ts). MYR to match the +60 phone numbers.

export const DEMO_WALLET_GUID = "5eedbeef-0000-4000-8000-000000000001";

export const demoBudget: BudgetApiResponse = {
  walletGuid: DEMO_WALLET_GUID,
  eventGuid: DEMO_EVENT_ID,
  userId: "0b5ea7ed-0000-4000-8000-000000000001",
  currency: "MYR",
  budget: 45000, // wire name is `budget`; the FE maps it to totalBudget
  isDeleted: false,
  createdBy: "demo",
  updatedBy: "demo",
  createdDate: new Date(Date.now() - 90 * 864e5).toISOString(),
  updatedDate: new Date(Date.now() - 7 * 864e5).toISOString(),
};

/**
 * paymentStatus, vendorName and dueDate are not columns yet — the frontend packs
 * them into `remarks` as JSON and parseTransaction() reads them back out
 * (utils/transactionUtils.ts:18). The seed has to use that exact envelope, or the
 * budget page sees every row as having no payment status.
 */
function remarks(
  ext: { vendorName?: string; paymentStatus?: string; dueDate?: string | null },
  notes = "",
): string {
  return JSON.stringify({ _extended: ext, notes });
}

/** name, amount, category, paid?, vendor, dueInDays */
type Spend = [string, number, string, boolean, string, number?];

const SPENDS: Spend[] = [
  ["Venue deposit",        8000, "Venue",        true,  "The Glasshouse"],
  ["Dinner for 32",        9600, "Catering",     false, "Golden Spoon Catering", 30],
  ["Photographer",         4500, "Photography",  true,  "Lens & Light Studio"],
  ["Gown and suit",        3200, "Attire",       true,  "Atelier Rima"],
  ["Centrepieces",         2800, "Decoration",   false, "Bloom & Stem", 45],
  ["Invitation printing",   650, "Invitation",   true,  "Kertas Press"],
];

// Paid 16,350 · pending 12,400. BudgetSummaryCards counts only PAID rows as
// spending and shows pending separately, so the dashboard aggregate below has to
// use the same split or the two pages would disagree for identical data.
export const demoTransactions: ApiTransaction[] = SPENDS.map(
  ([name, amount, category, paid, vendor, dueInDays], i) => ({
    transactionGuid: `d0113a45-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    walletGuid: DEMO_WALLET_GUID,
    eventGuid: DEMO_EVENT_ID,
    type: 1, // Debit / expense
    transactionName: name,
    transactionDate: paid
      ? new Date(Date.now() - (60 - i * 8) * 864e5).toISOString()
      : null,
    category,
    amount,
    remarks: remarks({
      vendorName: vendor,
      paymentStatus: paid ? "Paid" : "Pending",
      dueDate: dueInDays
        ? new Date(DEMO_EVENT_DATE.getTime() - dueInDays * 864e5).toISOString()
        : null,
    }),
    createdBy: "demo",
    updatedBy: "demo",
    createdDate: new Date(Date.now() - (70 - i * 8) * 864e5).toISOString(),
    lastUpdated: new Date(Date.now() - (70 - i * 8) * 864e5).toISOString(),
  }),
);

// ─── Checklist ───────────────────────────────────────────────────────────────
// 10 items, 4 done. Categories come from CHECKLIST_CATEGORIES in
// api/hooks/useChecklistApi.ts; anything else renders as an unknown group.

/** title, category, done */
const TASKS: [string, string, boolean][] = [
  ["Confirm the venue booking",          "Venue",           true],
  ["Finish the menu tasting",            "Catering",        true],
  ["First gown fitting",                 "Attire",          true],
  ["Send the save-the-dates",            "Invitations",     true],
  ["Book the photographer",              "Photography",     false],
  ["Choose the centrepieces",            "Flowers & Décor", false],
  ["Book the band",                      "Music",           false],
  ["Sort guest transport",                "Logistics",       false],
  ["Give the caterer a final headcount", "Catering",        false],
  ["Chase the last few replies",         "Invitations",     false],
];

export const demoChecklist: ChecklistItem[] = TASKS.map(
  ([title, category, isCompleted], i) => ({
    id: `c4ec5115-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    eventId: 1,
    eventGuid: DEMO_EVENT_ID,
    title,
    isCompleted,
    category,
    dueDate: new Date(DEMO_EVENT_DATE.getTime() - (90 - i * 7) * 864e5).toISOString(),
    notes: null,
    sortOrder: i + 1,
    createdDate: new Date(Date.now() - 60 * 864e5).toISOString(),
    lastUpdated: new Date(Date.now() - 10 * 864e5).toISOString(),
  }),
);

/**
 * Floor plan. Table items must share the id of their ApiTable row — FloorPlanPage
 * joins geometry to seating on that id, and syncTables() would otherwise append
 * duplicates in the default grid. Round diameters follow tableDimensions():
 * max(100, 60 + capacity * 6).
 */
export const demoFloorPlan: FloorItem[] = [
  { id: "demo-stage", type: "stage", x: 330, y: 30, width: 240, height: 70,
    meta: { label: "Stage" } },
  { id: "demo-dancefloor", type: "danceFloor", x: 310, y: 320, width: 280, height: 180,
    meta: { label: "Dance floor" } },

  { id: tableId(1), type: "table", x: 60,  y: 150, width: 120, height: 120,
    meta: { shape: "round", capacity: 10 } },
  { id: tableId(2), type: "table", x: 700, y: 150, width: 120, height: 120,
    meta: { shape: "round", capacity: 10 } },
  { id: tableId(3), type: "table", x: 66,  y: 350, width: 108, height: 108,
    meta: { shape: "round", capacity: 8 } },
  { id: tableId(4), type: "table", x: 706, y: 350, width: 108, height: 108,
    meta: { shape: "round", capacity: 8 } },
  { id: tableId(5), type: "table", x: 70,  y: 550, width: 100, height: 100,
    meta: { shape: "round", capacity: 6 } },
  { id: tableId(6), type: "table", x: 710, y: 550, width: 100, height: 100,
    meta: { shape: "round", capacity: 4 } },
];
