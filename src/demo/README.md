# Demo mode

A signed-out visitor can explore a sample wedding ("Aisha & Wei Ming") on the real
`/app/*` routes, with data served from `sessionStorage` instead of the API.

It exists so the marketing site has something **linkable** — a URL you can paste into a
Facebook group or an IG bio that shows the product working, with no signup and no typing.

## How it works

`api/client.ts` installs `demoAdapter` as the axios adapter. Every API hook already
funnels through that one client, so the real pages render unchanged and simply get their
data from `demoStore`. That is why demo mode needs **no changes to any hook in
`api/hooks/` and no changes to any page component**.

When demo mode is off — which includes always-off whenever a real access token exists —
the adapter delegates to the stock axios adapter and the whole folder is inert.

```
demoMode.ts    flag, kill switch, and the logged-in interlock
demoSeed.ts    the sample wedding (wire shapes: ApiGuest / ApiTable / ApiEvent)
demoStore.ts   mutable per-tab copy, persisted to sessionStorage
demoAdapter.ts URL → store dispatch, plus the recomputed dashboard aggregate
DemoBanner.tsx the "sample wedding" strip and the signup CTA (chrome, not content)
DemoGate.tsx   signup prompt for things the demo cannot honestly do
DemoEntryPage  the /demo route
index.ts       barrel — the only path the host app imports from
```

## To disable it

Set `VITE_DEMO_ENABLED` to anything other than `true` (or remove it). `isDemoActive()`
then returns `false` unconditionally, which short-circuits every touchpoint below: the
route redirects home, the CTA stops rendering, and the adapter delegates. No code change,
and it can differ per environment.

## To remove it entirely

Delete this folder, then fix the 15 places TypeScript complains about. They are the
complete integration surface, and each is a single conditional or call:

| File | What to remove |
| --- | --- |
| `api/client.ts` | the `installDemoAdapter(client)` call |
| `api/hooks/useAuthApi.ts` | `clearDemoArtifacts()` in login + logout |
| `routers/routes.tsx` | the `/demo` route and the `!demo` guards on the nudges |
| `components/RequireAuth.tsx` | the `isDemoActive()` clause in the redirect guard |
| `context/EventContext.tsx` | `isDemoActive()` in the events-query `enabled` flag |
| `context/UiModeContext.tsx` | the forced `"couple"` branch |
| `components/organisms/CoupleShell.tsx` | the `<DemoBanner />` mount, plus the `demo` guards on secondary links, the advanced-view switch and the palette / account-menu block |
| `components/molecules/EventSwitcher.tsx` | the guard hiding "Create new event" / "Manage all events" |
| `components/pages/Guests/CoupleGuestsPage.tsx` | the Step-2 "Design invite" branch, the export and invite gates, and the advanced-view hint guard |
| `components/pages/Events/CoupleQuestionsPage.tsx` | the add/examples gate and the hidden row actions |
| `components/pages/CheckIn/CheckInPage.tsx` | the check-in gate, the hidden Practice button, and the unmounted practice modal |
| `components/pages/Tables/FloorPlanPage.tsx` | the save gate (the canvas itself is never gated) |
| `components/pages/Budget/CoupleBudgetPage.tsx` | the advanced-view hint guard |
| `components/pages/Landing/LandingPage.tsx` | the two "See a live demo" CTAs |
| `components/pages/Public/Features/FeaturesPage.tsx` | the "See a live demo" CTA |

`grep -rn 'from "\(\.\./\)*demo"' src` finds all of them.

### What the demo will not do

Four gates, and they are not all the same kind. Export, saving a floor plan and
publishing an invite are **honest** boundaries: each produces something that
leaves the demo, so an account has to hold it.

Check-in is the exception, and worth being straight about in the code. The
Practice sandbox (`utils/practiceCheckIn.ts`) touches no API at all — hardcoded
guests, hardcoded QR tokens, `localStorage` — so it would work perfectly well
signed out. It is hidden anyway, along with the camera and manual check-in,
because scanning guests in is judged the thing worth registering for. That is a
product decision, not a technical limit, and `CheckInPage` says so.

### Why the shell has so many of them

A demo visitor has no account, so every control that assumes one has to go: "Your
account" and "Get help" hit `/User` and `/Contact`, which this adapter deliberately
passes through to the real backend; "Sign out" ends a session that never began; "What's
new" has no "since you were last here". Two body-copy hints that read *"Switch to
advanced view from your account menu"* are hidden for the same reason — once the switch
is gone, the hint points at nothing.

The colour-palette toggle goes too: a first-time visitor should see the look we
chose, not a theme switcher. Because Colours was the last item that worked without
an account, the avatar trigger is hidden with it rather than opening an empty menu.

The advanced-view switch is the one worth keeping hidden on principle: it drops a
first-time visitor into planner mode's fourteen-item sidebar, which is the first
impression `docs/COUPLE_MODE.md` was written to avoid. Because it is hidden,
`UiModeContext` forces couple mode over a *stored* override rather than merely over the
role default — otherwise a returning planner whose browser has `uiMode=planner` would
land in planner chrome with no control to leave it.

**`utils/analytics.ts` is NOT part of this folder and must not be deleted with it.** It
instruments signup, login, and event-created across the whole site and is useful
independently of whether the demo survives.

## Conventions this has to respect

- **Rows vs pax** (`CLAUDE.md`): one RSVP → one Guest row; `Guest.pax` is the party size
  *including* the replier. The seed is 10 RSVPs · 9 guest rows · 27 pax. A declined RSVP
  (`noOfPax: 0`) has **no** Guest row, mirroring the backend's soft delete.
- **Wire shapes only.** The hooks run `normalizeGuest` / `normalizeTable` / `toEvent` over
  whatever the adapter returns, so returning pre-normalized data would map it twice.
- **Unknown routes resolve empty, never reject.** The last unseeded surface is QR
  (`/Qr/ListByEvent`), empty on purpose — nobody has arrived at a wedding that has not
  happened. A rejection would throw an error page over the whole demo.
- **Read-only surfaces get a GET route and no writes.** Questions and crew are served
  straight from the seed rather than through `DemoState`: nothing can edit them, so there
  is nothing to persist, to validate on parse, or to reset.
- **Table count tracks guest count.** Trimming the guest list without trimming tables
  leaves the floor plan half empty, which reads as missing data rather than a small
  wedding. 4 tables · 32 seats · 24 seated pax, about three quarters full.
- The dashboard aggregate reproduces the backend's quirks rather than improving on them —
  notably `occupiedSeats = assignedGuests`. See the note in `demoAdapter.ts` and the
  contract at `CoupleHomePage.tsx:11-25`.
