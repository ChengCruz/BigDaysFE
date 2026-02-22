import { useQuery } from "@tanstack/react-query";
import client from "../client";
import { DashboardEndpoints } from "../endpoints";
import type { ApiDashboardSummary, DashboardSummary } from "../../types/dashboard";
import { toDashboardSummary } from "../../types/dashboard";

type ApiResponse<T> = {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errorCode?: string | null;
};

/**
 * Get dashboard summary for a specific event
 * @param eventGuid - The event GUID
 * @returns Dashboard summary with stats and recent activity
 */
export function useDashboardApi(eventGuid: string) {
  return useQuery<DashboardSummary, Error>({
    queryKey: ["dashboard", eventGuid],
    queryFn: async () => {
      const res = await client.get<ApiResponse<ApiDashboardSummary>>(
        DashboardEndpoints.summary(eventGuid)
      );
      return toDashboardSummary(res.data.data);
    },
    enabled: !!eventGuid,
  });
}
