// src/utils/transactionUtils.ts
// Helper functions for parsing/serializing extended transaction fields
// NOTE: Extended fields are stored in remarks as JSON until backend API is updated

import {
  ApiTransaction,
  Transaction,
  TransactionExtendedData,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionCategory,
  PaymentStatus,
} from '../types/transaction';

/**
 * Parse API transaction response to frontend Transaction type
 * Extracts extended fields from remarks JSON
 */
export const parseTransaction = (apiTransaction: ApiTransaction): Transaction => {
  let extended: TransactionExtendedData = {
    _extended: {},
    notes: '',
  };

  // Try to parse extended data from remarks
  if (apiTransaction.remarks) {
    try {
      const parsed = JSON.parse(apiTransaction.remarks);
      if (parsed && typeof parsed === 'object' && '_extended' in parsed) {
        extended = parsed as TransactionExtendedData;
      } else {
        // If remarks is not our extended format, treat it as plain notes
        extended.notes = apiTransaction.remarks;
      }
    } catch {
      // If JSON parse fails, treat remarks as plain text notes
      extended.notes = apiTransaction.remarks;
    }
  }

  return {
    ...apiTransaction,
    category: apiTransaction.category as TransactionCategory,
    remarks: extended.notes || '',
    vendorName: extended._extended.vendorName,
    vendorContact: extended._extended.vendorContact,
    paymentStatus: extended._extended.paymentStatus,
    dueDate: extended._extended.dueDate,
  };
};

/**
 * Serialize frontend Transaction to API request format
 * Stores extended fields as JSON in remarks
 */
export const serializeTransactionForCreate = (
  transaction: Partial<Transaction>
): Omit<CreateTransactionRequest, 'remarks'> & { remarks: string } => {
  const extended: TransactionExtendedData = {
    _extended: {
      vendorName: transaction.vendorName,
      vendorContact: transaction.vendorContact,
      paymentStatus: transaction.paymentStatus,
      dueDate: transaction.dueDate,
    },
    notes: transaction.remarks || '',
  };

  return {
    walletGuid: transaction.walletGuid!,
    eventGuid: transaction.eventGuid!,
    type: transaction.type!,
    transactionName: transaction.transactionName!,
    transactionDate: transaction.transactionDate!,
    category: transaction.category!,
    amount: transaction.amount!,
    referenceId: transaction.referenceId,
    remarks: JSON.stringify(extended),
  };
};

/**
 * Serialize frontend Transaction to API update request format
 * Stores extended fields as JSON in remarks
 */
export const serializeTransactionForUpdate = (
  transaction: Partial<Transaction>
): Omit<UpdateTransactionRequest, 'remarks'> & { remarks: string } => {
  const extended: TransactionExtendedData = {
    _extended: {
      vendorName: transaction.vendorName,
      vendorContact: transaction.vendorContact,
      paymentStatus: transaction.paymentStatus,
      dueDate: transaction.dueDate,
    },
    notes: transaction.remarks || '',
  };

  return {
    transactionGuid: transaction.transactionGuid!,
    walletGuid: transaction.walletGuid!,
    eventGuid: transaction.eventGuid!,
    type: transaction.type!,
    transactionName: transaction.transactionName!,
    transactionDate: transaction.transactionDate!,
    category: transaction.category!,
    amount: transaction.amount!,
    referenceId: transaction.referenceId,
    remarks: JSON.stringify(extended),
  };
};

/**
 * Check if a transaction is overdue
 */
export const isTransactionOverdue = (transaction: Transaction): boolean => {
  if (transaction.paymentStatus !== PaymentStatus.Overdue) {
    return false;
  }
  
  if (!transaction.dueDate) {
    return false;
  }

  const dueDate = new Date(transaction.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dueDate < today;
};

/**
 * Format amount with currency symbol
 */
export const formatAmount = (amount: number, currencySymbol: string = 'RM'): string => {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${currencySymbol} ${formatted}`;
};

/**
 * Get display label for transaction type
 */
export const getTransactionTypeLabel = (type: number): string => {
  return type === 0 ? 'Credit' : 'Debit';
};
