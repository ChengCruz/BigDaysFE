// src/components/pages/Guests/GuestFormModal.tsx
import React, { useState, useEffect } from "react";
import { type Guest } from "../../../api/hooks/useGuestsApi";
import { useCreateRsvp, useUpdateRsvp } from "../../../api/hooks/useRsvpsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useAuth } from "../../../api/hooks/useAuth";
import { Modal } from "../../molecules/Modal";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import toast from "react-hot-toast";

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
  const { user } = useAuth();
  const createRsvp = useCreateRsvp(eventId);
  const updateRsvp = useUpdateRsvp(eventId);
  const { data: tables = [] } = useTablesApi(eventId);

  const [guestName, setGuestName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [guestType, setGuestType] = useState("Family");
  const [remarks, setRemarks] = useState("");
  const [tableId, setTableId] = useState("");

  // Initialize form when modal opens or guest changes
  useEffect(() => {
    if (isOpen && guest) {
      setGuestName(guest.guestName || guest.name || "");
      setPhoneNo(guest.phoneNo || "");
      setGuestType(guest.guestType || "Family");
      setRemarks(guest.notes || "");
      setTableId(guest.tableId || "");
    } else if (isOpen && !guest) {
      // Reset for new guest
      setGuestName("");
      setPhoneNo("");
      setGuestType("Family");
      setRemarks("");
      setTableId("");
    }
  }, [isOpen, guest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      toast.error("Guest name is required");
      return;
    }

    const actor = user?.id ?? user?.name ?? "System";

    try {
      const payload = {
        eventId,
        guestName: guestName.trim(),
        phoneNo: phoneNo.trim(),
        guestType,
        remarks: remarks.trim(),
        tableId: tableId || undefined,
        status: "Yes", // Default status for guests
      };

      if (guest) {
        // Update existing guest
        await updateRsvp.mutateAsync({
          id: guest.rsvpId ?? guest.guestId ?? guest.id,
          ...payload,
          updatedBy: actor,
        });
        toast.success(`${guestName} updated successfully`);
      } else {
        // Create new guest
        await createRsvp.mutateAsync({
          ...payload,
          createdBy: actor,
        });
        toast.success(`${guestName} created successfully`);
      }

      onClose();
    } catch (err) {
      console.error("Guest save error:", err);
      toast.error(`Failed to ${guest ? "update" : "create"} guest`);
    }
  };

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

        {/* Guest Type */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Guest Type
          </label>
          <select
            className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-primary bg-white dark:bg-accent dark:border-white/10"
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

        {/* Table Assignment */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Table Assignment (Optional)
          </label>
          <select
            className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-primary bg-white dark:bg-accent dark:border-white/10"
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

        {/* Remarks */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Remarks / Notes
          </label>
          <textarea
            className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-primary bg-white dark:bg-accent dark:border-white/10"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Any special notes about this guest..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={createRsvp.isPending || updateRsvp.isPending}
          >
            {guest ? "Save Changes" : "Create Guest"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
