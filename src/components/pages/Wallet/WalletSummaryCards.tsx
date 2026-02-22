// src/components/pages/Wallet/WalletSummaryCards.tsx
import React from "react";
import type { Wallet } from "../../../types/wallet";
import type { Transaction } from "../../../types/transaction";
import { TransactionType, PaymentStatus } from "../../../types/transaction";
import { CURRENCY_CONFIG } from "../../../types/wallet";
import { formatAmount } from "../../../utils/transactionUtils";

interface WalletSummaryCardsProps {
  wallet: Wallet;
  transactions: Transaction[];
  onEditBudget: () => void;
}

export const WalletSummaryCards: React.FC<WalletSummaryCardsProps> = ({
  wallet,
  transactions,
  onEditBudget,
}) => {
  const currencySymbol = CURRENCY_CONFIG[wallet.currency].symbol;

  // Calculate current spending (sum of all debit transactions)
  const currentSpending = transactions
    .filter((t) => t.type === TransactionType.Debit)
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate pending payments (sum of pending/overdue transactions)
  const pendingPayments = transactions
    .filter(
      (t) =>
        t.type === TransactionType.Debit &&
        (t.paymentStatus === PaymentStatus.Pending ||
          t.paymentStatus === PaymentStatus.Overdue)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = transactions.filter(
    (t) =>
      t.type === TransactionType.Debit &&
      (t.paymentStatus === PaymentStatus.Pending ||
        t.paymentStatus === PaymentStatus.Overdue)
  ).length;

  // Calculate remaining budget
  const totalBudget = wallet.totalBudget || 0;
  const remainingBudget = totalBudget - currentSpending;
  const budgetPercentageUsed =
    totalBudget > 0 ? (currentSpending / totalBudget) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Budget Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-xl shadow-primary/20 cursor-pointer hover:shadow-2xl transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-white/20 font-medium">
            {wallet.currency}
          </span>
        </div>
        <p className="text-sm text-white/80 font-medium">Total Budget</p>
        <p className="text-3xl font-bold mt-1">
          {totalBudget > 0
            ? formatAmount(totalBudget, currencySymbol)
            : "Not Set"}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
          <button
            onClick={onEditBudget}
            className="hover:text-white transition-colors"
          >
            ✏️ Click to {totalBudget > 0 ? "edit" : "set"} budget
          </button>
        </div>
      </div>

      {/* Current Spending Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 grid place-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6 text-red-600 dark:text-red-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
              />
            </svg>
          </div>
          {totalBudget > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">
              {budgetPercentageUsed.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Current Spending
        </p>
        <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
          {formatAmount(currentSpending, currencySymbol)}
        </p>
        {totalBudget > 0 && (
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(budgetPercentageUsed, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Remaining Budget Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 grid place-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          {totalBudget > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
              {(100 - budgetPercentageUsed).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Remaining Budget
        </p>
        <p
          className={`text-3xl font-bold mt-1 ${
            totalBudget > 0
              ? remainingBudget >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {totalBudget > 0
            ? formatAmount(remainingBudget, currencySymbol)
            : "N/A"}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          {totalBudget > 0 ? (
            remainingBudget >= 0 ? (
              <>
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                <span className="text-gray-500 dark:text-gray-400">On track</span>
              </>
            ) : (
              <>
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                <span className="text-red-600 dark:text-red-400">Over budget</span>
              </>
            )
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Set budget to track</span>
          )}
        </div>
      </div>

      {/* Pending Payments Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 grid place-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6 text-amber-600 dark:text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
              {pendingCount} item{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Pending Payments
        </p>
        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {formatAmount(pendingPayments, currencySymbol)}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          {transactions.filter((t) => t.paymentStatus === PaymentStatus.Overdue).length > 0 && (
            <span>
              ⚠️{" "}
              {transactions.filter((t) => t.paymentStatus === PaymentStatus.Overdue).length}{" "}
              overdue payment{transactions.filter((t) => t.paymentStatus === PaymentStatus.Overdue).length !== 1 ? "s" : ""}
            </span>
          )}
          {pendingCount === 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">✓ All paid</span>
          )}
        </div>
      </div>
    </div>
  );
};
