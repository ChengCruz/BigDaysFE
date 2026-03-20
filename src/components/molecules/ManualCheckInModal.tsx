import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";
import { useCheckInScanApi } from "../../api/hooks/useQrApi";
import type { CheckInResult } from "../../types/qr";
import { FormError } from "./FormError";

interface ManualCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: CheckInResult) => void;
}

export const ManualCheckInModal: React.FC<ManualCheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const checkIn = useCheckInScanApi();

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = "Email cannot be empty.";
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    try {
      const result = await checkIn.mutateAsync(email);
      onSuccess?.(result);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Check In">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          placeholder="guest@example.com"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled>
            Check In
            <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Soon</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
