// src/components/molecules/ImportRsvpsModal.tsx
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import { Spinner } from "../atoms/Spinner";
import { useCreateRsvp, useUpdateRsvp, type Rsvp } from "../../api/hooks/useRsvpsApi";
import type { FormFieldConfig } from "../../api/hooks/useFormFieldsApi";

interface ParsedRow {
  guestName: string;
  payload: {
    guestName: string;
    phoneNo: string;
    noOfPax: number;
    remarks: string;
    [key: string]: unknown;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  formFields: FormFieldConfig[];
  formFieldsLoading: boolean;
  existingRsvps: Rsvp[];
  actor: string;
  onImportComplete: () => void;
}

const STANDARD_HEADERS = ["Guest Name", "Phone No", "No of Pax", "Remarks"];

export const ImportRsvpsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  formFields,
  formFieldsLoading,
  existingRsvps,
  actor,
  onImportComplete,
}) => {
  const createRsvp = useCreateRsvp(eventId);
  const updateRsvp = useUpdateRsvp(eventId);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (isImporting) return;
    setParsedRows([]);
    setSkippedCount(0);
    setProgress(0);
    onClose();
  };

  // ─── Template Download ───────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const customHeaders = formFields.map((f) => f.label ?? f.name ?? "");
    const allHeaders = [...STANDARD_HEADERS, ...customHeaders];

    const typeHints = [
      "text", "text", "number", "text",
      ...formFields.map((f) => f.typeKey ?? "text"),
    ];

    const optionHints = [
      "", "", "", "",
      ...formFields.map((f) => {
        if ((f.typeKey === "select" || f.typeKey === "radio") && f.options) {
          const opts = Array.isArray(f.options) ? f.options : f.options.split(",");
          return opts.map((o) => String(o).trim()).join(" | ");
        }
        return "";
      }),
    ];

    const ws = XLSX.utils.aoa_to_sheet([allHeaders, typeHints, optionHints]);

    // Style header row (bold) and hint rows (grey) where possible
    const headerRange = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[headerCell]) {
        ws[headerCell].s = { font: { bold: true }, fill: { fgColor: { rgb: "4F81BD" } } };
      }
      const hintCell = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[hintCell]) {
        ws[hintCell].s = { font: { italic: true, color: { rgb: "808080" } } };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");

    const safeName = eventTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const blob = new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `rsvp-template-${safeName}.xlsx`);
  };

  // ─── File Parsing ────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = ev.target?.result;
        if (!arr) throw new Error("Empty file");

        const wb = XLSX.read(arr, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];

        if (rawRows.length === 0) {
          toast.error("File is empty");
          return;
        }

        // Row 0: headers; Rows 1-2 may be guidance (type hints / option hints)
        const headerRow = (rawRows[0] as string[]).map((h) => String(h).trim().toLowerCase());

        // Detect guidance rows: if row[1] contains "text"/"number"/"textarea" etc., it's a hint row
        const HINT_KEYWORDS = ["text", "number", "textarea", "select", "radio", "checkbox", "email", "date"];
        const isGuidanceRow = (row: unknown[]) =>
          row.some((cell) => HINT_KEYWORDS.includes(String(cell).trim().toLowerCase()));

        let dataStartIndex = 1;
        if (rawRows.length > 1 && isGuidanceRow(rawRows[1])) {
          dataStartIndex = 2; // skip type hint row
        }
        if (rawRows.length > dataStartIndex && isGuidanceRow(rawRows[dataStartIndex])) {
          dataStartIndex++; // skip options hint row
        }

        // Build column index → field key map
        const colMap: Array<{ key: string; isCustom?: boolean; fieldName?: string }> = headerRow.map((h) => {
          const normalized = h.replace(/\s+/g, "");
          if (normalized === "guestname" || normalized === "name") return { key: "guestName" };
          if (normalized === "phoneno" || normalized === "phone") return { key: "phoneNo" };
          if (normalized === "noofpax" || normalized === "pax") return { key: "noOfPax" };
          if (normalized === "remarks" || normalized === "notes") return { key: "remarks" };

          // Try to match against custom form fields by label
          const matchedField = formFields.find(
            (f) => (f.label ?? "").toLowerCase() === h || (f.name ?? "").toLowerCase() === h
          );
          if (matchedField) {
            return { key: matchedField.name ?? h, isCustom: true, fieldName: matchedField.name ?? h };
          }

          return { key: h, isCustom: true };
        });

        const parsed: ParsedRow[] = [];
        let skipped = 0;

        for (let i = dataStartIndex; i < rawRows.length; i++) {
          const row = rawRows[i] as unknown[];
          const obj: Record<string, unknown> = {};
          colMap.forEach((col, ci) => {
            obj[col.key] = row[ci] ?? "";
          });

          const rawName = String(obj["guestName"] ?? "").trim();
          if (!rawName) {
            skipped++;
            continue;
          }

          // Build standard fields
          const rawPax = obj["noOfPax"];
          let noOfPax = 1;
          if (rawPax !== "" && rawPax !== undefined) {
            const parsed = Number(rawPax);
            if (!isNaN(parsed)) noOfPax = parsed;
          }

          // Build extras from custom fields
          const extras: Record<string, unknown> = {};
          colMap.forEach((col) => {
            if (col.isCustom && col.fieldName) {
              let val = String(obj[col.key] ?? "").trim();
              // Find field definition
              const fieldDef = formFields.find((f) => f.name === col.fieldName);
              if (fieldDef?.typeKey === "checkbox") {
                const lower = val.toLowerCase();
                val = lower === "yes" || lower === "1" || lower === "true" ? "true" : "false";
              } else if (fieldDef?.typeKey === "date" && obj[col.key] instanceof Date) {
                const d = obj[col.key] as Date;
                val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              }
              extras[col.fieldName] = val;
            }
          });

          parsed.push({
            guestName: rawName,
            payload: {
              guestName: rawName,
              phoneNo: String(obj["phoneNo"] ?? "").trim(),
              noOfPax,
              remarks: String(obj["remarks"] ?? "").trim(),
              ...extras,
            },
          });
        }

        setParsedRows(parsed);
        setSkippedCount(skipped);
        setProgress(0);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to parse file");
      }
    };
    reader.onerror = () => toast.error("File read error");
    reader.readAsArrayBuffer(file);

    // Reset file input so the same file can be re-selected
    e.target.value = "";
  };

  // ─── Import Execution ────────────────────────────────────────────────────────

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    let success = 0;

    try {
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const existing = existingRsvps.find(
          (r) => (r.guestName ?? "").toLowerCase() === row.guestName.toLowerCase()
        );

        try {
          if (existing) {
            const guid = existing.rsvpGuid ?? existing.rsvpId ?? existing.id;
            await updateRsvp.mutateAsync({ rsvpGuid: guid, ...row.payload, updatedBy: actor });
          } else {
            await createRsvp.mutateAsync({ ...row.payload, createdBy: actor });
          }
          success++;
        } catch (err) {
          console.error(`Failed to import row ${i + 1} (${row.guestName}):`, err);
        }

        setProgress(i + 1);
      }

      toast.success(`Imported ${success} of ${parsedRows.length} rows`);
      onImportComplete();
      handleClose();
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const hasFile = parsedRows.length > 0 || skippedCount > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import RSVPs">
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Step 1 — Get the template
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Download the Excel template for this event. It includes columns for all custom questions.
          </p>
          <Button
            variant="secondary"
            onClick={handleDownloadTemplate}
            disabled={formFieldsLoading}
          >
            {formFieldsLoading ? (
              <>
                <Spinner /> Loading…
              </>
            ) : (
              "↓ Download Template (.xlsx)"
            )}
          </Button>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Step 2 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Step 2 — Upload your filled file
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Choose file…
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">.xlsx, .csv</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </label>

          {hasFile && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-green-600 dark:text-green-400">{parsedRows.length} rows found</span>
              {skippedCount > 0 && (
                <span className="ml-2 text-gray-400 dark:text-gray-500">{skippedCount} skipped</span>
              )}
            </p>
          )}

          {isImporting && (
            <div className="space-y-1">
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${parsedRows.length > 0 ? (progress / parsedRows.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Importing {progress} of {parsedRows.length}…
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Spinner /> Importing…
              </>
            ) : (
              `Import ${parsedRows.length > 0 ? `${parsedRows.length} rows` : ""}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
