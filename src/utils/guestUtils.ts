import type { Guest } from "../api/hooks/useGuestsApi";
import type { ApiGuest } from "../types/guest";

export function normalizeGuest(g: ApiGuest): Guest {
  return {
    id: g.guestId ?? (g as any).id,

    // Guest API fields (preserve original)
    guestId: g.guestId,
    eventId: g.eventId,
    eventGuid: g.eventGuid,
    rsvpId: g.rsvpId,
    tableId: g.tableId ?? undefined,
    name: g.name ?? "",
    phoneNo: g.phoneNo ?? "",
    pax: g.pax ?? 1,
    groupId: g.groupId,
    seatIndex: g.seatIndex,
    flag: g.flag,
    notes: g.notes ?? "",
    createdDate: g.createdDate,
    lastUpdated: g.lastUpdated,
    isDeleted: g.isDeleted ?? false,
    createdBy: g.createdBy ?? "",
    updatedBy: g.updatedBy ?? "",

    // RSVP-compatible aliases (for UI compatibility)
    guestName: g.name ?? "",
    noOfPax: g.pax ?? 1,
    guestType: g.flag || g.groupId || "Other",
    remarks: g.notes ?? "",
    status: "Confirmed",
  };
}
