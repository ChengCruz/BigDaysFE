// src/components/molecules/UserFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { useCreateUser, useUpdateUser } from "../../api/hooks/useUsersApi";
import { FormError } from "./FormError";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: { id: string; name: string; email: string };
}

export const UserFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initial,
}) => {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(initial?.id || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || "");
      setEmail(initial?.email || "");
    }
  }, [isOpen, initial]);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, email };
    try {
      if (isEdit && initial) {
        await updateUser.mutateAsync(data);
      } else {
        await createUser.mutateAsync(data);
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
      title={isEdit ? "Edit User" : "New User"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}
        <FormField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
