import React, { useState, useEffect } from "react";
import { Modal } from "../../molecules/Modal";
import { Button } from "../../atoms/Button";
import { type Guest, useRecordGift } from "../../../api/hooks/useGuestsApi";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  currentAmount: number | null;
  eventGuid: string;
  eventId: string;
  currencySymbol: string;
}

export const GiftFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  guest,
  currentAmount,
  eventGuid,
  eventId,
  currencySymbol,
}) => {
  const [amount, setAmount] = useState<string>("");
  const recordGift = useRecordGift(eventId);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount != null ? String(currentAmount) : "");
    }
  }, [isOpen, currentAmount]);

  if (!guest) return null;

  const guestName = guest.guestName ?? guest.name;

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (amount.trim() === "" || isNaN(parsed) || parsed < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    recordGift.mutate(
      { guestId: guest.guestId ?? guest.id, eventGuid, amount: parsed },
      {
        onSuccess: (res) => {
          const msg = res?.message ?? (parsed === 0 ? "Gift cleared" : "Gift recorded");
          toast.success(msg);
          onClose();
        },
        onError: () => toast.error("Failed to record gift"),
      }
    );
  };

  const handleClear = () => {
    recordGift.mutate(
      { guestId: guest.guestId ?? guest.id, eventGuid, amount: 0 },
      {
        onSuccess: () => {
          toast.success("Gift cleared");
          onClose();
        },
        onError: () => toast.error("Failed to clear gift"),
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentAmount != null ? "Edit Gift" : "Record Gift"}
      className="max-w-sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recording gift from <span className="font-semibold text-gray-900 dark:text-white">{guestName}</span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gift Amount
          </label>
          <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-accent focus-within:ring-2 focus-within:ring-primary/20">
            <span className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-white/10 select-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <div>
            {currentAmount != null && (
              <Button
                variant="secondary"
                onClick={handleClear}
                loading={recordGift.isPending}
                type="button"
              >
                Clear Gift
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={recordGift.isPending}
              type="button"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
