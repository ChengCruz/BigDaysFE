// src/utils/apiEnvelope.ts
//
// The backend answers some refusals with HTTP 200 and the real outcome inside the
// ApiResponse envelope (`isSuccess: false`, `statusCode: 422/404/400`) rather than
// a 4xx. QuestionService.UpdateQuestion does this when a question already has
// answers, and Activate/Deactivate/Delete do it when the save writes no rows.
//
// Nothing in client.ts unwraps or inspects the envelope, so axios resolves and
// react-query reports success. Any page that treats a resolved mutation as proof
// the write landed will silently lie to the user. Run the result through
// envelopeError() before closing a modal or showing confirmation.

/** Message to show when the envelope reports a failure, or null when it really succeeded. */
export function envelopeError(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const env = res as { isSuccess?: boolean; statusCode?: unknown; message?: string };
  const code = Number(env.statusCode);
  const failed = env.isSuccess === false || (Number.isFinite(code) && code >= 400);
  if (!failed) return null;
  return env.message?.trim() || "That didn’t save. Please try again.";
}
