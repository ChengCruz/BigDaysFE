// src/types/wallet.ts

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
export interface WalletApiResponse {
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
export interface Wallet {
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
export interface CreateWalletRequest {
  eventGuid: string;
  userId: string;
  currency: string;
  budget?: number; // Backend expects 'budget' field name
}

export interface UpdateWalletRequest {
  eventGuid: string;
  walletGuid: string;
  userId: string;
  currency: string;
  budget?: number; // Backend expects 'budget' field name
}

export interface DeleteWalletRequest {
  eventGuid: string;
  walletGuid: string;
  userId: string;
}

// Frontend types for wallet operations
export interface WalletWithBudget extends Wallet {
  totalBudget: number;
}

export interface WalletStatistics {
  totalBudget: number;
  currentSpending: number;
  remainingBudget: number;
  pendingPayments: number;
  budgetPercentageUsed: number;
}
