# Couple mode

Branch: `feature/couples_design`
Status: **first cut — shells + merged guest list. Not committed.**

---

## Why

User feedback, 28 Jul 2026:

> "if you target individual user like me… i feel if the layout dont too enterprise…
> maybe can be attractive and more icon… if target is planner then yes"

The substance of it is not "add icons". It is that **the interface was doing our
segmentation for us, and picking the wrong segment.** A couple planning one wedding
opened the app and got a back-office console: a fourteen-item sidebar, CRUD verbs,
dense tables, and a hamburger menu on mobile.

## Decision

**Couples are the default. Planners are the power user.**

One engine, two shells. Role picks the default; the user can always override it.
Nothing is removed from the product — planner mode keeps every dense feature.

---

## Architecture: swap the shell, not the route tree

There is **one route table**. `AppLayout` branches on mode and renders one of two
chromes around the same `<Outlet />`:

```tsx
const Shell = mode === "couple" ? CoupleShell : PlannerShell;

return (
  <TourProvider>
    <Shell>{showEmptyState ? <NoEventsState /> : <Outlet />}</Shell>
    <HelpBubble />
  </TourProvider>
);
```

This mirrors the pattern already in `AppLayout` for Crew (role 6), one level up.

**Consequences that make this cheap:**

- No page component is duplicated. `WalletPage`, `CheckInPage`, `TablesPageV3` etc.
  are untouched and render identically in both shells.
- Every route string is unchanged, so bookmarks, email deep-links and the
  new-tab RSVP designer link keep working.
- `PlannerShell` is the previous `AppLayout` markup moved verbatim. Anyone who is
  not a Member sees exactly what they saw before.

### Mode resolution

`src/context/UiModeContext.tsx`, mounted inside `AuthProvider` (it needs the role).

| Role | | Default mode |
|---|---|---|
| 3 | Member | **couple** |
| 1, 2, 4 | Super Admin, Admin, Vendor | planner |
| 6 | Staff / Crew | n/a — `AppLayout` redirects to `/app/checkin` first |

The user's choice is stored under `localStorage.uiMode` and **overrides the role
default in both directions**. An admin can preview couple mode; a couple who wants
bulk import can switch to planner. Role sets the default, not a ceiling.

### Where the switch lives — both directions

| From | Control |
|---|---|
| Couple → planner | Rail footer → **"Switch to planner view"** (`CoupleShell.tsx`); mirrored in the avatar menu on mobile only (`md:hidden`) |
| Planner → couple | Sidebar footer → **"Switch to couple view"** (`Sidebar.tsx`) |

Both live in the same place — the bottom of the side nav — so the switch is in one
learnable location regardless of which mode you are in. The avatar-menu mirror exists
only because mobile has no rail.

The planner-side control is gated on `defaultMode === "couple" || override !== null`,
so a planner-native account that never opted in sees no change to its sidebar.

> Without the planner-side control the switch is **one-way**: `PlannerShell` renders
> the existing `Sidebar`/`Navbar`, neither of which knows about UI mode, so the only
> way back would be clearing `localStorage.uiMode` by hand. If you refactor either
> shell, keep both directions reachable.

### The five sections

`src/components/organisms/coupleSections.ts` is the single source of truth for both
the desktop rail and the mobile tab bar.

| Tab | Route | Absorbs |
|---|---|---|
| **Home** | `/app/dashboard` | `/app/dashboard`, `/app/checklist`, `/app/events` |
| **Guests** | `/app/guests` | `/app/guests`, `/app/rsvps`, `/app/form-fields`, designer (new tab) |
| **Seating** | `/app/tables/v3` | all of `/app/tables/*` |
| **Money** | `/app/budget` | `/app/budget` + gifts |
| **Big Day** | `/app/checkin` | `/app/checkin`, `/app/crew` |

Moved out of the tabs into the **rail footer** (and mirrored in the avatar menu on
mobile):

| Label | Route | Why not a tab |
|---|---|---|
| Get help | `/app/contact` | Support. |
| Your account | `/app/users` | **Not** "share access". `UsersPage` is the signed-in user's own profile and password, plus an admin-only user list. Labelled for what it actually is. |

Plus the palette toggle, the planner-mode switch and sign out.

**14 sidebar links → 5 tabs + 2 footer links + 3 menu actions. Nothing dropped.**

### Crew lives in Big Day, not in the footer

`/app/crew` ("Your helpers") was originally a third footer link. It is now reached
from a row at the top of the Big Day tab (`CoupleBigDayPage`). Three reasons:

1. **The shell already claimed it.** `sectionForPath` maps `/app/crew` → Big Day, so
   standing on crew lit the Big Day tab — but tapping Big Day went to `/app/checkin`,
   and `CheckInPage` had no link onward. The nav made a promise it didn't keep.
2. **It was the odd one out.** Its footer neighbours (Get help, Your account) are
   app-level and event-independent. Crew is **event-scoped** — it changes when you
   switch events in the header, and has its own `/crew-login` invite link.
3. **Mobile had no rail**, so helpers sat in the avatar dropdown next to sign-out,
   which is not where anyone looks for "who's scanning at the door".

> **That row is now the only path to `/app/crew` in couple mode.** `CrewPage` itself
> is unchanged and has no couple treatment. If you rework `CoupleBigDayPage`, keep a
> link to crew or the page becomes unreachable.

**Crew role (6) is excluded explicitly.** `BigDayRoute` checks `userRole !== 6`, not
just the mode: a crew member signing in on a browser that already has
`uiMode=couple` in `localStorage` would otherwise be handed the helper-management
list. Helpers don't manage helpers.

This is a step toward the date-aware Big Day sketched in `_ui-mock` (prep list
before → scanner on the day → summary after), where helpers are a prep-phase row.
The rest of that is still not built.

> **Prefix matching.** `sectionForPath()` matches on path *prefix*, deliberately the
> opposite of the planner sidebar's `end: true` NavLinks. A couple on
> `/app/tables/floorplan` must still see "Seating" lit.

---

## The Guest / RSVP model — read this before touching the guest list

**Verified against the backend (`MyBigDays_Mono`), not inferred from the FE types.**

An earlier draft of this document claimed Guest↔RSVP was 1:N — one Guest row per
attendee. **That was wrong.** The real model is:

```
Rsvp (1) ──── (0..1) Guest        Guest.Pax = the party size
```

One RSVP creates **exactly one** Guest row:

- `Application/Services/RsvpGuestHandler.cs` → `CreateAsync` calls
  `_guestService.CreateGuestAsync(...)` **once**, never in a loop, with
  `GuestName = rsvpDto.Name, Pax = rsvpDto.NoOfPax`.
- `Domain/DTOs/RsvpDetailDto.cs` → `public GuestDto? Guest` is **singular**.
- `GuestRepository.GetByRsvpIdAsync` uses `.FirstOrDefaultAsync()`.
- `Domain/Models/GuestModel.cs` on `Pax`: *"Number of people represented, will be
  generated when RSVP is created"*.

Corroborated on the FE: `RsvpsPage.tsx:88` builds `guestCodeMap` as a plain `Map`
keyed by `rsvpId` with one value — only correct at 1:1.

### What this means

- **There are no per-attendee records and no per-attendee names.** A party of four
  is one row whose `Pax` is 4.
- **A party is the atomic unit of seating.** `POST /Guest/{guestId}/AssignTable/{tableId}`
  seats all `Pax` at once. There is no bulk or split-party endpoint — the one shaped
  for it (`TableArrangement/DragDropUpdate`) is `throw new NotImplementedException()`.
- **A party is the atomic unit of check-in too** — one QR pass covers all `Pax`
  (`CheckInService` returns `NoOfPax = guest?.Pax`).
- **Auto-assign never splits a party.** First-fit-decreasing by pax; whatever
  doesn't fit comes back in `SkippedGuestIds`.

So "seat guests one by one" is **not expressible against this API**, and couple mode
correctly does not offer it.

`CoupleGuestsPage` therefore renders **one row per party**, joining RSVP→Guest on
`rsvpId`. Expanding shows the party's reply, seat and pass — not a list of people.

### Edge cases handled

| Case | Treatment |
|---|---|
| `noOfPax === 0` | Backend soft-deletes the Guest row → "Can't make it" |
| RSVP exists, Guest row not created yet | "Just replied" |
| Guest with no `rsvpId` | Becomes a party of its own, still visible |
| Guest whose `rsvpId` matches no RSVP | Same — never silently dropped |
| More than one Guest per RSVP (shouldn't happen) | Lowest `guestIndex` wins, defensively |

### Other backend facts worth knowing

- `guestIndex` is **1-based per event** and never reused (`GetNextGuestIndexAsync`
  does not filter `IsDeleted`).
- `guestCode` is `"{GuestIndex:D2}"` when unseated (e.g. `"07"`) and
  `"{TableCode}-{Seq:D2}"` when seated (e.g. `"WM01-03"`). So
  `guestCode.includes("-")` is a valid "is seated?" check — that is the documented
  contract.
- `AssignTable` has its **capacity check deliberately disabled** server-side; the FE
  warns but the assignment always succeeds.
- Setting `noOfPax` to 0 **silently unseats** the party (`TableId` and `SeatIndex`
  nulled). Raising it back from 0 restores the row but **not** the table assignment.

### Language

Operational badges become human ones. Same field, different register.

| Planner | Couple |
|---|---|
| `UNASSIGNED` | "Needs a seat" |
| `ASSIGNED` | the table name, e.g. "Table 2" |
| "Manage and organize your guest list" | "Everyone you invited, and who's replied" |

---

## Seating and capacity conventions — inherited, not invented

Audited across the planner pages before couple mode copied them. **Follow these; do
not invent new ones.**

### The rule that matters most

> **Over-capacity is ALWAYS allowed and never blocked. It only warns.**

No path in the app refuses an over-capacity assignment. Three places warn with an
identical sentence and toast style; three others assign silently. The floor plan's
`canAcceptDrop` (`FloorPlan/FloorTableItem.tsx:232`) dims non-fitting tables and says
*"Not enough seats"* — but `handleDrop` ignores it and assigns anyway. It is
**cosmetic only**.

The canonical warning, copied verbatim into `CoupleSeatingPage`:

```ts
toast(`⚠️ ${table.name} is over capacity (${after}/${capacity}). Guest assigned anyway.`, {
  duration: 4000,
  style: { background: "#fef3c7", color: "#92400e" },
});
```

Note it is `toast(...)` — the react-hot-toast **blank** variant with an inline amber
style and a literal `⚠️` prefix — **not** `toast.error`. Source of truth:
`TablesPage.tsx:234`, `GuestsPage.tsx:193`, `TableAssignments.tsx:56`.

### Other settled conventions

| Rule | Value |
|---|---|
| Occupancy | **Summed `pax`**, never a row count |
| Pax fallback | `pax \|\| noOfPax \|\| 1` on the tables grid |
| Remaining | `capacity - occupancy`, computed inline (no shared helper exists) |
| Full | `assigned >= capacity` |
| Over | `assigned > capacity` |
| Colour | **Red** for over-capacity, everywhere, consistently |
| Filters | `hasEmpty` = `assigned < capacity` (excludes full *and* over); `full` = `assigned >= capacity` (**includes** over) |
| Nouns | "seats" for the countable thing, "capacity" for the limit, "pax" as a party-size suffix |

`TableBase.extraGuests` exists on the type and is written by `useUpdateTableExtras`,
but it is **never added to capacity, never displayed, and never used in any
comparison**. Treat it as unused. Couple mode ignores it.

Known inconsistencies in planner mode, deliberately *not* propagated: the amber
threshold is 80% on `TableCard` and 60% on `TablesFullscreenPage`; an exactly-full
table is green on the tables grid but orange in the `GuestsPage` picker; undo exists
only on the floor plan.

### The one thing couple mode adds

`useAutoAssignGuests` returns `{ assignedCount, skippedCount, skippedGuestIds }`.
**A repo-wide grep for `skippedGuestIds` returns zero hits** — every planner surface
reads only the two counts and renders *"Assigned: 2, Skipped: 1."*, which tells the
user nothing actionable.

`CoupleSeatingPage` keeps the ids and names the parties, with the reason:

> **Aunty Chan couldn't be seated** — Aunty Chan is bringing 4, and the roomiest table
> (Table 3) has 2 seats left. A party has to sit together. **[Add a table] [Got it]**

Amber, not red: nothing is broken, a decision is needed. Red stays reserved for
over-capacity and overdue money.

**Follow-up worth its own ticket:** planner mode would benefit from the same fix.
It is a small change to `useAutoAssignGuests` plus the four toast call sites
(`TablesPageV3:265`, `TablesPage:412`, `TablesFullscreenPage:262`, `FloorPlanPage:422`).
Out of scope for this branch.

## Home — one question, answered in party counts

`CoupleHomePage` replaces `MemberDashboardPage` in couple mode via `HomeRoute`.
Same route (`/app/dashboard`), same single endpoint (`useDashboardApi`), **no new
query**. Planner mode still gets the six-panel dashboard.

The readiness ring is the one thing that needed a backend change — see
"Readiness ring" below. Everything else on this page is read from the dashboard
payload that already existed.

Four panels instead of six: the day itself, **the one thing next**, how ready you
are, and where
things stand. The planner quick-actions grid is gone — six equal buttons is not
an answer to "what do we do now?".

### The next-action ladder

First match wins. Everything below is read from the one dashboard payload:

| # | Condition | Says |
|---|---|---|
| 1 | event has passed | "Your big day has passed" — no action |
| 2 | event is today | "It's today" → check-in |
| 3 | `totalRsvpsReceived === 0` | "Invite your first guests" |
| 4 | `totalTables === 0` and parties exist | "Add your first table" |
| 5 | `unassignedGuests > 0` | "N parties still need a seat" + seating meter |
| 6 | `pendingCount > 0` | "N invites still waiting on a reply" |
| 7 | `status === over_budget` | "You're over budget" |
| 8 | — | "Everything's on track" |

### Counting: parties, exactly as the backend counts

Every number in `tableStats` is a **row** count, and one Guest row is one party
(see the Guest / RSVP model above). Home speaks in parties and derives no head
count client-side:

```
parties total = tableStats.assignedGuests + tableStats.unassignedGuests
seating meter = assignedGuests / parties total      → "35 of 40 parties seated"
```

> **`tableStats.occupiedSeats` is deliberately unused.** The backend assigns it
> `= assignedGuests` (`DashboardHandler.cs:199`, comment *"Assuming 1 guest = 1
> seat"*), so it is a party count wearing a seat label. Pairing it with
> `totalSeats` in one ratio mixes units and under-reports by roughly the average
> party size — 20 families of 5 in a 100-seat venue would render as "20% full".
> The parties/parties meter needs nothing from the backend and cannot drift.
> `tests/couple-home.spec.ts` asserts the mixed pairing never renders.

The **one** genuine head count on the page is `rsvpStats.totalGuestsConfirmed`,
which the backend computes itself as `SUM(NoOfPax)` over confirmed RSVPs
(`DashboardHandler.BuildRsvpStats`). That tile is labelled "People coming";
nothing else on the page says people.

Replies (`comingCount + notComingCount` of `totalRsvpsReceived`) stay a separate
tile from the head count, per open question 1 below.

### Countdown

Two different numbers, on purpose.

**The ladder** uses `daysUntilEvent()`, which slices `YYYY-MM-DD` and anchors to
UTC midnight. Parsing the raw API datetime directly lands a day early in GMT+8
(`eventUtils.ts:6-11`). It answers "which calendar day is it", which is what
"is it today?" and "has it passed?" need.

**The hero tiles** use `countdownToEvent(eventDate, eventTime)`, which builds the
target from the event's own start time in **local** wall-clock — the one place in
`eventUtils.ts` that deliberately does not anchor to UTC, because `eventTime` is
stored as local with no offset (same convention as `formatEventTime`).

The two can disagree by one late in the evening: at 23:00 the night before an
11am wedding, the ladder says 1 calendar day and the tiles say `0d 12h 0m`. Both
are right for their job — don't "fix" this by collapsing them into one number.

> `MemberDashboardPage` computes its own countdown inline from
> `new Date(eventDate)` and **ignores `eventTime` entirely**, so planner mode
> counts to midnight on the wedding day — roughly 11 hours early for a late-morning
> ceremony. Left alone here to keep planner mode byte-identical; worth its own ticket.

A 60-second tick drives both. Neither is memoised on `eventDate` — an earlier
draft memoised `days` that way, which silently defeated the tick and meant a page
left open overnight never rolled over.

### Readiness ring — the one backend change

`dashboard.checklistStats` → `{ totalItems, completedItems, remainingItems,
percentComplete }`. New field on the existing summary response.

**Why server-side rather than a second query.** The alternative was calling the
existing `useChecklistApi` from Home. Both were ~the same effort; the merge won on
request count and on keeping Home a one-endpoint page. The accepted cost is
staleness — see below.

> **The ring can lag up to 60 seconds.** `DashboardHandler` caches the whole
> summary for 60s (`CACHE_EXPIRATION_SECONDS`) and **nothing evicts it** — a grep
> for `_cache.Remove` finds no call outside `UserProfileService`. So ticking a
> checklist item does not move the ring until the cache expires. This was a
> deliberate call: the ring is on Home, the ticking happens on `/app/checklist`,
> and a round trip usually costs more than 60s anyway.
>
> If it ever needs to feel live, the fix is to inject `IMemoryCache` into
> `ChecklistService` and evict `dashboard_summary_{eventGuid}` in
> `UpdateItemAsync` / `CreateItemAsync` / `DeleteItemAsync`. Do **not** try to fix
> it from the frontend — `invalidateQueries` just re-fetches the same cached
> server response.

**Percent is computed on the server, on purpose.** Checklists are seeded on demand
via `POST /Checklist/Seed`; nothing seeds on event creation (`EventCreationHandler`
doesn't reference checklists at all). So `totalItems === 0` is a normal state for
most existing events, and a client-side `completed / total` divides by zero.
`BuildChecklistStats` guards it the same way `BuildRsvpStats` guards `ResponseRate`.

Home renders that zero case as **"Start your checklist"** with a clipboard icon,
not a demoralising 0% ring.

`ApiDashboardSummary.checklistStats` is typed **optional** and zero-filled in
`toDashboardSummary`, so a frontend deployed ahead of the backend still renders —
it just shows the start-your-checklist state. `tests/couple-home.spec.ts` covers
both that and the zero-items case.

### The preset lines

`src/utils/countdownMessages.ts` holds `ALMOST_THERE_MSGS`, `TODAY_MSGS`,
`PAST_MSGS`, `FAR_MSGS` and `ALMOST_THERE_DAYS` (15). These were module-local
constants in `MemberDashboardPage` and are now shared by both dashboards — the
only change to that file, and a pure extraction with no behaviour change.

Home shows one under the tiles: `almost` under 15 days out, `far` beyond. It is
picked once per mount (`useMemo(…, [])`) so it does not reshuffle on every tick.

**`TODAY_MSGS` and `PAST_MSGS` are deliberately not used on couple Home.** The
next-action card already owns those two states ("It's today 💍", "Your big day has
passed"), and its past-tense copy is `PAST_MSGS[2]` verbatim — showing both would
have printed the same sentence twice one time in three.

### Two backend bugs found while building this — left alone on purpose

Neither is fixed and neither blocks Home. Recorded here so the next person
doesn't re-derive them:

1. `occupiedSeats` is a party count labelled as seats (`DashboardHandler.cs:199`).
   One-line fix would be `.Where(g => g.TableId.HasValue).Sum(g => g.Pax)`.
   **Anything else consuming this field today is also wrong.**
2. `TableRepository.GetByEventIdAsync` doesn't filter `IsDeleted`
   (`TableRepository.cs:46-51`), so soft-deleted tables inflate `totalTables`,
   `totalSeats` and `arrangedTables`. The sibling method three lines down *does*
   filter it.

## Styling notes

**`src/theme/default.css` and `src/theme/dark.css` are dead files** — nothing imports
them. The live palette is the `@theme` block in `src/index.css`: **Rose** (default)
and **Slate** (`:root.slate`). Both are light palettes.

**`dark:` utilities are dead too.** `@custom-variant dark (&:where(.dark, .dark *))`
targets `.dark`, and `ThemeContext` explicitly removes that class. New couple-mode
components therefore use brand tokens (`bg-background`, `text-text`, `border-primary/10`)
and **no `dark:` classes**.

Five section hues were added to `@theme`, with cooled equivalents under `:root.slate`,
so each section keeps its identity in both palettes:

```
--color-sect-home --color-sect-guests --color-sect-seating
--color-sect-money --color-sect-bigday
```

> Class names are stored as **complete literal strings** in `coupleSections.ts`
> (`"text-sect-guests"`, not `` `text-sect-${key}` ``). Tailwind scans source for
> literal class names and would never generate a composed one.

---

## Files

**Added**
```
src/utils/countdownMessages.ts
src/context/UiModeContext.tsx
src/components/organisms/coupleSections.ts
src/components/organisms/CoupleShell.tsx
src/components/organisms/PlannerShell.tsx
src/components/pages/Guests/CoupleGuestsPage.tsx
src/components/pages/Tables/CoupleSeatingPage.tsx
src/components/pages/Budget/CoupleBudgetPage.tsx
src/components/pages/Dashboard/CoupleHomePage.tsx
src/components/pages/CheckIn/CoupleBigDayPage.tsx
tests/couple-home.spec.ts
docs/COUPLE_MODE.md
```

**Changed**
```
src/App.tsx            UiModeProvider mounted inside AuthProvider
src/routers/routes.tsx AppLayout picks a shell; HomeRoute / GuestsRoute /
                       SeatingRoute / BudgetRoute / BigDayRoute pick a body. No
                       route paths changed.
src/index.css          five sect-* hues per palette
src/utils/eventUtils.ts       + countdownToEvent()
src/components/pages/Dashboard/MemberDashboardPage.tsx
                       countdown message constants moved out to
                       countdownMessages.ts and imported back. Pure extraction —
                       renders identically.
```

**Deliberately untouched:** `Sidebar.tsx`, `Navbar.tsx`, `GuestsPage.tsx`,
`RsvpsPage.tsx`, `TablesPageV3.tsx`, `BudgetPage.tsx` and every other page.
Planner mode is unchanged.

**Reused rather than rebuilt:** `RsvpFormModal`, `TableFormModal`,
`SetupBudgetModal`, `TransactionFormModal`, `StatsCard`, `QrStatusBadge`,
`NoEventsState`, `PageLoader`, `ErrorState`.

**Backend changes — two files in `MyBigDays_Mono`, additive only:**

```
Application/DTOs/DashboardSummaryDto.cs   + ChecklistStatsDto, + property on
                                            DashboardSummaryDto
Application/Services/DashboardHandler.cs  + IChecklistService dependency,
                                            + one sequential await,
                                            + BuildChecklistStats(),
                                            + EventStats.EventGuid (see below)
```

No DI registration (`IChecklistService` was already registered), no migration, no
new endpoint, no route change. Every other couple-mode surface reads existing
endpoints only; the merge is client-side.

The new `await` sits **below** the existing four, not in a `Task.WhenAll` — the
comment at `DashboardHandler.cs:65` and the wallet loop below it exist because all
those services share one scoped `MyBigDaysDbContext`.

**Drive-by fix in the same file:** `BuildEventStats` never assigned
`EventStatsDto.EventGuid`, so it always serialized as `null` despite being
documented as returned. Now assigned. Nothing on the frontend read it, so this is
safe — but check any other consumer that was working around the null.

---

## Verification

- `npx tsc -b` — passes, no errors.
- `npx eslint` on the changed files — no new errors. One
  `react-refresh/only-export-components` warning on `UiModeContext.tsx`, matching the
  existing convention in `ThemeContext.tsx` and `EventContext.tsx`.
- Pre-existing repo-wide lint failures are unrelated and were not touched. Note
  `routes.tsx` reports two spurious `no-unused-vars` errors on the JSX comment
  `{/* global 404 fallback */}` — **this exists on `master` too** (line 228) and is an
  ESLint parsing artefact, not a regression.

### How to try it

1. Sign in as a Member (role 3) → couple mode loads by default.
2. Any other role → planner mode, unchanged from today.
3. To flip: avatar menu → "Switch to planner view". To reset, clear
   `localStorage.uiMode`.
4. Resize below `md` to see the bottom tab bar replace the rail.

---

## Not done yet

Scoped out on purpose:

- **Big Day** is a helpers row above `CheckInPage`, and is **not date-aware**
  (prep list → scanner → summary). The other two prep rows in the mock — "send
  everyone their pass" and "print the seating chart" — are not built.
- **Crew** has no couple treatment; `CrewPage` renders as-is, now reached from the
  Big Day tab rather than the rail footer.
- **Floor plan** is unchanged — couple mode links to the existing page.
- **Onboarding / first-run** screen for a couple with no event yet.
- **`ChecklistPage` itself** is unchanged — only Home's ring is new, and it links
  straight to the existing planner page.
- **Ring chips.** The mock showed chips under the ring ("Venue booked", "Seating").
  Not built: `ChecklistStatsDto` carries counts only, so there are no item titles
  to render. Would need `List<string> NextItems` added to the DTO.
- **Help / tours.** `HelpBubble` is planner-only — see below.

### Help and tours are planner-only

`routes.tsx` renders `<HelpBubble />` only when `mode === "planner"`. Two reasons:

1. **The tours cannot anchor.** Tours target `data-tour="…"` attributes and
   `findTourForPath()` resolves a tour by **route**, not by rendered component.
   Couple mode swaps in `Couple*` pages on the *same* paths, and none of them
   carry `data-tour` attributes. So the bubble would offer "Take a tour of this
   page" — enabled, because `hasTour` is computed from the route alone — and
   then Joyride would find nothing to point at:

   | Tab | Component | Tour matched | Steps that can anchor |
   |---|---|---|---|
   | Home | `CoupleHomePage` | Dashboard (6) | 2 — `event-switcher` only (it lives in the shell) |
   | Guests | `CoupleGuestsPage` | Guests (3) | 0 |
   | Seating | `CoupleSeatingPage` | Tables (4) | 0 |
   | Money | `CoupleBudgetPage` | Budget (3) | 0 |
   | Big Day | `CoupleBigDayPage` → `CheckInPage` | Check-in (4) | 4 — the scanner is rendered unchanged |

   The tour *copy* is planner-voiced too — "bulk-delete tables", "Auto-Assign",
   "pax filled vs capacity", "export reports" — describing UI couple mode
   deliberately hides.

2. **It covered the Big Day tab.** `fixed bottom-6 right-6` put a 56px circle
   over the mobile tab bar's last tab.

Couples still reach support via **Get help** in the account menu. `/app/tutorial`
has no couple entry point once the bubble is gone, which is intended — it lists
all 13 tours unconditionally, including planner-only ones (Events, RSVP
Designer, RSVP Questions, Floor Plan, Users & Profile).

To bring help back to couple mode: author couple-specific tours, add `data-tour`
attributes to the four `Couple*` pages, filter `TutorialPage` by mode, then
mount the entry point as a `?` button in the `CoupleShell` header rather than as
a floating bubble — the header already reserves space where the palette toggle
sits `md:`-only. Covered by `tests/couple-home.spec.ts`.

## Open questions

1. **Party-as-row is now settled** — the backend leaves no alternative. But it means
   the row count is *replies*, not head count. Every label now carries its unit so
   the two can never be read as the same number: row counts are "Replies" and
   "No table yet", pax sums are "People coming", "Seats taken/needed/free". See the
   counting-convention table in `CLAUDE.md`.
2. **Deletion in couple mode** is intentionally absent — removal goes through the RSVP
   module, which also soft-deletes the Guest row and unseats the party. Couple mode
   points at planner view. Acceptable, or should deleting a party be allowed inline?
3. **Sub-events.** Couple mode has no "Events" tab; switching happens in the header
   `EventSwitcher`. Fine at 1–3 celebrations, weak at ten — which is the planner case.
4. **Should Member ever see planner mode by accident?** Currently yes, via the account
   menu. That is deliberate but worth confirming.
