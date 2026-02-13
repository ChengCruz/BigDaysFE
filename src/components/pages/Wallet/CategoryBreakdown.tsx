// src/components/pages/Wallet/CategoryBreakdown.tsx
import React from "react";
import type { Transaction } from "../../../types/transaction";
import { TransactionType, TransactionCategory } from "../../../types/transaction";
import { CATEGORY_CONFIG, getCategoryConfig } from "../../../utils/categoryConfig";
import { formatAmount } from "../../../utils/transactionUtils";
import type { Wallet } from "../../../types/wallet";
import { CURRENCY_CONFIG } from "../../../types/wallet";

interface CategoryBreakdownProps {
  wallet: Wallet;
  transactions: Transaction[];
}

interface CategoryData {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  wallet,
  transactions,
}) => {
  const currencySymbol = CURRENCY_CONFIG[wallet.currency].symbol;

  // Calculate total spending (debit only)
  const totalSpending = transactions
    .filter((t) => t.type === TransactionType.Debit)
    .reduce((sum, t) => sum + t.amount, 0);

  // Group transactions by category
  const categoryMap = new Map<TransactionCategory, { amount: number; count: number }>();

  transactions
    .filter((t) => t.type === TransactionType.Debit)
    .forEach((txn) => {
      const existing = categoryMap.get(txn.category) || { amount: 0, count: 0 };
      categoryMap.set(txn.category, {
        amount: existing.amount + txn.amount,
        count: existing.count + 1,
      });
    });

  // Convert to array and sort by amount (descending)
  const categoryData: CategoryData[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (categoryData.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          📊 Spending by Category
        </h3>
        <div className="p-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No spending data yet. Start adding transactions to see your spending breakdown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        📊 Spending by Category
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryData.map(({ category, amount, percentage, transactionCount }) => {
          const config = getCategoryConfig(category);
          const progressColor = config.color;

          return (
            <div
              key={category}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{config.emoji}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {config.label}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {formatAmount(amount, currencySymbol)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-${progressColor}-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}

        {/* Show empty placeholders for categories with no spending */}
        {Object.values(TransactionCategory)
          .filter((cat) => !categoryMap.has(cat))
          .slice(0, Math.max(0, 6 - categoryData.length))
          .map((category) => {
            const config = getCategoryConfig(category);
            return (
              <div
                key={category}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 opacity-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{config.emoji}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {config.label}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {currencySymbol} 0.00
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: "0%" }} />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">0%</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
