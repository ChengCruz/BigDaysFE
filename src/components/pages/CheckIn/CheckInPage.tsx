import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useCheckInScanApi } from "../../../api/hooks/useQrApi";
import type { CheckInErrorCode, CheckInResult } from "../../../types/qr";

type ScanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: CheckInResult }
  | { status: "error"; code: CheckInErrorCode | "UNKNOWN" };

const errorMessages: Record<CheckInErrorCode | "UNKNOWN", string> = {
  ALREADY_CHECKED_IN: "Already checked in",
  TOKEN_REVOKED: "QR code has been revoked",
  WRONG_DAY: "QR not valid today",
  TOKEN_NOT_FOUND: "Unknown QR code",
  UNKNOWN: "Unexpected error — try again",
};

export default function CheckInPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader";
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const checkIn = useCheckInScanApi();

  // Prevent scanning while a request is in flight
  const isProcessing = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      scannerDivId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        if (isProcessing.current) return;
        isProcessing.current = true;
        setScanState({ status: "loading" });

        try {
          const result = await checkIn.mutateAsync(decodedText);
          setScanState({ status: "success", result });
          // Auto-reset after 3 seconds
          setTimeout(() => {
            setScanState({ status: "idle" });
            isProcessing.current = false;
          }, 3000);
        } catch (err: unknown) {
          const code =
            (err as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode;
          setScanState({
            status: "error",
            code: (code as CheckInErrorCode) ?? "UNKNOWN",
          });
          isProcessing.current = false;
        }
      },
      (errorMsg) => {
        // Ignore per-frame decode failures (expected when no QR in view)
        void errorMsg;
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  function handleClear() {
    setScanState({ status: "idle" });
    isProcessing.current = false;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary text-center">Guest Check-in</h1>

      {/* Camera scanner */}
      <div id={scannerDivId} className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10" />

      {/* Result display */}
      {scanState.status === "idle" && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-8 text-center text-gray-500 dark:text-gray-400">
          Ready to scan
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

      {scanState.status !== "idle" && scanState.status !== "loading" && (
        <button
          onClick={handleClear}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5"
        >
          Clear
        </button>
      )}
    </div>
  );
}
