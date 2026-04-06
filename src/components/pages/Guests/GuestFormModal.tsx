// src/components/pages/Guests/GuestFormModal.tsx
import React, { useState, useEffect } from "react";
import { type Guest, useCreateGuest, useUpdateGuest } from "../../../api/hooks/useGuestsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useAuth } from "../../../api/hooks/useAuth";
import { useEventContext } from "../../../context/EventContext";
import { Modal } from "../../molecules/Modal";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import toast from "react-hot-toast";

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

// Handles both "+6012345678" (old) and "6012345678" (new, no + prefix)
function parsePhoneNo(phoneNo: string): { countryCode: string; phoneNumber: string } {
  if (!phoneNo) return { countryCode: "+60", phoneNumber: "" };
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  // With "+" prefix (old stored data)
  if (phoneNo.startsWith("+")) {
    for (const { code } of sorted) {
      if (phoneNo.startsWith(code)) {
        return { countryCode: code, phoneNumber: phoneNo.slice(code.length) };
      }
    }
    return { countryCode: "+60", phoneNumber: phoneNo };
  }
  // Without "+" prefix (new stored data, e.g. "6012345678")
  for (const { code } of sorted) {
    const digits = code.replace(/^\+/, "");
    if (phoneNo.startsWith(digits)) {
      return { countryCode: code, phoneNumber: phoneNo.slice(digits.length) };
    }
  }
  return { countryCode: "+60", phoneNumber: phoneNo };
}

const GUEST_TYPES = ["Family", "VIP", "Friend", "Other"] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest;
  eventId: string;
}

export const GuestFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  guest,
  eventId,
}) => {
  useAuth();
  const { event } = useEventContext()!;
  const createGuest = useCreateGuest(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const { data: tables = [] } = useTablesApi(eventId);

  const [guestName, setGuestName] = useState("");
  const [countryCode, setCountryCode] = useState("+60");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pax, setPax] = useState<number>(1);
  const [flag, setFlag] = useState("Family");
  const [notes, setNotes] = useState("");
  const [tableId, setTableId] = useState("");

  useEffect(() => {
    if (isOpen && guest) {
      setGuestName(guest.name || guest.guestName || "");
      const parsed = parsePhoneNo(guest.phoneNo || "");
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
      setPax(guest.pax ?? guest.noOfPax ?? 1);
      setFlag(guest.flag || guest.guestType || "Family");
      setNotes(guest.notes || guest.remarks || "");
      setTableId(guest.tableId || "");
    } else if (isOpen && !guest) {
      setGuestName("");
      setCountryCode("+60");
      setPhoneNumber("");
      setPax(1);
      setFlag("Family");
      setNotes("");
      setTableId("");
    }
  }, [isOpen, guest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      toast.error("Guest name is required");
      return;
    }

    const builtPhoneNo = phoneNumber.trim()
      ? `${countryCode.replace(/^\+/, "")}${phoneNumber.trim()}`
      : "";

    const doSave = async () => {
      if (guest) {
        const guestId = guest.guestId ?? guest.id;
        await updateGuest.mutateAsync({
          guestId,
          name: guestName.trim(),
          pax,
          phoneNo: builtPhoneNo,
          flag,
          notes: notes.trim(),
          tableId: tableId || undefined,
        });
        toast.success(`${guestName} updated successfully`);
      } else {
        const eventGuid = event?.id ?? eventId;
        await createGuest.mutateAsync({
          eventGuid,
          guestName: guestName.trim(),
          pax,
          phoneNo: builtPhoneNo,
          tableId: tableId || undefined,
        });
        toast.success(`${guestName} created successfully`);
      }
      onClose();
    };

    try {
      await doSave();
    } catch (err: any) {
      console.error("Guest save error:", err);
      if (err?.response?.status === 401) {
        try {
          await doSave();
          return;
        } catch { /* fall through to show error */ }
      }
      toast.error(`Failed to ${guest ? "update" : "create"} guest`);
    }
  };

  const isPending = createGuest.isPending || updateGuest.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={guest ? "Edit Guest" : "New Guest"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* RSVP decoupling notice — edit mode only */}
        {guest && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Changes here only update guest details and won't affect the original RSVP.
          </p>
        )}

        {/* Guest Name */}
        <FormField
          label="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
        />

        {/* Phone Number */}
        <div className="flex flex-col gap-1">
          <label className="block font-medium text-sm text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <div className="flex gap-2 items-stretch">
            <select
              className="border rounded p-2 bg-background"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {COUNTRY_CODES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <input
              type="tel"
              className="flex-1 border rounded p-2"
              placeholder="e.g. 123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/^\+/, ""))}
            />
          </div>
        </div>

        {/* Pax */}
        <FormField
          label="No of Pax"
          type="number"
          value={String(pax)}
          onChange={(e) => setPax(Math.max(1, parseInt(e.target.value, 10) || 1))}
          min={1}
          step={1}
        />

        {/* Guest Type (flag) — edit only */}
        {guest && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Guest Type
            </label>
            <div className="flex flex-wrap gap-2">
              {GUEST_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFlag(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    flag === type
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table Assignment */}
        <div className="flex flex-col gap-1">
          <label className="block font-medium">
            Table Assignment (Optional)
          </label>
          <select
            className="border rounded p-2 bg-background"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name} (Capacity: {table.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="block font-medium">
            Notes
          </label>
          <textarea
            className="w-full border rounded p-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special notes about this guest..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isPending}>
            {guest ? "Save Changes" : "Create Guest"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
