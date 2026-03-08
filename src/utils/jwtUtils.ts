// src/utils/jwtUtils.ts

interface JwtPayload {
  sub?: string; // UserGuid
  email?: string;
  role?: string;
  exp?: number;
}

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
    const decoded = JSON.parse(atob(payload));
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
export function getUserRoleFromToken(token: string | null): number | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload?.role) return null;
  
  const role = parseInt(payload.role, 10);
  return isNaN(role) ? null : role;
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
