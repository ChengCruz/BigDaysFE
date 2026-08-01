// src/utils/exportUtils.ts
// ---------------------------------------------------------------------------
// Shared client-side spreadsheet download helpers.
//
// Every export in this app is built from data React Query already has cached —
// there is no server-side export endpoint. These two functions are the extracted
// form of the block that used to be copy-pasted into each exporting page.
// ---------------------------------------------------------------------------

import { saveAs } from "file-saver";

export type ExportRow = Record<string, unknown>;

/**
 * Writes rows to a .xlsx file and triggers a download.
 *
 * `xlsx` is imported lazily on purpose: it is ~400kb and only a handful of
 * pages export, so it must stay out of the main bundle.
 */
export async function downloadXlsx(
  rows: ExportRow[],
  filename: string,
  sheetName: string
): Promise<void> {
  if (rows.length === 0) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]), filename);
}

/** Wraps a value in quotes only when it contains a comma, quote or newline. */
function escapeCsv(value: unknown): string {
  const s = String(value ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

/**
 * Writes rows to a .csv file and triggers a download.
 *
 * Headers come from the first row, so every row must share the same keys.
 * The leading U+FEFF is a UTF-8 BOM — without it Excel on Windows mangles
 * non-ASCII guest names.
 */
export function downloadCsv(rows: ExportRow[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  saveAs(
    new Blob(["﻿", lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8;" }),
    filename
  );
}
