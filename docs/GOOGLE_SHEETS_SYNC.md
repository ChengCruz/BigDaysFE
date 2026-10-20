# Google Drive / Sheets sync

Status: **design agreed, not started.** First discussed 22 Sep 2026, simplified 14 Oct 2026.

## Decision

**One-way push from My Big Days into the couple's own Google Drive, on demand.**
The MBD platform is the single source of truth. The Sheet is a copy we hand over.
What the couple or their PIC edits in Drive afterwards is not our business: we never
read it back.

- Every push overwrites the mirrored tabs in place. Edits made in those tabs are lost
  on the next push, and the sheet and the connect flow both say so.
- The couple picks which sections are pushed, per event, with checkboxes.
- No Inbox tab, no two-way sync, no import from the Sheet.

### Why one-way

A shared editable spreadsheet guarantees conflicts, and `Guest.Pax` is exactly the
kind of field where a mistyped cell silently corrupts the seating maths (see
[CLAUDE.md](../CLAUDE.md)). Reading nothing back removes validation, row identity,
conflict policy and the closed-RSVP question in one go.

### Why checkboxes, not hidden tabs

Hiding a tab is obscurity, not a boundary: an editor unhides it in one click and an
`.xlsx` download carries it along. Data we never pushed cannot leak, so the couple
decides at push time what leaves the app.

## What syncs

One spreadsheet per event, in a per-event folder the app creates. One tab per section,
each opt-in.

| Tab | Source | Notes |
| --- | --- | --- |
| `Guests` | `GET /Guest/ByEvent/{eventGuid}` | One row per party. See the pax rule below. |
| `RSVPs` | `GET /Rsvp/GetRsvp/List/{eventGuid}` | `RsvpDetailDto` already joins guest + answers. Question columns from `GET /Question/GetQuestions/{eventGuid}`. |
| `Tables` | `GET /TableArrangement/Summary/{eventGuid}` | `MaxSeats`, `AssignedCount`, `Guests`. |
| `Itinerary` | `GET /Itinerary/{eventGuid}` | |
| `Crew` | `GET /Crew/ByEvent/{eventGuid}` | |
| `Budget` | `GET /Wallet/GetWalletByEvent` + `/Transaction/{walletGuid}/transactions` | Off by default. |
| `Notes` | none | Created once, never written again. Free space for the couple and the PIC. |

Media is not syncable: there is no public per-event media list endpoint.

### Pax vs guests in the sheet

The sheet gets handed to caterers, so this must be right. Per [CLAUDE.md](../CLAUDE.md):

- `Guests` is **one row per party**, with a `Pax` column that includes the person who replied.
- Totals state both numbers, labelled: `Parties: 42` and `Total pax: 118`. Never a bare "Total".
- Anything about seating or capacity is a pax sum, never a row count.

### Sheet conventions

- Column A of every mirrored tab is the row's Guid (`RsvpGuid`, `GuestId`, `TableId`),
  never the int `RsvpId`.
- Cell A1 holds the last-sync time and a warning: "Copy from My Big Days. Edit in the
  app, edits here are overwritten on the next sync."
- Never delete and recreate the file. Overwrite values in place, otherwise the file id
  changes and every share link dies.

## Retention: no sync after 90 days

The Sheet in the couple's Drive is the couple's own copy. We never touch it after the
push and it is outside our guest-data purge, which anonymises guest data in our DB 90
days after the event (`GuestDataPurgedAt`).

- The push endpoint refuses events more than 90 days past, or with `GuestDataPurgedAt`
  set (same rule as `RsvpWindowHelper` and the purge job). The last sync is therefore
  always before the purge. A scheduled refresh, if ever built, skips them too.
- The FE disables the push button for those events and says why.
- The privacy notice says a sheet pushed to the couple's own Drive is theirs to keep or
  delete and is not removed by our purge.

## Auth and token safety

Server-held OAuth. Browser-only (PKCE) tokens were rejected: they live about an hour
and only while the couple is in the app.

- **Scope: `drive.file` only.** Per-file access to files our app created. Re-confirm its
  current classification with Google before committing.
- **Refresh token encrypted at rest** (AES-GCM) in the DB. The key comes from the VPS
  `.env` (`Google__TokenEncryptionKey`), like the other secrets. Not ASP.NET Data
  Protection, which would need a persisted key-ring folder. Losing the key means every
  couple reconnects Google, so the `.env` is backed up like the rest of the secrets.
- **Per user, not per event.** One Google account covers all of a couple's events.
- **Disconnect revokes at Google first**, then deletes our row. Account closure runs the
  same revoke.
- **Logging.** Redact the OAuth callback (`?code=` and `state`) in TraceMiddleware, never
  log Google request or response bodies, and add tests for both, in line with the log
  safety policy.

## BE work

Nothing exists yet: no OAuth flow, third-party token storage, background worker or
`IHttpClientFactory` registration.

1. **Config.** `Google__ClientId`, `Google__ClientSecret`, `Google__TokenEncryptionKey`
   in the double-underscore env pattern (compose, `.env`, GitHub Actions), as for
   `R2__AccessKey`, `Turnstile__SecretKey`.
2. **Entity + migration.** `GoogleIntegration`: user guid (unique), encrypted refresh
   token, granted scopes, connected-at; per event `spreadsheetId`, `folderId`, section
   flags. The purge job ignores it (no guest PII).
3. **OAuth endpoints.** Start (consent URL), callback (code exchange, store token),
   status, disconnect (revoke).
4. **Typed `HttpClient`** for Google via `AddHttpClient`, starting from the commented-out
   lines in `API/DependencyInjection.cs:159-165`. Do not copy the
   `private static readonly HttpClient _http = new()` pattern.
5. **Sync service.** Reads the opted-in sections, ensures folder and spreadsheet exist,
   writes values in place, sets collaborators to viewer, stamps A1.
6. **Push endpoint.** `POST /Integrations/Google/Sync/{eventGuid}` returns rows written
   per tab. Refuses expired or purged events.

Scheduled refresh is later, if someone asks: `InternalController` is already
internal-key protected, so a cron can hit an internal endpoint. No Hangfire or Quartz.

## FE work

1. Connect / disconnect card in event settings, with the connected account.
2. Per-event section checkboxes (`Budget` off by default), persisted server-side.
3. Push button via `useMutation` in `src/api/hooks/useGoogleSyncApi.ts` (shape of
   `useExportRsvps`): last-synced-at, in-flight state, per-tab summary. Disabled for
   expired events.
4. Open the Sheet in a new tab (`target="_blank"`).
5. `trackAction("integrations", "google_synced", ...)` next to the export events.
6. Couple mode keeps "seats", never "pax", in the UI around this. The spreadsheet itself
   uses `Pax`.
7. The connect flow states that the sheet is a copy and that sharing it is the couple's
   call.

## Google verification and the privacy policy

Google must approve the app (consent screen and brand verification) before real couples
can connect. This is the long pole, so **start it first, in parallel with the code**.
Until approved, only test users added by hand can connect, which is enough for stg.

The submission needs a privacy policy on our own domain, linked from the homepage. The
**privacy notice must be updated before submitting and before launch**:

- That the app can connect to the couple's Google Drive when they choose, and what it
  writes there (the sections they ticked, which can include guest names and phones).
- That we only access files the app created (`drive.file`), and store an encrypted token.
- How to disconnect, and that disconnecting does not recall a file already shared.
- That a pushed sheet is the couple's copy and is not removed by our purge.
- Google's Limited Use statement: use of data received from Google APIs follows the
  Google API Services User Data Policy, including the Limited Use requirements.

Add the same to [LEGAL_TODO.md](../LEGAL_TODO.md). Wording needs the owner's legal review.

## Phases

0. Google Cloud project, consent screen and OAuth credentials, privacy text updated, submit.
1. BE foundation: config, entity + migration, token encryption, OAuth endpoints, typed
   client, log redaction.
2. Push: sync service and endpoint, 90-day refusal.
3. FE: connect card, checkboxes, push button.

## Risks

- **Sharing is irreversible from our side.** Once shared, we cannot unshare, and
  deleting the integration does not recall the data. Say so plainly in the connect flow.
- **Verification timeline** is the long pole.
- **Quota.** Sheets write quotas are per project, fine at current scale.
