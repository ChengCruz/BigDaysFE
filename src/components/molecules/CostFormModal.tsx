// src/components/molecules/CostFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { useCreateCost, useUpdateCost } from "../../api/hooks/useCostingApi";
import { FormError } from "./FormError";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: { id: string; description: string; amount: number };
}

export const CostFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initial,
}) => {
  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount.toString() || "0");
  const createCost = useCreateCost();
  const updateCost = useUpdateCost(initial?.id || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription(initial?.description || "");
      setAmount(initial?.amount.toString() || "0");
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { description, amount: Number(amount) };
    try {
      if (isEdit && initial) {
        await updateCost.mutateAsync(data);
      } else {
        await createCost.mutateAsync(data);
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
      title={isEdit ? "Edit Cost" : "New Cost"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}
        <FormField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
