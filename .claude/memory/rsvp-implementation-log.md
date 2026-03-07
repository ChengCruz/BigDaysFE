# RSVP Design System — Implementation Log

**Status:** COMPLETE
**Date:** 2026-02-24

The RSVP design system was fully rebuilt end-to-end across two sessions. The admin designer monolith (1565 lines) was split into 6 focused sub-components. The guest public form now renders all block types inline in designed order and collects all backend-required fields (status, guestName, guestEmail, guestType, noOfPax, phoneNo, answers). Music support was added. All known bugs were fixed.

---

## Files Changed

### Modified

| File | What Changed |
|------|-------------|
| `src/routers/routes.tsx` | Moved `/rsvp/submit/:token` outside `PublicTemplate` so guest page renders standalone (no navbar/footer) |
| `src/types/rsvpDesign.ts` | Added `attendance` + `guestDetails` to `RsvpBlock` union; added `questionId?: string` + `showFields?` to `ApiBlock`; added `formFieldConfigs?` to `RsvpDesign` + `ApiDesign`; added `globalMusicUrl?: string` to `RsvpDesign`; added `musicUrl?: string` to `ApiTheme` |
| `src/utils/rsvpDesignMapper.ts` | Handle `attendance`/`guestDetails` block types + `width` mapping; preserve `questionId` as string GUID through round-trip; map `formFieldConfigs`; round-trip `globalMusicUrl` via `theme.musicUrl` |
| `src/components/pages/RSVPs/RsvpDesignPage.tsx` | Full refactor from 1565-line monolith to ~400-line orchestrator; exports `PhonePreview`, `FullPagePreview`, `FlowPreset`, `RsvpBlock` for `RsvpSharePreviewPage`; wires all designer sub-components; embeds `formFieldConfigs` in save/snapshot |
| `src/components/pages/RSVPs/RsvpSharePreviewPage.tsx` | Updated snapshot type to include `formFieldConfigs` |
| `src/components/pages/Public/RSVPPublic/RSVPPublicPage.tsx` | Removed `useFormFields()` auth-only call; uses embedded `design.formFieldConfigs ?? []`; wrapped `mutateAsync` in try/catch with `toast.error` |
| `src/api/endpoints.ts` | Added `designByToken` to `PublicRsvpEndpoints` |
| `src/api/hooks/usePublicRsvpApi.ts` | Updated `RsvpSubmitPayload`: added `status`, `guestType`, `noOfPax`, `phoneNo`; removed `attending: boolean`; music URL included in localStorage fallback |

### Created

| File | Purpose |
|------|---------|
| `src/api/hooks/usePublicRsvpApi.ts` | `usePublicRsvpDesign(token)` (API first, localStorage fallback) + `useSubmitPublicRsvp()` mutation; extracts `formFieldConfigs` from design |
| `src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx` | Full form renderer: renders all blocks inline in designed order; auto-inserts attendance/guestDetails for backward compat; white cards have explicit `text-gray-900`; floating music player button |
| `src/components/pages/Public/RSVPPublic/RsvpSuccessScreen.tsx` | Thank-you confirmation screen after submission |
| `src/components/pages/RSVPs/designer/BlockList.tsx` | Draggable block list with drag-to-reorder |
| `src/components/pages/RSVPs/designer/BlockEditor.tsx` | Right-panel editor for all 8 block types; includes width controls for attendance/guestDetails |
| `src/components/pages/RSVPs/designer/GlobalSettingsPanel.tsx` | Global design settings (background, accent, music URL, flow preset) |
| `src/components/pages/RSVPs/designer/DesignToolbar.tsx` | Save/Preview/Generate share link toolbar |
| `src/components/pages/RSVPs/designer/AddBlockMenu.tsx` | Block type selector with all 8 types + RSVP question inserter |
| `src/components/pages/RSVPs/designer/BlockPreviewCard.tsx` | Compact draggable card for each block in the left panel list |

---

## How It Works (Data Flow)

```
Admin: /app/events/:id/form-fields
  -> Creates FormFieldConfig records (questionId, typeKey, options, isRequired, label)

Admin: /app/rsvps/designer
  -> GlobalSettingsPanel: background (color/image/video), music URL, overlay, accent
  -> BlockList: ordered blocks with drag-to-reorder
  -> BlockEditor: edit selected block content + per-block backgrounds
  -> AddBlockMenu: add blocks or insert questions from FormFields API
  -> DesignToolbar: Save -> PUT /RsvpDesign/{eventGuid}/design
                    Generate link -> /rsvp/submit/:token
                    (localStorage snapshot saved with eventGuid + globalMusicUrl + formFieldConfigs)

Guest: /rsvp/submit/:token (standalone, no navbar/footer)
  -> RSVPPublicPage
      usePublicRsvpDesign(token)
        tries GET /RsvpDesign/public/{token}  (fallback: localStorage snapshot)
      formFieldConfigs embedded in design (no auth needed)
  -> RsvpFormRenderer renders ALL blocks in designed order:
      attendance -> Yes/No/Maybe toggle buttons
      guestDetails -> white card with name/email/phone/pax/guestType fields
      formField -> white card with text-gray-900, resolves type from embedded formFieldConfigs
      headline/text/info/cta/image -> display-only
  -> Auto-inserts default attendance + guestDetails blocks if missing (backward compat)
  -> Submit: POST /events/{eventGuid}/rsvps/public
      { guestName, guestEmail, status:"Yes"|"No"|"Maybe", guestType, noOfPax, phoneNo, answers }
  -> RsvpSuccessScreen shown after submission
  -> Optional floating music player (globalMusicUrl -> <audio> + useRef)
```

---

## Key Design Decisions

- **formFieldConfigs embedded in design** — Guest page needs no auth to load custom questions. The admin's `handleSave()` embeds the full `FormFieldConfig[]` into the design payload, avoiding the auth-only `/question/GetQuestions/{eventId}` endpoint on the public page.
- **questionId as string GUID** — The mapper preserves `questionId` as a string through the round-trip. Previously `parseInt()` on GUIDs produced `NaN`. Now `ApiBlock.questionId` (string) is the primary identifier.
- **status not attending** — Backend uses `status: "Yes"|"No"|"Maybe"`. Form has 3-button toggle mapping directly, no boolean conversion.
- **guestType as chip buttons** — Better mobile UX for dark-themed wedding cards than a dropdown.
- **text-gray-900 on white cards** — Page root sets `text-white` for dark backgrounds. White `bg-white` cards need explicit `text-gray-900` to prevent white-on-white labels.
- **Auto-insert defaults** — `RsvpFormRenderer` uses `useMemo` to auto-insert `attendance` and `guestDetails` blocks if missing (backward compat).
- **Standalone route** — `/rsvp/submit/:token` is outside `<PublicTemplate />` for full-screen rendering without navbar/footer.
- **Music as floating player** — Browser autoplay blocked without gesture. Floating play/pause button controls hidden `<audio>` element.
- **Designer as orchestrator** — All state + handlers in `RsvpDesignPage.tsx` (~400 lines). Sub-components are presentational + callback-driven.

---

## Bugs Fixed

1. **White-on-white labels** — `FormField` labels inherited `text-white` from root, invisible on `bg-white` cards. Fixed with `text-gray-900` on card containers.
2. **questionId lost in mapper** — `parseInt()` on GUID strings produced `NaN`. Added `questionId` as string field on `ApiBlock` and preserved through round-trip.
3. **formField blocks returned null** — `renderBlock` returned `null` when no `FormFieldConfig` found. Fixed to render using block's own label/placeholder.
4. **Missing width controls** — `attendance` and `guestDetails` blocks had no width controls in BlockEditor. Added `width?: "full" | "half"` + admin UI.
5. **Submit error not shown** — `RSVPPublicPage` had no try/catch. Added `toast.error` on failure.

---

## What Was NOT Done (Deferred)

- **Backend `/RsvpDesign/public/{token}`** — Needs backend implementation. localStorage fallback only.
- **Image gallery navigation** — Multiple images in image block still show first only.
- **Add to Calendar** — Not on success screen.
- **Edit RSVP** — Guests can't update a previous submission.
- **Designer auto-save** — Still manual Save only.

---

## Known Issues & Improvements

### Must fix before production

1. **Backend public endpoint** — `/RsvpDesign/public/{token}` must be implemented for cross-device guest access.

### Should fix soon

2. **Half-width layout** — Adjacent half-width blocks don't sit side-by-side (no flex-row wrapper for consecutive half-widths).
3. **Phone field type** — Should use `type="tel"` not `type="text"` in core fields for mobile keyboard.

### Nice to have

4. Image gallery swipe/dot nav in public page.
5. Add to Calendar on success screen.
6. Edit RSVP revisit flow.
7. Designer auto-save (debounce 2s).
8. Music file upload (currently URL-only).
