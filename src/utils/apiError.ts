// src/utils/apiError.ts

/**
 * Pulls the most specific message out of an API error.
 *
 * The BE's ExceptionMiddleware returns `{ message, detail }` where `detail` holds
 * the actual cause ("Author is required.") and `message` is generic ("Validation
 * failed."), so `detail` wins. Also handles ASP.NET ProblemDetails, bodies that
 * arrive as an unparsed string (wrong Content-Type), and network/CORS failures
 * where there is no response at all.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } } | null)?.response?.data;

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return fallback;
    try {
      return fromBody(JSON.parse(trimmed)) ?? fallback;
    } catch {
      // Not JSON — surface it, but don't dump an HTML error page into the UI.
      return trimmed.startsWith("<") ? fallback : trimmed.slice(0, 300);
    }
  }

  return fromBody(data) ?? fallback;
}

function fromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  for (const key of ["detail", "message", "title"]) {
    const value = b[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  // ProblemDetails: { errors: { Author: ["Author is required."] } }
  if (b.errors && typeof b.errors === "object") {
    const first = Object.values(b.errors as Record<string, unknown>)
      .flat()
      .find(v => typeof v === "string" && v.trim());
    if (first) return first as string;
  }

  return null;
}
