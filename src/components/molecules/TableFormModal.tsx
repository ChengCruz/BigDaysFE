// src/components/molecules/TableFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { FormError } from "./FormError";
import {
  useCreateTable,
  useUpdateTableInfo,
} from "../../api/hooks/useTablesApi";
import { useEventContext } from "../../context/EventContext";
import { CheckIcon } from "@heroicons/react/solid";

interface ModalGuest {
  id: string;
  name: string;
  pax?: number;
  flag?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a new table is successfully created (not on edit or cancel). */
  onCreated?: () => void;
  initial?: { id: string; name: string; capacity: number };
  guests?: ModalGuest[];
  /** When provided, Guests tab shows these unassigned guests with checkboxes for bulk-assign. */
  unassignedGuests?: ModalGuest[];
  /** Called with selected guest IDs when user confirms bulk-assign. */
  onAssignGuests?: (guestIds: string[]) => Promise<void> | void;
  /** Which tab to show first when the modal opens (defaults to "guests"). */
  initialTab?: "guests" | "edit";
}

export const TableFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreated,
  initial,
  guests = [],
  unassignedGuests,
  onAssignGuests,
  initialTab,
}) => {
  const { eventId } = useEventContext();
  const [name, setName] = useState(initial?.name || "");
  const [capacity, setCapacity] = useState(
    initial?.capacity.toString() || "1"
  );
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"guests" | "edit">("guests");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignSearch, setAssignSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // hooks
  const createTable = useCreateTable(eventId);
  const updateTableInfo = useUpdateTableInfo(initial?.id || "", eventId);

  // Reset form fields whenever we open or switch `initial`
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || "");
      setCapacity((initial?.capacity ?? 10).toString());
      setError(null);
      setTab(initialTab ?? "guests");
      setSelectedIds(new Set());
      setAssignSearch("");
    }
  }, [isOpen, initial, initialTab]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      capacity: Number(capacity),
      eventId: eventId!,
    };

    try {
      if (isEdit && initial) {
        await updateTableInfo.mutateAsync(payload);
      } else {
        await createTable.mutateAsync(payload);
        onCreated?.();
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 401) {
        try {
          if (isEdit && initial) {
            await updateTableInfo.mutateAsync(payload);
          } else {
            await createTable.mutateAsync(payload);
            onCreated?.();
          }
          onClose();
          return;
        } catch { /* fall through to show error */ }
      }
      setError(err.message ?? "Something went wrong.");
    }
  };

  const seatedPax = guests.reduce((sum, g) => sum + (g.pax ?? 1), 0);
  const capacityNum = initial?.capacity ?? 0;
  const isAssignMode = unassignedGuests !== undefined;

  const filteredUnassigned = isAssignMode
    ? (unassignedGuests ?? []).filter(g =>
        g.name.toLowerCase().includes(assignSearch.toLowerCase())
      )
    : [];

  const selectedPax = isAssignMode
    ? (unassignedGuests ?? [])
        .filter(g => selectedIds.has(g.id))
        .reduce((sum, g) => sum + (g.pax ?? 1), 0)
    : 0;

  const toggleGuest = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmAssign = async () => {
    if (!onAssignGuests || selectedIds.size === 0) return;
    setIsAssigning(true);
    try {
      await onAssignGuests(Array.from(selectedIds));
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Table" : "New Table"}
      showCloseButton
    >
      {isEdit && (
        <div className="flex border-b border-gray-100 dark:border-white/10 -mx-6 px-6 mb-5">
          {(["guests", "edit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px " +
                (tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")
              }
            >
              {t === "guests" ? "Guests" : "Edit"}
            </button>
          ))}
        </div>
      )}

      {isEdit && tab === "guests" ? (
        isAssignMode ? (
          /* ── Assign mode: show unassigned guests with checkboxes ── */
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-text">{seatedPax}</span> / {capacityNum} seated
              {selectedIds.size > 0 && (
                <span className="ml-2 text-primary font-semibold">
                  +{selectedPax} selected
                </span>
              )}
            </p>
            <input
              type="text"
              placeholder="Search guests..."
              value={assignSearch}
              onChange={e => setAssignSearch(e.target.value)}
              className="w-full text-sm border border-primary/20 dark:border-primary/30 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {filteredUnassigned.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
                {(unassignedGuests ?? []).length === 0 ? "All guests are already assigned!" : "No guests match your search."}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/10 max-h-64 overflow-y-auto">
                {filteredUnassigned.map(g => {
                  const checked = selectedIds.has(g.id);
                  return (
                    <li
                      key={g.id}
                      onClick={() => toggleGuest(g.id)}
                      className="flex items-center gap-3 py-2.5 px-1 cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked
                          ? "bg-primary border-primary"
                          : "border-gray-300 dark:border-gray-600"
                      }`}>
                        {checked && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-text flex-1 truncate">{g.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {g.flag === "VIP" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            VIP
                          </span>
                        )}
                        {(g.pax ?? 1) > 1 && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                            {g.pax ?? 1} pax
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-white/10">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                disabled={selectedIds.size === 0}
                loading={isAssigning}
                onClick={handleConfirmAssign}
              >
                Assign {selectedIds.size > 0 ? `${selectedIds.size} guest${selectedIds.size > 1 ? "s" : ""}` : ""}
              </Button>
            </div>
          </div>
        ) : (
          /* ── View mode: show currently assigned guests ── */
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-text">{seatedPax}</span> / {capacityNum} seated
            </p>
            {guests.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                No guests assigned yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/10">
                {guests.map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="text-sm font-medium text-text truncate">{g.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {g.flag === "VIP" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          VIP
                        </span>
                      )}
                      {(g.pax ?? 1) > 1 && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          ×{g.pax}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <FormField
            label="Table Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormField
            label="Capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={createTable.isPending || updateTableInfo.isPending}
            >
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
