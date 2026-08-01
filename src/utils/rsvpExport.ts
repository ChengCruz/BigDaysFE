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
  // Guest codes live on the guest record, not the RSVP, so join them back in.
  const guestCodeMap = new Map<string, string>();
  for (const g of guests) {
    if (g.rsvpId && g.guestCode) guestCodeMap.set(g.rsvpId, g.guestCode);
  }

  return rsvps.map((r, idx) => {
    const row: ExportRow = {
      "No.": idx + 1,
      "Guest Code": guestCodeMap.get(r.rsvpId ?? r.id) ?? "",
      "Guest Name": r.guestName,
      "No. of Pax": r.noOfPax ?? "",
      "Table": r.tableId ? (tableMap.get(r.tableId) ?? "") : "",
    };
    for (const field of formFields) {
      const answer = (r.answers ?? []).find((a) => a.questionId === field.questionId);
      const key = field.label || field.questionId;
      if (key) row[key] = answer?.text ?? "";
    }
    return row;
  });
}
