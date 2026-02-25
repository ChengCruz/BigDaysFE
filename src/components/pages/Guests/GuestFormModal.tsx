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
  const [phoneNo, setPhoneNo] = useState("");
  const [pax, setPax] = useState<number>(1);
  const [flag, setFlag] = useState("Family");
  const [notes, setNotes] = useState("");
  const [tableId, setTableId] = useState("");

  useEffect(() => {
    if (isOpen && guest) {
      setGuestName(guest.name || guest.guestName || "");
      setPhoneNo(guest.phoneNo || "");
      setPax(guest.pax ?? guest.noOfPax ?? 1);
      setFlag(guest.flag || guest.guestType || "Family");
      setNotes(guest.notes || guest.remarks || "");
      setTableId(guest.tableId || "");
    } else if (isOpen && !guest) {
      setGuestName("");
      setPhoneNo("");
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

    try {
      if (guest) {
        const guestId = guest.guestId ?? guest.id;
        await updateGuest.mutateAsync({
          guestId,
          name: guestName.trim(),
          pax,
          phoneNo: phoneNo.trim(),
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
          phoneNo: phoneNo.trim(),
          tableId: tableId || undefined,
        });
        toast.success(`${guestName} created successfully`);
      }
      onClose();
    } catch (err) {
      console.error("Guest save error:", err);
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
        {/* Guest Name */}
        <FormField
          label="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
        />

        {/* Phone Number */}
        <FormField
          label="Phone Number"
          value={phoneNo}
          onChange={(e) => setPhoneNo(e.target.value)}
          type="text"
        />

        {/* Pax */}
        <FormField
          label="Number of Pax"
          type="number"
          value={String(pax)}
          onChange={(e) => setPax(Math.max(1, parseInt(e.target.value, 10) || 1))}
          min={1}
          step={1}
        />

        {/* Guest Type (flag) — edit only, not in CreateGuestRequest */}
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
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Table Assignment (Optional)
          </label>
          <select
            className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600"
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
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            className="w-full border rounded-xl p-2 text-sm focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600"
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
