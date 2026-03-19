# RSVP Designer V2 — Summary of Changes

> Branch: `feature/jc_branch_20260315`
> Date: 2026-03-19

---

## Overview

Built a brand-new **RSVP Designer V2** — a full-screen page builder for creating RSVP invite pages. V2 sits alongside V1 (`RsvpDesignPage`) without touching any existing code or logic. It shares the same backend endpoint, data types, hooks, and mapper as V1.

---

## Files Changed / Created

| File | Action | Purpose |
|---|---|---|
| `src/components/pages/RSVPs/RsvpDesignV2Page.tsx` | **Created** | Full V2 designer page |
| `src/routers/routes.tsx` | Modified | Add `/app/rsvps/designer-v2` route |
| `src/components/pages/RSVPs/RsvpsPage.tsx` | Modified | Add "Design V2 ↗" button (opens new tab) |
| `src/types/rsvpDesign.ts` | Modified | Add 3 new V2 block types |
| `src/utils/rsvpDesignMapper.ts` | Modified | Add mapper cases for new block types |

---

## How V2 Differs From V1

| Aspect | V1 (`RsvpDesignPage`) | V2 (`RsvpDesignV2Page`) |
|---|---|---|
| Layout | 2-column inside dashboard | Full-screen fixed overlay (opens in new tab) |
| Canvas | Modal preview only | Live centre canvas — real-time page preview |
| Block rendering | Small card-style list | Full-width page sections (like the real guest page) |
| Block library | Dropdown/list | Left panel — grouped list with icons |
| Properties | Always visible side panel | Right panel with **Block** / **Page** tabs |
| Block selection | Click in list | Click on canvas → label badge + action bar above |
| New block types | None | eventDetails, countdown, map + RSVP Form preset |

Both V1 and V2 use the exact same:
- `useRsvpDesign` / `useSaveRsvpDesign` hooks
- `RsvpBlock` type and all block subtypes
- `RsvpDesignEndpoints.get` / `.save` — same backend endpoint
- `mapToBackendPayload` / `mapToFrontendDesign` mapper

---

## V2 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOLBAR (52px) — ← Back | Event name | 📱🖥 toggle | Draft | Save  │
├───────────────┬──────────────────────────────┬──────────────────────┤
│ LEFT (230px)  │ CANVAS (flex-1, #eaecf0 bg)  │ RIGHT (268px)        │
│               │                              │                      │
│ [Blocks][Lay] │  ┌──────────────────────┐   │ [Block] [Page]       │
│               │  │  Device frame        │   │                      │
│ Content:      │  │  (375px mobile /     │   │ Block tab:           │
│  • Headline   │  │   full desktop)      │   │  BlockEditor (V1)    │
│  • Text       │  │  ┌────────────────┐  │   │  when block selected │
│  • Info badge │  │  │ headline block │  │   │                      │
│  • Attendance │  │  ├────────────────┤  │   │ Page tab:            │
│  • Guest dtl  │  │  │ attendance blk │  │   │  GlobalSettings (V1) │
│  • Form field │  │  ├────────────────┤  │   │  background, accent, │
│  • CTA button │  │  │ ...            │  │   │  music, presets      │
│  • Image      │  │  └────────────────┘  │   │                      │
│               │  └──────────────────────┘   │                      │
│ From event:   │                              │                      │
│  • Event Dtl  │  ＋ Add block               │                      │
│  • Countdown  │                              │                      │
│  • Map/Venue  │                              │                      │
│               │                              │                      │
│ Presets:      │                              │                      │
│  • RSVP Form  │                              │                      │
│  • Upload img │                              │                      │
├───────────────┴──────────────────────────────┴──────────────────────┤
│ STATUS BAR (26px) — block count | event name | save state           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Canvas Block Behaviour

- **Hover** — dashed primary-colour border overlay appears
- **Click to select** — solid border + label badge top-left + action bar top-right (↑ ↓ ✕)
- **Layers tab** — drag to reorder, click to select
- Text colours **auto-adapt** to background: white text on dark bg, dark text on light bg (luminance check via `isLightColor()`)
- Per-block section image always uses dark-mode text (overlay applied)

---

## New Block Types (V2 Only)

These pull data from `useEventContext()` at render time — no manual input needed.

### 📅 Event Details
Renders 3 info cards side-by-side:

| Card | Source |
|---|---|
| 📅 Date | `event.date` → formatted as "Saturday, 20 June 2026" |
| ⏰ Time | `event.raw?.eventTime` |
| 📍 Venue | `event.location` |

Fields are individually toggleable (`showDate`, `showTime`, `showLocation`).

### ⏳ Countdown
Live ticking timer — Days : Hrs : Min : Sec — implemented as a dedicated React component (`CountdownDisplay`) using `useState` + `setInterval`.

- Default target: `event.date`
- Override: `block.targetDate` (ISO date string)
- When date passes: shows "🎉 The big day is here!"

### 📍 Map / Venue
CSS grid-pattern map placeholder with:
- Floating venue card (name + address)
- "Get Directions →" link → `https://maps.google.com/...` with address pre-filled
- Default address: `event.location`
- Light/dark grid colours adapt to global background

### 📋 RSVP Form Preset
Not a block type — a quick-insert button that adds **3 blocks at once**: Attendance + Guest Details + CTA. Saves the user from adding each individually.

---

## Mapper Changes (`src/utils/rsvpDesignMapper.ts`)

The existing `transformBlockToBackend` had no `default` case — unknown types would produce a malformed API payload. Fixed by adding explicit cases for all 3 new types using existing `ApiBlock` fields:

| New block field | Serialised into `ApiBlock` field | Reason |
|---|---|---|
| `eventDetails.showDate/Time/Location` | `showFields.date/time/location` | Already a `Record<string, boolean>` |
| `countdown.label` | `label` | String field |
| `countdown.targetDate` | `hint` | String field, unused by countdown |
| `map.mapLabel` | `label` | String field |
| `map.address` | `content` | String field |
| `map.showDirections` | `required` | Boolean field |

`transformBlockToFrontend` already had a `default` fallback (mapped to `"text"`) — new cases added before it so the new types properly round-trip.

---

## Issues Fixed During Development

### 1. Page too squeezed / "Design V2" button
**Problem:** Original V2 opened within the dashboard layout — 3 columns were crammed into the dashboard's content area.
**Fix:** V2 now uses `position: fixed; inset: 0; z-index: 50` (full-screen overlay). The button in RsvpsPage was changed to `target="_blank"` so it opens in a new tab.

### 2. White text on light background (invisible)
**Problem:** Saved design had a light cream background (`#f6f1e4` default) but all canvas text was hardcoded white.
**Fix:** Added `isLightColor(hex)` luminance function. All block renderers use an adaptive colour palette (`clr.heading`, `clr.body`, `clr.muted`, etc.) that flips between dark-on-light and light-on-dark based on the global background.

### 3. Canvas not scrollable with 7+ blocks
**Problem:** `<main>` had both `overflow-auto` and `flex flex-col` on the same element — a known CSS quirk where flex containers suppress scroll height calculation.
**Fix:** Separated concerns — `overflow-y-auto` on `<main>` (plain block, gets definite height from `flex: 1`), inner `<div>` handles `flex flex-col items-center` layout without any overflow property.

---

## Entry Points

| Where | What |
|---|---|
| RSVPs page → "Design V2 ↗" button | Opens V2 in new tab |
| URL: `/app/rsvps/designer-v2` | Direct access |

---

## What Was NOT Changed

- `src/components/pages/RSVPs/RsvpDesignPage.tsx` — V1 untouched
- `src/api/hooks/useRsvpDesignApi.ts` — hooks untouched
- `src/components/pages/RSVPs/designer/BlockEditor.tsx` — reused as-is in V2 right panel
- `src/components/pages/RSVPs/designer/GlobalSettingsPanel.tsx` — reused as-is in V2 right panel
- All existing backend endpoints — same API, no BE changes needed
