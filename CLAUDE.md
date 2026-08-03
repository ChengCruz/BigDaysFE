# BigDaysFE — project conventions

## Counting guests: rows vs people

One RSVP creates exactly **one** Guest row, and `Guest.Pax` is that party's size,
**including the person who replied**. A party of one is `Pax = 1`, not `Pax = 0`.
There are no per-attendee records.

So there are two legitimate numbers, and they must never be confused:

| Number | How to compute | What it means |
| --- | --- | --- |
| **Guest count** | `guests.length` — a row count | How many parties / RSVPs replied |
| **Pax count** | `sum(pax)` | How many people are actually coming |

Two parties, one bringing 1 and one bringing 3 → **2 guests, 4 pax**. Both are
correct; they answer different questions.

### The rule

**A count labelled with people-words must be a pax sum. A count labelled with
guest/RSVP/reply-words must be a row count.** Never label a row count "people",
and never label a pax sum "guests".

- Planner mode says the word **"pax"** whenever the number is a pax sum —
  `Total Pax`, `Seated (pax)`, `3 / 8 pax`. An unqualified count there is a row
  count (`Total Guests`, `Assigned`, `Unassigned`).
- Couple mode deliberately avoids the word "pax". It says **"seats"** instead —
  `3 seats`, `Seats free`. Same rule, friendlier noun.

Anything about **seating or capacity is always pax**, never rows — a table holds
people, and a party has to sit together.

Couple mode's noun rules are settled in more detail in
[docs/COUPLE_MODE.md](docs/COUPLE_MODE.md) — "seats" for the countable thing,
"capacity" for the limit, "pax" as a party-size suffix.

### Planner and couple mode must agree

The same label must produce the same number in both modes. If the couple page
for a section shows a different figure from its planner counterpart for the same
data, that is a bug in one of them — fix it, don't rename around it.

## RSVP identity

The RSVP's identity is its **`RsvpGuid`** everywhere: writes take it, and
`Guest.rsvpId` holds it. `RsvpDetailDto` also carries an int `RsvpId`, but
nothing consumes it — do not join, key, or route on it. `useRsvpsApi` maps both
`id` and `rsvpId` to the Guid on purpose so the int can never leak downstream.
