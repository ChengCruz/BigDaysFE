import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type ErrorInfo } from "react";
import { useCheckInScanApi, useQrListApi, useUndoCheckInApi } from "../../../api/hooks/useQrApi";
import { useGuestsApi } from "../../../api/hooks/useGuestsApi";
import type { CheckInErrorCode, CheckInResult } from "../../../types/qr";
import { Button } from "../../atoms/Button";
import { ManualCheckInModal } from "../../molecules/ManualCheckInModal";
import { QrcodeIcon } from "@heroicons/react/solid";
import { useEventContext } from "../../../context/EventContext";
import { PageLoader } from "../../atoms/PageLoader";
import { NoEventsState } from "../../molecules/NoEventsState";
import toast from "react-hot-toast";

type ScanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: CheckInResult; at: number }
  | { status: "error"; code: CheckInErrorCode | "UNKNOWN"; at: number };

interface RecentScan {
  id: string;
  guestName: string;
  noOfPax: number;
  at: number;
  token?: string; // only set for QR scans; absent for manual check-ins
}

const errorMessages: Record<CheckInErrorCode | "UNKNOWN", string> = {
  ALREADY_CHECKED_IN: "Already checked in",
  TOKEN_REVOKED: "QR code has been revoked",
  WRONG_DAY: "QR not valid today",
  TOKEN_NOT_FOUND: "Unknown QR code",
  UNKNOWN: "Unexpected error — try again",
};

/**
 * Derive the best-effort error code from a thrown axios-style error.
 * Backend returns 404 (not found) and 422 (already checked in or revoked);
 * may or may not set `errorCode` on response.data.
 */
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

/**
 * Single short WebAudio beep. Muted-safe — swallows failures on browsers
 * that block audio before user gesture.
 */
function beep(frequency: number, duration = 120) {
  try {
    const AC: typeof AudioContext = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close().catch(() => {});
    }, duration);
  } catch {
    /* ignore */
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

class CameraErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Camera error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 p-6 text-center">
          <p className="text-4xl mb-2">📷</p>
          <p className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">
            Camera encountered an error
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
          >
            Restart Camera
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CheckInPage() {
  const { eventId, eventsLoading } = useEventContext();
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scannerDivId = "qr-reader";
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const checkIn = useCheckInScanApi(eventId ?? "");
  const undoCheckIn = useUndoCheckInApi();
  const { data: qrTokens = [] } = useQrListApi(eventId ?? "");
  const { data: guests = [] } = useGuestsApi(eventId ?? "");

  // Prevent scanning while a request is in flight
  const isProcessing = useRef(false);
  const resetTimer = useRef<number | null>(null);

  const checkInRef = useRef(checkIn.mutateAsync.bind(checkIn));
  useEffect(() => {
    checkInRef.current = checkIn.mutateAsync.bind(checkIn);
  });

  useEffect(() => {
    if (!cameraActive || !eventId) return;

    setCameraError(null);
    let scanner: { stop: () => Promise<void> } | null = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      let instance: InstanceType<typeof Html5Qrcode>;
      try {
        instance = new Html5Qrcode(scannerDivId);
      } catch {
        setCameraError("Could not initialize camera scanner. Please try again.");
        setCameraActive(false);
        return;
      }
      scanner = instance;
      scannerRef.current = instance;

      instance
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setScanState({ status: "loading" });

            try {
              const result = await checkInRef.current(decodedText);
              const at = Date.now();
              setScanState({ status: "success", result, at });
              setRecentScans((prev) => [
                { id: `${at}-${decodedText}`, guestName: result.guestName, noOfPax: result.noOfPax, at, token: decodedText },
                ...prev,
              ].slice(0, 10));
              beep(880, 150);
              vibrate(80);
              resetTimer.current = window.setTimeout(() => {
                setScanState({ status: "idle" });
                isProcessing.current = false;
              }, 3000);
            } catch (err: unknown) {
              setScanState({ status: "error", code: mapError(err), at: Date.now() });
              beep(220, 200);
              vibrate([80, 60, 80]);
              // Shorter cooldown on error so crew can re-scan quickly
              resetTimer.current = window.setTimeout(() => {
                isProcessing.current = false;
              }, 1200);
            }
          },
          () => {
            // Ignore per-frame decode failures
          }
        )
        .catch((err: unknown) => {
          const msg = (err as { message?: string })?.message ?? "";
          setCameraError(
            msg.includes("Permission")
              ? "Camera permission denied. Please allow camera access and try again."
              : "Could not start camera. Make sure you are on HTTPS and camera is not in use."
          );
          setCameraActive(false);
        });
    }).catch(() => {
      setCameraError("Could not load camera scanner. Please try again.");
      setCameraActive(false);
    });

    return () => {
      if (scanner) scanner.stop().catch(() => {});
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    };
  // checkIn intentionally excluded: mutation state changes after each scan but
  // the scanner should not restart — use checkInRef to always call the latest mutateAsync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, eventId]);

  const stats = useMemo(() => {
    const totalGuests = guests.length;
    const totalPax = guests.reduce((s, g) => s + (g.pax ?? 1), 0);
    const checkedInTokens = qrTokens.filter((t) => t.checkedInAt !== null);
    const checkedInGuestIds = new Set(checkedInTokens.map((t) => t.guestId));
    const checkedInPax = guests
      .filter((g) => checkedInGuestIds.has(g.id))
      .reduce((s, g) => s + (g.pax ?? 1), 0);
    return {
      totalGuests,
      totalPax,
      checkedInGuests: checkedInGuestIds.size,
      checkedInPax,
    };
  }, [guests, qrTokens]);

  if (eventsLoading) return <PageLoader message="Loading..." />;
  if (!eventId) return <NoEventsState title="No Event Selected" message="Select or create an event to start checking in guests." />;

  function handleStopCamera() {
    setCameraActive(false);
    setScanState({ status: "idle" });
    isProcessing.current = false;
  }

  function handleScanNext() {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setScanState({ status: "idle" });
    isProcessing.current = false;
  }

  async function handleUndoScan(scanId: string, token: string) {
    try {
      await undoCheckIn.mutateAsync({ token, eventId: eventId! });
      setRecentScans((prev) => prev.filter((s) => s.id !== scanId));
    } catch {
      // silently ignore — user can open manual modal to retry
    }
  }

  function handleManualSuccess(result: CheckInResult) {
    const at = Date.now();
    setScanState({ status: "success", result, at });
    setRecentScans((prev) => [
      { id: `${at}-manual`, guestName: result.guestName, noOfPax: result.noOfPax, at },
      ...prev,
    ].slice(0, 10));
    beep(880, 150);
    vibrate(80);
    toast.success(`${result.guestName} · ${result.noOfPax} pax checked in`);
    resetTimer.current = window.setTimeout(() => {
      setScanState({ status: "idle" });
    }, 3000);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Guest Check-in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Scan QR codes to validate guest arrivals</p>
        </div>
        <Button variant="secondary" onClick={() => setManualModalOpen(true)}>
          Manual Check-in
        </Button>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">Checked In</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 leading-tight">
            {stats.checkedInGuests}
            <span className="text-sm font-medium text-emerald-700/70 dark:text-emerald-300/70"> / {stats.totalGuests}</span>
          </p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
            {stats.checkedInPax} / {stats.totalPax} pax
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-3">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300">Remaining</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200 leading-tight">
            {Math.max(0, stats.totalGuests - stats.checkedInGuests)}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
            {Math.max(0, stats.totalPax - stats.checkedInPax)} pax
          </p>
        </div>
      </div>

      {/* Scanner card */}
      <CameraErrorBoundary onReset={handleStopCamera}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-4">
        {!cameraActive ? (
          <Button onClick={() => setCameraActive(true)}>QR Check In</Button>
        ) : (
          <Button variant="secondary" onClick={handleStopCamera}>
            Stop Camera
          </Button>
        )}

        {cameraActive && (
          <div
            id={scannerDivId}
            className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
          />
        )}

        {cameraError && (
          <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 p-4 text-center text-yellow-800 dark:text-yellow-300 text-sm">
            {cameraError}
          </div>
        )}

        {scanState.status === "idle" && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-12 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <QrcodeIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">
              {cameraActive ? "Point camera at a QR code" : "Press the button above to start scanning"}
            </p>
          </div>
        )}

        {scanState.status === "loading" && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 py-8 text-center text-gray-600 dark:text-gray-300 animate-pulse">
            Validating...
          </div>
        )}

        {scanState.status === "success" && (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 p-6 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">
              {scanState.result.guestName}
            </p>
            <p className="text-lg text-green-700 dark:text-green-400 mt-1">
              {scanState.result.noOfPax} {scanState.result.noOfPax === 1 ? "person" : "pax"}
            </p>
          </div>
        )}

        {scanState.status === "error" && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 p-6 text-center">
            <p className="text-4xl mb-2">❌</p>
            <p className="text-lg font-semibold text-red-800 dark:text-red-300">
              {errorMessages[scanState.code]}
            </p>
          </div>
        )}

        {(scanState.status === "success" || scanState.status === "error") && (
          <Button variant="secondary" onClick={handleScanNext}>
            Scan next
          </Button>
        )}
      </div>
      </CameraErrorBoundary>

      {/* Recent check-ins */}
      {recentScans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recent check-ins</h3>
            <span className="text-[11px] text-gray-400">{recentScans.length}</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentScans.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between text-sm gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{s.guestName}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {s.noOfPax} {s.noOfPax === 1 ? "person" : "pax"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400">{formatTime(s.at)}</span>
                  {s.token && (
                    <button
                      type="button"
                      onClick={() => handleUndoScan(s.id, s.token!)}
                      disabled={undoCheckIn.isPending}
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ManualCheckInModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSuccess={handleManualSuccess}
        eventId={eventId}
      />
    </div>
  );
}
