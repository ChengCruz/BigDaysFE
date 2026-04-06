// src/components/pages/Crew/CrewFormModal.tsx
import { useState, useEffect } from "react";
import { Modal } from "../../molecules/Modal";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import { useCreateCrew, useUpdateCrew, type CrewMember } from "../../../api/hooks/useCrewApi";
import toast from "react-hot-toast";

interface CrewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CrewMember;
  eventId: string;
}

export function CrewFormModal({ isOpen, onClose, initialData, eventId }: CrewFormModalProps) {
  const isEdit = !!initialData;
  const createCrew = useCreateCrew();
  const updateCrew = useUpdateCrew();

  const [name, setName] = useState("");
  const [crewCode, setCrewCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? "");
      setCrewCode(initialData?.crewCode ?? "");
      setPin("");
      setConfirmPin("");
      setIsActive(initialData?.isActive ?? true);
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!isEdit) {
      // Create: PIN is required
      if (!pin) {
        setError("PIN is required.");
        return;
      }
      if (pin.length < 4 || pin.length > 6) {
        setError("PIN must be 4–6 digits.");
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match.");
        return;
      }
    } else if (pin) {
      // Edit: PIN is optional but if provided must be valid
      if (pin.length < 4 || pin.length > 6) {
        setError("PIN must be 4–6 digits.");
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match.");
        return;
      }
    }

    try {
      if (isEdit) {
        await updateCrew.mutateAsync({
          crewGuid: initialData!.crewGuid,
          name: name.trim(),
          isActive,
          ...(pin ? { pin } : {}),
        });
        toast.success(`${name} updated.`);
      } else {
        await createCrew.mutateAsync({
          name: name.trim(),
          ...(crewCode.trim() ? { crewCode: crewCode.trim() } : {}),
          pin,
          eventId,
        });
        toast.success(`${name} added to crew.`);
      }
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          if (isEdit) {
            await updateCrew.mutateAsync({
              crewGuid: initialData!.crewGuid,
              name: name.trim(),
              isActive,
              ...(pin ? { pin } : {}),
            });
            toast.success(`${name} updated.`);
          } else {
            await createCrew.mutateAsync({
              name: name.trim(),
              ...(crewCode.trim() ? { crewCode: crewCode.trim() } : {}),
              pin,
              eventId,
            });
            toast.success(`${name} added to crew.`);
          }
          onClose();
          return;
        } catch { /* fall through to show error */ }
      }
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const isPending = createCrew.isPending || updateCrew.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Crew Member" : "Add Crew Member"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John the Coordinator"
          required
        />

        {!isEdit && (
          <FormField
            label="Crew ID"
            type="text"
            value={crewCode}
            onChange={(e) => setCrewCode(e.target.value)}
            placeholder="Auto-generated if left blank"
            hint="A short code the crew member will use to log in (e.g. CR-001)"
          />
        )}

        {isEdit && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
            <span className="text-sm text-text/60 dark:text-white/40">Crew ID:</span>
            <span className="font-mono text-sm font-semibold">{initialData?.crewCode}</span>
          </div>
        )}

        <FormField
          label={isEdit ? "New PIN (leave blank to keep current)" : "PIN"}
          type="password"
          value={pin}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setPin(v);
          }}
          placeholder="4–6 digits"
          required={!isEdit}
        />

        {(pin || !isEdit) && (
          <FormField
            label="Confirm PIN"
            type="password"
            value={confirmPin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setConfirmPin(v);
            }}
            placeholder="Re-enter PIN"
            required={!isEdit || !!pin}
            inputMode="numeric"
          />
        )}

        {isEdit && (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  isActive ? "bg-primary" : "bg-gray-300 dark:bg-white/20"
                }`}
              />
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isActive ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-sm font-medium">{isActive ? "Active" : "Inactive"}</span>
          </label>
        )}

        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isPending} className="flex-1">
            {isPending ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save Changes" : "Add Crew Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
