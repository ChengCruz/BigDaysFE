// src/components/pages/Rsvps/RsvpsPage.tsx
import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

import {
  useRsvpsApi,
  useCreateRsvp,
  useUpdateRsvp,
  useDeleteRsvp,
  type Rsvp,
} from "../../../api/hooks/useRsvpsApi";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import { Button } from "../../atoms/Button";
import { useEventContext } from "../../../context/EventContext";

export default function RsvpsPage() {
  // ← 1) pull eventId
  const { eventId } = useEventContext();
console.log("RsvpsPage eventId:", eventId);
  const navigate = useNavigate();

  const { data: rsvps = [], isLoading, isError } = useRsvpsApi(eventId!);
  const createRsvp = useCreateRsvp(eventId!);
  const updateRsvp = useUpdateRsvp(eventId!);
  const deleteRsvp = useDeleteRsvp(eventId!);

  const [modal, setModal] = useState<{ open: boolean; rsvp?: Rsvp }>({
    open: false,
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState("All");

  if (isLoading) return <p>Loading RSVPs…</p>;
  if (isError) return <p>Failed to load RSVPs.</p>;

  const filtered = rsvps.filter(
    (r: Rsvp) => filterType === "All" || r.guestType === filterType
  );

  // --- Export (omit id) ---
  const handleExport = () => {
    const data = rsvps.map(({ id, ...rest }: Rsvp) => rest);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "rsvps.xlsx");
  };

  // --- Import (match on guestName) ---
  const handleImportClick = () => fileInput.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const arr = ev.target?.result;
        if (!arr) throw new Error("Empty file");
        const wb = XLSX.read(arr, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: "",
        });
        const headers = (rows[0] as string[]).map((h) =>
          h.trim().toLowerCase().replace(/\s+/g, "")
        );
        let success = 0;
        for (const row of rows.slice(1)) {
          const obj = Object.fromEntries(
            row.map((c, i) => [headers[i], String(c)])
          );
          const payload = {
            guestName: obj["guestname"] || "",
            status: obj["status"] || "Yes",
            guestType: obj["guesttype"] || "Other",
          };
          const existing = rsvps.find(
            (r: Rsvp) => r.guestName === payload.guestName
          );
          if (existing) {
            // ← 3) UPDATE must send { id, data }
            await updateRsvp.mutateAsync({ id: existing.id, ...payload });
          } else {
            await createRsvp.mutateAsync(payload);
          }
          success++;
        }
        toast.success(`Imported ${success} rows`);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Import failed");
      } finally {
        if (fileInput.current) fileInput.current.value = "";
      }
    };
    reader.onerror = () => toast.error("File read error");
    reader.readAsArrayBuffer(f);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-primary">RSVPs</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setModal({ open: true })}>+ New RSVP</Button>
          <Button variant="secondary" onClick={handleImportClick}>
            Import CSV/XLSX
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            Export Excel
          </Button>
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleFile}
      />

      <div className="mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full md:w-1/3 border rounded p-2"
        >
          {["All", "Family", "VIP", "Friend", "Other"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {filtered.map((r: Rsvp) => (
          <li
            key={r.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-medium">{r.guestName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {r.status}
              </p>
              <span className="inline-block px-2 py-0.5 bg-accent text-white rounded">
                {r.guestType}
              </span>
            </div>
            <div className="space-x-2">
              <Button
                variant="secondary"
                onClick={() => setModal({ open: true, rsvp: r })}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => deleteRsvp.mutate(r.id!)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <RsvpFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.rsvp}
        eventId={eventId!}
        onSave={(data, id) => {
          if (id) {
            // `data` is CreateRsvpInput (guestName, status, guestType, …)
            // spread in `id` so the hook gets a full Rsvp:
            updateRsvp.mutate({ id, ...data });
          } else {
            createRsvp.mutate(data);
          }
          setModal({ open: false });
        }}
      />
    </>
  );
}
