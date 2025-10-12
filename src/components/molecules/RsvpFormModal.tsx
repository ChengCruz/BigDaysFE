// src/components/molecules/RsvpFormModal.tsx
import React, { useState, useEffect } from "react";
import { type Rsvp, type CreateRsvpInput } from "../../api/hooks/useRsvpsApi";
import { useAuth } from "../../api/hooks/useAuth";
import { useFormFields } from "../../api/hooks/useFormFieldsApi";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initial?: Rsvp;
  onSave: (data: CreateRsvpInput, id?: string) => void;
}

export const RsvpFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  eventId,
  initial,
  onSave,
}) => {
  const { user } = useAuth();
  const [guestName, setGuestName] = useState(initial?.guestName || initial?.name || "");
  const [status, setStatus] = useState(initial?.status || "Yes");
  const [guestType, setGuestType] = useState(initial?.guestType || "Family");

  const [extras, setExtras] = useState<Record<string, string>>({});
  const { data: formFields = [] } = useFormFields(eventId);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !initialized) {
      setGuestName(initial?.name ?? "");
      setStatus(initial?.status ?? "Yes");
      // setGuestType(initial?.guestType ?? "Family");
      setExtras(
        (formFields as any[]).reduce((acc: Record<string, string>, f: any) => {
          const key = f.name ?? f.id ?? f.questionId;
          if (key) acc[key] = (initial as any)?.[key] ?? "";
          return acc;
        }, {} as Record<string, string>)
      );
      setInitialized(true);
    }
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, initial?.rsvpId, formFields, initialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = user?.id ?? user?.name ?? "System";
    const payload: CreateRsvpInput = {
      eventId,
      guestName: guestName,
      status,
      guestType,
      remarks: "", // Placeholder; can be extended to include remarks in the form
      ...extras,
    };

    // If editing an existing RSVP, include updatedBy. Otherwise include createdBy.
    if (initial) payload.updatedBy = actor;
    else payload.createdBy = actor;
    onSave(payload, initial?.id ?? initial?.rsvpId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Edit RSVP" : "New RSVP"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Guest Name */}
        <FormField
          label="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />

        {/* —— Guest Type Select —— */}
        <div>
          <label className="block mb-1">Guest Type</label>
          <select
            className="w-full border rounded p-2 focus:ring-2 focus:ring-primary"
            value={guestType}
            onChange={(e) => setGuestType(e.target.value)}
          >
            {["Family", "VIP", "Friend", "Other"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        {/* —— Status Select —— */}
        <div>
          <label className="block mb-1">Reservation Status</label>
          <select
            className="w-full border rounded p-2 focus:ring-2 focus:ring-primary"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["Yes", "No", "Maybe"].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* —— Dynamic Extra Fields —— */}
        {formFields.map((f: any) => (
          <FormField
            key={f.id}
            label={f.label}
            type={f.type}
            required={f.required}
            options={f.options}
            value={extras[f.name] || ""}
            onChange={(e) =>
              setExtras((prev) => ({ ...prev, [f.name]: e.target.value }))
            }
          />
        ))}

        {/* Actions */}
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
