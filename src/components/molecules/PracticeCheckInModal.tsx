import React, { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import {
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshIcon,
  LightBulbIcon,
  QrcodeIcon,
  UserGroupIcon,
} from "@heroicons/react/solid";
import {
  getPracticeStatuses,
  checkInPractice,
  undoPractice,
  resetAllPractice,
  resolvePracticeToken,
  PRACTICE_GUESTS,
  PRACTICE_RESET_MS,
  type PracticeStatus,
} from "../../utils/practiceCheckIn";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = "manual" | "qr";

// Feedback shown after a manual tap or a QR scan — mirrors the real scanner's
// success / already-checked-in / error states.
type Feedback =
  | { kind: "success"; name: string; pax: number }
  | { kind: "already"; name: string }
  | { kind: "error"; message: string };

// A soft confirmation beep so the practice run *feels* like the real scanner.
function beep(frequency: number, duration = 130) {
  try {
    const AC: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close().catch(() => {});
    }, duration);
  } catch {
    /* ignore — audio is best-effort */
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

const RESET_HOURS = Math.round(PRACTICE_RESET_MS / (60 * 60 * 1000));

function formatResetHint(resetsAt: number | null): string {
  if (resetsAt == null) return "";
  const ms = resetsAt - Date.now();
  if (ms <= 0) return "resetting…";
  const totalMins = Math.round(ms / (60 * 1000));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 1) return `Auto-resets to Pending in ~${hours}h ${mins}m`;
  return `Auto-resets to Pending in ~${mins}m`;
}

const typeColor: Record<string, string> = {
  Family: "border-blue-500 text-blue-600 dark:text-blue-400",
  VIP: "border-purple-500 text-purple-600 dark:text-purple-400",
  Friend: "border-indigo-500 text-indigo-600 dark:text-indigo-400",
  Other: "border-gray-400 text-gray-500 dark:text-gray-400",
};

export const PracticeCheckInModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<TabId>("manual");
  const [statuses, setStatuses] = useState<PracticeStatus[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Which demo guest's QR is currently displayed in the QR tab.
  const [qrGuestId, setQrGuestId] = useState<string>(PRACTICE_GUESTS[0].id);

  const feedbackTimer = useRef<number | null>(null);
  const isProcessing = useRef(false);
  const resetTimer = useRef<number | null>(null);

  const refresh = useCallback(() => setStatuses(getPracticeStatuses()), []);

  const clearFeedbackSoon = useCallback((ms = 2400) => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), ms);
  }, []);

  // Load fresh state whenever the modal opens, then keep the reset countdown
  // live with a gentle 30s tick (also catches guests whose window elapses
  // while the modal sits open).
  useEffect(() => {
    if (!isOpen) return;
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [isOpen, refresh]);

  // Reset transient UI when the modal closes.
  useEffect(() => {
    if (isOpen) return;
    setCameraActive(false);
    setCameraError(null);
    setFeedback(null);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  // Shared handler for both a real camera decode and the "simulate scan" button.
  const handleDecoded = useCallback(
    (decodedText: string) => {
      const id = resolvePracticeToken(decodedText);
      if (!id) {
        setFeedback({
          kind: "error",
          message: "That’s not a demo QR. Point the camera at the demo code above — this is a practice sandbox, real guest QRs aren’t checked in here.",
        });
        beep(220, 200);
        vibrate([80, 60, 80]);
        clearFeedbackSoon(3200);
        return;
      }
      const guest = PRACTICE_GUESTS.find((g) => g.id === id)!;
      const current = getPracticeStatuses().find((s) => s.id === id);
      if (current?.checkedInAt != null) {
        setFeedback({ kind: "already", name: guest.name });
        beep(440, 160);
        vibrate(60);
        clearFeedbackSoon();
        return;
      }
      checkInPractice(id);
      refresh();
      setFeedback({ kind: "success", name: guest.name, pax: guest.pax });
      beep(880, 150);
      vibrate(80);
      clearFeedbackSoon();
    },
    [clearFeedbackSoon, refresh]
  );

  const handleDecodedRef = useRef(handleDecoded);
  useEffect(() => {
    handleDecodedRef.current = handleDecoded;
  });

  // Live camera scanner — mirrors the real Check-in page, but sandboxed.
  useEffect(() => {
    if (!isOpen || tab !== "qr" || !cameraActive) return;
    setCameraError(null);
    let scanner: { stop: () => Promise<void> } | null = null;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        let instance: InstanceType<typeof Html5Qrcode>;
        try {
          instance = new Html5Qrcode("practice-qr-reader");
        } catch {
          setCameraError("Could not initialize camera scanner.");
          setCameraActive(false);
          return;
        }
        scanner = instance;
        instance
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText: string) => {
              if (isProcessing.current) return;
              isProcessing.current = true;
              handleDecodedRef.current(decodedText);
              resetTimer.current = window.setTimeout(() => {
                isProcessing.current = false;
              }, 1500);
            },
            () => {}
          )
          .catch((err: unknown) => {
            const msg = (err as { message?: string })?.message ?? "";
            setCameraError(
              msg.includes("Permission")
                ? "Camera permission denied. Allow camera access and try again."
                : "Could not start camera. Make sure you’re on HTTPS and the camera isn’t in use."
            );
            setCameraActive(false);
          });
      })
      .catch(() => {
        setCameraError("Could not load camera scanner. Please try again.");
        setCameraActive(false);
      });

    return () => {
      if (scanner) {
        try {
          scanner.stop().catch(() => {});
        } catch {
          /* ignore */
        }
      }
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
      isProcessing.current = false;
    };
  }, [isOpen, tab, cameraActive]);

  const checkedInCount = statuses.filter((s) => s.checkedInAt != null).length;
  const qrGuest = PRACTICE_GUESTS.find((g) => g.id === qrGuestId) ?? PRACTICE_GUESTS[0];
  const checkedInIds = new Set(statuses.filter((s) => s.checkedInAt != null).map((s) => s.id));

  function handleManualCheckIn(g: PracticeStatus) {
    checkInPractice(g.id);
    refresh();
    beep(880, 150);
    vibrate(80);
    setFeedback({ kind: "success", name: g.name, pax: g.pax });
    clearFeedbackSoon();
  }

  function handleUndo(id: string) {
    undoPractice(id);
    refresh();
  }

  function handleResetAll() {
    resetAllPractice();
    refresh();
    setFeedback(null);
  }

  function switchTab(next: TabId) {
    if (next === tab) return;
    setFeedback(null);
    if (next === "manual") setCameraActive(false); // stop camera when leaving QR
    setTab(next);
  }

  const feedbackBanner = feedback && (
    <div
      className={
        feedback.kind === "success"
          ? "rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 p-4 text-center"
          : feedback.kind === "already"
          ? "rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 p-4 text-center"
          : "rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 p-4 text-center"
      }
    >
      {feedback.kind === "success" && (
        <>
          <p className="text-3xl mb-1">✅</p>
          <p className="text-xl font-bold text-green-800 dark:text-green-200 leading-tight">{feedback.name}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">
            {feedback.pax} {feedback.pax === 1 ? "person" : "pax"} · checked in
          </p>
        </>
      )}
      {feedback.kind === "already" && (
        <>
          <p className="text-3xl mb-1">⚠️</p>
          <p className="text-base font-semibold text-amber-800 dark:text-amber-200 leading-tight">{feedback.name}</p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">Already checked in</p>
        </>
      )}
      {feedback.kind === "error" && (
        <>
          <p className="text-3xl mb-1">❌</p>
          <p className="text-sm font-medium text-red-800 dark:text-red-300 leading-relaxed">{feedback.message}</p>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Practice Check-in"
      className="!max-w-lg"
      showCloseButton
    >
      <div className="space-y-4">
        {/* Intro */}
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary text-white grid place-items-center flex-shrink-0 shadow-sm">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            A safe sandbox to rehearse check-in with <strong>demo guests only</strong>. Try both ways —
            scan a demo QR or check in from the list. Nothing here touches your real guest list or stats.
          </p>
        </div>

        {/* "Not a bug" reset notice */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-3 flex items-start gap-2.5">
          <LightBulbIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong>Heads up — this is expected, not a bug:</strong> a demo guest you check in here will
            automatically return to <strong>Pending</strong> after about {RESET_HOURS} hours. That’s on
            purpose, so you can practise again anytime and the demo never leaves stale data behind.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1 gap-1">
          <button
            type="button"
            onClick={() => switchTab("qr")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
              tab === "qr"
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <QrcodeIcon className="h-4 w-4" /> QR scan
          </button>
          <button
            type="button"
            onClick={() => switchTab("manual")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
              tab === "manual"
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <UserGroupIcon className="h-4 w-4" /> Manual
          </button>
        </div>

        {feedbackBanner}

        {/* ── QR tab ── */}
        {tab === "qr" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 dark:border-white/10 p-4 flex flex-col items-center gap-3">
              {/* Pick which demo guest's QR to show */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {PRACTICE_GUESTS.map((g) => {
                  const selected = g.id === qrGuestId;
                  const isIn = checkedInIds.has(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setQrGuestId(g.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium border inline-flex items-center gap-1 transition-colors ${
                        selected
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {isIn && <CheckCircleIcon className="h-3 w-3 text-green-500" />}
                      {g.name.replace(" (demo)", "")}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                This is <strong>{qrGuest.name}</strong>’s demo QR. Show it on another screen and scan it
                with your phone’s camera below — or just tap <strong>Simulate scan</strong> to try it on
                this device. Pick any of the three above to try them all.
              </p>
              <div className="bg-white p-3 rounded-xl">
                <QRCodeCanvas value={qrGuest.token} size={148} marginSize={2} />
              </div>
              <Button variant="secondary" onClick={() => handleDecoded(qrGuest.token)} className="gap-1.5">
                <SparklesIcon className="h-4 w-4" /> Simulate scan
              </Button>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <QrcodeIcon className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Camera scanner</h3>
              </div>
              <Button
                variant={cameraActive ? "secondary" : "primary"}
                onClick={() => setCameraActive((a) => !a)}
              >
                {cameraActive ? "Stop Camera" : "Start Camera"}
              </Button>
              {cameraActive && (
                <div
                  id="practice-qr-reader"
                  className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                />
              )}
              {cameraError && (
                <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 p-3 text-center text-yellow-800 dark:text-yellow-300 text-sm">
                  {cameraError}
                </div>
              )}
              {!cameraActive && !cameraError && (
                <p className="text-xs text-gray-400 text-center">
                  Tap Start Camera, then point it at the demo QR above (on another screen).
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Manual tab ── */}
        {tab === "manual" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                Demo guests
              </span>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {checkedInCount} / {statuses.length} checked in
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
              {statuses.map((g) => {
                const checkedIn = g.checkedInAt != null;
                return (
                  <div key={g.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            checkedIn
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {g.name}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                            typeColor[g.guestType] ?? typeColor.Other
                          }`}
                        >
                          {g.guestType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {g.phoneNo} · {g.pax} pax
                      </p>
                      {checkedIn && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400/90 mt-1 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatResetHint(g.resetsAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {checkedIn ? (
                        <>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 inline-flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" /> In
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUndo(g.id)}
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
                          >
                            Undo
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleManualCheckIn(g)}
                          className="text-[11px] px-3 py-1 rounded-full font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Check in
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={checkedInCount === 0}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Reset demo now
          </button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
