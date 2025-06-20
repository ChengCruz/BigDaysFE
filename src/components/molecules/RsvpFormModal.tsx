import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { useCreateRsvp, useUpdateRsvp } from "../../api/hooks/useRsvpsApi";
import { FormError } from "./FormError";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: {
    id: string;
    guestName: string;
    status: string;
    guestType?: string;
  };
}

export const RsvpFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initial,
}) => {
  const [guestName, setGuestName] = useState(initial?.guestName || "");
  const [status, setStatus] = useState(initial?.status || "Yes");
  const [guestType, setGuestType] = useState(initial?.guestType || "Guest");

  const createRsvp = useCreateRsvp();
  const updateRsvp = useUpdateRsvp(initial?.id || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGuestName(initial?.guestName || "");
      setStatus(initial?.status || "Yes");
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initial) {
        await updateRsvp.mutateAsync({ guestName, status });
      } else {
        await createRsvp.mutateAsync({ guestName, status });
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
      title={isEdit ? "Edit RSVP" : "New RSVP"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}
        <FormField
          label="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
        <div>
          <label className="block mb-1">Status</label>
          <select
            className="w-full border rounded p-2 focus:ring-2 focus:ring-primary"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["Yes", "No", "Maybe"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Guest Type</label>
          <select
            value={guestType}
            onChange={(e) => setGuestType(e.target.value)}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-primary"
          >
            {["Family", "VIP", "Friend", "Other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
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
