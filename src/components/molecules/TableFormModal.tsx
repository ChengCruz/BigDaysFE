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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: { id: string; name: string; capacity: number };
}

export const TableFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initial,
}) => {
  const { eventId } = useEventContext();
  const [name, setName] = useState(initial?.name || "");
  const [capacity, setCapacity] = useState(
    initial?.capacity.toString() || "1"
  );
  const [error, setError] = useState<string | null>(null);

  // hooks
  const createTable = useCreateTable(eventId);
  const updateTableInfo = useUpdateTableInfo(initial?.id || "", eventId);

  // Reset form fields whenever we open or switch `initial`
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || "");
      setCapacity((initial?.capacity ?? 10).toString());
      setError(null);
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
      setError(err.message ?? "Something went wrong.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Table" : "New Table"}
    >
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
          <Button variant="primary" type="submit">
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
