import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { useCreateTable, useUpdateTable } from "../../api/hooks/useTablesApi";
import { FormError } from "./FormError";

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
  const [name, setName] = useState(initial?.name || "");
  const [capacity, setCapacity] = useState(initial?.capacity.toString() || "1");
  const createTable = useCreateTable();
  const updateTable = useUpdateTable(initial?.id || "");
  const [error, setError] = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || "");
      setCapacity(initial?.capacity.toString() || "1");
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, capacity: Number(capacity) };
    try {
      if (isEdit && initial) {
        await updateTable.mutateAsync(data);
      } else {
        await createTable.mutateAsync(data);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong.");
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
