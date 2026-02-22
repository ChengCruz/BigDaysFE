// src/components/molecules/CustomBulkModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { FormError } from "./FormError";
import { useBulkCreateTables } from "../../api/hooks/useTablesApi";
import { useEventContext } from "../../context/EventContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomBulkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { eventId } = useEventContext();
  const [prefix, setPrefix] = useState("");
  const [quantity, setQuantity] = useState("5");
  const [capacity, setCapacity] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const bulkCreateTables = useBulkCreateTables(eventId);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrefix("");
      setQuantity("5");
      setCapacity("10");
      setError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!prefix.trim()) {
      setError("Please enter a table prefix (e.g., 'family', 'vip', 'guest')");
      return;
    }

    const qty = Number(quantity);
    const cap = Number(capacity);

    if (qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    if (cap < 1) {
      setError("Capacity must be at least 1");
      return;
    }

    setIsCreating(true);

    try {
      // Use bulk create API - backend handles table name numbering
      await bulkCreateTables.mutateAsync({
        eventGuid: eventId!,
        tableName: prefix,
        quantity: qty,
        maxSeats: cap,
      });

      onClose();
    } catch (err: any) {
      console.error("Failed to create tables:", err);
      setError(err.message ?? "Failed to create tables. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Create Tables (Custom)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Example:</strong> Prefix "family" with 5 tables creates: family1,
            family2, family3, family4, family5
          </p>
        </div>

        <FormField
          label="Table Prefix"
          placeholder="e.g., family, vip, guest"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          required
        />

        <FormField
          label="Number of Tables"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <FormField
          label="Default Capacity (seats per table)"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            type="button"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isCreating}>
            {isCreating ? "Creating..." : `Create ${quantity} Tables`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
