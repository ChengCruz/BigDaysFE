# RSVP Design Rebuild Plan

**Status:** PARTIALLY IMPLEMENTED — see `rsvp-implementation-log.md` in global memory
**Created:** 2026-02-23
**Scope:** Admin RSVP designer + Guest public RSVP page

---

## Problem Statement

### Current Issues

| Issue | File | Detail |
|-------|------|--------|
| Monolithic designer | `RsvpDesignPage.tsx` | 1565 lines — hard to read, maintain, or extend |
| Guest page is a placeholder | `RSVPPublicPage.tsx` | Hardcoded name/email/status, `alert()` on submit, no API call |
| Share page uses localStorage only | `RsvpSharePreviewPage.tsx` | Snapshot stored in browser only — breaks across devices/browsers |
| Types duplicated | `RsvpDesignPage.tsx` & `rsvpDesign.ts` | Block types re-declared inside the page file |
| No form submission | `RSVPPublicPage.tsx` | Guests cannot actually submit an RSVP |
| No validation | everywhere | No field-level required/email/type validation |
| No success state | `RSVPPublicPage.tsx` | No confirmation after guest submits |
| Form fields not rendered | public page | Custom questions (from FormFields) never shown to guests |

---

## Goals

1. **Admin** can build a rich, beautiful RSVP invitation page using the block designer
2. **Admin** can add any form fields (custom questions) into the page layout
3. **Guest** opens a share link and sees the designed page — images, text, branding
4. **Guest** fills in the form fields embedded in the design and submits
5. **Guest** sees a clear confirmation/thank-you screen after submitting
6. Designer is split into focused, maintainable components (no file > ~300 lines)

---

## Architecture Overview

### File Structure Changes

```
src/
├── components/
│   ├── pages/
│   │   └── RSVPs/
│   │       ├── RsvpDesignPage.tsx            ← REFACTOR (orchestrator ~150 lines)
│   │       ├── RsvpSharePreviewPage.tsx       ← KEEP (minor update)
│   │       └── designer/                      ← NEW folder
│   │           ├── DesignToolbar.tsx          ← NEW: save/publish/preview controls
│   │           ├── BlockList.tsx              ← EXTRACT from RsvpDesignPage
│   │           ├── BlockEditor.tsx            ← EXTRACT from RsvpDesignPage
│   │           ├── GlobalSettingsPanel.tsx    ← EXTRACT from RsvpDesignPage
│   │           ├── AddBlockMenu.tsx           ← EXTRACT from RsvpDesignPage
│   │           └── BlockPreviewCard.tsx       ← EXTRACT block thumbnail renderer
│   └── pages/
│       └── Public/
│           └── RSVPPublic/
│               ├── RSVPPublicPage.tsx         ← REBUILD (token-based, renders design)
│               ├── RsvpFormRenderer.tsx        ← NEW: renders design + collects answers
│               └── RsvpSuccessScreen.tsx       ← NEW: thank-you confirmation screen
├── api/
│   └── hooks/
│       └── usePublicRsvpApi.ts                ← NEW: guest submission mutation
```

### What We Keep (Unchanged)

- `src/types/rsvpDesign.ts` — all types are correct
- `src/utils/rsvpDesignMapper.ts` — transformation logic is correct
- `src/api/hooks/useRsvpDesignApi.ts` — admin hooks are correct
- `src/api/hooks/useFormFieldsApi.ts` — form fields hooks are correct
- `src/components/molecules/FormField.tsx` — field renderer is correct
- `src/api/endpoints.ts` — will only ADD new endpoint
- `src/api/client.ts` — unchanged

---

## Detailed Implementation Steps

### Step 1 — Add public submission endpoint

**File:** `src/api/endpoints.ts`

Add to `PublicRsvpEndpoints`:
```typescript
PublicRsvpEndpoints = {
  submit: (eventId: string) => `/events/${eventId}/rsvps/public`,
  designByToken: (token: string) => `/RsvpDesign/public/${token}`,   // ← ADD
}
```

---

### Step 2 — Create `usePublicRsvpApi.ts`

**File:** `src/api/hooks/usePublicRsvpApi.ts`

Two hooks:

```typescript
// 1. Fetch design by share token (no auth required)
export function usePublicRsvpDesign(token: string) {
  return useQuery({
    queryKey: ["rsvpDesign", "public", token],
    queryFn: async () => {
      // Try API first; fallback to localStorage snapshot for dev
      try {
        const res = await client.get(PublicRsvpEndpoints.designByToken(token));
        return mapToFrontendDesign(res.data.data);
      } catch {
        // Dev fallback: localStorage snapshot
        const snapshot = localStorage.getItem(`rsvp-share-${token}`);
        if (snapshot) return JSON.parse(snapshot) as RsvpDesign;
        return null;
      }
    },
    enabled: !!token,
  });
}

// 2. Submit guest RSVP answers
export function useSubmitPublicRsvp() {
  return useMutation({
    mutationFn: async (payload: {
      eventId: string;
      guestName: string;
      guestEmail: string;
      attending: boolean;
      answers: Record<string, string | string[]>;
    }) => {
      return client.post(PublicRsvpEndpoints.submit(payload.eventId), payload);
    },
  });
}
```

---

### Step 3 — Extract designer sub-components

Break `RsvpDesignPage.tsx` (1565 lines) into:

#### 3a. `designer/BlockList.tsx`
- Renders the left panel: ordered list of blocks
- Each block shows type badge + thumbnail preview
- Drag handle for reordering
- Delete button per block
- "Add block" button at bottom (opens `AddBlockMenu`)
- Props: `blocks`, `selectedId`, `onSelect`, `onReorder`, `onDelete`, `onAdd`

#### 3b. `designer/BlockEditor.tsx`
- Renders the right panel: settings for the selected block
- Uses discriminated union switch on `block.type`
- Sub-sections: Content, Background, Section Image, Overlay
- For `formField` type: dropdown to pick from available form questions
- Props: `block`, `formFields`, `accentColor`, `onChange`

#### 3c. `designer/GlobalSettingsPanel.tsx`
- Center/floating panel for global theme settings
- Background type selector (Color / Image / Video)
- Color picker or file upload based on type
- Global overlay slider (0–0.8)
- Accent color picker
- Flow preset picker (Serene / Parallax / Stacked)
- Props: `design`, `onChange`

#### 3d. `designer/DesignToolbar.tsx`
- Top bar with: event name, Save button, Publish button, Preview button, Share link copy
- Shows last-saved time
- Disabled states while mutations are loading
- Props: `design`, `eventName`, `onSave`, `onPublish`, `onPreview`, `isSaving`, `isPublishing`

#### 3e. `designer/AddBlockMenu.tsx`
- Dropdown/popover with 6 block type options
- Each option has an icon and short description
- Inserts a default block of the chosen type
- Props: `onAdd(type)`

#### 3f. `designer/BlockPreviewCard.tsx`
- Compact card for the block list showing block type + content preview
- E.g., headline shows title truncated; formField shows question label
- Props: `block`, `isSelected`, `accentColor`

#### 3g. `RsvpDesignPage.tsx` (refactored orchestrator)
- ~150 lines
- Manages top-level state: `design`, `selectedBlockId`, `previewMode`
- Calls `useRsvpDesign`, `useSaveRsvpDesign`, `useFormFields`
- Wires toolbar, block list, block editor, global settings together
- Handles save / publish logic
- Preview modal stays here (or moves to `DesignToolbar`)

---

### Step 4 — Rebuild `RSVPPublicPage.tsx`

**Goal:** Token-based guest RSVP page that renders the admin's design and collects answers using the event's Custom RSVP Fields.

#### Route
Current: `/rsvp` (generic)
Add: `/rsvp/submit/:token` ← **new dedicated submission route**

*(Keep the existing `/rsvp` for backwards compat — it can redirect or show a fallback)*

---

#### How Form Questions Reach Guests — Data Flow

```
Admin: Form Fields page (/app/events/:id/form-fields)
  └── Creates FormFieldConfig records
      { questionId, typeKey, label/text, options, isRequired }
          ↓
Admin: RSVP Designer
  └── Adds "formField" block → selects question from dropdown
      { type: "formField", questionId: "abc-123", label?, placeholder?, required?, hint? }
          ↓
Backend: stores design JSON (block.questionId references the form field)
          ↓
Guest: /rsvp/submit/:token
  ├── Fetch RSVP design by token → get blocks (including formField blocks with questionId)
  ├── Extract eventGuid from design response
  ├── Fetch form fields by eventGuid → get FormFieldConfig[] (the actual question definitions)
  └── For each formField block:
        look up FormFieldConfig by block.questionId
        render <FormField> using:
          - type     ← FormFieldConfig.typeKey  (text/textarea/select/radio/checkbox/email/number/date)
          - options  ← FormFieldConfig.options   (for select/radio/checkbox groups)
          - label    ← block.label ?? FormFieldConfig.label ?? FormFieldConfig.text
          - required ← block.required ?? FormFieldConfig.isRequired
          - placeholder ← block.placeholder
          - hint     ← block.hint
```

**Key rule:** The *input type* and *options list* always come from `FormFieldConfig` (the admin's Form Fields setup). The block only controls layout (width, position) and can optionally override label/placeholder/hint/required.

---

#### `usePublicRsvpApi.ts` — add form fields fetch

```typescript
// 3. Fetch form fields for event (no auth, public endpoint or via design response)
export function usePublicFormFields(eventGuid: string | undefined) {
  return useFormFields(eventGuid, { enabled: !!eventGuid });
  // useFormFields already exists in useFormFieldsApi — reuse it
}
```

The `eventGuid` comes from the design response (`ApiRsvpDesign.eventGuid`), so:
1. First query: fetch design by token → get `eventGuid`
2. Second query (enabled when eventGuid is ready): fetch form fields by `eventGuid`

---

#### `RsvpFormRenderer.tsx`

```typescript
interface Props {
  design: RsvpDesign;
  formFields: FormFieldConfig[];   // ← from useFormFields(eventGuid)
  onSubmit: (payload: RsvpSubmitPayload) => Promise<void>;
  isSubmitting: boolean;
}
```

Rendering logic for a `formField` block:
```typescript
case "formField": {
  // 1. Find the actual question definition
  const config = formFields.find(f => f.questionId === block.questionId);
  if (!config) return null; // question was deleted or not found

  // 2. Render using FormField molecule
  return (
    <FormField
      label={block.label || config.label || config.text || ""}
      type={config.typeKey ?? "text"}
      options={Array.isArray(config.options) ? config.options : undefined}
      required={block.required ?? config.isRequired}
      placeholder={block.placeholder}
      hint={block.hint}
      value={answers[block.questionId!] as string ?? ""}
      onChange={e => setAnswer(block.questionId!, e.target.value)}
      error={errors[block.questionId!]}
    />
  );
}
```

**Always-present core fields (above the blocks, or as first section):**
- Guest name (text, required)
- Guest email (email, required)
- Attending? (Yes / No — two large prominent buttons, not a dropdown)

**Answers state:**
```typescript
// Key = questionId (string GUID)
const [answers, setAnswers] = useState<Record<string, string>>({});
const [attending, setAttending] = useState<boolean | null>(null);
const [guestName, setGuestName] = useState("");
const [guestEmail, setGuestEmail] = useState("");
```

**Validation rules (run on submit):**
- `guestName` required
- `guestEmail` required + email pattern
- `attending` must be selected (not null)
- Each `formField` block where `required` is true must have a non-empty answer
- Shows inline `error` prop on the `<FormField>` component

#### `RsvpSuccessScreen.tsx`

Shown after successful submission:
- Large checkmark / celebration icon
- "Thank you, [Name]!" heading
- Confirmation message: "We've received your RSVP. See you at the event!"
- Event details from design (date, location from info blocks)
- Option to "Add to Calendar" (future / out of scope for now)

#### Updated `RSVPPublicPage.tsx`

```typescript
export default function RSVPPublicPage() {
  const { token } = useParams<{ token: string }>();
  const { data: design, isLoading: loadingDesign } = usePublicRsvpDesign(token!);
  // eventGuid is available once design loads
  const { data: formFields = [], isLoading: loadingFields } = useFormFields(
    design?.eventGuid,
    { enabled: !!design?.eventGuid }
  );
  const submitMutation = useSubmitPublicRsvp();
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  if (loadingDesign || loadingFields) return <FullPageSpinner />;
  if (!design) return <NotFoundState />;
  if (submitted) return <RsvpSuccessScreen guestName={submittedName} design={design} />;

  return (
    <RsvpFormRenderer
      design={design}
      formFields={formFields}          // ← Custom RSVP Fields from form fields API
      onSubmit={async (payload) => {
        await submitMutation.mutateAsync(payload);
        setSubmittedName(payload.guestName);
        setSubmitted(true);
      }}
      isSubmitting={submitMutation.isPending}
    />
  );
}
```

**Note:** `RsvpDesign` needs `eventGuid` added to the frontend type so it's available after `mapToFrontendDesign()`. Currently `ApiRsvpDesign.eventGuid` is mapped — verify that `mapToFrontendDesign` preserves it, and add to `RsvpDesign` interface if not present.

---

### Step 5 — Update routing

**File:** `src/routers/routes.tsx`

Add the new public submission route:
```typescript
// Public routes
<Route path="/rsvp/submit/:token" element={<RSVPPublicPage />} />
// Keep existing:
<Route path="/rsvp/share/:token" element={<RsvpSharePreviewPage />} />
```

Update `DesignToolbar` share link to use `/rsvp/submit/:token` for the submission link and keep `/rsvp/share/:token` as a read-only preview.

---

### Step 6 — Update `RsvpSharePreviewPage.tsx`

Minor update: add a "RSVP Now" button linking to `/rsvp/submit/:token` so guests can go from preview to the live form.

---

## UX Design Decisions

### Admin Designer UX

| Panel | Location | Contents |
|-------|----------|----------|
| Left sidebar (280px) | Fixed | Block tree + Add Block button |
| Right panel (320px) | Fixed | Selected block editor |
| Center | Scrollable | Live preview at 375px (mobile) or 768px+ |
| Top toolbar | Fixed | Save, Publish, Preview mode toggle, Share link |

**Block add flow:**
1. Click "Add Block +" at bottom of left sidebar
2. A menu pops up with 6 block type cards (icon + name + 1-line description)
3. Click type → block appended at bottom, auto-selected for editing

**Form question flow:**
1. Add a "Form Field" block
2. In the right panel: dropdown shows all configured questions for this event
3. If no questions exist: inline "Create question" shortcut opens FormFields page
4. Required / Label / Placeholder / Hint all editable per block

**Save / Publish flow:**
- Auto-save on block change (debounced 2s) — status shown in toolbar
- Manual "Save Draft" button always available
- "Publish" button sends design live; disables if no changes since last publish
- Share link copy shows submission URL (for guests) vs preview URL (for admins)

### Guest Public Page UX

**Layout:** Single scrollable page matching the designed blocks exactly

**Attending toggle:** Displayed prominently as two large buttons:
```
[ ✓ Yes, I'll be there ]  [ ✗ Sorry, can't make it ]
```

**Form fields:** Rendered inline within the flow, styled to match the design's accent color and background

**Validation feedback:** Inline error messages under each field, red border highlight

**Submit button:** Full-width, uses the design's accent color, shows spinner while submitting

**Mobile:** Fully responsive — blocks stack naturally, touch-friendly inputs

---

## What We Are NOT Changing

- `src/types/rsvpDesign.ts` — no changes to types
- `src/utils/rsvpDesignMapper.ts` — no changes to mapper
- `src/api/hooks/useRsvpDesignApi.ts` — no changes to admin hooks
- `src/api/hooks/useFormFieldsApi.ts` — no changes
- `src/components/molecules/FormField.tsx` — no changes
- Any existing API endpoints (only ADD new ones)
- The existing block data model and backend format

---

## Implementation Order

```
1. usePublicRsvpApi.ts                  ← foundation (new hook)
2. endpoints.ts                         ← add designByToken endpoint
3. designer/AddBlockMenu.tsx            ← smallest, no deps
4. designer/BlockPreviewCard.tsx        ← small, no deps
5. designer/GlobalSettingsPanel.tsx     ← extract from page
6. designer/BlockEditor.tsx             ← extract from page
7. designer/BlockList.tsx               ← uses BlockPreviewCard + BlockEditor
8. designer/DesignToolbar.tsx           ← uses mutation hooks
9. RsvpDesignPage.tsx                   ← refactor to use all above
10. RsvpSuccessScreen.tsx               ← simple display component
11. RsvpFormRenderer.tsx                ← renders design + collects form data
12. RSVPPublicPage.tsx                  ← rebuilt orchestrator
13. routes.tsx                          ← add new route
14. RsvpSharePreviewPage.tsx            ← minor update (add RSVP Now button)
```

---

## Out of Scope (Future)

- Undo / redo in designer
- Quick-start templates
- Add-to-calendar on success screen
- Analytics (how many views, how many submissions)
- Edit RSVP after submission

---

## Files to Create (New)

1. `src/api/hooks/usePublicRsvpApi.ts`
2. `src/components/pages/RSVPs/designer/DesignToolbar.tsx`
3. `src/components/pages/RSVPs/designer/BlockList.tsx`
4. `src/components/pages/RSVPs/designer/BlockEditor.tsx`
5. `src/components/pages/RSVPs/designer/GlobalSettingsPanel.tsx`
6. `src/components/pages/RSVPs/designer/AddBlockMenu.tsx`
7. `src/components/pages/RSVPs/designer/BlockPreviewCard.tsx`
8. `src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx`
9. `src/components/pages/Public/RSVPPublic/RsvpSuccessScreen.tsx`

## Files to Modify (Existing)

1. `src/api/endpoints.ts` — add `designByToken` to `PublicRsvpEndpoints`
2. `src/components/pages/RSVPs/RsvpDesignPage.tsx` — refactor to orchestrator
3. `src/components/pages/Public/RSVPPublic/RSVPPublicPage.tsx` — full rebuild
4. `src/components/pages/RSVPs/RsvpSharePreviewPage.tsx` — add "RSVP Now" button
5. `src/routers/routes.tsx` — add `/rsvp/submit/:token` route
