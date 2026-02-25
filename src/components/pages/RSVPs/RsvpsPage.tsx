// src/components/pages/Rsvps/RsvpsPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
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
import { NoEventsState } from "../../molecules/NoEventsState";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RsvpsPage() {
  const { eventId } = useEventContext()!;
  const { data: rsvps = [], isLoading, isError } = useRsvpsApi(eventId!);
  const createRsvp = useCreateRsvp(eventId!);
  const updateRsvp = useUpdateRsvp(eventId!);
  const deleteRsvp = useDeleteRsvp(eventId!);
  const { user } = useAuth();
  const actor = user?.id ?? user?.name ?? "System";
  const qc = useQueryClient();

  const [modal, setModal] = useState<{ open: boolean; rsvp?: Rsvp }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; rsvp: Rsvp | null }>({ open: false, rsvp: null });
  const fileInput = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  if (!eventId) return <NoEventsState title="No Events to Manage RSVPs" message="Create your first event to start managing guest responses and invitations." />;
  if (isLoading) return <PageLoader message="Loading RSVPs..." />;
  if (isError) return <p className="text-red-500 p-4">Failed to load RSVPs.</p>;

  const handleDelete = (rsvp: Rsvp) => setDeleteModal({ open: true, rsvp });
  const handleCancelDelete = () => setDeleteModal({ open: false, rsvp: null });
  const handleConfirmDelete = async () => {
    if (!deleteModal.rsvp) return;
    try {
      await deleteRsvp.mutateAsync({
        rsvpGuid: deleteModal.rsvp.rsvpGuid ?? deleteModal.rsvp.rsvpId ?? deleteModal.rsvp.id,
        eventId: eventId!,
      });
      setDeleteModal({ open: false, rsvp: null });
    } catch (error) {
      console.error("Failed to delete RSVP:", error);
    }
  };

  const filtered = rsvps.filter((r) =>
    (r.guestName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = rsvps.reduce(
    (acc, r) => {
      acc.total += 1;
      acc.pax += r.noOfPax ?? 0;
      return acc;
    },
    { total: 0, pax: 0 }
  );

  const handleExport = () => {
    const data = rsvps.map(({ eventId, ...rest }) => { void eventId; return rest; });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]), "rsvps.xlsx");
  };

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
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
        const headers = (rows[0] as string[]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
        let success = 0;
        for (const row of rows.slice(1)) {
          const obj = Object.fromEntries(row.map((c, i) => [headers[i], String(c)]));
          const payload = { guestName: obj["guestname"] || "", noOfPax: Number(obj["noofpax"] || 1), phoneNo: obj["phoneno"] || "", remarks: obj["remarks"] || "" };
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
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        if (fileInput.current) fileInput.current.value = "";
      }
    };
    reader.onerror = () => toast.error("File read error");
    reader.readAsArrayBuffer(f);
  };

  return (
    <>
      {/* ─── STAT CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total RSVPs</p>
          <p className="text-3xl font-bold text-primary">{totals.total}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Pax</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totals.pax}</p>
        </div>
      </div>

      {/* ─── HEADER + ACTIONS ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-5 gap-3">
        <h2 className="text-2xl font-semibold text-primary">RSVPs</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/rsvps/designer">
            <Button variant="secondary">Design RSVP Card</Button>
          </Link>
          <Button onClick={() => setModal({ open: true })}>+ New RSVP</Button>
          <Button disabled variant="secondary" onClick={handleImportClick}>
            Import
            <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Soon</span>
          </Button>
          <Button disabled variant="secondary" onClick={handleExport}>
            Export
            <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Soon</span>
          </Button>
        </div>
      </div>

      <input ref={fileInput} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFile} />

      {/* ─── FILTERS ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search guests…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:ml-auto w-full md:w-64 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl transition-colors ${viewMode === "list" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
            aria-label="List view"
          >
            <ViewListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
            aria-label="Grid view"
          >
            <ViewGridIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ─── EMPTY STATE ──────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-600">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-500 dark:text-gray-400">
            {searchTerm ? "No RSVPs match your search." : "No RSVPs yet."}
          </p>
          {!searchTerm && (
            <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Add your first guest using the button above.</p>
          )}
        </div>
      )}

      {/* ─── GRID VIEW ────────────────────────────────────────────────── */}
      {viewMode === "grid" && filtered.length > 0 && (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-gray-900/40 transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 leading-snug">{r.guestName}</h3>
                {r.noOfPax != null && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full shrink-0">
                    {r.noOfPax} pax
                  </span>
                )}
              </div>
              {r.phoneNo && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.phoneNo}</p>
              )}
              {r.remarks && (
                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{r.remarks}</p>
              )}
              <div className="mt-auto flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <Button variant="secondary" onClick={() => setModal({ open: true, rsvp: r })}>Edit</Button>
                <Button variant="secondary" onClick={() => handleDelete(r)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ─── LIST VIEW ────────────────────────────────────────────────── */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Guest</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Phone</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Pax</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Remarks</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{r.guestName}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.phoneNo || "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{r.noOfPax ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[220px] truncate">{r.remarks || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setModal({ open: true, rsvp: r })}>Edit</Button>
                      <Button variant="secondary" onClick={() => handleDelete(r)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RsvpFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.rsvp}
        eventId={eventId!}
        onSave={async (data, id) => {
          try {
            if (id) {
              await updateRsvp.mutateAsync({ rsvpGuid: id, ...data });
            } else {
              await createRsvp.mutateAsync(data);
            }
            qc.invalidateQueries({ queryKey: ["rsvps", eventId] });
          } catch (err) {
            console.error("RSVP save error", err);
          } finally {
            setModal({ open: false });
          }
        }}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        isDeleting={deleteRsvp.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete RSVP?"
        description="Are you sure you want to delete this RSVP? This will permanently remove it from your guest list."
      >
        {deleteModal.rsvp && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">{deleteModal.rsvp.guestName}</p>
            {deleteModal.rsvp.phoneNo && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone: {deleteModal.rsvp.phoneNo}</p>
            )}
            {deleteModal.rsvp.noOfPax != null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Pax: {deleteModal.rsvp.noOfPax}</p>
            )}
          </div>
        )}
      </DeleteConfirmationModal>
    </>
  );
}
