// src/components/molecules/EventFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import {
  useCreateEvent,
  useUpdateEvent,
  type Event,
} from "../../api/hooks/useEventsApi";
import { FormError } from "./FormError";

interface EventFormModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onSuccess?: (evt: Event) => void;
  initial?: Event;
  className?: string;
}

/** Normalizes API date strings like '2025-09-04T00:00:00' to '2025-09-04' for <input type="date"> */
function toDateInputValue(raw?: string): string {
  if (!raw) return "";
  // If it's already YYYY-MM-DD, use as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Try to parse any other format and return local YYYY-MM-DD
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    // Fallback: slice the first 10 if the string looks ISO-like
    return raw.slice(0, 10);
  }
  // Adjust for timezone so date inputs don't shift
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initial,
  className = "",
}) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState<string>(toDateInputValue(initial?.date));
  const [noOfTable, setNoOfTable] = useState<number>(
    initial?.noOfTable ? Number(initial.noOfTable) : 0
  );
  const [description, setDescription] = useState(initial?.description || "");
  const [location, setLocation] = useState(initial?.location || "");

  const createEvt = useCreateEvent();
  const updateEvt = useUpdateEvent();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "");
      setDate(toDateInputValue(initial?.date));  // <-- normalize here
      setNoOfTable(initial?.noOfTable ? Number(initial.noOfTable) : 0);
      setDescription(initial?.description || "");
      setLocation(initial?.location || "");
      setError(null);
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initial) {
        const updated = await updateEvt.mutateAsync({
          eventID: initial.id,
          name: title,
          date, // already YYYY-MM-DD from input
          time: "",
          description,
          location,
          userID: 0,
          noOfTable,
        });
        onSuccess?.(updated);
      } else {
        const created = await createEvt.mutateAsync({
          name: title,
          date, // already YYYY-MM-DD
          description,
          location,
          userID: "0",
          noOfTable: noOfTable.toString(),
        });
        onSuccess?.(created);
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
      title={isEdit ? "Edit Event" : "New Event"}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}
        <FormField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <FormField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <FormField
          label="Number of Tables"
          type="number"
          value={noOfTable.toString()}
          onChange={(e) => setNoOfTable(Number(e.target.value))}
        />
        <FormField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createEvt.isPending || updateEvt.isPending}
          >
            {isEdit
              ? updateEvt.isPending
                ? "Saving…"
                : "Save"
              : createEvt.isPending
              ? "Creating…"
              : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
