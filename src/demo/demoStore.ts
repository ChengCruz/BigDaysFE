// src/demo/demoStore.ts
//
// Mutable copy of the sample wedding for the current tab. The adapter reads and
// writes this instead of the network.
//
// Persisted to sessionStorage so a refresh doesn't wipe what the visitor just
// did — they poke a table, hit reload, and their change is still there, which is
// what makes the demo feel like software rather than a screenshot. sessionStorage
// rather than localStorage so it dies with the tab (see demoMode.ts).
//
// Mutation payloads arrive as untyped wire objects, because the real mutation
// hooks send loosely-shaped bodies (useCreateRsvp takes `any`). Rather than
// inherit that, everything here goes through the str/num coercers below, so a
// missing or malformed field becomes `undefined` and is skipped instead of
// writing NaN or "[object Object]" into the store.

import type { ApiGuest } from "../types/guest";
import type { ApiTable } from "../utils/tableUtils";
import type { ApiEvent } from "../types/event";
import type { BudgetApiResponse } from "../types/budget";
import type { ApiTransaction } from "../types/transaction";
import type { ChecklistItem } from "../api/hooks/useChecklistApi";
import type { FloorItem } from "../components/pages/Tables/useFloorPlanState";
import { DEMO_EVENT_ID } from "./demoMode";
import {
  demoEvent,
  demoGuests,
  demoRsvps,
  demoTables,
  demoFloorPlan,
  demoBudget,
  demoTransactions,
  demoChecklist,
} from "./demoSeed";

const STATE_KEY = "bigdays.demo.state.v1";

export type Payload = Record<string, unknown>;
export type DemoRsvp = Record<string, unknown>;

export const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

export const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Copies only the defined keys, so absent payload fields leave the row alone. */
function patch<T extends object>(target: T, updates: Partial<T>): void {
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) (target as Record<string, unknown>)[k] = v;
  }
}

interface DemoState {
  event: ApiEvent;
  tables: ApiTable[];
  guests: ApiGuest[];
  rsvps: DemoRsvp[];
  floorPlan: FloorItem[];
  budget: BudgetApiResponse;
  transactions: ApiTransaction[];
  checklist: ChecklistItem[];
}

function freshState(): DemoState {
  // Deep clone so mutations can never write back into the seed module.
  return structuredClone({
    event: demoEvent,
    tables: demoTables,
    guests: demoGuests,
    rsvps: demoRsvps as DemoRsvp[],
    floorPlan: demoFloorPlan,
    budget: demoBudget,
    transactions: demoTransactions,
    checklist: demoChecklist,
  });
}

let state: DemoState | undefined;

/** Validates every field against a corrupt or stale blob, per utils/whatsNew.ts. */
function parse(raw: string): DemoState | undefined {
  try {
    const p = JSON.parse(raw);
    if (
      !p ||
      typeof p.event !== "object" ||
      !Array.isArray(p.tables) ||
      !Array.isArray(p.guests) ||
      !Array.isArray(p.rsvps) ||
      !Array.isArray(p.floorPlan) ||
      typeof p.budget !== "object" ||
      !Array.isArray(p.transactions) ||
      !Array.isArray(p.checklist)
    ) {
      return undefined;
    }
    return p as DemoState;
  } catch {
    return undefined;
  }
}

function load(): DemoState {
  if (state) return state;
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    state = (raw && parse(raw)) || freshState();
  } catch {
    state = freshState();
  }
  return state;
}

function persist(): void {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(load()));
  } catch {
    // Over quota or storage disabled: the in-memory copy still works for this
    // page view, it just won't survive a refresh.
  }
}

/** Discards edits and reloads the pristine sample wedding. */
export function resetDemoStore(): void {
  state = freshState();
  persist();
}

export const demoStore = {
  // ─── Reads ──────────────────────────────────────────────────────────────────

  event: (): ApiEvent => load().event,
  events: (): ApiEvent[] => [load().event],
  tables: (): ApiTable[] => load().tables,
  guests: (): ApiGuest[] => load().guests.filter((g) => !g.isDeleted),
  guestsByTable: (id: string): ApiGuest[] =>
    load().guests.filter((g) => !g.isDeleted && g.tableId === id),
  rsvps: (): DemoRsvp[] => load().rsvps,
  floorPlan: (): FloorItem[] => load().floorPlan,
  // useBudgetsApi reads budgets[0] off an array, so hand it a list of one.
  budget: (): BudgetApiResponse[] => [load().budget],
  transactions: (): ApiTransaction[] => load().transactions,
  checklist: (): ChecklistItem[] => load().checklist,

  // ─── Writes ─────────────────────────────────────────────────────────────────

  createGuest(p: Payload): ApiGuest {
    const s = load();
    const group = str(p.groupId) ?? "Other";
    const guest: ApiGuest = {
      guestId: crypto.randomUUID(),
      eventId: 1,
      eventGuid: DEMO_EVENT_ID,
      rsvpId: str(p.rsvpId),
      tableId: str(p.tableId) ?? null,
      guestIndex: s.guests.length + 1,
      guestCode: `G${String(s.guests.length + 1).padStart(3, "0")}`,
      name: str(p.guestName) ?? str(p.name) ?? "Guest",
      phoneNo: str(p.phoneNo) ?? "",
      // Party size includes the person replying, so 1 is the floor, never 0.
      pax: Math.max(1, num(p.pax) ?? 1),
      groupId: group,
      flag: str(p.flag) ?? group,
      notes: str(p.notes) ?? "",
      isDeleted: false,
    };
    s.guests.push(guest);
    persist();
    return guest;
  },

  updateGuest(p: Payload): ApiGuest | undefined {
    const g = load().guests.find((x) => x.guestId === str(p.guestId));
    if (!g) return undefined;
    patch(g, {
      name: str(p.name),
      pax: num(p.pax),
      phoneNo: str(p.phoneNo),
      flag: str(p.flag),
      notes: str(p.notes),
      groupId: str(p.groupId),
      tableId: str(p.tableId),
      seatIndex: num(p.seatIndex),
    });
    // Mirror the backend: a party dropping to 0 stops being a guest row.
    if (g.pax !== undefined && g.pax <= 0) g.isDeleted = true;
    persist();
    return g;
  },

  assignTable(gid: string, tid: string): void {
    const g = load().guests.find((x) => x.guestId === gid);
    if (g) g.tableId = tid;
    persist();
  },

  unassignTable(gid: string): void {
    const g = load().guests.find((x) => x.guestId === gid);
    if (g) g.tableId = null;
    persist();
  },

  /** Fills tables in order, keeping each party together — a table seats pax, not rows. */
  autoAssign(): void {
    const s = load();
    const used = new Map<string, number>();
    for (const g of s.guests) {
      if (!g.isDeleted && g.tableId) {
        used.set(g.tableId, (used.get(g.tableId) ?? 0) + (g.pax ?? 1));
      }
    }
    for (const g of s.guests) {
      if (g.isDeleted || g.tableId) continue;
      const pax = g.pax ?? 1;
      const table = s.tables.find((t) => (used.get(t.tableId) ?? 0) + pax <= t.maxSeats);
      if (!table) continue;
      g.tableId = table.tableId;
      used.set(table.tableId, (used.get(table.tableId) ?? 0) + pax);
    }
    persist();
  },

  createTable(p: Payload): ApiTable {
    const s = load();
    const table: ApiTable = {
      tableId: crypto.randomUUID(),
      tableName: str(p.tableName) ?? str(p.name) ?? `Table ${s.tables.length + 1}`,
      maxSeats: num(p.maxSeats) ?? num(p.capacity) ?? 8,
    };
    s.tables.push(table);
    persist();
    return table;
  },

  bulkCreateTables(p: Payload): ApiTable[] {
    const raw = Array.isArray(p.tables) ? p.tables : Array.isArray(p) ? p : [];
    return (raw as Payload[]).map((t) => this.createTable(t));
  },

  updateTable(p: Payload): void {
    const id = str(p.tableId) ?? str(p.id);
    const t = load().tables.find((x) => x.tableId === id);
    if (!t) return;
    patch(t, {
      tableName: str(p.tableName),
      maxSeats: num(p.maxSeats),
      extraGuests: num(p.extraGuests),
    });
    persist();
  },

  deleteTable(tid: string): void {
    const s = load();
    s.tables = s.tables.filter((t) => t.tableId !== tid);
    // Unseat anyone who was at it, rather than leaving a dangling tableId.
    s.guests.forEach((g) => {
      if (g.tableId === tid) g.tableId = null;
    });
    s.floorPlan = s.floorPlan.filter((i) => i.id !== tid);
    persist();
  },

  createRsvp(p: Payload): DemoRsvp {
    const s = load();
    const guid = crypto.randomUUID();
    const pax = num(p.noOfPax) ?? num(p.pax) ?? 1;
    const name = str(p.guestName) ?? str(p.name) ?? "Guest";
    const rsvp: DemoRsvp = {
      rsvpGuid: guid,
      rsvpId: s.rsvps.length + 1,
      eventGuid: DEMO_EVENT_ID,
      guestName: name,
      noOfPax: pax,
      phoneNo: str(p.phoneNo) ?? "",
      remarks: str(p.remarks) ?? "",
      tableId: str(p.tableId),
      answers: [],
    };
    s.rsvps.push(rsvp);
    // One RSVP creates exactly one Guest row — unless the party declined.
    if (pax > 0) {
      this.createGuest({ ...p, rsvpId: guid, guestName: name, pax });
    } else {
      persist();
    }
    return rsvp;
  },

  updateRsvp(p: Payload): void {
    const s = load();
    const guid = str(p.rsvpGuid) ?? str(p.id) ?? str(p.rsvpId);
    const r = s.rsvps.find((x) => x.rsvpGuid === guid);
    if (!r) return;

    const pax = num(p.noOfPax);
    patch(r, {
      guestName: str(p.guestName),
      noOfPax: pax,
      phoneNo: str(p.phoneNo),
      remarks: str(p.remarks),
    });

    const g = s.guests.find((x) => x.rsvpId === guid);
    if (g) {
      patch(g, {
        name: str(p.guestName),
        phoneNo: str(p.phoneNo),
        notes: str(p.remarks),
        pax,
      });
      if (pax !== undefined && pax <= 0) g.isDeleted = true;
      // Party changed its mind after declining: the row comes back.
      if (pax !== undefined && pax > 0) g.isDeleted = false;
    } else if ((pax ?? 0) > 0) {
      this.createGuest({ ...p, rsvpId: guid, guestName: r.guestName, pax });
      return;
    }
    persist();
  },

  createChecklistItem(p: Payload): ChecklistItem {
    const s = load();
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      eventId: 1,
      eventGuid: DEMO_EVENT_ID,
      title: str(p.title) ?? "New task",
      isCompleted: false,
      category: str(p.category) ?? "General",
      dueDate: str(p.dueDate) ?? null,
      notes: str(p.notes) ?? null,
      sortOrder: num(p.sortOrder) ?? s.checklist.length + 1,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    s.checklist.push(item);
    persist();
    return item;
  },

  updateChecklistItem(p: Payload): void {
    const item = load().checklist.find((x) => x.id === str(p.id));
    if (!item) return;
    patch(item, {
      title: str(p.title),
      category: str(p.category),
      dueDate: str(p.dueDate),
      notes: str(p.notes),
    });
    // The tick is the whole point of this list, and it is a boolean, so it
    // cannot go through patch()'s defined-only string/number coercers.
    if (typeof p.isCompleted === "boolean") item.isCompleted = p.isCompleted;
    item.lastUpdated = new Date().toISOString();
    persist();
  },

  deleteChecklistItem(id: string): void {
    const s = load();
    s.checklist = s.checklist.filter((x) => x.id !== id);
    persist();
  },

  createTransaction(p: Payload): ApiTransaction {
    const s = load();
    const tx: ApiTransaction = {
      transactionGuid: crypto.randomUUID(),
      walletGuid: s.budget.walletGuid,
      eventGuid: DEMO_EVENT_ID,
      type: (num(p.type) ?? 1) as ApiTransaction["type"],
      transactionName: str(p.transactionName) ?? "New expense",
      transactionDate: str(p.transactionDate) ?? null,
      category: str(p.category) ?? "Others",
      amount: num(p.amount) ?? 0,
      // Already carries the _extended JSON envelope, built by
      // serializeTransactionForCreate; store it verbatim.
      remarks: str(p.remarks) ?? "",
      createdBy: "demo",
      updatedBy: "demo",
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    s.transactions.push(tx);
    persist();
    return tx;
  },

  updateTransaction(p: Payload): void {
    const tx = load().transactions.find(
      (x) => x.transactionGuid === (str(p.transactionGuid) ?? str(p.id)),
    );
    if (!tx) return;
    patch(tx, {
      transactionName: str(p.transactionName),
      category: str(p.category),
      amount: num(p.amount),
      transactionDate: str(p.transactionDate),
      remarks: str(p.remarks),
    });
    tx.lastUpdated = new Date().toISOString();
    persist();
  },

  deleteTransaction(p: Payload): void {
    const s = load();
    const id = str(p.transactionGuid) ?? str(p.id);
    s.transactions = s.transactions.filter((x) => x.transactionGuid !== id);
    persist();
  },

  updateBudget(p: Payload): void {
    patch(load().budget, {
      currency: str(p.currency),
      budget: num(p.budget) ?? num(p.totalBudget),
    });
    persist();
  },

  saveFloorPlan(items: unknown): void {
    load().floorPlan = Array.isArray(items) ? (items as FloorItem[]) : [];
    persist();
  },

  updateEvent(p: Payload): void {
    patch(load().event, {
      eventName: str(p.name),
      eventDate: str(p.date),
      eventTime: str(p.time),
      eventLocation: str(p.location),
      eventDescription: str(p.description),
    });
    persist();
  },
};
