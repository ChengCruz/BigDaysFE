# Legal pages — open items

Tracking what is still outstanding after adding `/terms` and `/privacy`
(commit `db0b8d9`, branch `feature/TnC_Page`).

Nothing here blocks the pages from being merged. Items marked **must fix before
launch** are ones where a published page currently states something that is not
yet true, or where a required decision has no answer.

Roughly in priority order.

---

## 1. Get consent for dietary / health / accessibility data at the RSVP form

**Highest priority — this matters more than any further edit to the Privacy
Notice.**

Dietary, health and accessibility notes are the most sensitive data on the
platform, and they are collected from guests who never signed up for anything.
The Privacy Notice explains that we process them, but explaining is not the same
as obtaining consent. Consent has to be captured at the point of collection —
that is, in the RSVP form itself, not on a policy page the guest never opens.

Minimum: put a short notice next to those fields.

> Dietary and accessibility information is optional. If you provide it, you
> consent to it being processed by the event organiser and MYBigDay for the
> purpose of managing your attendance and event arrangements.

Strongest option: an explicit tickbox, so consent is a recorded action rather
than an assumption.

> ☐ I consent to the processing of any dietary, health or accessibility
> information I provide for this event.

- [ ] Add the notice text beside the dietary / accessibility fields in the RSVP
      form renderer
- [ ] Decide whether to require the tickbox (recommended) or rely on the notice
- [ ] If using a tickbox, store the answer against the RSVP — a consent record
      you cannot produce later is the same problem as item 2 below
- [ ] Keep the fields genuinely optional: an RSVP must still submit without them

## 2. Marketing consent is collected but discarded — must fix before launch

`src/components/pages/Auth/RegisterPage.tsx`

The signup page shows an opt-in marketing checkbox. It is unchecked by default
and held in local state, but the value is **not sent** and **not stored** —
there is no field on the register payload. Two `TODO(be)` comments mark the
spot: one on the `marketingConsent` state declaration, one at the
`register.mutateAsync` call site.

Why it matters: the notice promises marketing only with consent, and the UI
implies a preference was recorded. Right now neither a yes nor a no can be
produced if anyone asks.

- [ ] Add a boolean field to the register payload and persist it
- [ ] Send `marketingConsent` from the register page
- [ ] Surface it in account settings as an opt-out
- [ ] **Until then: do not send any marketing email from this list**

Owner: BE. Targeted for w/c 8 Sep 2026.

## 3. Offer a cookie preference control in the product

Currently Privacy Notice §10 tells people to manage analytics cookies through
their own browser settings and Google's opt-out add-on. That is not wrong, but
it pushes the work onto the user for something we could simply ask.

Cleaner: ask once on first visit, and let them choose.

> We use essential cookies to operate MYBigDay, and optional analytics cookies
> to help us improve the service.
>
> [ Accept analytics ]  [ Reject analytics ]

Not having this yet does **not** make the Privacy Notice inaccurate — the notice
describes browser-level control, which is real. This is an improvement, not a
correction.

Implementation notes:

- [ ] Small first-visit banner with a genuine reject option (not just "OK")
- [ ] Store the choice locally and respect it on subsequent visits
- [ ] Wire it to GA4 Consent Mode v2: default `analytics_storage: 'denied'`, and
      only grant on accept. `ensureInitialized` in `src/utils/analytics.ts` is
      where gtag is loaded, so the gate belongs there
- [ ] Add a way to change the choice later (footer link or settings)
- [ ] Update Privacy Notice §10 once it exists, so it points at the in-product
      control as well as browser settings

This also covers the EU/UK case if overseas traffic ever appears, where prior
consent is genuinely required rather than optional.

## 4. Data processing agreements are not signed — must fix before launch

Privacy Notice §08 states third parties "act as our data processors under
contract and only on our instructions". §09 is hedged correctly ("may include
contractual data protection commitments"), so the two sections currently
disagree.

Most providers offer a DPA but require you to accept it explicitly in their
console; it is not on by default.

- [ ] Accept the DPA for the hosting provider (Singapore region)
- [ ] Accept the DPA for the transactional email provider
- [ ] Accept the DPA for Cloudflare
- [ ] Confirm the Google Analytics data processing terms are accepted
- [ ] Either sign the above, **or** soften §08 to "who process it on our
      behalf and only on our instructions" (drop "under contract")

## 5. Liability cap has no figure

`src/components/pages/Public/Legal/TermsPage.tsx` — see the code comment above
the "Limitation of liability" section.

The clause currently limits liability "to the maximum extent permitted by law"
with no monetary cap. A fees-paid cap was removed because it resolves to RM0
while the product is free, which is both odd-looking and the kind of term most
likely to be struck down.

- [ ] Decide a cap figure (commercial decision)
- [ ] Have counsel review the clause, including whether the Consumer
      Protection Act 1999 limits what can be excluded on a free service

## 6. Guest deletion requests — process not written down

Privacy Notice §15 directs guests to the couple or planner, with a fallback
that MYBigDay will pass a request on if the organiser cannot be reached.
Guests have no account and cannot self-serve.

- [ ] Write down who handles a forwarded request and how (a paragraph is enough)
- [ ] Decide whether an admin tool is needed, or manual is fine at current volume

## 7. Breach response procedure

Privacy Notice §13 states a breach response procedure exists covering
detection, containment, assessment and notification, and that notifiable
breaches go to the Commissioner within 72 hours.

- [ ] Write the runbook (one page: who is called, who assesses notifiability,
      who notifies, what gets logged)

## 8. Verify the hosting and CDN chain matches §09

§09 names Cloudflare and Google Analytics and states the primary hosting region
is Singapore. Earlier notes indicate this project deploys to **Netlify**.

- [ ] Confirm the actual chain (Cloudflare DNS/CDN in front of Netlify? Or
      Cloudflare Pages?)
- [ ] If Netlify serves the app, name it in §09 alongside Cloudflare — it is a
      processor handling request data
- [ ] Confirm the host can actually pin a Singapore region; edge platforms
      often cannot, in which case reword "primary hosting region"

## 9. Backup retention — know the real number

§07 says deleted data "clears from our backups as older backups are replaced by
newer ones", deliberately vague because the real figure was unknown.

- [ ] Look up the host's backup retention (commonly 7 or 30 days)
- [ ] Note that the 90-day RSVP deletion completes in the live system at day 90,
      but fully clears backups up to that retention period later

**Update 2026-10-14:** the 90-day wording in the Privacy Notice (section 06
commitment box and paragraphs, section 15, and the "In Short" summary) was
changed to describe what the backend now does: RSVP replies, answers, contact
details, dietary notes and check-in records are permanently deleted, while each
remaining guest is kept as an anonymised entry (name replaced by a table label,
party size and seating kept as an anonymous count). Event, budget and checklist
stay until account closure.

- [ ] Owner must review the final legal text (Privacy Notice sections 06, 15 and
      the summary) before publishing

## 10. Google Drive sync: privacy wording — must ship together with the feature

Design in [docs/GOOGLE_SHEETS_SYNC.md](docs/GOOGLE_SHEETS_SYNC.md). Google also
requires this text on our own domain before it approves the consent screen, so it
has to be drafted and published before the submission, not after.

Draft wording (owner to review before publishing). Suggested home: a new section
under §08/§09 (third parties) plus one line in the "In Short" summary.

> **Connecting your Google Drive (optional)**
> If you choose to connect your Google account, MYBigDay can copy event details
> you select (for example your guest list, RSVP replies, seating tables,
> itinerary, crew or budget) into a Google Sheet in your own Google Drive. This
> only happens when you press Sync, and only for the sections you tick. Guest
> names, phone numbers and dietary notes can be among the data you choose to
> copy.
>
> We only ask for access to files that MYBigDay itself creates in your Drive. We
> cannot see, list or change any other file. We store the connection token in
> encrypted form and use it only to update the sheet when you ask us to.
>
> The sheet is your copy. MYBigDay remains the master record, and we never read
> changes you make in the sheet. Edits to the synced tabs are overwritten the
> next time you sync. If you share the sheet with other people, that is your
> decision, and we cannot see or undo it.
>
> We stop syncing an event 90 days after it takes place. Our 90-day deletion of
> guest data applies to MYBigDay only. It does not remove a sheet that is
> already in your Drive: you decide whether to keep or delete it.
>
> You can disconnect at any time in your event settings. Disconnecting removes our
> access at Google and deletes the stored token. It does not delete or recall
> sheets already created.
>
> MYBigDay's use and transfer of information received from Google APIs will
> adhere to the [Google API Services User Data
> Policy](https://developers.google.com/terms/api-services-user-data-policy),
> including the Limited Use requirements.

- [ ] Add the section to the Privacy Notice and the "In Short" summary
- [ ] Add Google (Drive) to the third-party list in §08/§09, with the data it receives
- [ ] Mention in Terms that a synced sheet is the user's own copy and responsibility
- [ ] Owner legal review of the final wording
- [ ] Publish before the Google consent-screen submission and before launch

---

## Decisions already made — do not reopen

| Item | Decision |
|---|---|
| Bilingual notice (BM) | **English only.** PDPA s.7(2) expects English + Bahasa Malaysia; accepted as a known gap. |
| DPO title | **Not used.** §18 says "Privacy Contact" only. Change to DPO only after a formal appointment and registration with the Commissioner. |
| DPO appointment | **Deferred.** Thresholds (>20,000 data subjects; >10,000 for sensitive data; regular systematic monitoring) not yet met. Revisit at scale. |
| Paid plans | **None today.** Terms §06 keeps a forward-looking clause only, so launching a plan is a price announcement rather than a terms rewrite. |
| Collaborators | **No such feature.** Terms §02 is one account per person, with no sharing exception. Revisit when collaboration ships. |
| Privacy contact address | `admin@bigdaysmanager.com` |

Superseded: a cookie banner was previously judged unnecessary for
Malaysia-only traffic. That still holds legally, but we are choosing to build a
preference control anyway — see item 3.
