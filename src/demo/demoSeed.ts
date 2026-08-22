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
// Totals: 10 RSVPs · 9 guest rows · 27 pax · 7 parties seated · 2 needing a
// table · 1 declined. Deliberately includes one over-capacity table so the
// warning state is visible.
//
// Kept deliberately small. A demo visitor is skimming, and a long list reads as
// homework; the point is to show the shapes (seated, needs-a-seat, over
// capacity, declined), not to look like a real guest list. Every structural
// state below is load-bearing — if you trim further, trim pax, not states.

import type { ApiGuest } from "../types/guest";
import type { ApiTable } from "../utils/tableUtils";
import type { ApiEvent } from "../types/event";
import type { BudgetApiResponse } from "../types/budget";
import type { ApiTransaction } from "../types/transaction";
import type { ChecklistItem } from "../api/hooks/useChecklistApi";
import type { CrewMember } from "../api/hooks/useCrewApi";
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
  noOfTable: 4,
  eventDescription:
    "A sample wedding so you can see how My Big Days works. Change anything you like — nothing here is saved.",
  isDeleted: false,
  slug: "aisha-and-wei-ming-demo",
  eventCode: "DEMO24",
  rsvpDueDate: new Date(DEMO_EVENT_DATE.getTime() - 30 * 864e5).toISOString(),
  isExpired: false,
};

/**
 * Four tables, 32 seats, holding 24 seated pax — about three quarters full.
 *
 * Table count tracks the guest count on purpose. Cutting the guest list without
 * cutting tables would drop the room to half empty, and a half empty floor plan
 * reads as "this product has no data in it" rather than "this wedding is small".
 */
export const demoTables: ApiTable[] = [
  { tableId: tableId(1), tableName: "Family — Bride",  maxSeats: 10 },
  { tableId: tableId(2), tableName: "Family — Groom",  maxSeats: 10 },
  { tableId: tableId(3), tableName: "Friends",         maxSeats: 8 },
  { tableId: tableId(4), tableName: "Bride — Wong Family", maxSeats: 4 },
];

// ─── Questions ───────────────────────────────────────────────────────────────
// Wire shape is QuestionDto, as /question/GetQuestions/{eventId} returns it:
// an int questionId, a numeric `type` (see TYPE_KEY_MAP in utils/eventUtils),
// and comma-delimited `options` for the choice types.
//
// Read-only in the demo — the adapter serves this list and nothing else, and
// CoupleFormFieldsPage gates "Add question". Three of them rather than one so
// the page shows a list rather than a lonely row, and so the answers below have
// something to vary against.

/** Answer text keyed by question, so the seeded RSVPs can reference it. */
export const DEMO_QUESTION_IDS = { diet: "1", access: "2", song: "3" } as const;

export const demoQuestions = [
  {
    questionId: DEMO_QUESTION_IDS.diet,
    eventGuid: DEMO_EVENT_ID,
    text: "Any dietary requirements?",
    type: 0, // text
    isRequired: false,
    options: undefined,
    order: 1,
    isActive: true,
    hasExistingAnswers: true,
  },
  {
    questionId: DEMO_QUESTION_IDS.access,
    eventGuid: DEMO_EVENT_ID,
    text: "Do you need step-free access?",
    type: 3, // radio
    isRequired: false,
    options: "Yes,No",
    order: 2,
    isActive: true,
    hasExistingAnswers: true,
  },
  {
    questionId: DEMO_QUESTION_IDS.song,
    eventGuid: DEMO_EVENT_ID,
    text: "A song that will get you on the dance floor",
    type: 0, // text
    isRequired: false,
    options: undefined,
    order: 3,
    isActive: true,
    hasExistingAnswers: true,
  },
];

/** name, pax, table (null = needs a seat), group, phone, note */
type Party = [string, number, string | null, string, string, string?];

const PARTIES: Party[] = [
  // ── Seated (7 parties, 24 pax) ────────────────────────────────────────────
  ["Aunt Mei Ling",      4, tableId(1), "Family",    "+60 12-345 6701"],
  ["Uncle Tan Boon Huat", 2, tableId(1), "Family",   "+60 12-345 6702"],
  ["Aunty Fatimah",      3, tableId(1), "Family",    "+60 12-345 6703"],
  ["Marcus Tay",         5, tableId(2), "Family",    "+60 12-345 6704"],
  ["Rahman & Siti",      2, tableId(3), "Friends",   "+60 12-345 6705"],
  ["Priya Raman",        3, tableId(3), "Friends",   "+60 12-345 6706"],
  // Their own table, and it holds 4 — so this party of 5 sits one over
  // capacity on purpose, which is what makes the warning state reachable.
  ["The Wong Family",    5, tableId(4), "Family",    "+60 12-345 6707", "Bringing the kids"],

  // ── Coming, not yet seated (2 parties, 3 pax) ─────────────────────────────
  ["Kavitha & Suresh",   2, null,       "Friends",   "+60 12-345 6708"],
  ["Daniel Ooi",         1, null,       "Colleague", "+60 12-345 6709"],

  // ── Declined: pax 0, so no Guest row exists for these ─────────────────────
  ["Gerald Ng",          0, null,       "Colleague", "+60 12-345 6710", "Away that week"],
];

/**
 * Answers to demoQuestions, by PARTIES index, in question order: diet, access,
 * song. An empty string means the party skipped that question.
 *
 * Two of these used to be free-text `notes` on the party ("Wheelchair access
 * needed", "Vegetarian ×2"). They are answers now, which is what they always
 * were — a remark is what you write when the form never asked.
 *
 * Deliberately sparse. Kavitha & Suresh answered nothing, most parties skipped
 * the song, and the declined party has no answers at all. A grid where every
 * cell is filled looks generated; the gaps are what make it look collected.
 */
const ANSWERS: Record<number, [string, string, string]> = {
  0: ["No pork, please",   "No",  "Can't Help Falling in Love"],
  1: ["",                  "Yes", ""],
  2: ["Halal",             "No",  ""],
  3: ["",                  "No",  "September — Earth, Wind & Fire"],
  4: ["Halal ×2",          "No",  ""],
  5: ["Vegetarian ×2",     "No",  "Perfect — Ed Sheeran"],
  6: ["Two kids' portions", "No", ""],
  8: ["No shellfish",      "",    ""],
};

const QUESTION_ORDER = [
  DEMO_QUESTION_IDS.diet,
  DEMO_QUESTION_IDS.access,
  DEMO_QUESTION_IDS.song,
] as const;

/** AnswerItem[] for one party, skipping the questions it left blank. */
function answersFor(partyIndex: number) {
  return (ANSWERS[partyIndex] ?? []).flatMap((text, q) =>
    text
      ? [{
          answerId: `a115ec00-0000-4000-8000-${String(partyIndex * 10 + q + 1).padStart(12, "0")}`,
          questionId: QUESTION_ORDER[q],
          text,
        }]
      : [],
  );
}

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
  answers: answersFor(i),
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

// ─── Gifts ───────────────────────────────────────────────────────────────────
// Ang pow, as Credit rows on the same wallet. Two pages read these and they do
// NOT agree on how: CoupleBudgetPage's Gifts tab takes `type === Credit`, while
// the guests pages build their gift column from `category === "Gift"`. Setting
// both satisfies each without touching either.
//
// `referenceId` is the guestCode, which is how the guest pages join a gift to a
// party — G00n, where n is the 1-based PARTIES index. Only parties that have a
// Guest row can appear here, so the declined party never does.
//
// Deliberately five of nine, not all nine: gifts arrive on the day and after,
// so a complete set would look like a spreadsheet rather than a wedding.

/** guestCode, giver, amount */
type Gift = [string, string, number];

const GIFTS: Gift[] = [
  ["G001", "Aunt Mei Ling",   1200],
  ["G004", "Marcus Tay",       800],
  ["G005", "Rahman & Siti",    400],
  ["G006", "Priya Raman",      500],
  ["G009", "Daniel Ooi",       200],
];

export const demoGifts: ApiTransaction[] = GIFTS.map(
  ([guestCode, giver, amount], i) => ({
    transactionGuid: `9133f000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    walletGuid: DEMO_WALLET_GUID,
    eventGuid: DEMO_EVENT_ID,
    type: 0, // Credit / money in
    transactionName: giver,
    transactionDate: new Date(Date.now() - (20 - i * 3) * 864e5).toISOString(),
    category: "Gift",
    amount,
    referenceId: guestCode,
    // No paymentStatus: the dashboard's "spent" figure skips every non-Debit
    // row before it parses remarks, so a status here would never be read and
    // would imply these are bills.
    remarks: remarks({}),
    createdBy: "demo",
    updatedBy: "demo",
    createdDate: new Date(Date.now() - (20 - i * 3) * 864e5).toISOString(),
    lastUpdated: new Date(Date.now() - (20 - i * 3) * 864e5).toISOString(),
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
  { id: tableId(4), type: "table", x: 706, y: 350, width: 100, height: 100,
    meta: { shape: "round", capacity: 4 } },
];

// ─── Big Day ─────────────────────────────────────────────────────────────────
// Crew are the people working the door on the night. Seeded so the Big Day tab
// has content: it is one of the five couple sections, and unseeded it rendered
// as a blank page, which reads as a missing feature rather than a quiet one.
//
// No QR tokens are seeded to go with them. Nobody has arrived at a wedding that
// hasn't happened yet, so "0 checked in" is the truthful state — and check-in
// itself is gated in the demo (see CheckInPage), so there is nothing to scan.

export const demoCrew: CrewMember[] = [
  {
    crewGuid: "c2ew0000-0000-4000-8000-000000000001",
    crewCode: "DOOR1",
    name: "Farah (door)",
    isActive: true,
    eventGuid: DEMO_EVENT_ID,
  },
  {
    crewGuid: "c2ew0000-0000-4000-8000-000000000002",
    crewCode: "DOOR2",
    name: "Kenneth (door)",
    isActive: true,
    eventGuid: DEMO_EVENT_ID,
  },
  {
    crewGuid: "c2ew0000-0000-4000-8000-000000000003",
    crewCode: "USHER",
    name: "Siti (ushering)",
    isActive: false,
    eventGuid: DEMO_EVENT_ID,
  },
];
