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
  const [guestName, setGuestName] = useState(
    initial?.guestName || initial?.name || ""
  );
  const [noOfPax, setNoOfPax] = useState<string | number>(initial?.noOfPax || 1);
  const [phoneNo, setPhoneNo] = useState(initial?.phoneNo || "");
  const [remarks, setRemarks] = useState(initial?.remarks || "");
  const [status, setStatus] = useState(initial?.status || "Yes");
  const [guestType, setGuestType] = useState(initial?.guestType || "Family");

  const [extras, setExtras] = useState<Record<string, string>>({});
  const { data: formFields = [] } = useFormFields(eventId);
  const [initialized, setInitialized] = useState(false);
  const [guestNameError, setGuestNameError] = useState("");
  const [phoneNoError, setPhoneNoError] = useState("");
  const [noOfPaxError, setNoOfPaxError] = useState("");

  useEffect(() => {
    if (isOpen && !initialized) {
      setGuestName(initial?.name ?? "");
      setNoOfPax(initial?.noOfPax ?? 1);
      setPhoneNo((initial as any)?.phoneNo ?? "");
      setRemarks(initial?.remarks ?? "");
      setStatus(initial?.status ?? "Yes");
      // setGuestType(initial?.guestType ?? "Family");
      setExtras(
        (formFields as any[]).reduce((acc: Record<string, string>, f: any) => {
          const key = f.name ?? f.id ?? f.questionId;
          if (key) acc[key] = (initial as any)?.[key] ?? "";
          return acc;
        }, {} as Record<string, string>)
      );
      // Clear all errors when modal opens
      setGuestNameError("");
      setPhoneNoError("");
      setNoOfPaxError("");
      setInitialized(true);
    }
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, initial?.rsvpId, formFields, initialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    
    // Validate guest name
    if (!guestName || guestName.trim() === "") {
      setGuestNameError("Guest name is required");
      hasError = true;
    } else {
      setGuestNameError("");
    }
    
    // Validate phone number
    if (!phoneNo || phoneNo.trim() === "") {
      setPhoneNoError("Phone number is required");
      hasError = true;
    } else {
      setPhoneNoError("");
    }
    
    // Validate noOfPax
    if (!noOfPax && noOfPax !== 0 && noOfPax !== "0") {
      setNoOfPaxError("Number of pax is required");
      hasError = true;
    } else if (Number(noOfPax) < 0) {
      setNoOfPaxError("Number of pax cannot be negative");
      hasError = true;
    } else if (!Number.isInteger(Number(noOfPax))) {
      setNoOfPaxError("Number of pax must be a whole number");
      hasError = true;
    } else {
      setNoOfPaxError("");
    }
    
    // If any validation failed, stop submission
    if (hasError) {
      return;
    }
    
    const actor = user?.id ?? user?.name ?? "System";
    const payload: CreateRsvpInput = {
      eventId,
      guestName: guestName.trim(),
      noOfPax: Number(noOfPax),
      status,
      guestType,
      remarks: remarks.trim(),
      phoneNo: phoneNo.trim(),
      ...extras,
    };

    // If editing an existing RSVP, include updatedBy. Otherwise include createdBy.
    if (initial) {
      payload.updatedBy = actor;
      payload.rsvpGuid = initial.rsvpGuid;
    } else payload.createdBy = actor;
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
        <div>
          <FormField
            label="Guest Name"
            value={guestName}
            onChange={(e) => {
              setGuestName(e.target.value);
              setGuestNameError(""); // Clear error when user types
            }}
            required
          />
          {guestNameError && (
            <p className="text-red-500 text-sm mt-1">{guestNameError}</p>
          )}
        </div>

        {/* No Of Pax */}
        <div>
          <FormField
            label="No Of Pax"
            type="number"
            value={String(noOfPax)}
            onChange={(e) => {
              setNoOfPax(e.target.value);
              setNoOfPaxError(""); // Clear error when user types
            }}
            min={0}
            step={1}
            required
          />
          {noOfPaxError && (
            <p className="text-red-500 text-sm mt-1">{noOfPaxError}</p>
          )}
        </div>

        {/* Phone number */}
        <div>
          <FormField
            label="Phone"
            value={phoneNo}
            onChange={(e) => {
              setPhoneNo(e.target.value);
              setPhoneNoError(""); // Clear error when user types
            }}
            required
          />
          {phoneNoError && (
            <p className="text-red-500 text-sm mt-1">{phoneNoError}</p>
          )}
        </div>

        {/* —— Guest Type Select —— */}
        <div style={{ display: 'none' }}>
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
        <div style={{ display: 'none' }}>
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

        {/* Remarks */}
        <div>
          <label className="block mb-1">Remarks</label>
          <textarea
            className="w-full border rounded p-2 focus:ring-2 focus:ring-primary"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Add any additional notes or remarks..."
          />
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
