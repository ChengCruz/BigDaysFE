// src/utils/jwtUtils.ts

interface JwtPayload {
  sub?: string; // UserGuid
  email?: string;
  role?: string | string[];
  exp?: number;
  [key: string]: unknown; // allows accessing non-standard claim names
}

// Maps BE UserRole enum names to their integer values
const ROLE_MAP: Record<string, number> = {
  SuperAdmin: 1,
  Admin: 2,
  User: 3,
  Vendor: 4,
  Guest: 5,
  Staff: 6,
};

/**
 * Decode JWT token to get payload
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // JWT uses base64url (- and _ instead of + and /); atob() needs standard base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get user GUID from JWT token
 * @param token - JWT token string
 * @returns User GUID or null
 */
export function getUserGuidFromToken(token: string | null): string | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  return payload?.sub || null;
}

/**
 * Get user role from JWT token
 * @param token - JWT token string
 * @returns User role as number or null
 */
// .NET ClaimTypes.Role may serialize as the full URI instead of "role"
const DOTNET_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function getUserRoleFromToken(token: string | null): number | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;

  // Check both short ("role") and full .NET URI claim names
  const raw = payload.role ?? payload[DOTNET_ROLE_CLAIM] as string | string[] | undefined;
  if (!raw) return null;

  // The BE JWT role claim is a string name (e.g. "Admin") or array of names
  const roleName = Array.isArray(raw) ? raw[0] : raw;
  if (!roleName) return null;

  // Try name lookup first, then fall back to numeric parse
  return ROLE_MAP[roleName] ?? (isNaN(Number(roleName)) ? null : Number(roleName));
}

/**
 * Check if token is expired
 * @param token - JWT token string
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  
  return Date.now() >= payload.exp * 1000;
}
