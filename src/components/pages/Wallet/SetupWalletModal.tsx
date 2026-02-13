// src/components/pages/Wallet/SetupWalletModal.tsx
import React, { useState, useEffect } from "react";
import { Modal } from "../../molecules/Modal";
import { Button } from "../../atoms/Button";
import { Currency, CURRENCY_CONFIG } from "../../../types/wallet";
import { useCreateWallet, useUpdateWallet } from "../../../api/hooks/useWalletApi";
import type { Wallet } from "../../../types/wallet";

interface SetupWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventGuid: string;
  userId: string;
  wallet?: Wallet | null; // If provided, edit mode
}

export const SetupWalletModal: React.FC<SetupWalletModalProps> = ({
  isOpen,
  onClose,
  eventGuid,
  userId,
  wallet,
}) => {
  const [currency, setCurrency] = useState<Currency>(Currency.MYR);
  const [totalBudget, setTotalBudget] = useState<string>("");
  const [errors, setErrors] = useState<{ currency?: string; budget?: string }>({});

  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();

  const isEditMode = Boolean(wallet);

  // Load existing wallet data in edit mode
  useEffect(() => {
    if (wallet) {
      setCurrency(wallet.currency as Currency);
      setTotalBudget(wallet.totalBudget?.toString() || "");
    } else {
      // Reset for create mode
      setCurrency(Currency.MYR);
      setTotalBudget("");
    }
    setErrors({});
  }, [wallet, isOpen]);

  const validate = (): boolean => {
    const newErrors: { currency?: string; budget?: string } = {};

    if (!currency) {
      newErrors.currency = "Please select a currency";
    }

    if (totalBudget) {
      const budgetNum = parseFloat(totalBudget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        newErrors.budget = "Budget must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const budgetValue = totalBudget ? parseFloat(totalBudget) : undefined;

    try {
      if (isEditMode && wallet) {
        console.log("Updating wallet:", { eventGuid, walletGuid: wallet.walletGuid, userId, currency, totalBudget: budgetValue });
        await updateWallet.mutateAsync({
          eventGuid,
          walletGuid: wallet.walletGuid,
          userId,
          currency,
          totalBudget: budgetValue,
        });
      } else {
        console.log("Creating wallet:", { eventGuid, userId, currency, totalBudget: budgetValue });
        const result = await createWallet.mutateAsync({
          eventGuid,
          userId,
          currency,
          totalBudget: budgetValue,
        });
        console.log("Wallet created successfully:", result);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save wallet:", error);
      alert("Failed to save wallet: " + (error as Error).message);
    }
  };

  const handleClose = () => {
    if (!createWallet.isPending && !updateWallet.isPending) {
      onClose();
    }
  };

  const suggestedAllocation = [
    { label: "Venue", percentage: "30%" },
    { label: "Catering", percentage: "25%" },
    { label: "Photography", percentage: "15%" },
    { label: "Decoration", percentage: "10%" },
    { label: "Attire", percentage: "10%" },
    { label: "Others", percentage: "10%" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Update Wallet" : "Setup Wallet"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isEditMode
            ? "Update your wallet configuration"
            : "Configure your event budget and currency"}
        </p>

        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency *
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          >
            {Object.values(Currency).map((curr) => {
              const config = CURRENCY_CONFIG[curr];
              return (
                <option key={curr} value={curr}>
                  {config.flag} {curr} - {config.label}
                </option>
              );
            })}
          </select>
          {errors.currency && (
            <p className="text-red-500 text-xs mt-1">{errors.currency}</p>
          )}
        </div>

        {/* Total Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total Budget (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {CURRENCY_CONFIG[currency].symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="50000"
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set your maximum budget for this event
          </p>
          {errors.budget && (
            <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
          )}
        </div>

        {/* Suggested Budget Allocation */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            💡 Suggested Budget Allocation
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            {suggestedAllocation.map((item) => (
              <div key={item.label} className="flex justify-between">
                <span>{item.label}:</span>
                <span className="font-medium">{item.percentage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createWallet.isPending || updateWallet.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createWallet.isPending || updateWallet.isPending}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
          >
            {isEditMode ? "Update Wallet" : "Create Wallet"}
          </Button>
        </div>

        {(createWallet.isError || updateWallet.isError) && (
          <p className="text-red-500 text-sm text-center mt-2">
            Failed to save wallet. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
};
