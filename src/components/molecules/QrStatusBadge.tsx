import type { QrStatus } from "../../types/qr";

interface Props {
  status: QrStatus;
}

const config: Record<QrStatus, { label: string; className: string }> = {
  None: { label: "No QR", className: "bg-gray-100 text-gray-500" },
  Generated: { label: "QR Generated", className: "bg-green-100 text-green-700" },
  Revoked: { label: "Revoked", className: "bg-red-100 text-red-700" },
  CheckedIn: { label: "Checked In", className: "bg-blue-100 text-blue-700" },
};

export default function QrStatusBadge({ status }: Props) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
