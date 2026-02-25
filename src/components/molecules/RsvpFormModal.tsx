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
  const [guestName, setGuestName] = useState(initial?.guestName ?? initial?.name ?? "");
  const [noOfPax, setNoOfPax] = useState<string | number>(initial?.noOfPax ?? 1);
  const [phoneNo, setPhoneNo] = useState(initial?.phoneNo ?? "");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");

  const [extras, setExtras] = useState<Record<string, string>>({});
  const { data: formFields = [] } = useFormFields(eventId);
  const [initialized, setInitialized] = useState(false);
  const [guestNameError, setGuestNameError] = useState("");
  const [phoneNoError, setPhoneNoError] = useState("");
  const [noOfPaxError, setNoOfPaxError] = useState("");

  useEffect(() => {
    if (isOpen && !initialized) {
      setGuestName(initial?.guestName ?? initial?.name ?? "");
      setNoOfPax(initial?.noOfPax ?? 1);
      setPhoneNo(initial?.phoneNo ?? "");
      setRemarks(initial?.remarks ?? "");
      setExtras(
        (formFields as any[]).reduce((acc: Record<string, string>, f: any) => {
          const key = f.name ?? f.id ?? f.questionId;
          if (key) acc[key] = (initial as any)?.[key] ?? "";
          return acc;
        }, {} as Record<string, string>)
      );
      setGuestNameError("");
      setPhoneNoError("");
      setNoOfPaxError("");
      setInitialized(true);
    }
    if (!isOpen) setInitialized(false);
  }, [isOpen, initial?.rsvpId, formFields, initialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!guestName.trim()) {
      setGuestNameError("Guest name is required");
      hasError = true;
    } else {
      setGuestNameError("");
    }

    if (!phoneNo.trim()) {
      setPhoneNoError("Phone number is required");
      hasError = true;
    } else {
      setPhoneNoError("");
    }

    if (noOfPax === "" || noOfPax === null || noOfPax === undefined) {
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

    if (hasError) return;

    const actor = user?.id ?? user?.name ?? "System";
    const payload: CreateRsvpInput = {
      eventId,
      guestName: guestName.trim(),
      noOfPax: Number(noOfPax),
      remarks: remarks.trim(),
      phoneNo: phoneNo.trim(),
      ...extras,
    };

    if (initial) {
      payload.updatedBy = actor;
      payload.rsvpGuid = initial.rsvpGuid;
    } else {
      payload.createdBy = actor;
    }

    onSave(payload, initial?.id ?? initial?.rsvpId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? "Edit RSVP" : "New RSVP"}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Guest Name */}
        <div>
          <FormField
            label="Guest Name"
            value={guestName}
            onChange={(e) => { setGuestName(e.target.value); setGuestNameError(""); }}
            required
          />
          {guestNameError && <p className="text-red-500 text-xs mt-1">{guestNameError}</p>}
        </div>

        {/* Phone */}
        <div>
          <FormField
            label="Phone"
            value={phoneNo}
            onChange={(e) => { setPhoneNo(e.target.value); setPhoneNoError(""); }}
            required
          />
          {phoneNoError && <p className="text-red-500 text-xs mt-1">{phoneNoError}</p>}
        </div>

        {/* No of Pax */}
        <div>
          <FormField
            label="No of Pax"
            type="number"
            value={String(noOfPax)}
            onChange={(e) => { setNoOfPax(e.target.value); setNoOfPaxError(""); }}
            min={0}
            step={1}
            required
          />
          {noOfPaxError && <p className="text-red-500 text-xs mt-1">{noOfPaxError}</p>}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Add any notes…"
          />
        </div>

        {/* Dynamic Extra Fields */}
        {formFields.map((f: any) => (
          <FormField
            key={f.id}
            label={f.label}
            type={f.type}
            required={f.required}
            options={f.options}
            value={extras[f.name] ?? ""}
            onChange={(e) => setExtras((prev) => ({ ...prev, [f.name]: e.target.value }))}
          />
        ))}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit">{initial ? "Save" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
};
