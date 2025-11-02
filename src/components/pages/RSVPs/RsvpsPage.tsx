// src/components/pages/Rsvps/RsvpsPage.tsx
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { ViewGridIcon, ViewListIcon } from "@heroicons/react/outline";
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
import { useAuth } from "../../../api/hooks/useAuth";

export default function RsvpsPage() {
  const { eventId } = useEventContext()!;
  const { data: rsvps = [], isLoading, isError } = useRsvpsApi(eventId!);

  // ─── All hooks first ─────────────────────────────────────────
  const createRsvp = useCreateRsvp(eventId!);
  const updateRsvp = useUpdateRsvp(eventId!);
  const deleteRsvp = useDeleteRsvp(eventId!);
  const { user } = useAuth();
  const actor = user?.id ?? user?.name ?? "System";

  const [modal, setModal] = useState<{ open: boolean; rsvp?: Rsvp }>({
    open: false,
  });
  const fileInput = useRef<HTMLInputElement>(null);

  const [guestTypeFilter, setGuestTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  // ───────────────────────────────────────────────────────────────

  if (isLoading) return <p>Loading RSVPs…</p>;
  if (isError) return <p>Failed to load RSVPs.</p>;

  // Filtered & searched list
  const filtered = rsvps.filter((r) => {
    const okType = guestTypeFilter === "All" || r.guestType === guestTypeFilter;
    const okSearch = (r.guestName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return okType && okSearch;
  });

  // Background colors by status
  const cardBgClasses: Record<string, string> = {
    Yes: "bg-green-50",
    No: "bg-red-50",
    Maybe: "bg-yellow-50",
  };

  // Export to Excel
  const handleExport = () => {
    const data = rsvps.map(({ eventId, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "rsvps.xlsx");
  };

  // Import from CSV/XLSX
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
          const existing = rsvps.find((r) => r.name === payload.guestName);
          if (existing) {
            const guid = existing.rsvpGuid ?? existing.rsvpId ?? existing.id;
            await updateRsvp.mutateAsync({ rsvpGuid: guid, ...payload, updatedBy: actor });
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
      {/* ─── HEADER + CONTROLS ──────────────────────────────── */}
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

{/* FILTERS + ICON TOGGLE */}
<div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
  <select
    value={guestTypeFilter}
    onChange={(e) => setGuestTypeFilter(e.target.value)}
    className="w-full md:w-1/4 border rounded p-2"
  >
    {["All", "Family", "VIP", "Friend", "Other"].map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Search Guests"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full md:flex-1 border rounded p-2"
  />

  <div className="flex space-x-2 md:ml-auto">
    <Button
      variant={viewMode === "list" ? "primary" : "secondary"}
      onClick={() => setViewMode("list")}
      aria-label="List view"
    >
      <ViewListIcon className="h-5 w-5" />
    </Button>
    <Button
      variant={viewMode === "grid" ? "primary" : "secondary"}
      onClick={() => setViewMode("grid")}
      aria-label="Grid view"
    >
      <ViewGridIcon className="h-5 w-5" />
    </Button>
  </div>
</div>

      {/* ─── GRID VIEW ─────────────────────────────────────────── */}
      {viewMode === "grid" && (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((r) => (
                <li
              key={r.id}
              className={`
                relative p-4 rounded-lg shadow flex flex-col justify-between
                ${cardBgClasses[r.status ?? ""] || "bg-white"}
              `}
            >
              <span
                role="status"
                aria-label={`RSVP status: ${r.status}`}
                className={`absolute top-2 right-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold
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

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{r.guestName}</h3>
                {r.phoneNo && (
                  <p className="text-sm text-gray-600">Phone: {r.phoneNo}</p>
                )}
                <span
                  className={`
                    inline-block px-2 py-0.5 rounded-full text-sm font-medium border-2
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

              <div className="mt-4 flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => setModal({ open: true, rsvp: r })}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    deleteRsvp.mutate({ rsvpGuid: r.rsvpGuid ?? r.rsvpId ?? r.id, eventId: eventId! })
                  }
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ─── LIST VIEW ──────────────────────────────────────────── */}
      {viewMode === "list" && (
        <ul className="space-y-2">
            {filtered.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between p-4 bg-white rounded shadow"
            >
              <div className="flex-1">
                <p className="font-medium">{r.guestName}</p>
                <p className="text-sm text-gray-600">
                  <span className="mr-2">Status: {r.status}</span>
                  <span>Type: {r.guestType}</span>
                </p>
                {r.phoneNo && (
                  <p className="text-sm text-gray-600">Phone: {r.phoneNo}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => setModal({ open: true, rsvp: r })}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    deleteRsvp.mutate({ rsvpGuid: r.rsvpGuid ?? r.rsvpId ?? r.id, eventId: eventId! })
                  }
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RsvpFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.rsvp}
        eventId={eventId!}
        onSave={(data, id) => {
          if (id) {
            const guid = id;
            updateRsvp.mutate({ rsvpId: guid, ...data });
          } else {
            createRsvp.mutate(data);
          }
          setModal({ open: false });
        }}
      />
    </>
  );
}
