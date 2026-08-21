// src/demo/demoAdapter.ts
//
// Serves the sample wedding from demoStore instead of the network.
//
// This is installed as the axios adapter on the shared client, which is the one
// place every API hook already funnels through. That is why demo mode needs zero
// changes to the ~30 hook files and zero changes to any page component: the real
// pages run, they just get their data from here.
//
// When demo mode is off (the common case, and always when logged in) this
// delegates to the stock adapter and is a no-op.
//
// ── Two rules for anything added here ────────────────────────────────────────
//
// 1. Return WIRE shapes. The hooks run their own normalizers (normalizeGuest,
//    normalizeTable, toEvent) over whatever we hand back, so pre-normalized data
//    would be mapped twice.
// 2. Unknown routes resolve EMPTY, never reject. Surfaces the demo doesn't seed
//    (budget, checklist, crew, QR, questions) already render empty states, so a
//    quiet empty envelope degrades gracefully where a 404 would throw a red
//    error page over the whole demo.

import axios from "axios";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { isDemoActive, DEMO_EVENT_ID } from "./demoMode";
import { demoStore, num, type Payload } from "./demoStore";
import { trackEventOnce } from "../utils/analytics";
import type { ApiDashboardSummary } from "../types/dashboard";

/** Resolved once at module load, before we replace it. */
const stockAdapter = axios.getAdapter(axios.defaults.adapter) as AxiosAdapter;

function envelope<T>(config: InternalAxiosRequestConfig, data: T): AxiosResponse {
  return {
    data: { isSuccess: true, message: "", data },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}

function body(config: InternalAxiosRequestConfig): Payload {
  const raw = config.data;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Payload;
    } catch {
      return {};
    }
  }
  return raw as Payload;
}

/**
 * Recomputes the aggregate the backend normally builds. The units below mirror
 * DashboardHandler deliberately, including one quirk: the backend sets
 * occupiedSeats = assignedGuests ("assuming 1 guest = 1 seat"), so it is a party
 * count wearing a seat label. Reproducing that rather than "fixing" it keeps the
 * demo telling the same story as production for the same data — a demo that
 * disagreed with the real app would be a worse bug than the quirk.
 * See the contract documented at CoupleHomePage.tsx:11-25.
 */
function dashboardSummary(): ApiDashboardSummary {
  const event = demoStore.event();
  const guests = demoStore.guests();
  const tables = demoStore.tables();
  const rsvps = demoStore.rsvps();

  const paxOf = (r: (typeof rsvps)[number]) => num(r.noOfPax) ?? 0;
  const coming = rsvps.filter((r) => paxOf(r) > 0);
  const notComing = rsvps.filter((r) => paxOf(r) === 0);
  // The one genuine head count: SUM(NoOfPax) over confirmed RSVPs.
  const paxConfirmed = coming.reduce((n, r) => n + paxOf(r), 0);

  // Row counts, not people — these are "parties" everywhere they surface.
  const seatedParties = guests.filter((g) => g.tableId).length;
  const unseatedParties = guests.filter((g) => !g.tableId).length;
  const occupiedTableIds = new Set(guests.filter((g) => g.tableId).map((g) => g.tableId));

  // Only PAID rows count as spending, matching BudgetSummaryCards.tsx:23, which
  // reports pending separately. Using all debits here would make the dashboard
  // and the Money page disagree for the same data.
  const totalBudget = demoStore.budget()[0]?.budget ?? 0;
  const paid = demoStore.transactions().reduce((n, t) => {
    if (t.type !== 1) return n;
    let status: unknown;
    try {
      status = JSON.parse(t.remarks ?? "{}")?._extended?.paymentStatus;
    } catch {
      status = undefined;
    }
    return status === "Paid" ? n + (t.amount ?? 0) : n;
  }, 0);
  const budgetStats = {
    totalBudget,
    spentAmount: paid,
    remainingAmount: totalBudget - paid,
    spentPercentage: totalBudget > 0 ? Math.round((paid / totalBudget) * 1000) / 10 : 0,
    status: paid > totalBudget ? 2 : 0,
  };

  const tasks = demoStore.checklist();
  const done = tasks.filter((t) => t.isCompleted).length;
  const checklistStats = {
    totalItems: tasks.length,
    completedItems: done,
    remainingItems: tasks.length - done,
    percentComplete: tasks.length > 0 ? Math.round((done / tasks.length) * 1000) / 10 : 0,
  };

  return {
    eventStats: {
      eventName: event.eventName,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      eventLocation: event.eventLocation,
      noOfTable: tables.length,
    },
    rsvpStats: {
      totalRsvpsReceived: rsvps.length,
      comingCount: coming.length,
      notComingCount: notComing.length,
      // Every row in the demo is a reply, so nothing is outstanding.
      pendingCount: 0,
      totalGuestsConfirmed: paxConfirmed,
      responseRate: 100,
      newConfirmationsToday: 2,
    },
    tableStats: {
      totalTables: tables.length,
      arrangedTables: occupiedTableIds.size,
      assignedGuests: seatedParties,
      unassignedGuests: unseatedParties,
      totalSeats: tables.reduce((n, t) => n + (t.maxSeats ?? 0), 0),
      occupiedSeats: seatedParties,
    },
    budgetStats,
    checklistStats,
    // `icon` is rendered verbatim inside a <span> by both dashboards
    // (CoupleHomePage.tsx:462, MemberDashboardPage.tsx:378), so it must be an
    // emoji. An icon *name* here prints as literal text.
    recentActivity: [
      {
        activityType: "rsvp",
        description: "Hui Xin replied",
        details: "2 seats · might be late",
        timestamp: new Date(Date.now() - 36e5).toISOString(),
        icon: "💌",
      },
      {
        activityType: "rsvp",
        description: "Kavitha & Suresh replied",
        details: "2 seats",
        timestamp: new Date(Date.now() - 5 * 36e5).toISOString(),
        icon: "💌",
      },
      {
        activityType: "table",
        description: "The Wong Family seated",
        details: "Overflow · over capacity",
        timestamp: new Date(Date.now() - 26 * 36e5).toISOString(),
        icon: "🪑",
      },
    ],
  };
}

/** GUID or int, for building route patterns. */
const ID = "([^/?]+)";
const re = (p: string) => new RegExp(`^${p}/?$`, "i");

/**
 * Never faked, even in demo mode — these must always hit the real backend.
 *
 * Auth especially: the catch-all below answers unknown writes with a success
 * envelope, and a faked /User/RefreshToken would hand AuthProvider an undefined
 * access token as though the refresh had worked. Contact is here for a different
 * reason: replying "sent" to a support request nobody received is a lie, and a
 * genuine network error is the honest outcome.
 */
const PASSTHROUGH = [
  /^\/User\//i,
  /^\/auth\//i,
  /^\/Crew\/Login/i,
  /^\/Contact\//i,
];

/**
 * Names the first thing the visitor did, for the demo_interact event. The floor
 * plan only saves from an explicit "Save Layout" button, so none of these can
 * fire from a page merely loading.
 */
function writeAction(path: string): string {
  if (/AssignTable/i.test(path)) return "guest_seated";
  if (/UnassignTable/i.test(path)) return "guest_unseated";
  if (/AutoAssign/i.test(path)) return "auto_assign";
  if (/\/(Guest|rsvp)\/Create/i.test(path)) return "guest_added";
  if (/\/(Guest|rsvp)\/Update/i.test(path)) return "guest_edited";
  if (/FloorPlan/i.test(path)) return "floorplan_saved";
  if (/TableArrangement/i.test(path)) return "table_edited";
  return "write";
}

export const demoAdapter: AxiosAdapter = async (config) => {
  if (!isDemoActive()) return stockAdapter(config);

  const method = (config.method ?? "get").toLowerCase();
  const path = (config.url ?? "").split("?")[0];
  if (PASSTHROUGH.some((p) => p.test(path))) return stockAdapter(config);

  const ok = <T,>(data: T) => envelope(config, data);

  // ─── Reads ──────────────────────────────────────────────────────────────────
  if (method === "get") {
    if (re("/event/GetEventsListByUser").test(path) || re("/event/GetEventsList").test(path)) {
      return ok(demoStore.events());
    }
    if (re(`/event/eventRsvpInternal/${ID}`).test(path)) return ok(null);
    if (re(`/event/${ID}`).test(path)) return ok(demoStore.event());

    if (re(`/Guest/ByEvent/${ID}`).test(path)) return ok(demoStore.guests());
    const byTable = re(`/Guest/ByTable/${ID}`).exec(path);
    if (byTable) return ok(demoStore.guestsByTable(byTable[1]));

    if (re(`/TableArrangement/Summary/${ID}`).test(path)) return ok(demoStore.tables());
    if (re(`/rsvp/GetRsvp/List/${ID}`).test(path)) return ok(demoStore.rsvps());

    if (re(`/FloorPlan/${ID}`).test(path)) {
      return ok({ eventGuid: DEMO_EVENT_ID, items: demoStore.floorPlan() });
    }
    if (re(`/Dashboard/Summary/${ID}`).test(path)) return ok(dashboardSummary());

    // Money and Big Day are two of the five couple sections; unseeded they
    // rendered as empty pages, which made 40% of the demo look broken.
    if (re(`/Wallet/GetWalletByEvent/${ID}`).test(path)) return ok(demoStore.budget());
    if (re(`/Wallet/${ID}`).test(path)) return ok(demoStore.budget()[0]);
    if (re(`/Transaction/${ID}/transactions`).test(path)) return ok(demoStore.transactions());
    if (re(`/Checklist/ByEvent/${ID}`).test(path)) return ok(demoStore.checklist());

    // Seeded as empty on purpose — see rule 2 in the header.
    return ok([]);
  }

  // ─── Writes ─────────────────────────────────────────────────────────────────
  // Reaching here means the visitor changed something, which is the signal that
  // separates a bounce from real interest. Fired once per tab, before the
  // dispatch below, so it covers every write including ones that return early.
  // Fired here rather than in the shared hooks so no hook has to know demo mode
  // exists — see src/demo/README.md.
  const payload = body(config);
  trackEventOnce("demo_interact", { action: writeAction(path) });

  if (method === "post" || method === "put") {
    if (re("/Guest/Create").test(path)) return ok(demoStore.createGuest(payload));
    if (re("/Guest/Update").test(path)) return ok(demoStore.updateGuest(payload));

    const assign = re(`/Guest/${ID}/AssignTable/${ID}`).exec(path);
    if (assign) {
      demoStore.assignTable(assign[1], assign[2]);
      return ok(true);
    }
    const unassign = re(`/Guest/${ID}/UnassignTable`).exec(path);
    if (unassign) {
      demoStore.unassignTable(unassign[1]);
      return ok(true);
    }
    if (re(`/Guest/AutoAssign/${ID}`).test(path)) {
      demoStore.autoAssign();
      return ok(true);
    }

    if (re("/TableArrangement/Create").test(path)) return ok(demoStore.createTable(payload));
    if (re("/TableArrangement/BulkCreate").test(path)) {
      return ok(demoStore.bulkCreateTables(payload));
    }
    if (re("/TableArrangement/Update").test(path)) {
      demoStore.updateTable(payload);
      return ok(true);
    }
    if (re("/TableArrangement/BulkDelete").test(path)) {
      const ids = Array.isArray(payload.tableIds) ? payload.tableIds : [];
      ids.filter((id): id is string => typeof id === "string")
        .forEach((id) => demoStore.deleteTable(id));
      return ok(true);
    }

    if (re("/rsvp/Create").test(path)) return ok(demoStore.createRsvp(payload));
    if (re("/rsvp/Update").test(path)) {
      demoStore.updateRsvp(payload);
      return ok(true);
    }

    if (re(`/FloorPlan/${ID}`).test(path)) {
      demoStore.saveFloorPlan(payload.items ?? []);
      return ok(true);
    }

    if (re("/event/Update").test(path)) {
      demoStore.updateEvent(payload);
      return ok(true);
    }

    if (re("/Checklist/Create").test(path)) {
      return ok(demoStore.createChecklistItem(payload));
    }
    if (re("/Checklist/Update").test(path)) {
      demoStore.updateChecklistItem(payload);
      return ok(true);
    }
    // Seeding is what the "Start your checklist" card triggers, but the demo
    // ships with a list already, so accept and do nothing.
    if (re(`/Checklist/Seed/${ID}`).test(path)) return ok(demoStore.checklist());

    if (re("/Transaction/Create").test(path)) {
      return ok(demoStore.createTransaction(payload));
    }
    if (re("/Transaction/Update").test(path)) {
      demoStore.updateTransaction(payload);
      return ok(true);
    }
    if (re("/Transaction/Delete").test(path)) {
      demoStore.deleteTransaction(payload);
      return ok(true);
    }
    if (re("/Wallet/Create").test(path) || re("/Wallet/Update").test(path)) {
      demoStore.updateBudget(payload);
      return ok(demoStore.budget()[0]);
    }
  }

  if (method === "delete" || path.includes("/Delete/")) {
    const del = re(`/TableArrangement/Delete/${ID}`).exec(path);
    if (del) {
      demoStore.deleteTable(del[1]);
      return ok(true);
    }
    const delTask = re(`/Checklist/${ID}`).exec(path);
    if (delTask) {
      demoStore.deleteChecklistItem(delTask[1]);
      return ok(true);
    }
  }

  // Unhandled write: accept it so the UI's success path runs, but nothing is
  // stored. Better a no-op than a red error over the demo.
  return ok(true);
};

/** Installs the adapter on the shared client. Called once from api/client.ts. */
export function installDemoAdapter(client: { defaults: { adapter?: unknown } }): void {
  client.defaults.adapter = demoAdapter;
}
