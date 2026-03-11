import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { saveAs } from "file-saver";
import { useQrLookupApi, type QrLookupResult } from "../../../../api/hooks/usePublicQrApi";

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; result: QrLookupResult }
  | { status: "not_found" }
  | { status: "error" };

export default function QrLookupPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const lookup = useQrLookupApi(eventId ?? "");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pageState, setPageState] = useState<PageState>({ status: "idle" });
  const canvasRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setPageState({ status: "loading" });

    lookup.mutate(
      { name: name.trim(), phone: phone.trim() },
      {
        onSuccess: (result) => setPageState({ status: "found", result }),
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            setPageState({ status: "not_found" });
          } else {
            setPageState({ status: "error" });
          }
        },
      }
    );
  }

  function handleDownload(guestName: string) {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `${guestName}-qr.png`);
    });
  }

  function handleReset() {
    setPageState({ status: "idle" });
    setName("");
    setPhone("");
  }

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Find Your QR Code</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the name and phone number you registered with.
          </p>
        </div>

        {/* Search form */}
        {(pageState.status === "idle" || pageState.status === "not_found" || pageState.status === "error") && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-accent rounded-2xl shadow-lg p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ahmad bin Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border rounded-xl p-3 bg-white dark:bg-background dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 0123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border rounded-xl p-3 bg-white dark:bg-background dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {pageState.status === "not_found" && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                No guest found with that name and phone number.
                <br />
                Please check your details or contact the organiser.
              </p>
            )}

            {pageState.status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={lookup.isPending || !name.trim() || !phone.trim()}
              className="w-full rounded-xl bg-primary px-4 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {lookup.isPending ? "Searching..." : "Find My QR Code"}
            </button>
          </form>
        )}

        {/* Loading state */}
        {pageState.status === "loading" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-pulse">
            Searching...
          </div>
        )}

        {/* Found state */}
        {pageState.status === "found" && (
          <div className="bg-white dark:bg-accent rounded-2xl shadow-lg p-6 flex flex-col items-center gap-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Hello, {pageState.result.guestName}!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Party of {pageState.result.noOfPax}{" "}
                {pageState.result.noOfPax === 1 ? "person" : "people"}
              </p>
            </div>

            <div ref={canvasRef} className="p-3 bg-white rounded-xl shadow-inner">
              <QRCodeCanvas value={pageState.result.token} size={240} marginSize={2} />
            </div>

            <p className="text-xs text-gray-400 text-center break-all">
              Please screenshot or download this QR code and present it at the entrance on event day.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleDownload(pageState.result.guestName)}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Download QR
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-xl border border-gray-300 dark:border-white/10 px-4 py-3 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Search Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
