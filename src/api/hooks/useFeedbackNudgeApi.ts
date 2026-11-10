import { useQuery } from "@tanstack/react-query";
import client from "../client";
import { FeedbackNudgeEndpoints } from "../endpoints";

/**
 * Whether to show the feedback nudge banner to this user. The backend holds a
 * private allow-list and only ever answers for the caller, so the list never
 * reaches the browser. Any error (including a 503 during maintenance) just
 * means no banner.
 */
export function useFeedbackNudge(userGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["feedbackNudge", userGuid],
    queryFn: () =>
      client
        .get(FeedbackNudgeEndpoints.nudge)
        .then((res) => res.data?.data?.show === true),
    enabled: enabled && !!userGuid,
    // Nothing about this changes while the user is in the app.
    staleTime: Infinity,
    retry: false,
  });
}
