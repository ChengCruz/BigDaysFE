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
  /** now receives the just‐created or updated event */
  onSuccess?: (evt: Event) => void;
  /** when editing, pass the existing event here */
  initial?: Event;
  className?: string;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  title,
  onClose,
  onSuccess,
  initial,
  className = "",
}) => {
  const [name, setName] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || "");
  const createEvt = useCreateEvent();
  const updateEvt = useUpdateEvent(initial?.id || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initial?.title || "");
      setDate(initial?.date || "");
      setError(null);
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initial) {
        const updated = await updateEvt.mutateAsync({ title: name, date });
        onSuccess?.(updated);
      } else {
        const created = await createEvt.mutateAsync({ title: name, date });
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
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
