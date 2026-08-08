# Question ↔ RSVP Design ↔ RSVP Submit — E2E test flow

Run against the **real local stack** (Caddy `mbd.localhost:8080` → FE + BE `:7000` → real MySQL).
Nothing is mocked. Account `jc@test.com`. Turnstile is disabled locally, so submits are unguarded.

Findings: [FINDINGS.md](./FINDINGS.md).

## The thing under test

Three consumers read the same questions, and they do **not** filter alike:

| Consumer | Endpoint | Filters hidden (`IsActive=false`)? |
| --- | --- | --- |
| Questions page + RSVP designer | `GET /question/GetQuestions/{eventGuid}` | ❌ no |
| Guest invite page | `GET /event/eventRsvp/slug/{slug}` | ✅ yes |
| Answer write | `POST /rsvp/Create` | ❌ no validation at all |

A design's `formField` block stores its **own** copy of `questionId` + `label` + `required`.
Nothing on either side ever reconciles blocks against live question state. That gap is the test target.

## How to run

Credentials are read from the environment — none are committed.

```bash
export QA_EMAIL='you@example.com'
export QA_PASSWORD='...'          # the account's real password
# export QA_API_KEY='a'           # optional, defaults to the local dev key

node docs/qa/run-api-matrix.mjs                          # 14 API scenarios
npx playwright test -c docs/qa/playwright.qa.config.ts    # 11 browser scenarios
```

Each run creates its own throwaway event, so runs never collide and existing data is untouched.
Evidence lands in `docs/qa/evidence/` (JSON per scenario + screenshots).

> Node's `getaddrinfo` won't resolve `*.localhost`; both harnesses patch `dns.lookup` to loopback.
> Chromium resolves it natively, so the browser under test is unaffected.

## Files

| File | Purpose |
| --- | --- |
| [run-api-matrix.mjs](./run-api-matrix.mjs) | API-layer matrix, both consumers read side by side |
| [guest-page.spec.ts](./guest-page.spec.ts) | What the **guest** sees after the couple edits a question |
| [admin-side.spec.ts](./admin-side.spec.ts) | What the **couple** sees on the Questions page + designer |
| [qa-api.ts](./qa-api.ts) | Shared fixture builder (event + 3 questions + published design) |
| [playwright.qa.config.ts](./playwright.qa.config.ts) | Real-stack config — separate from the repo's mocked one |

## Fixture

Every scenario starts from: 1 event, 3 questions, 1 **published** design linking all three.

| Key | Question | Type | Why |
| --- | --- | --- | --- |
| `qSelect` | "Meal choice" | select (`Chicken,Fish,Vegetarian`) | proves type degradation when the config is lost |
| `qText` | "Song request" | short text | rename-with-answers target |
| `qRename` | "Need a room" | short text | rename-without-answers target |

The fixture mirrors `mapToBackendPayload` byte-for-byte, **including two int-id workarounds** the
FE performs because the backend types these fields as `Guid?` (see finding 6):
blocks carry `formFieldId: <int>` and no `questionId`; `formFieldConfigs` carry no id at all.
Send an int in either `questionId` field and the design save 400s.

## Scenarios

### API — [run-api-matrix.mjs](./run-api-matrix.mjs)

| # | Scenario | Asserts | Evidence |
| --- | --- | --- | --- |
| 02 | save + publish a design carrying `formFieldConfigs` | does the snapshot survive the round trip? | `02-design-published.json` |
| 02b | "Add RSVP form" preset (`customQuestions`) | does the preset shape save? | `02b-preset-customquestions.json` |
| 03 | baseline | both consumers agree | `03-baseline.json` |
| A | hide the select question | guest payload vs. design block | `04-A-hide-select.json` |
| B | submit an answer to the **hidden** question | is it rejected? | `05-B-submit-answer-to-hidden.json` |
| C | submit `questionId: 999999` | is an unknown id rejected? | `06-C-submit-unknown-questionid.json` |
| — | read RSVPs back | can an answer be attributed? | `07-rsvp-list-with-answers.json` |
| D | rename a question with **no** answers | does the block label follow? | `08-D-rename-no-answers.json` |
| E | rename a question **with** answers | the documented 422 refusal | `09-E-rename-with-answers.json` |
| F | delete a question **with** answers | is it blocked like rename? | `10-F-delete-with-answers.json` |
| G | re-activate | does it return to the invite? | `11-G-activate-idempotent.json` |
| H | design after question churn | is it ever reconciled? | `12-H-design-after-question-churn.json` |

### Browser — [guest-page.spec.ts](./guest-page.spec.ts) (mobile 393px)

| # | Scenario | Asserts | Evidence |
| --- | --- | --- | --- |
| BASELINE | clean invite | select renders as `<select>` with its 3 options | `browser-01-baseline.json`, `shot-01` |
| A | hide, then load the invite | still rendered? as what? | `browser-02-after-hide.json`, `shot-02` |
| B | fill + submit as a real guest | is the hidden answer persisted? | `browser-03-submit-hidden-answer.json`, `shot-03` |
| C | rename, then load the invite | which label does the guest see? | `browser-04-after-rename.json`, `shot-04` |
| D | delete an answered question | block survives? answers survive? | `browser-05-after-delete.json`, `shot-05` |

### Browser — [admin-side.spec.ts](./admin-side.spec.ts) (desktop 1440px, real UI login)

| # | Scenario | Asserts | Evidence |
| --- | --- | --- | --- |
| E1 | Questions page after hiding (couple mode) | is the couple told? | `admin-06-...json`, `shot-06/07` |
| E2 | designer question picker (planner mode) | is a hidden question still offered? | `admin-07-...json`, `shot-08` |
| F | edit an answered question through the UI | what is the couple actually told? | `admin-08-...json`, `shot-09` |

Two environment quirks the admin spec pins via `addInitScript`, both of which otherwise break runs:
the **What's New** modal re-arms on every navigation and blocks clicks, and **`uiMode`** persists in
localStorage, so a test that switches view leaks that mode into the next one.
