// src/api/hooks/useWalletApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { WalletEndpoints } from "../endpoints";
import type {
  Wallet,
  WalletApiResponse,
  CreateWalletRequest,
  UpdateWalletRequest,
  DeleteWalletRequest,
} from "../../types/wallet";
import { getBudget, saveBudget, removeBudget } from "../../utils/walletStorage";

/**
 * Helper: Map backend wallet response to frontend wallet type
 * Backend uses 'budget', frontend uses 'totalBudget'
 */
function mapApiResponseToWallet(apiWallet: WalletApiResponse): Wallet {
  return {
    ...apiWallet,
    totalBudget: apiWallet.budget, // Map backend 'budget' to frontend 'totalBudget'
    currency: apiWallet.currency as any, // Cast to Currency enum
  };
}

/**
 * Fetch wallet for an event (list query pattern)
 * Maps backend 'budget' field to frontend 'totalBudget'
 */
export function useWalletsApi(eventId: string) {
  return useQuery<Wallet | null>({
    queryKey: ["wallet", eventId],
    queryFn: async () => {
      try {
        const response = await client.get(WalletEndpoints.getByEvent(eventId));
        
        // Handle both direct data and wrapped response formats
        const wallets = response.data?.data ?? response.data;
        
        // API returns array, get first wallet
        if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
          return null;
        }

        const apiWallet: WalletApiResponse = wallets[0];

        // Map backend response to frontend type (budget → totalBudget)
        const wallet = mapApiResponseToWallet(apiWallet);
        
        // Fallback to localStorage if backend doesn't have budget yet
        if (wallet.totalBudget === undefined || wallet.totalBudget === null) {
          const localBudget = getBudget(wallet.walletGuid);
          if (localBudget !== null) {
            wallet.totalBudget = localBudget;
          }
        }
        
        return wallet;
      } catch (error: any) {
        // If 404, wallet doesn't exist yet - return null
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
 * Fetch wallet by GUID (single item query pattern)
 * Maps backend 'budget' field to frontend 'totalBudget'
 */
export function useWalletApi(id: string, eventId: string) {
  return useQuery<Wallet | null>({
    queryKey: ["wallet", id],
    queryFn: async () => {
      try {
        const response = await client.get(
          WalletEndpoints.getByGuid(id, eventId)
        );
        
        const apiWallet: WalletApiResponse = response.data?.data ?? response.data;
        
        if (!apiWallet) {
          return null;
        }

        // Map backend response to frontend type (budget → totalBudget)
        const wallet = mapApiResponseToWallet(apiWallet);
        
        // Fallback to localStorage if backend doesn't have budget yet
        if (wallet.totalBudget === undefined || wallet.totalBudget === null) {
          const localBudget = getBudget(wallet.walletGuid);
          if (localBudget !== null) {
            wallet.totalBudget = localBudget;
          }
        }
        
        return wallet;
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
 * Create a new wallet
 * Frontend accepts totalBudget, sends as 'budget' to backend
 */
export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation<
    Wallet,
    Error,
    Omit<CreateWalletRequest, 'budget'> & { totalBudget?: number }
  >({
    mutationFn: async ({ totalBudget, ...restData }) => {
      // Map frontend 'totalBudget' to backend 'budget'
      const payload: CreateWalletRequest = {
        ...restData,
        budget: totalBudget,
      };
      
      const response = await client.post(WalletEndpoints.create, payload);
      const apiWallet: WalletApiResponse = response.data?.data ?? response.data;

      // Map backend response to frontend type (budget → totalBudget)
      const wallet = mapApiResponseToWallet(apiWallet);

      // Backup to localStorage for safety
      if (totalBudget !== undefined && wallet.walletGuid) {
        saveBudget(wallet.walletGuid, totalBudget);
      }

      return wallet;
    },
    onSuccess: (data) => {
      // Invalidate all wallet queries to refetch
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      // Also refetch immediately
      queryClient.refetchQueries({ queryKey: ["wallet", data.eventGuid] });
    },
  });
}

/**
 * Update an existing wallet
 * Frontend accepts totalBudget, sends as 'budget' to backend
 */
export function useUpdateWallet() {
  const queryClient = useQueryClient();

  return useMutation<
    Wallet,
    Error,
    Omit<UpdateWalletRequest, 'budget'> & { totalBudget?: number }
  >({
    mutationFn: async ({ totalBudget, ...restData }) => {
      // Map frontend 'totalBudget' to backend 'budget'
      const payload: UpdateWalletRequest = {
        ...restData,
        budget: totalBudget,
      };
      
      const response = await client.post(WalletEndpoints.update, payload);
      const apiWallet: WalletApiResponse = response.data?.data ?? response.data;

      // Map backend response to frontend type (budget → totalBudget)
      const wallet = mapApiResponseToWallet(apiWallet);

      // Update localStorage backup
      if (totalBudget !== undefined && wallet.walletGuid) {
        saveBudget(wallet.walletGuid, totalBudget);
      }

      return wallet;
    },
    onSuccess: (_data, variables) => {
      // Update API returns bool, not wallet — just invalidate to trigger a fresh GET
      queryClient.invalidateQueries({ queryKey: ["wallet", variables.eventGuid] });
    },
  });
}

/**
 * Delete a wallet
 */
export function useDeleteWallet() {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, DeleteWalletRequest>({
    mutationFn: async (walletData) => {
      const response = await client.post(WalletEndpoints.delete, walletData);
      const apiWallet: WalletApiResponse = response.data?.data ?? response.data;

      // Map backend response to frontend type
      const wallet = mapApiResponseToWallet(apiWallet);

      // Remove budget from localStorage
      if (wallet.walletGuid) {
        removeBudget(wallet.walletGuid);
      }

      return wallet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wallet", data.eventGuid] });
      queryClient.invalidateQueries({ queryKey: ["wallet", data.walletGuid] });
      // Also invalidate transactions
      queryClient.invalidateQueries({ queryKey: ["transactions", data.walletGuid] });
    },
  });
}

/**
 * @deprecated Use useWalletsApi instead
 * Backward compatibility alias
 */
export const useWalletByEvent = useWalletsApi;

/**
 * @deprecated Use useWalletApi instead
 * Backward compatibility alias
 */
export const useWalletByGuid = useWalletApi;
