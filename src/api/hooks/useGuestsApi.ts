// src/api/hooks/useGuestsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { GuestEndpoints } from "../endpoints";
import { normalizeGuest } from "../../utils/guestUtils";

/**
 * Guest API Field Mapping (API → UI)
 * =====================================
 * API uses different naming from RSVP-based UI, so we map fields:
 * 
 * API Field      → UI Field (RSVP-compatible)
 * -----------      --------------------------
 * guestId        → id (primary)
 * name           → guestName (alias)
 * pax            → noOfPax (alias)
 * flag           → guestType (mapped)
 * notes          → remarks (alias)
 * (derived)      → status (default: "Confirmed")
 */

export interface Guest {
  id: string; // mapped from guestId
  guestId?: string;
  eventId?: number;
  eventGuid?: string;
  rsvpId?: string;
  tableId?: string;
  guestIndex?: number;
  guestCode?: string;
  name: string; // guest name
  phoneNo?: string;
  pax?: number;
  groupId?: string;
  seatIndex?: number;
  flag?: string;
  notes?: string;
  createdDate?: string;
  lastUpdated?: string;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
  
  // UI compatibility aliases (mapped from API fields)
  guestName?: string; // alias for name (RSVP naming)
  noOfPax?: number; // alias for pax (RSVP naming)
  guestType?: string; // mapped from flag/groupId (RSVP naming)
  remarks?: string; // alias for notes (RSVP naming)
  status?: string; // derived/default status
}

export function useGuestsApi(eventId: string) {
  return useQuery<Guest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const res = await client.get(GuestEndpoints.all(eventId));

      // Handle the response structure
      const data = res.data?.data ?? res.data;

      // Ensure it's always an array
      const arr = Array.isArray(data) ? data : [];

      return arr.map(normalizeGuest);
    },
    staleTime: 60_000,
    enabled: Boolean(eventId),
  });
}

export function useGuestsByTable(eventId: string, tableId: string) {
  return useQuery<Guest[]>({
    queryKey: ["guests", "table", tableId],
    queryFn: async () => {
      const res = await client.get(GuestEndpoints.byTable(tableId));
      const data = res.data?.data ?? res.data;
      const arr = Array.isArray(data) ? data : [];

      return arr.map(normalizeGuest);
    },
    staleTime: 60_000,
    enabled: Boolean(eventId) && Boolean(tableId),
  });
}

export function useCreateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      eventGuid: string;
      guestName?: string;
      pax?: number;
      phoneNo?: string;
      groupId?: string;
      rsvpId?: string;
      tableId?: string;
    }) => client.post(GuestEndpoints.create, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", eventId] });
    },
  });
}

export function useUpdateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      guestId: string;
      name?: string;
      pax?: number;
      phoneNo?: string;
      flag?: string;       // guestType → flag
      notes?: string;      // remarks → notes
      groupId?: string;
      tableId?: string;
      seatIndex?: number;
    }) => client.put(GuestEndpoints.update, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", eventId] });
    },
  });
}

export function useAssignGuestToTable(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, tableId }: { guestId: string; tableId: string }) =>
      client.post(GuestEndpoints.assignTable(guestId, tableId)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", eventId] });
      qc.invalidateQueries({ queryKey: ["tables", eventId] });
    },
  });
}

export function useUnassignGuestFromTable(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guestId: string) =>
      client.post(GuestEndpoints.unassignTable(guestId)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", eventId] });
      qc.invalidateQueries({ queryKey: ["tables", eventId] });
    },
  });
}

export function useAutoAssignGuests(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      client.post(GuestEndpoints.autoAssign(eventId)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", eventId] });
      qc.invalidateQueries({ queryKey: ["tables", eventId] });
    },
  });
}

export function useRecordGift(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      guestId,
      eventGuid,
      amount,
    }: {
      guestId: string;
      eventGuid: string;
      amount: number | null;
    }) =>
      client
        .put(GuestEndpoints.gift(guestId), { eventGuid, amount })
        .then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["guests", eventId] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallet", variables.eventGuid] });
    },
  });
}
