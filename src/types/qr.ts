export interface QrToken {
  guestId: string;
  eventId: string;
  token: string; // UUID v4 — used to render QR image client-side
  generatedAt: string;
  isRevoked: boolean;
  checkedInAt: string | null;
}

export type QrStatus = "None" | "Generated" | "Revoked" | "CheckedIn";

export interface GenerateQrResult {
  generated: number;
  skipped: number;
}

export interface CheckInResult {
  guestName: string;
  noOfPax: number;
}

export type CheckInErrorCode =
  | "TOKEN_NOT_FOUND"
  | "TOKEN_REVOKED"
  | "WRONG_DAY"
  | "ALREADY_CHECKED_IN";
