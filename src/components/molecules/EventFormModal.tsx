// src/components/molecules/EventFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button }    from "../atoms/Button";
import { useCreateEvent, useUpdateEvent } from "../../api/hooks/useEventsApi";
import { FormError } from "./FormError";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: { id: string; title: string; date: string };
}

export const EventFormModal: React.FC<Props> = ({ isOpen, onClose, initial }) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate]   = useState(initial?.date || "");
  const createEvt = useCreateEvent();
  const updateEvt = useUpdateEvent(initial?.id || "");
const [error, setError] = useState<string | null>(null);

  // reset when opening
  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "");
      setDate(initial?.date || "");
      setError(null);

    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initial) {
        await updateEvt.mutateAsync({ title, date });
      } else {
        await createEvt.mutateAsync({ title, date });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong.");

    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Event" : "New Event"}>
      <form onSubmit={handleSubmit} className="space-y-4">
         {error && <FormError message={error} />}
        <FormField
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <FormField
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
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
            {isEdit ? (updateEvt.isPending ? "Saving…" : "Save") : (createEvt.isPending ? "Creating…" : "Create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
