// src/types/budget.ts
// NOTE: The backend entity is still named "Wallet" (see MyBigDays_Mono), so `walletGuid`
// fields below are kept as-is to match the wire contract; only the frontend-facing
// names (Budget, BudgetApiResponse, etc.) are renamed.

export const Currency = {
  MYR: 'MYR',
  USD: 'USD',
  SGD: 'SGD',
  IDR: 'IDR',
} as const;
export type Currency = typeof Currency[keyof typeof Currency];

export const CURRENCY_CONFIG: Record<Currency, { flag: string; label: string; symbol: string }> = {
  [Currency.MYR]: { flag: '🇲🇾', label: 'Malaysian Ringgit', symbol: 'RM' },
  [Currency.USD]: { flag: '🇺🇸', label: 'US Dollar', symbol: '$' },
  [Currency.SGD]: { flag: '🇸🇬', label: 'Singapore Dollar', symbol: 'S$' },
  [Currency.IDR]: { flag: '🇮🇩', label: 'Indonesian Rupiah', symbol: 'Rp' },
};

// Backend API Response Type (raw from backend)
export interface BudgetApiResponse {
  walletGuid: string;
  eventGuid: string;
  userId: string;
  currency: string;
  budget?: number; // Backend uses 'budget' field name
  isDeleted: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

// Frontend Type (normalized)
export interface Budget {
  walletGuid: string;
  eventGuid: string;
  userId: string;
  currency: Currency;
  totalBudget?: number; // Frontend uses 'totalBudget' (mapped from backend 'budget')
  isDeleted: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

// API Request Types
export interface CreateBudgetRequest {
  eventGuid: string;
  userId: string;
  currency: string;
  budget?: number; // Backend expects 'budget' field name
}

export interface UpdateBudgetRequest {
  eventGuid: string;
  walletGuid: string;
  userId: string;
  currency: string;
  budget?: number; // Backend expects 'budget' field name
}

export interface DeleteBudgetRequest {
  eventGuid: string;
  walletGuid: string;
  userId: string;
}

// Frontend types for budget operations
export interface BudgetWithAmount extends Budget {
  totalBudget: number;
}

export interface BudgetStatistics {
  totalBudget: number;
  currentSpending: number;
  remainingBudget: number;
  pendingPayments: number;
  budgetPercentageUsed: number;
}
