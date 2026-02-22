// src/components/pages/Wallet/TransactionFormModal.tsx
import React, { useState, useEffect } from "react";
import { Modal } from "../../molecules/Modal";
import { Button } from "../../atoms/Button";
import {
  TransactionType,
  TransactionCategory,
  PaymentStatus,
  type Transaction,
} from "../../../types/transaction";
import { CATEGORY_CONFIG, getAllCategories } from "../../../utils/categoryConfig";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../../../api/hooks/useTransactionApi";

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletGuid: string;
  eventGuid: string;
  transaction?: Transaction | null; // If provided, edit mode
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  walletGuid,
  eventGuid,
  transaction,
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.Debit);
  const [transactionName, setTransactionName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [category, setCategory] = useState<TransactionCategory>(TransactionCategory.Others);
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.Paid);
  const [dueDate, setDueDate] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const isEditMode = Boolean(transaction);

  // Load existing transaction data in edit mode
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setTransactionName(transaction.transactionName);
      setAmount(transaction.amount.toString());
      setTransactionDate(
        transaction.transactionDate
          ? new Date(transaction.transactionDate).toISOString().split("T")[0]
          : ""
      );
      setCategory(transaction.category);
      setVendorName(transaction.vendorName || "");
      setVendorContact(transaction.vendorContact || "");
      setPaymentStatus(transaction.paymentStatus || PaymentStatus.Paid);
      setDueDate(
        transaction.dueDate
          ? new Date(transaction.dueDate).toISOString().split("T")[0]
          : ""
      );
      setReferenceId(transaction.referenceId || "");
      setRemarks(transaction.remarks || "");
    } else {
      // Reset for create mode
      resetForm();
    }
    setErrors({});
  }, [transaction, isOpen]);

  const resetForm = () => {
    setType(TransactionType.Debit);
    setTransactionName("");
    setAmount("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setCategory(TransactionCategory.Others);
    setVendorName("");
    setVendorContact("");
    setPaymentStatus(PaymentStatus.Paid);
    setDueDate("");
    setReferenceId("");
    setRemarks("");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!transactionName.trim()) {
      newErrors.transactionName = "Transaction name is required";
    }

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }

    if (!transactionDate) {
      newErrors.transactionDate = "Transaction date is required";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const transactionData: Partial<Transaction> = {
      walletGuid,
      eventGuid,
      type,
      transactionName: transactionName.trim(),
      amount: parseFloat(amount),
      transactionDate,
      category,
      vendorName: vendorName.trim() || undefined,
      vendorContact: vendorContact.trim() || undefined,
      paymentStatus,
      dueDate: dueDate || undefined,
      referenceId: referenceId.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    try {
      if (isEditMode && transaction) {
        await updateTransaction.mutateAsync({
          ...transactionData,
          transactionGuid: transaction.transactionGuid,
        });
      } else {
        await createTransaction.mutateAsync(transactionData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  const handleClose = () => {
    if (!createTransaction.isPending && !updateTransaction.isPending) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Transaction" : "Add Transaction"}
      className="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isEditMode
            ? "Update transaction details"
            : "Record a new expense or income"}
        </p>

        {/* Transaction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transaction Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType(TransactionType.Debit)}
              className={`px-4 py-3 rounded-xl font-semibold text-sm border-2 flex items-center justify-center gap-2 transition ${
                type === TransactionType.Debit
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
              }`}
            >
              <span>📤</span> Debit (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.Credit)}
              className={`px-4 py-3 rounded-xl font-semibold text-sm border-2 flex items-center justify-center gap-2 transition ${
                type === TransactionType.Credit
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
              }`}
            >
              <span>📥</span> Credit (Income)
            </button>
          </div>
        </div>

        {/* Transaction Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction Name *
          </label>
          <input
            type="text"
            value={transactionName}
            onChange={(e) => setTransactionName(e.target.value)}
            placeholder="e.g. Venue Deposit Payment"
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
          {errors.transactionName && (
            <p className="text-red-500 text-xs mt-1">{errors.transactionName}</p>
          )}
        </div>

        {/* Amount & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
            {errors.transactionDate && (
              <p className="text-red-500 text-xs mt-1">{errors.transactionDate}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          >
            {getAllCategories().map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              return (
                <option key={cat} value={cat}>
                  {config.emoji} {config.label}
                </option>
              );
            })}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
          )}
        </div>

        {/* Vendor Section */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Vendor Information (Optional)
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Shangri-La Hotel"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Contact Number / Email
              </label>
              <input
                type="text"
                value={vendorContact}
                onChange={(e) => setVendorContact(e.target.value)}
                placeholder="e.g. +60 3-2074 3900"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus(PaymentStatus.Paid)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition ${
                paymentStatus === PaymentStatus.Paid
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              ✅ Paid
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus(PaymentStatus.Pending)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition ${
                paymentStatus === PaymentStatus.Pending
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              🕐 Pending
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus(PaymentStatus.Overdue)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition ${
                paymentStatus === PaymentStatus.Overdue
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              ⚠️ Overdue
            </button>
          </div>
        </div>

        {/* Due Date (for pending/overdue) */}
        {(paymentStatus === PaymentStatus.Pending ||
          paymentStatus === PaymentStatus.Overdue) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {/* Reference ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reference ID (Optional)
          </label>
          <input
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g. Invoice number, Receipt ID"
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional notes..."
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createTransaction.isPending || updateTransaction.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createTransaction.isPending || updateTransaction.isPending}
            className="flex-1"
          >
            {isEditMode ? "Update Transaction" : "Save Transaction"}
          </Button>
        </div>

        {(createTransaction.isError || updateTransaction.isError) && (
          <p className="text-red-500 text-sm text-center mt-2">
            Failed to save transaction. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
};
