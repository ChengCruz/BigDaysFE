# Practice Check-in (demo / "try it" mode)

A safe, sandboxed way for an organiser to **rehearse the check-in flow** before
the real event day. They check in a demo guest, see it flip to "In ✓" exactly
like the real scanner, and the demo guest **auto-reverts to Pending after a few
hours** — by design, with the UI clearly telling them this is expected and not a
bug.

> This is the first cut. Everything is intentionally easy to tweak — copy,
> guest names, colours, reset window. Review and adjust, then I can iterate.

---

## What it does (user-facing)

1. On the **Check-in page** there's a new **✨ Practice** button in the header.
2. Tapping it opens the **Practice Check-in** modal with two tabs — **QR scan**
   and **Manual** — matching the two real check-in methods.

### QR scan tab
- A **picker for all 3 demo guests** (Alex / Priya / Wei Ming) — tap a name to
  show that guest's QR; a green tick marks anyone already checked in.
- Renders a **real, scannable demo QR code** for the selected guest.
- **Simulate scan** — one tap runs the scan locally (for single-device testing).
- **Start Camera** — opens the live camera scanner (same `html5-qrcode` engine
  as the real page). Show the demo QR on another screen and scan it with your
  phone for a genuine end-to-end test.
- Decoding behaves just like the real scanner, sandboxed:
  - demo QR → green ✅ success (beep + vibrate),
  - same demo QR again → amber ⚠️ **"Already checked in"** (great teaching moment),
  - any other/real QR → red ❌ *"That's not a demo QR… practice sandbox"*.

### Manual tab
- Lists 3 demo guests. Tapping **Check in**:
  - plays the same beep + vibrate + green ✅ success flash,
  - flips the guest to a green **In ✓** pill with an **Undo** button,
  - shows a live hint: *"Auto-resets to Pending in ~2h 58m"*.

### Shared
- A prominent amber callout explains the reset up front:
  > **Heads up — this is expected, not a bug:** a demo guest you check in here
  > will automatically return to **Pending** after about 3 hours…
- **Undo** reverts one guest immediately; **Reset demo now** reverts all.
- QR and Manual share the same demo state — scanning Alex's QR also marks him In
  in the Manual list, and vice versa.
- It's also surfaced as the **first step of the Check-in guided tour**
  (Tutorials → Check-in), so new users are pointed at it before anything else.

Nothing here touches the real guest list, real QR tokens, stats, or the backend.

### Crew (Staff) get it automatically on login
Crew log in via the Staff tab and land straight on the Check-in page (they're
scoped to `/app/checkin`, `/app/guests`, `/app/tables`). Because the Practice
button lives in the Check-in header, it's already available to them. On top of
that, the **practice modal auto-opens once per session for crew** (role `6`) the
first time they hit Check-in after logging in — so event-day staff are nudged to
rehearse before real guests arrive. It won't re-pop on every navigation, and
they can reopen it anytime via the **Practice** button.

Implemented in `CheckInPage.tsx` (`CREW_ROLE = 6`, `sessionStorage` flag
`bigdays.practiceCheckIn.crewSeen`). Uses `sessionStorage` (not `localStorage`)
so each fresh crew session gets the nudge once — matching how crew tokens are
session-scoped.

---

## Why it behaves this way (the "guest goes back to Pending" bit)

The reset is deliberate and lives entirely in the browser:

- When you check in a demo guest, we store `now()` against that guest id in
  `localStorage`.
- A guest counts as "checked in" only while it's within the reset window
  (`PRACTICE_RESET_MS`, currently **3 hours**). Past that, it's pruned and shows
  as Pending again.
- This keeps the demo **repeatable** and stops it leaving stale "checked in"
  state hanging around. That's the behaviour you described — and the UI says so
  in two places (the amber callout + the per-guest countdown) so users don't
  mistake it for a bug.

To change the window, edit one constant:
`src/utils/practiceCheckIn.ts` → `PRACTICE_RESET_MS`.

---

## Backend

**No backend change was made, and none is needed.** The whole thing is
sandboxed on the frontend (localStorage), which is the right call for a
practice/demo mode because:

- it never pollutes the real guest list, stats, tables or QR tokens,
- the "auto-revert after a few hours" is trivial and reliable client-side
  (no scheduled job / cron on the BE),
- it works even on an event with zero real guests.

If you'd rather it be a *real* BE-backed demo guest that a backend job reverts
(so, e.g., crew on different devices see the same demo state), say the word and
I'll do that via a BE subagent — but I'd recommend keeping it frontend-only.

---

## Files

**New**
| File | Purpose |
|---|---|
| `src/utils/practiceCheckIn.ts` | localStorage-backed demo state: roster (with demo QR tokens), check-in / undo / reset, `resolvePracticeToken()`, auto-expiry after `PRACTICE_RESET_MS`. Pure, no React. |
| `src/components/molecules/PracticeCheckInModal.tsx` | The interactive modal — **QR scan** tab (scannable demo QR + live camera + simulate) and **Manual** tab. Mirrors the real scanner's beep/vibrate/success/already/error UI, reset countdown + the "not a bug" callout. |

**Edited**
| File | Change |
|---|---|
| `src/components/pages/CheckIn/CheckInPage.tsx` | Added the header **✨ Practice** button (`data-tour="checkin-practice"`), renders the modal, and auto-opens it once per session for crew (role 6) on login. |
| `src/components/tour/tours.ts` | Added a first step to the Check-in tour pointing at the Practice button, including the "auto-resets, not a bug" note. |

---

## Knobs you'll likely want to tweak

All in `src/utils/practiceCheckIn.ts` unless noted:

- **Reset window** — `PRACTICE_RESET_MS` (default 3h).
- **Demo guests** — `PRACTICE_GUESTS` (names, phone, pax, guest type, QR token).
  Currently Alex Tan / Priya Kumar / Wei Ming, all suffixed "(demo)". The QR tab
  shows the first guest's code; change `QR_GUEST` in the modal to feature another.
- **Copy / wording** — the intro line, amber callout and success flash text are
  in `PracticeCheckInModal.tsx`.
- **Button label / placement** — "Practice" button in `CheckInPage.tsx` header.
- **Tour wording** — the new first step in `tours.ts` (`/app/checkin`).

---

## Verification done

- `tsc --noEmit` — passes clean.
- `eslint` on all changed files — no errors (one pre-existing unrelated warning
  in the camera effect, untouched).
- `vite build` — builds successfully.

Not yet done: a manual click-through in the browser (left for your review, since
you said you'll try + tweak it). The logic is covered by types/build; the visual
polish is the part worth eyeballing.

---

## Suggested follow-ups (not done — your call)

- Add a Playwright spec for the practice flow (kept separate from source per our
  convention).
- Optionally surface the same **Practice** entry on the Dashboard "quick
  actions" or the empty-state of the real guest list, so people find it before
  event day.
- Consider a "first visit" nudge that auto-opens the practice modal once.
