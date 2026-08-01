import { useCallback, useMemo } from "react";
import { useUsersListApi } from "./useUsersApi";
import { useAuth } from "./useAuth";

interface ApiUser {
  userGuid?: string;
  fullName?: string;
  email?: string;
}

/** GUIDs come back from the API with inconsistent casing — normalise before comparing. */
const norm = (guid?: string | null) => (guid ?? "").trim().toLowerCase();

/**
 * Resolves event owners for admins.
 *
 * The events list endpoint returns every user's events to Admin/SuperAdmin but
 * only carries a raw `userGuid`, so we join it against the admin-only users
 * list to get a display name. Non-admins never fetch the users list — they only
 * ever see their own events, so there is nothing to disambiguate.
 */
export function useEventOwners() {
  const { userRole, userGuid } = useAuth();
  const isAdmin = userRole === 1 || userRole === 2;

  const { data: users } = useUsersListApi({ enabled: isAdmin });

  const namesByGuid = useMemo(() => {
    const map = new Map<string, string>();
    if (!Array.isArray(users)) return map;
    for (const u of users as ApiUser[]) {
      const key = norm(u?.userGuid);
      if (!key) continue;
      const label = u.fullName?.trim() || u.email?.trim();
      if (label) map.set(key, label);
    }
    return map;
  }, [users]);

  const isMine = useCallback(
    (ownerGuid?: string | null) => {
      const owner = norm(ownerGuid);
      return Boolean(owner) && owner === norm(userGuid);
    },
    [userGuid]
  );

  const ownerName = useCallback(
    (ownerGuid?: string | null) => {
      const owner = norm(ownerGuid);
      if (!owner) return null;
      // Fall back to a truncated GUID so the row still distinguishes owners
      // if the users list is unavailable.
      return namesByGuid.get(owner) ?? `User ${owner.slice(0, 8)}`;
    },
    [namesByGuid]
  );

  /** True when owner attribution is worth rendering at all. */
  const showOwner = isAdmin;

  return { showOwner, isAdmin, isMine, ownerName };
}
