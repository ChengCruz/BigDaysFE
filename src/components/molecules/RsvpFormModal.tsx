// src/components/molecules/RsvpFormModal.tsx
import React, { useState, useEffect } from "react";
import { type Rsvp, type CreateRsvpInput } from "../../api/hooks/useRsvpsApi";
import { useFormFields } from "../../api/hooks/useFormFieldsApi";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initial?: Rsvp; // <-- same Rsvp
  onSave: (data: CreateRsvpInput, id?: string) => void;
}

export const RsvpFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  eventId,
  initial,
  onSave,
}) => {
  const [guestName, setGuestName] = useState(initial?.guestName || "");
  const [status, setStatus] = useState(initial?.status || "Yes");
  const [guestType, setGuestType] = useState(initial?.guestType || "Family");
console.log("RsvpFormModal eventId:", eventId);
  // pick up any extra dynamic fields:
  const [extras, setExtras] = useState<Record<string, string>>({});
  const { data: formFields = [] } = useFormFields(eventId);
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setGuestName(initial?.guestName ?? "");
      setStatus(initial?.status ?? "Yes");
      setGuestType(initial?.guestType ?? "Family");
      setExtras(
        formFields.reduce(
          (acc, f) => ({
            ...acc,
            [f.name]: initial ? (initial as Record<string, any>)[f.name] ?? "" : ""
          }),
          {}
        )
      );
      setHasInitialized(true);
    }
    // when the modal closes, reset the flag
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [
    isOpen,
    initial?.id /* only reset init when id changes */,
    formFields.length,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateRsvpInput = {
      guestName,
      status,
      guestType,
      ...extras,
    };
    onSave(payload, initial?.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Edit RSVP" : "New RSVP"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />

        {/* status, guestType selects omitted for brevity */}

        {formFields.map((f) => (
          <FormField
            key={f.id}
            label={f.label}
            type={f.type}
            required={f.required}
            options={f.options}
            value={extras[f.name] || ""}
            onChange={(e) =>
              setExtras((x) => ({ ...x, [f.name]: e.target.value }))
            }
          />
        ))}

        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initial ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
