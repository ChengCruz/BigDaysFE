import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { saveAs } from "file-saver";
import { Modal } from "./Modal";

interface Props {
  isOpen: boolean;
  guestName: string;
  token: string;
  onClose: () => void;
}

export default function QrImageModal({ isOpen, guestName, token, onClose }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `${guestName}-qr.png`);
    });
  }

  return (
    <Modal isOpen={isOpen} title={`QR Code — ${guestName}`} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        <div ref={canvasRef}>
          <QRCodeCanvas value={token} size={256} marginSize={2} />
        </div>
        <p className="text-sm text-gray-500 break-all text-center">{token}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
