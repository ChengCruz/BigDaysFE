# RSVP Guest Page Fix — Implementation Log

**Status:** COMPLETE
**Date:** 2026-02-25 (updated)

Fixed 4 critical RSVP guest page issues (2026-02-24): (1) custom form fields couldn't load on public page, (2) guest page inside layout with navbar/footer, (3) form fields showed empty/couldn't fill or submit, (4) admin had no control over default questions. Also fixed follow-up bugs: white-on-white labels, missing width controls, questionId GUID lost in mapper.

**2026-02-25 follow-up fixes:** (5) guest submit called wrong endpoint `/events/{id}/rsvps/public` — fixed to `POST /rsvp/Create`; (6) answers sent as Record instead of `CreateAnswerRequest[]`; (7) formField blocks unable to link questions — numeric `questionId` integer from API caused strict-equality mismatch with string from `select` onChange; (8) cross-device design loading — share link now embeds `?event={eventGuid}` so external users can load design via `GET /RsvpDesign/{eventGuid}/design` (no JWT needed, only apiKey+author).

---

## Files Changed

### Modified

| File | What Changed |
|------|-------------|
| `src/routers/routes.tsx` | Moved `/rsvp/submit/:token` outside `PublicTemplate` so guest page renders standalone (no navbar/footer) |
| `src/types/rsvpDesign.ts` | Added `attendance` + `guestDetails` to `RsvpBlock` union (with `width?`); added `questionId?: string` + `showFields?` to `ApiBlock`; added `formFieldConfigs?` to `RsvpDesign` + `ApiDesign` |
| `src/utils/rsvpDesignMapper.ts` | Handle `attendance`/`guestDetails` block types + `width` mapping; preserve `questionId` as string GUID through round-trip; map `formFieldConfigs` |
| `src/components/pages/RSVPs/RsvpDesignPage.tsx` | Designer monolith split into sub-components; embed `formFieldConfigs` in save/snapshot; `generatePublicLink` now appends `?event={eventId}`; `insertQuestionBlock`/`applyQuestionToBlock` use `String()` coercion for ID comparison |
| `src/components/pages/RSVPs/RsvpSharePreviewPage.tsx` | Updated snapshot type to include `formFieldConfigs` |
| `src/components/pages/Public/RSVPPublic/RSVPPublicPage.tsx` | Removed auth-only `useFormFields()` call; reads `design.formFieldConfigs`; extracts `?event=` query param from URL and passes to `usePublicRsvpDesign` |
| `src/api/endpoints.ts` | `PublicRsvpEndpoints.submit` changed from `/events/${id}/rsvps/public` → `() => /rsvp/Create` |
| `src/api/hooks/usePublicRsvpApi.ts` | `usePublicRsvpDesign` gains `eventGuid?` param + fallback 3 (load via `/RsvpDesign/{eventGuid}/design` + fetch questions); `useSubmitPublicRsvp` fixes endpoint + converts answers to `CreateAnswerRequest[]` |
| `src/api/hooks/useFormFieldsApi.ts` | `questionId` and `id` now always stringified: `String(r.questionId ?? r.id ?? "")` — fixes select dropdown linking |

### Created

| File | Purpose |
|------|---------|
| `src/api/hooks/usePublicRsvpApi.ts` | `usePublicRsvpDesign(token, eventGuid?)` with 3-tier fallback + `useSubmitPublicRsvp()` |
| `src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx` | Full form renderer for guest page |
| `src/components/pages/Public/RSVPPublic/RsvpSuccessScreen.tsx` | Thank-you confirmation screen |
| `src/components/pages/RSVPs/designer/BlockList.tsx` | Extracted — draggable block list |
| `src/components/pages/RSVPs/designer/BlockEditor.tsx` | Right-panel block editor (all 8 types) |
| `src/components/pages/RSVPs/designer/GlobalSettingsPanel.tsx` | Global design settings |
| `src/components/pages/RSVPs/designer/DesignToolbar.tsx` | Save/Publish/Generate link toolbar |
| `src/components/pages/RSVPs/designer/AddBlockMenu.tsx` | Block type selector |
| `src/components/pages/RSVPs/designer/BlockPreviewCard.tsx` | Thumbnail preview cards |

---

## How It Works (Data Flow)

```
Admin: /app/events/:id/form-fields
  → Creates FormFieldConfig records (questionId:integer, typeKey, options, isRequired, text)
  → API: GET/POST /question/GetQuestions/{eventGuid} (requires apiKey+author only, no JWT)

Admin: /app/rsvps/designer
  → useFormFields(eventId) fetches questions — IDs stringified in mapper
  → Adds blocks; for formField: selects question from dropdown
    → BlockEditor dropdown value = String(q.id ?? q.questionId)
    → onChange returns string → applyQuestionToBlock uses String() coercion for find()
  → handleSave() embeds formFieldConfigs (availableQuestions) into design payload
  → generatePublicLink() creates token + link = /rsvp/submit/{token}?event={eventGuid}
  → persistShareSnapshot() saves to localStorage["rsvp-share-{token}"]

Guest: /rsvp/submit/:token?event={eventGuid} (standalone, no navbar/footer)
  → usePublicRsvpDesign(token, eventGuid) — 3-tier fallback:
      1. GET /RsvpDesign/public/{token}  (backend public endpoint — not yet implemented)
      2. localStorage["rsvp-share-{token}"]  (same-browser fallback)
      3. GET /RsvpDesign/{eventGuid}/design  (no JWT needed — works cross-device!)
         + GET /question/GetQuestions/{eventGuid} (no JWT needed — fetches formFieldConfigs)
  → RsvpFormRenderer renders ALL blocks in designed order
  → Submit: POST /rsvp/Create
      { eventId, guestName, guestEmail, noOfPax, phoneNo, status, guestType,
        remarks, createdBy, answers: [{ questionId, text }] }
  → RsvpSuccessScreen shown after submission
```

---

## Key Design Decisions

- **formFieldConfigs embedded in design** — Guest page needs no auth to load custom questions. Admin's `handleSave()` embeds the full `FormFieldConfig[]` into the design payload.
- **questionId always string** — `QuestionDto.questionId` is `integer` from API. `useFormFields` now stringifies it (`String(r.questionId ?? r.id ?? "")`). This ensures `<select>` onChange string values match in `find()` comparisons.
- **?event= query param in share link** — `GET /RsvpDesign/{eventGuid}/design` only requires `apiKey`+`author` headers (not JWT). Embedding the eventGuid in the share URL enables cross-device design loading without any backend changes.
- **CreateAnswerRequest[] format** — Backend's `/rsvp/Create` expects `answers: [{ questionId: string, text: string }]`. Multi-select checkbox values are joined with `", "`.
- **text-gray-900 on white cards** — White `bg-white` cards inside guestDetails/formField need explicit `text-gray-900` to prevent invisible labels on the dark background.
- **Auto-insert defaults** — `RsvpFormRenderer` auto-inserts `attendance` + `guestDetails` blocks if missing (backward compat with old designs).
- **Standalone route** — `/rsvp/submit/:token` is outside `<PublicTemplate />`.

---

## Bugs Fixed

1. **White-on-white labels** — Fixed by `text-gray-900` on white card containers.
2. **questionId lost in mapper round-trip** — Added `questionId` as string field on `ApiBlock`.
3. **formField blocks returned null** — Fixed to render using block's own label/placeholder.
4. **Missing width controls** — Added `width?: "full" | "half"` to `attendance`/`guestDetails`.
5. **Wrong submit endpoint** — Changed from non-existent `/events/{id}/rsvps/public` to `/rsvp/Create`.
6. **answers format** — Converted `Record<string, string|string[]>` to `CreateAnswerRequest[]`.
7. **formField question linking broken** — Numeric questionId from API caused `1 === "1"` mismatch. Fixed by stringifying in `useFormFields` mapper + `String()` coercion in comparisons.
8. **Cross-device design loading** — Share link now includes `?event={eventGuid}`; `usePublicRsvpDesign` uses it as a fallback to fetch design + questions without JWT.
9. **`withCredentials: true` CORS blocking all requests** — Axios client had `withCredentials: true` which requires backend to send specific `Access-Control-Allow-Origin` (not `*`). Auth is header-based (JWT/apiKey/author), not cookie-based, so `withCredentials` is unnecessary. **Removed from `src/api/client.ts`**. This was the root cause of all API calls silently failing in production when backend uses wildcard CORS.

---

## What Was NOT Done (Deferred)

- **Backend public endpoint** — `/RsvpDesign/public/{token}` still needs backend implementation (tier-1 in the fallback chain, currently always 404).

---

## Known Issues & Improvements

### Must fix before production

1. **Backend public endpoint** — `/RsvpDesign/public/{token}` should be implemented so the opaque token (not the eventGuid) is the primary lookup.

### Should fix soon

2. **Half-width layout** — Adjacent half-width blocks don't sit side-by-side (no flex-row container).

### Nice to have

3. **Image gallery swipe** — Image blocks with multiple images show only the first.
4. **Edit RSVP** — Allow guests to update by revisiting the link.
5. **Designer auto-save** — Debounce-save on block change.
