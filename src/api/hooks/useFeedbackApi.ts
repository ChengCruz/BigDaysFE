import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import client from "../client";
import { FeedbackEndpoints } from "../endpoints";
import { trackAction } from "../../utils/analytics";
import type { ApiResponse } from "../../types/api";
import { useAuth } from "./useAuth";
import { isDemoActive } from "../../demo";

export type FeedbackStatus = "Eligible" | "AlreadySubmitted" | "NotEligible";

export interface FeedbackEligibilityEvent {
  eventGuid: string;
  eventName: string;
  eventDate: string;
  status: FeedbackStatus;
}

export interface FeedbackEligibility {
  events: FeedbackEligibilityEvent[];
}

/** Bump when the question set changes so old answers stay readable. */
export const FEEDBACK_FORM_VERSION = 1;

export interface FeedbackPayload {
  eventGuid: string;
  formVersion: number;
  /** 1 to 5 */
  overall: number;
  /** 1 to 5 */
  ease: number;
  /** 0 to 10 */
  recommend: number;
  modulesUsed: string[];
  /** module key -> 1 to 4 */
  moduleRatings: Record<string, number>;
  /** Up to 2 entries: module keys, "other" or "none". */
  likedModules: string[];
  improveModules: string[];
  liked: string;
  improve: string;
  canContact: boolean;
}

/** The API may wrap the payload in ApiResponse<T> or return it bare; accept both. */
function unwrap<T>(body: ApiResponse<T> | T): T {
  const wrapped = body as ApiResponse<T>;
  return wrapped && typeof wrapped === "object" && "data" in wrapped && "isSuccess" in wrapped
    ? wrapped.data
    : (body as T);
}

export const feedbackEligibilityKey = ["feedback", "eligibility"] as const;

/** Drives the "Feedback" menu item. */
export interface FeedbackMenuStatus {
  /** At least one event is Eligible or AlreadySubmitted, so the page has something to show. */
  available: boolean;
  /** At least one event is Eligible and not answered yet. */
  pending: boolean;
  eligibleCount: number;
  submittedCount: number;
}

const HIDDEN_STATUS: FeedbackMenuStatus = { available: false, pending: false, eligibleCount: 0, submittedCount: 0 };

/** Prefix of every status query, whatever the user, for invalidation. */
export const feedbackStatusKey = ["feedback", "status"] as const;

/**
 * Whether to show the "Feedback" menu item, and its "New" dot. Only runs for a
 * signed-in, non-crew account (never in demo mode, which has no user). `available`
 * is false while loading and on any failure, so the item simply stays hidden.
 */
export function useFeedbackStatus() {
  const { userGuid, userRole, loading } = useAuth();
  const enabled = Boolean(userGuid) && !loading && userRole !== 6 && !isDemoActive();
  const query = useQuery<FeedbackMenuStatus>({
    queryKey: [...feedbackStatusKey, userGuid ?? ""],
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const res = await client.get<ApiResponse<FeedbackMenuStatus> | FeedbackMenuStatus>(FeedbackEndpoints.status);
      const data = unwrap(res.data) as Partial<FeedbackMenuStatus> | null | undefined;
      if (!data || typeof data !== "object") return HIDDEN_STATUS;
      return {
        available: data.available === true,
        pending: data.available === true && data.pending === true,
        eligibleCount: typeof data.eligibleCount === "number" ? data.eligibleCount : 0,
        submittedCount: typeof data.submittedCount === "number" ? data.submittedCount : 0,
      };
    },
  });
  // Hidden while loading and after any failure, even if an earlier answer is cached.
  const status = query.isError ? HIDDEN_STATUS : (query.data ?? HIDDEN_STATUS);
  return { available: enabled && status.available, pending: enabled && status.pending, query };
}

/** Which finished events this user can still send feedback for. */
export function useFeedbackEligibility() {
  return useQuery<FeedbackEligibility>({
    queryKey: feedbackEligibilityKey,
    queryFn: async () => {
      const res = await client.get<ApiResponse<FeedbackEligibility> | FeedbackEligibility>(
        FeedbackEndpoints.eligibility,
      );
      const data = unwrap(res.data);
      return { events: Array.isArray(data?.events) ? data.events : [] };
    },
  });
}

/** The free-form part of a saved feedback row. */
export interface FeedbackAnswers {
  modulesUsed: string[];
  moduleRatings: Record<string, number>;
  likedModules: string[];
  improveModules: string[];
  liked: string;
  improve: string;
}

/** The signed-in user's own saved feedback for one event. */
export interface SavedFeedback {
  eventGuid: string;
  formVersion: number;
  overall: number;
  ease: number;
  recommend: number;
  canContact: boolean;
  submittedAt: string;
  answers: FeedbackAnswers;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Fills in safe defaults so the read-only view never trips over a missing field. */
function normalizeSaved(raw: Partial<SavedFeedback> | null | undefined, eventGuid: string): SavedFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  const a: Partial<FeedbackAnswers> = raw.answers ?? {};
  const ratings: Record<string, number> = {};
  if (a.moduleRatings && typeof a.moduleRatings === "object") {
    for (const [k, v] of Object.entries(a.moduleRatings)) {
      if (typeof v === "number") ratings[k] = v;
    }
  }
  return {
    eventGuid: raw.eventGuid ?? eventGuid,
    formVersion: raw.formVersion ?? FEEDBACK_FORM_VERSION,
    overall: raw.overall ?? 0,
    ease: raw.ease ?? 0,
    recommend: raw.recommend ?? 0,
    canContact: Boolean(raw.canContact),
    submittedAt: raw.submittedAt ?? "",
    answers: {
      modulesUsed: strings(a.modulesUsed),
      moduleRatings: ratings,
      likedModules: strings(a.likedModules),
      improveModules: strings(a.improveModules),
      liked: typeof a.liked === "string" ? a.liked : "",
      improve: typeof a.improve === "string" ? a.improve : "",
    },
  };
}

export const myFeedbackKey = (eventGuid: string) => ["feedback", "mine", eventGuid.toLowerCase()] as const;

/**
 * The signed-in user's own saved feedback for `eventGuid`, or null when there is none
 * (404). Pass undefined to keep the query idle. Other failures surface as `isError`
 * and are not retried, since callers fall back to a plain panel.
 */
export function useMyFeedback(eventGuid: string | undefined) {
  return useQuery<SavedFeedback | null>({
    queryKey: myFeedbackKey(eventGuid ?? ""),
    enabled: Boolean(eventGuid),
    retry: false,
    queryFn: async () => {
      const guid = eventGuid ?? "";
      try {
        const res = await client.get<ApiResponse<SavedFeedback> | SavedFeedback>(FeedbackEndpoints.mine(guid));
        return normalizeSaved(unwrap(res.data), guid);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
  });
}

/**
 * Send post-event feedback. 403 means the event is not eligible and 409 means it
 * was already submitted; callers read `error.response.status` to show those states.
 * 400 carries a validation message in `error.response.data.message`.
 * The sender's name and email are resolved server-side from the JWT.
 */
export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FeedbackPayload) => {
      const res = await client.post(FeedbackEndpoints.submit, payload);
      return res.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: feedbackEligibilityKey });
      qc.invalidateQueries({ queryKey: feedbackStatusKey });
      trackAction("feedback", "feedback_submitted", {
        overall: vars.overall,
        recommend: vars.recommend,
        modules: vars.modulesUsed.length,
      });
    },
    onError: (err) => {
      // 403/409 mean our eligibility list is out of date; refresh it.
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 403 || status === 409) {
        qc.invalidateQueries({ queryKey: feedbackEligibilityKey });
        qc.invalidateQueries({ queryKey: feedbackStatusKey });
      }
    },
  });
}
