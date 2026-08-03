// src/components/whatsNew/releases.ts
// ---------------------------------------------------------------------------
// The release notes themselves. This is the ONLY file you edit to announce a
// feature — see the "Adding an entry" note at the bottom.
//
// Ships with the frontend on purpose. Notes written here land in the same
// deploy as the code they describe, so we can never announce something that
// isn't live yet.
//
// Definitions live next to their consumers, same as tours.ts.
// ---------------------------------------------------------------------------
import type { TourIconKey } from "../tour/tours";

export interface ReleaseItem {
  /** One user-facing line. No version numbers, no ticket refs. */
  text: string;
  /** Optional second line for the "why you care". */
  detail?: string;
  icon: TourIconKey;
}

export interface Release {
  /**
   * Stable slug, keyed on by the seen-map in utils/whatsNew.ts. Deliberately
   * NOT pkg.version: most deploys add no entry, so tying the two would mean
   * bumping the version just to say something. Convention: YYYY-MM-<slug>.
   * Never reuse or rename an id — that re-announces it to everyone.
   */
  id: string;
  /** ISO date, shown on the What's New page. */
  date: string;
  title: string;
  /**
   * The "why we did this" line, shown under the title in both the modal and the
   * page. This is where the warmth goes — without it, the reason has to be
   * crammed into an item row and the whole thing reads like a manual.
   *
   * NOT mode-filtered, unlike items: write one sentence that works for a couple
   * and a planner alike. Omit for a release that needs no framing; the modal
   * falls back to its standard line.
   */
  intro?: string;
  items: ReleaseItem[];
  /**
   * Opens the modal on the user's next visit, and again each session until they
   * tick "don't show this again" or `announceUntil` passes. Omit for a quiet
   * entry that only shows up on the What's New page — most releases should be
   * quiet, precisely because an announcement repeats.
   */
  announce?: boolean;
  /**
   * ISO date after which the modal stops firing, even for someone who never
   * saw it. Without this, a user returning after six months away gets every
   * stale announcement in a row. The entry stays on the page forever either
   * way. Defaults to ANNOUNCE_WINDOW_DAYS past `date` when omitted.
   */
  announceUntil?: string;
}

/** How long an announcement stays live when `announceUntil` is not given. */
export const ANNOUNCE_WINDOW_DAYS = 60;

/** Newest first. The modal only ever shows the first announceable match. */
/*Icon Enum: home, guests, tables, budget, checkin, rsvps, questions, calendar, floorplan, users, crew, rsvp-designer, checklist */
export const RELEASES: Release[] = [
  {
    id: "2026-08-simple-view",
    date: "2026-08-02",
    title: "A simpler view",
    intro:
      "We heard you, fourteen menus is a lot. So here's a simpler view: five sections, and everything else tucked behind them.",
    announce: true,
    announceUntil: "2026-11-01",
    items: [
      {
        text: "Five sections: Home, Guests, Seating, Money and Big Day",
        detail:
          "No more jumping between guests and RSVPs, it's one list. Seating is tap a guest then tap a table. And Money tells you what's owed and overdue before anything else.",
        icon: "home",
      },
      {
        text: "Don't like it? One click back",
        detail:
          "Bottom of the left menu, look for \"Switch to simple view\" or \"Switch to advanced view\". On your phone it's under your initials, top right. Whichever you pick sticks on this device.",
        icon: "home",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Adding an entry
//
//   1. Add an object to the TOP of RELEASES, in the same PR as the feature.
//   2. Give it a fresh `id` (YYYY-MM-<slug>) and today's `date`.
//   3. Write an `intro` — one sentence on why, which is the part people read.
//   4. Add `announce: true` ONLY if it's worth interrupting someone for, and
//      set `announceUntil` while you're there. An announcement returns every
//      session until the user ticks "don't show this again", so this is a
//      standing interruption, not a one-off. Without `announce` the entry is
//      silent and just joins the What's New page.
//
// Copy rules: write for the person, not the changelog.
//
//   - EVERY reader sees EVERY item — there is no per-view filtering. If a
//     change only exists in one view, say which one ("in the simple view, …")
//     rather than assuming who is reading.
//   - Never write "couple" or "planner". Those are internal names for the two
//     shells; the UI calls them the SIMPLE view and the ADVANCED view.
//   - Say "seats", never "pax" — see docs/COUPLE_MODE.md and CLAUDE.md.
// ---------------------------------------------------------------------------
