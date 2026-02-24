# RSVP Guest Page Fix — Implementation Log

**Status:** COMPLETE
**Date:** 2026-02-24

Fixed 4 critical RSVP guest page issues: (1) custom form fields couldn't load on public page (auth-only endpoint), (2) guest page rendered inside corporate layout with navbar/footer, (3) form fields showed empty/couldn't fill or submit, (4) admin had no control over default questions. Also fixed follow-up bugs: white-on-white label text, missing width controls for attendance/guestDetails blocks, and questionId GUID lost during mapper round-trip.

---

## Files Changed

### Modified

| File | What Changed |
|------|-------------|
| `src/routers/routes.tsx` | Moved `/rsvp/submit/:token` outside `PublicTemplate` so guest page renders standalone (no navbar/footer) |
| `src/types/rsvpDesign.ts` | Added `attendance` + `guestDetails` to `RsvpBlock` union (with `width?`); added `questionId?: string` + `showFields?` to `ApiBlock`; added `formFieldConfigs?` to `RsvpDesign` + `ApiDesign` |
| `src/utils/rsvpDesignMapper.ts` | Handle `attendance`/`guestDetails` block types + `width` mapping; preserve `questionId` as string GUID through round-trip; map `formFieldConfigs` |
| `src/components/pages/RSVPs/RsvpDesignPage.tsx` | Designer monolith split into sub-components; added attendance/guestDetails defaults in `addBlock()`; embed `formFieldConfigs` in save/snapshot |
| `src/components/pages/RSVPs/RsvpSharePreviewPage.tsx` | Updated snapshot type to include `formFieldConfigs` |
| `src/components/pages/Public/RSVPPublic/RSVPPublicPage.tsx` | Removed `useFormFields()` auth-only call; uses embedded `design.formFieldConfigs ?? []` instead |
| `src/api/endpoints.ts` | Added `designByToken` to `PublicRsvpEndpoints` |
| `src/components/molecules/FormField.tsx` | Not modified — label uses `className="block font-medium"` with inherited color |

### Created

| File | Purpose |
|------|---------|
| `src/api/hooks/usePublicRsvpApi.ts` | `usePublicRsvpDesign(token)` (API first, localStorage fallback) + `useSubmitPublicRsvp()` mutation; extracts `formFieldConfigs` from design |
| `src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx` | Full form renderer: renders all blocks inline in designed order; auto-inserts attendance/guestDetails for backward compat; white cards have explicit `text-gray-900` |
| `src/components/pages/Public/RSVPPublic/RsvpSuccessScreen.tsx` | Thank-you confirmation screen after submission |
| `src/components/pages/RSVPs/designer/BlockList.tsx` | Extracted from monolith — draggable block list |
| `src/components/pages/RSVPs/designer/BlockEditor.tsx` | Right-panel editor for all 8 block types; includes width controls for attendance/guestDetails |
| `src/components/pages/RSVPs/designer/GlobalSettingsPanel.tsx` | Global design settings (background, accent, music, flow preset) |
| `src/components/pages/RSVPs/designer/DesignToolbar.tsx` | Save/Publish/Generate link toolbar |
| `src/components/pages/RSVPs/designer/AddBlockMenu.tsx` | Block type selector with all 8 types |
| `src/components/pages/RSVPs/designer/BlockPreviewCard.tsx` | Thumbnail preview cards for block list |

---

## How It Works (Data Flow)

```
Admin: /app/events/:id/form-fields
  → Creates FormFieldConfig records (questionId, typeKey, options, isRequired, label)

Admin: /app/rsvps/designer
  → Adds blocks: headline, text, attendance, guestDetails, formField, cta, image, info
  → For formField blocks: links a questionId from the dropdown
  → attendance block: title/subtitle/width controls
  → guestDetails block: title/subtitle/width + toggles for name/email/phone/pax/guestType
  → handleSave() embeds formFieldConfigs (availableQuestions) into design payload
  → persistShareSnapshot() saves to localStorage with formFieldConfigs + eventGuid

Guest: /rsvp/submit/:token (standalone, no navbar/footer)
  → usePublicRsvpDesign(token)
      tries GET /RsvpDesign/public/{token}
      fallback: localStorage["rsvp-share-{token}"]
      extracts formFieldConfigs from design (no auth needed)
  → RsvpFormRenderer renders ALL blocks in designed order:
      attendance → Yes/No/Maybe toggle buttons
      guestDetails → white card with name/email/phone/pax/guestType fields
      formField → white card with text-gray-900, resolves type from embedded formFieldConfigs
      headline/text/info/cta/image → display-only
  → Auto-inserts default attendance + guestDetails blocks if missing (backward compat)
  → Submit: POST /events/{eventGuid}/rsvps/public
      { guestName, guestEmail, status:"Yes"|"No"|"Maybe", guestType, noOfPax, phoneNo, answers }
  → RsvpSuccessScreen shown after submission
```

---

## Key Design Decisions

- **formFieldConfigs embedded in design** — Guest page needs no auth to load custom questions. The admin's `handleSave()` embeds the full `FormFieldConfig[]` into the design payload. This avoids the auth-only `/question/GetQuestions/{eventId}` endpoint entirely on the public page.
- **questionId as string GUID** — The mapper preserves `questionId` as a string through the round-trip. Previously `parseInt()` on GUIDs produced `NaN` which was lost. Now `ApiBlock.questionId` (string) is the primary identifier alongside legacy `formFieldId` (numeric).
- **text-gray-900 on white cards** — The page root sets `text-white` for the dark design background. White `bg-white` cards inside guestDetails and formField blocks need explicit `text-gray-900` to prevent white-on-white invisible labels.
- **Auto-insert defaults** — `RsvpFormRenderer` uses `useMemo` to auto-insert `attendance` and `guestDetails` blocks if missing from the design (backward compat with old designs that predate these block types).
- **Standalone route** — `/rsvp/submit/:token` is outside `<PublicTemplate />` so it renders full-screen without navbar/footer. The corporate site layout only applies to marketing pages.

---

## Bugs Fixed (This Session)

1. **White-on-white labels** — `FormField` component's `<label className="block font-medium">` inherited `text-white` from the page root, making labels invisible on `bg-white` cards. Fixed by adding `text-gray-900` to white card containers.
2. **questionId lost in mapper round-trip** — `parseInt()` on GUID strings produced `NaN`, which was stripped. Added `questionId` as a string field on `ApiBlock` and preserved it through `transformBlockToBackend`/`transformBlockToFrontend`.
3. **formField blocks returned null** — `renderBlock` returned `null` when no `FormFieldConfig` was found. Fixed to render using block's own label/placeholder.
4. **Missing width controls** — `attendance` and `guestDetails` blocks had no width controls in BlockEditor. Added `width?: "full" | "half"` to both types, plus admin UI controls and renderer support.

---

## What Was NOT Done (Deferred)

- **Backend endpoint** — `/RsvpDesign/public/{token}` needs backend implementation. Currently only localStorage fallback works.

---

## Known Issues & Improvements

### Must fix before production

1. **Backend public endpoint** — `/RsvpDesign/public/{token}` must be implemented for the guest page to work cross-device (not just same browser as admin).
2. **Submit error handling** — `RSVPPublicPage` should wrap `mutateAsync` in try/catch with `toast.error`.

### Should fix soon

3. **Half-width layout** — Adjacent half-width blocks don't sit side-by-side (no flex-row container). Needs a wrapping row for consecutive half-width blocks.

### Nice to have

4. **Image gallery swipe** — Image blocks with multiple images show only the first.
5. **Edit RSVP** — Allow guests to update by revisiting the link.
6. **Designer auto-save** — Debounce-save on block change.
