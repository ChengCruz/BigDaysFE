import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import { useCheckInScanApi, useQrListApi } from "../../api/hooks/useQrApi";
import { useGuestsApi } from "../../api/hooks/useGuestsApi";
import type { CheckInErrorCode, CheckInResult } from "../../types/qr";
import { FormError } from "./FormError";

interface ManualCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: CheckInResult) => void;
  eventId: string;
}

const errorMessages: Record<CheckInErrorCode | "UNKNOWN" | "NO_TOKEN", string> = {
  ALREADY_CHECKED_IN: "Already checked in.",
  TOKEN_REVOKED: "QR code has been revoked.",
  WRONG_DAY: "QR not valid today.",
  TOKEN_NOT_FOUND: "Unknown QR code.",
  NO_TOKEN: "No QR code generated for this guest yet.",
  UNKNOWN: "Unexpected error — try again.",
};

function mapError(err: unknown): CheckInErrorCode | "UNKNOWN" {
  const e = err as { response?: { status?: number; data?: { errorCode?: string; message?: string } } };
  const code = e?.response?.data?.errorCode;
  if (code === "ALREADY_CHECKED_IN" || code === "TOKEN_REVOKED" || code === "WRONG_DAY" || code === "TOKEN_NOT_FOUND") {
    return code;
  }
  const status = e?.response?.status;
  const message = (e?.response?.data?.message ?? "").toLowerCase();
  if (status === 404) return "TOKEN_NOT_FOUND";
  if (status === 422) {
    if (message.includes("revoke")) return "TOKEN_REVOKED";
    return "ALREADY_CHECKED_IN";
  }
  return "UNKNOWN";
}

export const ManualCheckInModal: React.FC<ManualCheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
}) => {
  const [query, setQuery] = useState("");
  const [submittingGuestId, setSubmittingGuestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkIn = useCheckInScanApi();
  const { data: guests = [], isLoading: guestsLoading } = useGuestsApi(eventId);
  const { data: qrTokens = [] } = useQrListApi(eventId);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setError(null);
      setSubmittingGuestId(null);
    }
  }, [isOpen]);

  // Map guestId → token record for fast lookup + status hints
  const tokenByGuestId = useMemo(() => {
    const m = new Map<string, (typeof qrTokens)[number]>();
    for (const t of qrTokens) m.set(t.guestId, t);
    return m;
  }, [qrTokens]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests.slice(0, 25);
    return guests
      .filter((g) => {
        const name = (g.name ?? g.guestName ?? "").toLowerCase();
        const phone = (g.phoneNo ?? "").toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
      .slice(0, 25);
  }, [guests, query]);

  async function handlePick(guestId: string) {
    setError(null);
    const tokenRec = tokenByGuestId.get(guestId);
    if (!tokenRec) {
      setError(errorMessages.NO_TOKEN);
      return;
    }
    setSubmittingGuestId(guestId);
    try {
      const result = await checkIn.mutateAsync(tokenRec.token);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      setError(errorMessages[mapError(err)]);
    } finally {
      setSubmittingGuestId(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Check-in">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Search by guest name or phone number, then tap to check in.
        </p>

        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a name or phone number…"
          className="w-full border rounded-xl p-3 bg-white dark:bg-background dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <FormError message={error} />}

        <div className="max-h-80 overflow-y-auto -mx-6 px-6 border-t border-b border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
          {guestsLoading && (
            <p className="py-6 text-center text-sm text-gray-400">Loading guests…</p>
          )}
          {!guestsLoading && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              {query ? "No matches." : "No guests yet."}
            </p>
          )}
          {!guestsLoading && filtered.map((g) => {
            const tokenRec = tokenByGuestId.get(g.id);
            const checkedIn = tokenRec?.checkedInAt != null;
            const revoked = tokenRec?.isRevoked === true;
            const noToken = !tokenRec;
            const submitting = submittingGuestId === g.id;
            const disabled = submitting || checkedIn || revoked || noToken;

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handlePick(g.id)}
                disabled={disabled}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                    {g.name ?? g.guestName ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {g.phoneNo || "No phone"} · {g.pax ?? 1} pax
                  </p>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    submitting
                      ? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
                      : checkedIn
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : revoked
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : noToken
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {submitting
                    ? "Checking…"
                    : checkedIn
                    ? "In"
                    : revoked
                    ? "Revoked"
                    : noToken
                    ? "No QR"
                    : "Check in"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
