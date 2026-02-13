// src/components/pages/Wallet/DeleteTransactionModal.tsx
import React from "react";
import { Button } from "../../atoms/Button";
import type { Transaction } from "../../../types/transaction";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  transaction,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6 text-red-600 dark:text-red-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Delete Transaction?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                  {transaction.transactionName}
                </p>
                {transaction.vendorName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Vendor: {transaction.vendorName}
                  </p>
                )}
                {transaction.referenceId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ref: {transaction.referenceId}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${
                  transaction.type === 1
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {transaction.type === 1 ? "-" : "+"} {transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {transaction.category}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Are you sure you want to delete this transaction? This will permanently remove it from your records.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Deleting...
              </div>
            ) : (
              "Delete Transaction"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
