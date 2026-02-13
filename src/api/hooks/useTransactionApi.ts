// src/api/hooks/useTransactionApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { TransactionEndpoints } from "../endpoints";
import type {
  Transaction,
  ApiTransaction,
  DeleteTransactionRequest,
} from "../../types/transaction";
import {
  parseTransaction,
  serializeTransactionForCreate,
  serializeTransactionForUpdate,
} from "../../utils/transactionUtils";

/**
 * Fetch all transactions for a wallet (list query pattern)
 * Automatically parses extended fields from remarks
 */
export function useTransactionsApi(walletId: string, eventId: string) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", walletId],
    queryFn: async () => {
      try {
        const response = await client.get(
          TransactionEndpoints.getByWallet(walletId, eventId)
        );
        
        // Handle wrapped response format
        const apiTransactions = response.data?.data ?? response.data;
        
        if (!apiTransactions || !Array.isArray(apiTransactions)) {
          return [];
        }

        // Parse each transaction to extract extended fields
        return apiTransactions.map((apiTransaction: ApiTransaction) =>
          parseTransaction(apiTransaction)
        );
      } catch (error: any) {
        // Return empty array if not found
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: Boolean(walletId) && Boolean(eventId),
    staleTime: 2 * 60_000, // Cache for 2 minutes
  });
}

/**
 * Fetch a single transaction by ID (single item query pattern)
 */
export function useTransactionApi(id: string, eventId: string) {
  return useQuery<Transaction | null>({
    queryKey: ["transaction", id],
    queryFn: async () => {
      try {
        const response = await client.get(
          TransactionEndpoints.getById(id, eventId)
        );
        
        const apiTransaction = response.data?.data ?? response.data;
        
        if (!apiTransaction) {
          return null;
        }

        return parseTransaction(apiTransaction);
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
 * Create a new transaction
 * Automatically serializes extended fields to remarks
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, Partial<Transaction>>({
    mutationFn: async (transactionData) => {
      // Serialize transaction with extended fields
      const payload = serializeTransactionForCreate(transactionData);
      
      const response = await client.post(TransactionEndpoints.create, payload);
      
      // API returns the new transaction GUID
      return response.data?.data ?? response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      if (variables.walletGuid && variables.eventGuid) {
        queryClient.invalidateQueries({
          queryKey: ["transactions", variables.walletGuid],
        });
        queryClient.invalidateQueries({
          queryKey: ["wallet", variables.eventGuid],
        });
      }
    },
  });
}

/**
 * Update an existing transaction
 * Automatically serializes extended fields to remarks
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, Partial<Transaction>>({
    mutationFn: async (transactionData) => {
      // Serialize transaction with extended fields
      const payload = serializeTransactionForUpdate(transactionData);
      
      const response = await client.post(TransactionEndpoints.update, payload);
      
      return response.data?.data ?? response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      if (variables.walletGuid && variables.eventGuid) {
        queryClient.invalidateQueries({
          queryKey: ["transactions", variables.walletGuid],
        });
        queryClient.invalidateQueries({
          queryKey: ["transaction", variables.transactionGuid],
        });
        queryClient.invalidateQueries({
          queryKey: ["wallet", variables.eventGuid],
        });
      }
    },
  });
}

/**
 * Delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DeleteTransactionRequest>({
    mutationFn: async (transactionData) => {
      const response = await client.post(TransactionEndpoints.delete, transactionData);
      return response.data?.data ?? response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: ["transactions", variables.walletGuid],
      });
      queryClient.invalidateQueries({
        queryKey: ["transaction", variables.transactionGuid],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", variables.eventGuid],
      });
    },
  });
}

/**
 * @deprecated Use useTransactionsApi instead
 * Backward compatibility alias
 */
export const useTransactionsByWallet = useTransactionsApi;

/**
 * @deprecated Use useTransactionApi instead
 * Backward compatibility alias
 */
export const useTransaction = useTransactionApi;
