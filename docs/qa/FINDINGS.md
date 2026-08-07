# Findings — Question ↔ RSVP Design ↔ RSVP Submit

All reproduced against the **real** local stack on 2026-08-04.
The four frontend findings are now **fixed**; the three backend ones are **open** (KIV).
How they were produced: [TEST_FLOW.md](./TEST_FLOW.md). Raw captures: `evidence/`.

**Root cause for most of this:** a design's `formField` block stores its own `questionId` + `label` +
`required`, and **nothing reconciles blocks against live question state** — not the backend when it
serves the invite, not the frontend when it renders it. So the block outlives the question.

| # | Finding | Severity | Side | Status |
| --- | --- | --- | --- | --- |
| 1 | Hiding a question does not remove it from the live invite | **P1** | FE | ✅ fixed |
| 2 | A hidden/deleted question silently degrades to a free-text box | **P1** | FE | ✅ fixed |
| 3 | `POST /rsvp/Create` accepts answers to hidden, deleted and non-existent questions | **P1** | BE | open |
| 4 | The "can't edit an answered question" refusal is dead code — it 500s instead | **P1** | BE | open |
| 5 | Deleting an answered question is allowed, and orphans the answers unreadably | **P1** | BE | open |
| 6 | `formFieldConfigs` is dropped by the backend and stripped of ids by the frontend | **P3** | both | open — dead paths only, see below |
| 7 | The designer offers hidden questions with no indication they're hidden | **P2** | FE | ✅ fixed |
| 8 | Renaming a question does not change its label on the invite | **P2** | FE | ✅ fixed |

The frontend fixes are covered by regression tests in [guest-page.spec.ts](./guest-page.spec.ts) and
[admin-side.spec.ts](./admin-side.spec.ts), which now assert the corrected behaviour (9/9 passing).
The remaining three are backend-only and untouched.

### Correction to an earlier draft of this document

An earlier version claimed *"the Guest Link the couple shares is broken for every real guest."*
**That was wrong, and it overstated the blast radius.** Checking each surface separately:

| Surface | Link it produces | Verdict |
| --- | --- | --- |
| V3 designer → "Guest Link" | `/rsvp/{slug}` | ✅ correct — public, works anonymously |
| V3 designer → "Preview" | in-app modal, no network | ✅ preview only |
| `RsvpSharePreviewPage` (`/rsvp/share/:token`) | — | routed, but **nothing links to it** |
| `ShareWithGuestsCard` | `/rsvp/submit/{Math.random()}` | 🔴 broken — but **dead code** |

`ShareWithGuestsCard` fabricates a token client-side ([lines 28-32](../../src/components/molecules/ShareWithGuestsCard.tsx#L28-L32))
and never calls the backend, so the link resolves to nothing. Its only importer is `EventDetail`,
which **has no importers at all** — both are dead, like the retired V1/V2 designers.

The token endpoints really are broken (`share-token` returns `null`; `/RsvpDesign/share/{token}`
404s; the fallback 401s for anonymous users), and the V3 designer's own comments already say so.
But the live guest path is the slug, and it works. That is why finding 6 is P3, not P1 — and why
the fix for findings 1–2 could land without repairing the token path first.

**Still worth deciding:** delete `ShareWithGuestsCard` + `EventDetail`, or fix the card to use the
slug. Left alone for now — it is a landmine only if `EventDetail` is ever revived.

---

## 1 · Hiding a question does not remove it from the live invite — **P1** · ✅ fixed

The backend does its job: the hidden question is gone from the guest payload. The frontend renders
the block anyway, because it never checks that the config lookup succeeded.

[RsvpFormRenderer.tsx:570-582](../../src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx#L570-L582) —
`cfg` may be `undefined`, and nothing bails:

```ts
if (!block.questionId) return null;
const cfg = formFields.find((f) => (f.questionId ?? f.id) === block.questionId);
const fieldLabel = block.label || cfg?.label || cfg?.text || "Custom field";
```

Evidence — `browser-02-after-hide.json`: backend served `[155,156]`, hidden id `154`,
`stillRenderedToGuest: true`. Screenshot `shot-02-after-hide.png` shows **MEAL CHOICE** on a live
invite. Same for `guestDetails.customQuestions` ([lines 480-565](../../src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx#L480-L565)).

> The couple hides a question, sees it marked "Hidden from invite", and guests keep answering it.

**Fixed** — `RsvpFormRenderer` now treats a missing config as the signal to drop the field, for both
`formField` blocks and `guestDetails.customQuestions`. The same guard was added to `validate()`: an
older block carrying `required: true` would otherwise demand an answer to a field that is no longer
rendered, wedging the form shut.

The block is deliberately **left in the design**, so unhiding restores the field with no re-editing
(regression test `A2`).

## 2 · Hidden/deleted questions degrade to a free-text box — **P1** · ✅ fixed

With no `cfg`, `fieldType` falls back to `"text"` and the options vanish. A 3-option dropdown becomes
a free-text input — so the answers stop being comparable even where the field is intentionally live.

Evidence — baseline `{"tag":"select","options":["Select...","Chicken","Fish","Vegetarian"]}` →
after hiding `{"tag":"input","type":"text"}`.

**Fixed** by the same guard as finding 1: the degraded branch is only reachable when `cfg` is
missing, and that case now returns early. On unhide the field returns as a real `<select>` with its
options intact (`browser-02b-after-unhide.json`).

## 3 · `POST /rsvp/Create` validates nothing about the question — **P1**

No `IsActive` check, no `IsDeleted` check, no existence check. **There are no foreign keys anywhere
in the schema**, so `Answer.QuestionId` is a bare int.

| Submitted | Result |
| --- | --- |
| answer to a **hidden** question | `200 isSuccess:true` — stored (`05-B`) |
| answer to `questionId: 999999` | `200 isSuccess:true` — stored (`06-C`) |
| answer to a **deleted** question | stored, survives the delete (`browser-05`) |

`GET /rsvp/GetRsvp/List/{eventGuid}` then returns `{"questionId":999999,"text":"..."}` with no label
and no question to join to (`07-rsvp-list-with-answers.json`).

Non-numeric ids are worse: they throw in AutoMapper and **500 the entire RSVP**, losing the whole
submission rather than one answer. (The FluentValidation validators in `Application/Validators` are
never registered in DI — they never run.)

## 4 · The "answered question can't be edited" refusal is dead code — **P1**

`QuestionService.UpdateQuestion` is *supposed* to return HTTP 200 with `statusCode: 422` when answers
exist. It never gets there. It calls `LockQuestion` first, which attaches a second `QuestionModel`
with the same PK into the same scoped `DbContext` — an EF identity-map conflict. Unmapped exception →
`500 {"message":"An unexpected error occurred."}`.

Stack trace recovered from `MyBigDays_Mono/logs/local-log-20260803.txt`:

```
System.InvalidOperationException: The instance of entity type 'QuestionModel' cannot be tracked
because another instance with the same key value for {'QuestionId'} is already being tracked.
  BaseRepository.AttachAsync      BaseRepository.cs:25
  QuestionRepository.LockQuestion QuestionRepository.cs:169
  QuestionService.LockQuestion    QuestionService.cs:267
  QuestionService.UpdateQuestion  QuestionService.cs:167
```

Contributing: the read at `QuestionService.cs:150` uses the **tracked** overload while a
`GetQuestionByQuestionIDAsNoTracking` exists for exactly this reason. And `LockQuestion` can no
longer lock anything — the `IsAllowToEdit` column it targeted was dropped in migration
`20260322133611`. The unit test passes only because it mocks the repo, so no change tracker is involved.

**What the couple sees** (`admin-08`, `shot-09`): *"We couldn't save that question. Please try
again."* — retry advice for a permanent refusal, with no mention of answers. The FE's careful
422-envelope handling (`envelopeError`) is unreachable.

## 5 · Deleting an answered question is allowed, and orphans the answers — **P1**

The guard is asymmetric: rename is refused (via the 500 above), delete is not.

Evidence (`browser-05-after-delete.json`): rename `500`, delete `200 isSuccess:true`,
answers `1 → 1`, and the block **still renders on the invite**.

The answers become permanently unreadable: no FK, `GetAnswersByRsvp` does not join to Question, and
the `AnsweredQuestionText/Options/Type` snapshot columns added by migration `20260322133611` exist in
the DB but are **not mapped in `AnswerModel`** — never written, never read.

Knock-on: [rsvpExport.ts:49](../../src/utils/rsvpExport.ts#L49) iterates *live* form fields, so a
deleted question's **column and every answer to it silently vanish from the export**.

The couple-mode delete dialog says "This cannot be undone" but never warns that existing answers
become unattributable.

## 6 · `formFieldConfigs` is dropped by the backend and de-identified by the frontend — **P3**

Both ends independently break the same field, which is why the share-token preview path has no
question configs at all.

- **Backend:** `RsvpDesignService` hand-builds the payload it serialises and simply omits
  `FormFieldConfigs` on both create and update. Sent `1`, returned `null` (`02-design-published.json`).
- **Frontend:** [rsvpDesignMapper.ts:386-390](../../src/utils/rsvpDesignMapper.ts#L386-L390) runs a
  **GUID regex** over the question id. Question ids are ints, so every config goes out with
  `id: undefined, questionId: undefined`.

Consequence: [RSVPPublicPage.tsx:90](../../src/components/pages/Public/RSVPPublic/RSVPPublicPage.tsx#L90)
passes `design.formFieldConfigs ?? []` — always empty — so on the `/rsvp/submit/:token` route
**every** linked question degrades per finding 2, not just hidden ones. The slug route escapes this
only because it gets `questions` from a separate field.

Context (not filed as a bug per your note on ids): the backend types
`RsvpBlockDto.QuestionId` and `RsvpFormFieldConfigDto.Id` as `Guid?`, so an int id 400s the whole
design save. The FE's GUID regex and its `formFieldId` fallback are workarounds for that.
`customQuestions[].questionId` has **no** such workaround — it is spread verbatim
([mapper line 285](../../src/utils/rsvpDesignMapper.ts#L285)) — so it survives today only because it
lands in an untyped JSON bag.

## 7 · The designer offers hidden questions, unmarked — **P2** · ✅ fixed

`GET /question/GetQuestions` returns inactive questions by design (the Questions page needs them to
offer "unhide"). But [RsvpDesignV3Page.tsx:727-730](../../src/components/pages/RSVPs/RsvpDesignV3Page.tsx#L727-L730)
passes the list straight through with no `isActive` filter and no badge.

Evidence (`admin-07`): fetched `{"questionId":118,"text":"Meal choice","isActive":false}`;
picker offered `["— Choose a question —","Meal choice (select)", ...]` — nothing marks it hidden
(`shot-08`). `addRsvpFormPreset` ([line 892](../../src/components/pages/RSVPs/RsvpDesignV3Page.tsx#L892))
has the same problem: it maps **all** questions, hidden included.

The Questions page itself is correct — couple mode does show "· Hidden from invite" (`shot-07`).

**Fixed** — `availableQuestions` now filters `isActive !== false`, which covers both the picker and
`addRsvpFormPreset`. A separate unfiltered `allQuestions` is passed to `BlockEditor` purely to
*explain* an existing link: a hidden question appears as a disabled `"… (hidden)"` option with a
note that guests won't see the field, and a deleted one as `"(deleted question)"`. Without that the
select would fall back to its placeholder and the block would look unlinked.

Evidence (`admin-07`): selectable `["— Choose a question —","Song request (text)","Need a room (text)"]`;
full list still shows `"Meal choice (hidden)"`; warning rendered.

## 8 · Renaming a question does not change its label on the invite — **P2** · ✅ fixed

`fieldLabel = block.label || cfg?.label` — the block's snapshot wins, so the guest keeps seeing the
old wording indefinitely.

Evidence (`browser-04-after-rename.json`): backend text `"Do you need accommodation?"`,
labels shown to the guest `["Meal choice","Song request","Need a room"]`.

Note this is only reachable for questions with **no** answers — with answers, finding 4 blocks the
rename entirely.

**Fixed** — `applyQuestionToBlock` no longer copies `label`/`isRequired` onto the block, so the live
question supplies both. A label the couple deliberately types in "Label override" is still stored and
still wins (proven by the `b-txt` block in the fixture, which keeps `"Your favourite song"` through a
rename of its question).

`required` had to become `undefined` rather than `false`: the renderer reads
`block.required ?? cfg.isRequired`, and `false` is not nullish, so a copied `false` permanently
pinned the field optional. BlockEditor's Required dropdown gained a third
*"Use the question's setting"* option, since otherwise it would display "Optional" for a question
that is in fact required.

---

## Not bugs (checked and cleared)

- `GET /rsvp/GetRsvp/List` returns `name`, not `guestName` — `useRsvpsApi` maps
  `r.guestName ?? r.name`. Fine; my first test asserted the wrong field.
- `formField` isn't in the V3 designer's add-block menu, so those blocks come only from older designs
  or the RSVP-form preset. Intentional as far as I can tell — flagging in case it isn't.
- Re-activating a hidden question restores it to the invite correctly (`11-G`).
- The backend correctly filters both hidden and deleted questions out of the guest payload
  (`EventRsvpHandler.cs:120`). Every guest-side leak above is the frontend rendering past it.
