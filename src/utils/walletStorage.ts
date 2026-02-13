// src/utils/walletStorage.ts
// Helper functions for storing wallet budget in localStorage
// NOTE: Used as backward compatibility fallback while backend is being updated
// Once backend fully supports totalBudget field, this will only serve as cache/fallback

const BUDGET_KEY_PREFIX = 'wallet-budget-';

export const saveBudget = (walletGuid: string, budget: number): void => {
  try {
    localStorage.setItem(`${BUDGET_KEY_PREFIX}${walletGuid}`, budget.toString());
  } catch (error) {
    console.error('Failed to save budget to localStorage:', error);
  }
};

export const getBudget = (walletGuid: string): number | null => {
  try {
    const budgetStr = localStorage.getItem(`${BUDGET_KEY_PREFIX}${walletGuid}`);
    if (budgetStr === null) return null;
    
    const budget = parseFloat(budgetStr);
    return isNaN(budget) ? null : budget;
  } catch (error) {
    console.error('Failed to read budget from localStorage:', error);
    return null;
  }
};

export const removeBudget = (walletGuid: string): void => {
  try {
    localStorage.removeItem(`${BUDGET_KEY_PREFIX}${walletGuid}`);
  } catch (error) {
    console.error('Failed to remove budget from localStorage:', error);
  }
};

export const hasBudget = (walletGuid: string): boolean => {
  return getBudget(walletGuid) !== null;
};
