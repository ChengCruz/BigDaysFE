// src/components/molecules/SeatingFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { useCreateSeat, useUpdateSeat } from "../../api/hooks/useSeatingApi";
import { FormError } from "./FormError";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: { id: string; tableId: string; guestId: string };
}

export const SeatingFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initial,
}) => {
  const [tableId, setTableId] = useState(initial?.tableId || "");
  const [guestId, setGuestId] = useState(initial?.guestId || "");
  const createSeat = useCreateSeat();
  const updateSeat = useUpdateSeat(initial?.id || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTableId(initial?.tableId || "");
      setGuestId(initial?.guestId || "");
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { tableId, guestId };
    try {
      if (isEdit && initial) {
        await updateSeat.mutateAsync(data);
      } else {
        await createSeat.mutateAsync(data);
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
      title={isEdit ? "Edit Seating" : "New Seating"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}
        <FormField
          label="Table ID"
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
        />
        <FormField
          label="Guest ID"
          value={guestId}
          onChange={(e) => setGuestId(e.target.value)}
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
