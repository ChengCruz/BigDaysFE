// src/utils/rsvpExport.ts
// ---------------------------------------------------------------------------
// Builds the RSVP export rows.
//
// Pure (no hooks, no API) so both the RSVPs page and the paper-backup reminder
// modal emit an identical file. Custom form questions become extra columns, so
// the shape varies per event.
// ---------------------------------------------------------------------------

import type { Rsvp } from "../api/hooks/useRsvpsApi";
import type { Guest } from "../api/hooks/useGuestsApi";
import type { TableBase } from "../api/hooks/useTablesApi";
import type { FormFieldConfig } from "../api/hooks/useFormFieldsApi";
import type { ExportRow } from "./exportUtils";

export interface RsvpExportInput {
  rsvps: Rsvp[];
  guests: Guest[];
  tables: TableBase[];
  formFields: FormFieldConfig[];
}

export function buildRsvpRows({
  rsvps,
  guests,
  tables,
  formFields,
}: RsvpExportInput): ExportRow[] {
  const tableMap = new Map(tables.map((t) => [t.id, t.name]));
  // Guest codes and seats live on the guest record, not the RSVP, so join them
  // back in. Guest.rsvpId holds the RSVP's *Guid* — RsvpDetailDto.RsvpId is an
  // int, so keying this map on rsvpId would never match and blank the columns.
  const guestByRsvp = new Map<string, Guest>();
  for (const g of guests) {
    if (g.rsvpId) guestByRsvp.set(g.rsvpId, g);
  }

  return rsvps.map((r, idx) => {
    const guest = guestByRsvp.get(r.rsvpGuid ?? r.rsvpId ?? r.id);
    // The RSVP DTO carries no table — the seat is on the guest row.
    const tableId = guest?.tableId ?? r.tableId;
    const row: ExportRow = {
      "No.": idx + 1,
      "Guest Code": guest?.guestCode ?? "",
      "Guest Name": r.guestName,
      "No. of Pax": r.noOfPax ?? "",
      "Table": tableId ? (tableMap.get(tableId) ?? "") : "",
    };
    for (const field of formFields) {
      const answer = (r.answers ?? []).find((a) => a.questionId === field.questionId);
      const key = field.label || field.questionId;
      if (key) row[key] = answer?.text ?? "";
    }
    return row;
  });
}
