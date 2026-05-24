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

interface ModalGuest {
  id: string;
  name: string;
  pax?: number;
  flag?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: { id: string; name: string; capacity: number };
  guests?: ModalGuest[];
}

export const TableFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initial,
  guests = [],
}) => {
  const { eventId } = useEventContext();
  const [name, setName] = useState(initial?.name || "");
  const [capacity, setCapacity] = useState(
    initial?.capacity.toString() || "1"
  );
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"guests" | "edit">("guests");

  // hooks
  const createTable = useCreateTable(eventId);
  const updateTableInfo = useUpdateTableInfo(initial?.id || "", eventId);

  // Reset form fields whenever we open or switch `initial`
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || "");
      setCapacity((initial?.capacity ?? 10).toString());
      setError(null);
      setTab("guests");
    }
  }, [isOpen, initial]);

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
