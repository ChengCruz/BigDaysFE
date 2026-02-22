// src/types/transaction.ts

export const TransactionType = {
  Credit: 0, // Income/Refund
  Debit: 1,  // Expense
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionCategory = {
  Venue: 'Venue',
  Catering: 'Catering',
  Photography: 'Photography',
  Decoration: 'Decoration',
  Attire: 'Attire',
  Entertainment: 'Entertainment',
  Transport: 'Transport',
  Invitation: 'Invitation',
  Gifts: 'Gifts',
  Others: 'Others',
} as const;
export type TransactionCategory = typeof TransactionCategory[keyof typeof TransactionCategory];

export const PaymentStatus = {
  Paid: 'Paid',
  Pending: 'Pending',
  Overdue: 'Overdue',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// API Response Type 
export interface ApiTransaction {
  transactionGuid: string;
  walletGuid: string;
  eventGuid: string;
  type: TransactionType;
  transactionName: string;
  transactionDate: string | null;
  category: string;
  amount: number;
  referenceId?: string;
  remarks?: string; // Contains extended fields as JSON
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  lastUpdated: string;
}

// Frontend Type (with parsed extended fields)
export interface Transaction {
  transactionGuid: string;
  walletGuid: string;
  eventGuid: string;
  type: TransactionType;
  transactionName: string;
  transactionDate: string | null;
  category: TransactionCategory;
  amount: number;
  referenceId?: string;
  remarks?: string; // User's actual notes
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  lastUpdated: string;
  
  // Extended fields (parsed from remarks JSON, pending backend sync)
  vendorName?: string;
  vendorContact?: string;
  paymentStatus?: PaymentStatus;
  dueDate?: string | null;
}

// API Request Types
export interface CreateTransactionRequest {
  walletGuid: string;
  eventGuid: string;
  type: TransactionType;
  transactionName: string;
  transactionDate: string;
  category: string;
  amount: number;
  referenceId?: string;
  remarks?: string; // Will contain extended fields as JSON
}

export interface UpdateTransactionRequest {
  transactionGuid: string;
  walletGuid: string;
  eventGuid: string;
  type: TransactionType;
  transactionName: string;
  transactionDate: string;
  category: string;
  amount: number;
  referenceId?: string;
  remarks?: string; // Will contain extended fields as JSON
}

export interface DeleteTransactionRequest {
  transactionGuid: string;
  walletGuid: string;
  eventGuid: string;
}

// Extended fields structure stored in remarks
export interface TransactionExtendedData {
  _extended: {
    vendorName?: string;
    vendorContact?: string;
    paymentStatus?: PaymentStatus;
    dueDate?: string | null;
  };
  notes?: string; // User's actual remarks
}

// Category breakdown for statistics
export interface CategorySpending {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}
