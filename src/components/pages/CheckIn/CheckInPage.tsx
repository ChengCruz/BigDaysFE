import { useEffect, useRef, useState } from "react";
import { useCheckInScanApi } from "../../../api/hooks/useQrApi";
import type { CheckInErrorCode, CheckInResult } from "../../../types/qr";
import { Button } from "../../atoms/Button";
import { ManualCheckInModal } from "../../molecules/ManualCheckInModal";
import { QrcodeIcon } from "@heroicons/react/solid";

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
  const scannerRef = useRef<any>(null);
  const scannerDivId = "qr-reader";
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const checkIn = useCheckInScanApi();

  // Prevent scanning while a request is in flight
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!cameraActive) return;

    setCameraError(null);
    let scanner: any = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
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
        () => {
          // Ignore per-frame decode failures (expected when no QR in view)
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
    });

    return () => {
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [cameraActive]);

  function handleStopCamera() {
    setCameraActive(false);
    setScanState({ status: "idle" });
    isProcessing.current = false;
  }

  function handleClear() {
    setScanState({ status: "idle" });
    isProcessing.current = false;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Guest Check-in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Scan QR codes to validate guest arrivals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setManualModalOpen(true)}>
            Manual Check In
          </Button>
          <Button disabled variant="secondary">
            Add Crew
            <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Soon</span>
          </Button>
        </div>
      </div>

      {/* Scanner card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-4">
        {/* Camera toggle */}
        {!cameraActive ? (
          <Button onClick={() => setCameraActive(true)}>QR Check In</Button>
        ) : (
          <Button variant="secondary" onClick={handleStopCamera}>
            Stop Camera
          </Button>
        )}

        {/* Camera scanner — only mounted when active so Html5Qrcode attaches to a visible div */}
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

        {/* Result display */}
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

        {scanState.status !== "idle" && scanState.status !== "loading" && (
          <Button variant="secondary" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      <ManualCheckInModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSuccess={(result) => { setScanState({ status: "success", result }); }}
      />
    </div>
  );
}
