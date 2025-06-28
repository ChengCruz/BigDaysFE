// src/components/pages/Rsvps/RsvpsPage.tsx
import React, { useState, useRef } from "react";
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
  const { eventId } = useEventContext();
  const { data: rsvps = [], isLoading, isError } = useRsvpsApi(eventId!);

  const statusBadgeClasses: Record<string, string> = {
    Yes: "bg-green-100 text-green-800",
    No: "bg-red-100   text-red-800",
    Maybe: "bg-yellow-100 text-yellow-800",
  };
  const cardBorderClasses: Record<string, string> = {
    Yes: "border-green-500",
    No: "border-red-500",
    Maybe: "border-yellow-500",
  };
  const cardBgClasses: Record<string,string> = {
  Yes:   "bg-green-50",
  No:    "bg-red-50",
  Maybe: "bg-yellow-50",
};

const typeBadgeClasses: Record<string,string> = {
  Family: "bg-blue-100 text-blue-800",
  VIP:    "bg-purple-100 text-purple-800",
  Friend: "bg-indigo-100 text-indigo-800",
  Other:  "bg-gray-100 text-gray-800",
};
  const createRsvp = useCreateRsvp(eventId!);
  const updateRsvp = useUpdateRsvp(eventId!);
  const deleteRsvp = useDeleteRsvp(eventId!);

  const [modal, setModal] = useState<{ open: boolean; rsvp?: Rsvp }>({
    open: false,
  });
  const fileInput = useRef<HTMLInputElement>(null);

  // our two filters:
  const [guestTypeFilter, setGuestTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (isLoading) return <p>Loading RSVPs…</p>;
  if (isError) return <p>Failed to load RSVPs.</p>;

  // compose our final filtered list:
  const filtered = rsvps.filter((r) => {
    const matchesType =
      guestTypeFilter === "All" || r.guestType === guestTypeFilter;
    const matchesSearch = r.guestName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // --- Export Excel ---
  const handleExport = () => {
    const data = rsvps.map(({ id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "rsvps.xlsx");
  };

  // --- Import CSV/XLSX ---
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
          const existing = rsvps.find((r) => r.guestName === payload.guestName);
          if (existing) {
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
      {/* header controls */}
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

      {/* filters */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
        {/* guest-type dropdown */}
        <select
          value={guestTypeFilter}
          onChange={(e) => setGuestTypeFilter(e.target.value)}
          className="w-full md:w-1/3 border rounded p-2"
        >
          {["All", "Family", "VIP", "Friend", "Other"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* search box */}
        <input
          type="text"
          placeholder="Search Guests"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-2/3 border rounded p-2"
        />
      </div>

      {/* responsive grid of cards */}
<ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {filtered.map((r) => (
    <li
      key={r.id}
      className={`
        relative p-4 rounded-lg shadow
        ${cardBgClasses[r.status] ?? "bg-white"}
        flex flex-col justify-between
      `}
    >
      {/* Top-right status badge */}
      <span
        role="status"
        aria-label={`RSVP status: ${r.status}`}
        className={`
          absolute top-2 right-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold
          ${
            r.status === "Yes"
              ? "bg-green-600 text-white"
              : r.status === "No"
              ? "bg-red-600 text-white"
              : "bg-yellow-600 text-white"
          }
        `}
      >
        {r.status}
      </span>

      {/* Card content */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          {r.guestName}
        </h3>

        {/* Guest-type outlined pill */}
        <span
          className={`
            inline-block px-2 py-0.5 rounded-full text-sm font-medium
            border-2
            ${
              r.guestType === "Family"
                ? "border-blue-600 text-blue-600"
                : r.guestType === "VIP"
                ? "border-purple-600 text-purple-600"
                : r.guestType === "Friend"
                ? "border-indigo-600 text-indigo-600"
                : "border-gray-400 text-gray-600"
            }
          `}
        >
          {r.guestType}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex space-x-2">
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
