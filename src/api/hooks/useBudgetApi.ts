// src/api/hooks/useBudgetApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { BudgetEndpoints } from "../endpoints";
import type {
  Budget,
  BudgetApiResponse,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  DeleteBudgetRequest,
} from "../../types/budget";
import { getBudget, saveBudget, removeBudget } from "../../utils/budgetStorage";

/**
 * Helper: Map backend Wallet response to frontend Budget type
 * Backend uses 'budget', frontend uses 'totalBudget'
 */
function mapApiResponseToBudget(apiBudget: BudgetApiResponse): Budget {
  return {
    ...apiBudget,
    totalBudget: apiBudget.budget, // Map backend 'budget' to frontend 'totalBudget'
    currency: apiBudget.currency as any, // Cast to Currency enum
  };
}

/**
 * Fetch budget for an event (list query pattern)
 * Maps backend 'budget' field to frontend 'totalBudget'
 */
export function useBudgetsApi(eventId: string) {
  return useQuery<Budget | null>({
    queryKey: ["budget", eventId],
    queryFn: async () => {
      try {
        const response = await client.get(BudgetEndpoints.getByEvent(eventId));

        // Handle both direct data and wrapped response formats
        const budgets = response.data?.data ?? response.data;

        // API returns array, get first budget
        if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {
          return null;
        }

        const apiBudget: BudgetApiResponse = budgets[0];

        // Map backend response to frontend type (budget → totalBudget)
        const budget = mapApiResponseToBudget(apiBudget);

        // Fallback to localStorage if backend doesn't have budget yet
        if (budget.totalBudget === undefined || budget.totalBudget === null) {
          const localBudget = getBudget(budget.walletGuid);
          if (localBudget !== null) {
            budget.totalBudget = localBudget;
          }
        }

        return budget;
      } catch (error: any) {
        // If 404, budget doesn't exist yet - return null
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(eventId),
    staleTime: 1 * 60_000, // Reduced to 1 minute
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Fetch budget by GUID (single item query pattern)
 * Maps backend 'budget' field to frontend 'totalBudget'
 */
export function useBudgetApi(id: string, eventId: string) {
  return useQuery<Budget | null>({
    queryKey: ["budget", id],
    queryFn: async () => {
      try {
        const response = await client.get(
          BudgetEndpoints.getByGuid(id, eventId)
        );

        const apiBudget: BudgetApiResponse = response.data?.data ?? response.data;

        if (!apiBudget) {
          return null;
        }

        // Map backend response to frontend type (budget → totalBudget)
        const budget = mapApiResponseToBudget(apiBudget);

        // Fallback to localStorage if backend doesn't have budget yet
        if (budget.totalBudget === undefined || budget.totalBudget === null) {
          const localBudget = getBudget(budget.walletGuid);
          if (localBudget !== null) {
            budget.totalBudget = localBudget;
          }
        }

        return budget;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(id) && Boolean(eventId),
  });
}

/**
 * Create a new budget
 * Frontend accepts totalBudget, sends as 'budget' to backend
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation<
    Budget,
    Error,
    Omit<CreateBudgetRequest, 'budget'> & { totalBudget?: number }
  >({
    mutationFn: async ({ totalBudget, ...restData }) => {
      // Map frontend 'totalBudget' to backend 'budget'
      const payload: CreateBudgetRequest = {
        ...restData,
        budget: totalBudget,
      };

      const response = await client.post(BudgetEndpoints.create, payload);
      const apiBudget: BudgetApiResponse = response.data?.data ?? response.data;

      // Map backend response to frontend type (budget → totalBudget)
      const budget = mapApiResponseToBudget(apiBudget);

      // Backup to localStorage for safety
      if (totalBudget !== undefined && budget.walletGuid) {
        saveBudget(budget.walletGuid, totalBudget);
      }

      return budget;
    },
    onSuccess: (data) => {
      // Invalidate all budget queries to refetch
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      // Also refetch immediately
      queryClient.refetchQueries({ queryKey: ["budget", data.eventGuid] });
    },
  });
}

/**
 * Update an existing budget
 * Frontend accepts totalBudget, sends as 'budget' to backend
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation<
    Budget,
    Error,
    Omit<UpdateBudgetRequest, 'budget'> & { totalBudget?: number }
  >({
    mutationFn: async ({ totalBudget, ...restData }) => {
      // Map frontend 'totalBudget' to backend 'budget'
      const payload: UpdateBudgetRequest = {
        ...restData,
        budget: totalBudget,
      };

      const response = await client.post(BudgetEndpoints.update, payload);
      const apiBudget: BudgetApiResponse = response.data?.data ?? response.data;

      // Map backend response to frontend type (budget → totalBudget)
      const budget = mapApiResponseToBudget(apiBudget);

      // Update localStorage backup
      if (totalBudget !== undefined && budget.walletGuid) {
        saveBudget(budget.walletGuid, totalBudget);
      }

      return budget;
    },
    onSuccess: (_data, variables) => {
      // Update API returns bool, not budget, so just invalidate to trigger a fresh GET
      queryClient.invalidateQueries({ queryKey: ["budget", variables.eventGuid] });
    },
  });
}

/**
 * Delete a budget
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation<Budget, Error, DeleteBudgetRequest>({
    mutationFn: async (budgetData) => {
      const response = await client.post(BudgetEndpoints.delete, budgetData);
      const apiBudget: BudgetApiResponse = response.data?.data ?? response.data;

      // Map backend response to frontend type
      const budget = mapApiResponseToBudget(apiBudget);

      // Remove budget from localStorage
      if (budget.walletGuid) {
        removeBudget(budget.walletGuid);
      }

      return budget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget", data.eventGuid] });
      queryClient.invalidateQueries({ queryKey: ["budget", data.walletGuid] });
      // Also invalidate transactions
      queryClient.invalidateQueries({ queryKey: ["transactions", data.walletGuid] });
    },
  });
}

/**
 * @deprecated Use useBudgetsApi instead
 * Backward compatibility alias
 */
export const useBudgetByEvent = useBudgetsApi;

/**
 * @deprecated Use useBudgetApi instead
 * Backward compatibility alias
 */
export const useBudgetByGuid = useBudgetApi;
