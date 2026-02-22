// src/components/pages/Wallet/ExportReportModal.tsx
import React, { useState } from "react";
import { Modal } from "../../molecules/Modal";
import { Button } from "../../atoms/Button";
import type { Transaction } from "../../../types/transaction";
import type { Wallet } from "../../../types/wallet";
import { CATEGORY_CONFIG } from "../../../utils/categoryConfig";
import { formatAmount, getTransactionTypeLabel } from "../../../utils/transactionUtils";
import { CURRENCY_CONFIG } from "../../../types/wallet";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  wallet: Wallet;
}

type ExportFormat = "csv" | "excel" | "pdf";

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  wallet,
}) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [includeTransactionDetails, setIncludeTransactionDetails] = useState(true);
  const [includeCategorySummary, setIncludeCategorySummary] = useState(true);
  const [includeVendorInfo, setIncludeVendorInfo] = useState(false);

  const filterTransactionsByDate = (txns: Transaction[]): Transaction[] => {
    if (!dateFrom && !dateTo) return txns;

    return txns.filter((txn) => {
      if (!txn.transactionDate) return false;
      
      const txnDate = new Date(txn.transactionDate);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      if (from && txnDate < from) return false;
      if (to && txnDate > to) return false;
      
      return true;
    });
  };

  const exportToCSV = () => {
    const filteredTransactions = filterTransactionsByDate(transactions);
    
    if (filteredTransactions.length === 0) {
      alert("No transactions to export with the selected date range.");
      return;
    }

    const currencySymbol = CURRENCY_CONFIG[wallet.currency].symbol;
    let csv = "";

    // Add header with metadata
    csv += `Event Wallet Report\n`;
    csv += `Currency: ${wallet.currency}\n`;
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Date Range: ${dateFrom || "All"} to ${dateTo || "All"}\n`;
    csv += `\n`;

    // Transaction Details
    if (includeTransactionDetails) {
      csv += `Transaction Details\n`;
      const headers = [
        "Date",
        "Transaction Name",
        "Type",
        "Category",
        includeVendorInfo ? "Vendor" : null,
        includeVendorInfo ? "Vendor Contact" : null,
        "Amount",
        "Status",
        "Reference ID",
        "Remarks",
      ].filter(Boolean);
      
      csv += headers.join(",") + "\n";

      filteredTransactions.forEach((txn) => {
        const row = [
          txn.transactionDate || "",
          `"${txn.transactionName.replace(/"/g, '""')}"`,
          getTransactionTypeLabel(txn.type),
          txn.category,
          includeVendorInfo ? `"${(txn.vendorName || "").replace(/"/g, '""')}"` : null,
          includeVendorInfo ? `"${(txn.vendorContact || "").replace(/"/g, '""')}"` : null,
          txn.amount,
          txn.paymentStatus || "",
          txn.referenceId || "",
          `"${(txn.remarks || "").replace(/"/g, '""')}"`,
        ].filter((v) => v !== null);
        
        csv += row.join(",") + "\n";
      });
      
      csv += `\n`;
    }

    // Category Summary
    if (includeCategorySummary) {
      csv += `Category Summary\n`;
      csv += `Category,Total Spent,Percentage,Transaction Count\n`;

      const categoryTotals = new Map<string, { amount: number; count: number }>();
      const totalSpending = filteredTransactions
        .filter((t) => t.type === 1) // Debit only
        .reduce((sum, t) => sum + t.amount, 0);

      filteredTransactions
        .filter((t) => t.type === 1)
        .forEach((txn) => {
          const existing = categoryTotals.get(txn.category) || { amount: 0, count: 0 };
          categoryTotals.set(txn.category, {
            amount: existing.amount + txn.amount,
            count: existing.count + 1,
          });
        });

      categoryTotals.forEach((data, category) => {
        const percentage = totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0;
        csv += `${category},${currencySymbol} ${data.amount.toFixed(2)},${percentage.toFixed(1)}%,${data.count}\n`;
      });
      
      csv += `\n`;
      csv += `Total Spending,${currencySymbol} ${totalSpending.toFixed(2)}\n`;
    }

    // Create download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wallet-report-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  const handleExport = () => {
    if (format === "csv") {
      exportToCSV();
    } else {
      // TODO: Implement Excel and PDF export
      alert(`${format.toUpperCase()} export coming soon!`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Report"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Download your transaction report
        </p>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                format === "csv"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5"
              }`}
            >
              <span className="text-2xl">📊</span>
              <span className={`text-sm font-medium ${format === "csv" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                CSV
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("excel")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                format === "excel"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5"
              }`}
            >
              <span className="text-2xl">📄</span>
              <span className={`text-sm font-medium ${format === "excel" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                Excel
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                format === "pdf"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5"
              }`}
            >
              <span className="text-2xl">📝</span>
              <span className={`text-sm font-medium ${format === "pdf" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                PDF
              </span>
            </button>
          </div>
          {format !== "csv" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Note: {format.toUpperCase()} export is coming soon. CSV is currently available.
            </p>
          )}
        </div>

        {/* Include Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Include in Report
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <input
                type="checkbox"
                checked={includeTransactionDetails}
                onChange={(e) => setIncludeTransactionDetails(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Transaction details
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <input
                type="checkbox"
                checked={includeCategorySummary}
                onChange={(e) => setIncludeCategorySummary(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Category summary
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <input
                type="checkbox"
                checked={includeVendorInfo}
                onChange={(e) => setIncludeVendorInfo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Vendor information
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleExport} className="flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-4 w-4 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};
