// src/components/molecules/RsvpFormModal.tsx
import React, { useState, useEffect } from "react";
import { type Rsvp, type CreateRsvpInput } from "../../api/hooks/useRsvpsApi";
import { useAuth } from "../../api/hooks/useAuth";
import { useEventRsvpInternal } from "../../api/hooks/useEventsApi";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";

const COUNTRY_CODES = [
  { code: "+60", label: "🇲🇾 +60" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+62", label: "🇮🇩 +62" },
  { code: "+66", label: "🇹🇭 +66" },
  { code: "+63", label: "🇵🇭 +63" },
  { code: "+84", label: "🇻🇳 +84" },
  { code: "+95", label: "🇲🇲 +95" },
  { code: "+855", label: "🇰🇭 +855" },
  { code: "+856", label: "🇱🇦 +856" },
  { code: "+673", label: "🇧🇳 +673" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+966", label: "🇸🇦 +966" },
];

function parsePhoneNo(phoneNo: string): { countryCode: string; phoneNumber: string } {
  if (!phoneNo) return { countryCode: "+60", phoneNumber: "" };
  if (!phoneNo.startsWith("+")) return { countryCode: "+60", phoneNumber: phoneNo };
  // Try longest match first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of sorted) {
    if (phoneNo.startsWith(code)) {
      return { countryCode: code, phoneNumber: phoneNo.slice(code.length) };
    }
  }
  return { countryCode: "+60", phoneNumber: phoneNo };
}

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
  const [countryCode, setCountryCode] = useState(() => parsePhoneNo(initial?.phoneNo ?? "").countryCode);
  const [phoneNumber, setPhoneNumber] = useState(() => parsePhoneNo(initial?.phoneNo ?? "").phoneNumber);
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");

  const [extras, setExtras] = useState<Record<string, string>>({});
  const { data: formFields = [] } = useEventRsvpInternal(eventId);
  const [initialized, setInitialized] = useState(false);
  const [guestNameError, setGuestNameError] = useState("");
  const [phoneNoError, setPhoneNoError] = useState("");
  const [noOfPaxError, setNoOfPaxError] = useState("");

  useEffect(() => {
    if (isOpen && !initialized) {
      setGuestName(initial?.guestName ?? initial?.name ?? "");
      setNoOfPax(initial?.noOfPax ?? 1);
      const parsed = parsePhoneNo(initial?.phoneNo ?? "");
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
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

    if (!phoneNumber.trim()) {
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
      phoneNo: `${countryCode}${phoneNumber.trim()}`,
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Guest Name */}
        <FormField
          label="Guest Name"
          value={guestName}
          onChange={(e) => { setGuestName(e.target.value); setGuestNameError(""); }}
          required
          error={guestNameError}
        />

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label className="block font-medium">
            Phone <span className="ml-1 text-red-600">*</span>
          </label>
          <div className="flex gap-2 items-stretch">
            <select
              className="border rounded p-2 bg-background disabled:opacity-60 disabled:cursor-not-allowed"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {COUNTRY_CODES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <input
              type="tel"
              className={`flex-1 border rounded p-2 disabled:opacity-60 disabled:cursor-not-allowed ${phoneNoError ? "border-red-500" : ""}`}
              placeholder="e.g. 123456789"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setPhoneNoError(""); }}
            />
          </div>
          {phoneNoError && <p className="text-xs text-red-600">{phoneNoError}</p>}
        </div>

        {/* No of Pax */}
        <FormField
          label="No of Pax"
          type="number"
          value={String(noOfPax)}
          onChange={(e) => { setNoOfPax(e.target.value); setNoOfPaxError(""); }}
          min={0}
          step={1}
          required
          error={noOfPaxError}
        />

        {/* Dynamic Extra Fields */}
        {formFields.map((f: any) => (
          <FormField
            key={f.id}
            label={f.label}
            type={f.typeKey ?? f.type}
            required={f.isRequired ?? f.required}
            options={f.options}
            value={extras[f.name] ?? ""}
            onChange={(e) => setExtras((prev) => ({ ...prev, [f.name]: e.target.value }))}
          />
        ))}

        {/* Remarks */}
        <FormField
          label="Remarks"
          type="textarea"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder="Add any notes…"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit">{initial ? "Save" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
};
