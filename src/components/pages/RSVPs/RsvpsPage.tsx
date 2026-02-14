// src/components/pages/Rsvps/RsvpsPage.tsx
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { ViewGridIcon, ViewListIcon } from "@heroicons/react/outline";
import { Link } from "react-router-dom";
import {
  useRsvpsApi,
  useCreateRsvp,
  useUpdateRsvp,
  useDeleteRsvp,
  type Rsvp,
} from "../../../api/hooks/useRsvpsApi";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Button } from "../../atoms/Button";
import { useEventContext } from "../../../context/EventContext";
import { useAuth } from "../../../api/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function RsvpsPage() {
  const { eventId } = useEventContext()!;
  const { data: rsvps = [], isLoading, isError } = useRsvpsApi(eventId!);

  // ─── All hooks first ─────────────────────────────────────────
  const createRsvp = useCreateRsvp(eventId!);
  const updateRsvp = useUpdateRsvp(eventId!);
  const deleteRsvp = useDeleteRsvp(eventId!);
  const { user } = useAuth();
  const actor = user?.id ?? user?.name ?? "System";
  const qc = useQueryClient();

  const [modal, setModal] = useState<{ open: boolean; rsvp?: Rsvp }>({
    open: false,
  });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    rsvp: Rsvp | null;
  }>({ open: false, rsvp: null });
  const fileInput = useRef<HTMLInputElement>(null);

  const [guestTypeFilter, setGuestTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  // ───────────────────────────────────────────────────────────────

  if (isLoading) return <p>Loading RSVPs…</p>;
  if (isError) return <p>Failed to load RSVPs.</p>;

  // Delete modal handlers
  const handleDelete = (rsvp: Rsvp) => {
    setDeleteModal({ open: true, rsvp });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ open: false, rsvp: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.rsvp) return;
    
    try {
      await deleteRsvp.mutateAsync({
        rsvpGuid: deleteModal.rsvp.rsvpGuid ?? deleteModal.rsvp.rsvpId ?? deleteModal.rsvp.id,
        eventId: eventId!
      });
      setDeleteModal({ open: false, rsvp: null });
    } catch (error) {
      console.error("Failed to delete RSVP:", error);
    }
  };

  // Filtered & searched list
  const filtered = rsvps.filter((r) => {
    const okType = guestTypeFilter === "All" || r.guestType === guestTypeFilter;
    const okSearch = (r.guestName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return okType && okSearch;
  });

  const totals = rsvps.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.status === "Yes") acc.yes += 1;
      if (r.status === "No") acc.no += 1;
      if (r.status === "Maybe") acc.maybe += 1;
      if (r.guestType === "VIP") acc.vip += 1;
      return acc;
    },
    { total: 0, yes: 0, no: 0, maybe: 0, vip: 0 }
  );

  // Export to Excel
  const handleExport = () => {
    const data = rsvps.map(({ eventId, ...rest }) => {
      void eventId;
      return rest;
    });
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
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Import failed";
        toast.error(message);
      } finally {
        if (fileInput.current) fileInput.current.value = "";
      }
    };
    reader.onerror = () => toast.error("File read error");
    reader.readAsArrayBuffer(f);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-white shadow border border-gray-100">
          <p className="text-xs text-gray-500">Total guests</p>
          <p className="text-xl font-semibold text-primary">{totals.total}</p>
        </div>
        <div className="p-3 rounded-lg bg-white shadow border border-gray-100">
          <p className="text-xs text-gray-500">Yes</p>
          <p className="text-xl font-semibold text-green-600">{totals.yes}</p>
        </div>
        <div className="p-3 rounded-lg bg-white shadow border border-gray-100">
          <p className="text-xs text-gray-500">Maybe</p>
          <p className="text-xl font-semibold text-yellow-600">{totals.maybe}</p>
        </div>
        <div className="p-3 rounded-lg bg-white shadow border border-gray-100">
          <p className="text-xs text-gray-500">VIPs</p>
          <p className="text-xl font-semibold text-purple-600">{totals.vip}</p>
        </div>
      </div>

      {/* ─── HEADER + CONTROLS ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-primary">RSVPs</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/rsvps/designer">
            <Button variant="secondary">Design RSVP Card</Button>
          </Link>
          <Button onClick={() => setModal({ open: true })}>+ New RSVP</Button>
          <Button disabled variant="secondary" onClick={handleImportClick}>
            Import CSV/XLSX   
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full ml-1">
              Coming Soon
            </span>
          </Button>
          <Button disabled variant="secondary" onClick={handleExport}>
            Export Excel
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full ml-1">
              Coming Soon
            </span>
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
          {filtered.map((r) => {
            // Determine status based on noOfPax
            const nop = r.noOfPax ?? 0;
            const displayStatus = nop > 0 ? "Yes" : "No";
            const statusColor = nop > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white";
            const cardBg = nop > 0 ? "bg-green-50" : "bg-red-50";

            return (
              <li
                key={r.id}
                className={`
                  relative p-4 rounded-lg shadow flex flex-col justify-between
                  ${cardBg}
                `}
              >
                <span
                  role="status"
                  aria-label={`RSVP status: ${displayStatus}`}
                  className={`absolute top-2 right-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}
                >
                  {displayStatus}
                </span>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{r.guestName}</h3>
                  {r.phoneNo && (
                    <p className="text-sm text-gray-600">Phone: {r.phoneNo}</p>
                  )}
                  {(r.noOfPax !== undefined && r.noOfPax !== null) && (
                    <p className="text-sm text-gray-600">Pax: {r.noOfPax}</p>
                  )}
                  {/* Guest type tag (Friend/Family/VIP) hidden as requested */}
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
                    onClick={() => handleDelete(r)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ─── LIST VIEW ──────────────────────────────────────────── */}
      {viewMode === "list" && (
        <ul className="space-y-2">
            {filtered.map((r) => {
              // Determine background color based on noOfPax
              const nop = r.noOfPax ?? 0;
              const cardBg = nop > 0 ? "bg-green-50" : "bg-red-50";

              return (
                <li
                  key={r.id}
                  className={`flex items-center justify-between p-4 rounded shadow ${cardBg}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{r.guestName}</p>
                    <p className="text-sm text-gray-600" style={{display:'none'}}>
                      <span className="mr-2">Status: {r.status}</span>
                      <span>Type: {r.guestType}</span>
                    </p>
                    {r.phoneNo && (
                      <p className="text-sm text-gray-600">Phone: {r.phoneNo}</p>
                    )}
                    {(r.noOfPax !== undefined && r.noOfPax !== null) && (
                      <p className="text-sm text-gray-600">Pax: {r.noOfPax}</p>
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
                      onClick={() => handleDelete(r)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
        </ul>
      )}

      <RsvpFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.rsvp}
        eventId={eventId!}
        onSave={async (data, id) => {
          try {
            if (id) {
              const guid = id;
              await updateRsvp.mutateAsync({ rsvpGuid: guid, ...data });
            } else {
              await createRsvp.mutateAsync(data);
            }
            // Ensure fresh data after mutation
            qc.invalidateQueries({ queryKey: ["rsvps", eventId] });
          } catch (err) {
            console.error("RSVP save error", err);
          } finally {
            setModal({ open: false });
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        isDeleting={deleteRsvp.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete RSVP?"
        description="Are you sure you want to delete this RSVP? This will permanently remove it from your guest list."
      >
        {deleteModal.rsvp && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                  {deleteModal.rsvp.guestName}
                </p>
                {deleteModal.rsvp.phoneNo && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Phone: {deleteModal.rsvp.phoneNo}
                  </p>
                )}
                {(deleteModal.rsvp.noOfPax !== undefined && deleteModal.rsvp.noOfPax !== null) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pax: {deleteModal.rsvp.noOfPax}
                  </p>
                )}
                {deleteModal.rsvp.guestType && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Type: {deleteModal.rsvp.guestType}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    (deleteModal.rsvp.noOfPax ?? 0) > 0
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {(deleteModal.rsvp.noOfPax ?? 0) > 0 ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        )}
      </DeleteConfirmationModal>
    </>
  );
}
