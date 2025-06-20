// src/components/molecules/ImportRsvpsModal.tsx
import React, { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import { Spinner } from "../atoms/Spinner";
import { useImportRsvps } from "../../api/hooks/useImportRsvps";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export const ImportRsvpsModal: React.FC<Props> = ({ isOpen, onClose, eventId }) => {
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync, isPending, isError, error } = useImportRsvps(eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      await mutateAsync(file);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import RSVPs">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {isError && <div className="text-red-500">{(error as any).message}</div>}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isPending}>
            Upload {isPending && <Spinner />}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
