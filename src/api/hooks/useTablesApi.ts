import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { TablesEndpoints, GuestEndpoints } from "../endpoints";
import type { Rsvp } from "./useRsvpsApi";

//
// ——— Types ——————————————————————————————————————————————————————————
//

export interface TableBase {
  id: string;
  name: string;
  capacity: number;
  extraGuests?: number;
  layout?: { guestId: string; x: number; y: number }[];
}

export interface TableWithGuests extends TableBase {
  guests: Rsvp[];
  assignedCount: number;
}

//
// ——— QUERIES —————————————————————————————————————————————————————————
//

// List all tables (lightweight)
export function useTablesApi(eventId:string) {
  return useQuery<TableBase[]>({
    queryKey: ["tables",eventId],
    queryFn: async () => {
      const response = await client.get(TablesEndpoints.all(eventId));
      const data = response.data;
      
      // Handle different response formats flexibly
      let tables = data?.data?.tables || data?.tables || data?.data || data || [];
      
      if (!Array.isArray(tables)) {
        console.warn('Unexpected tables API response format:', data);
        return [];
      }
      
      // Convert API field names to frontend field names
      // Note: API uses different naming conventions (see .cursor/CONVENTIONS.md)
      return tables.map((table: any) => ({
        id: table.tableId,                    // API → Frontend
        name: table.tableName,                 // API → Frontend
        capacity: table.maxSeats,              // API → Frontend
        guests: table.guests || [],            // Include guests if present
        assignedCount: table.assignedCount ?? table.guests?.length ?? 0, // Calculate if not provided
        extraGuests: table.extraGuests,        // Optional field
        layout: table.layout,                  // Optional field
      }));
    },
    enabled: Boolean(eventId),
    staleTime: 5 * 60_000,
    // Note: In dev mode with React StrictMode, you'll see 2x calls - this is normal
  });
}

// Fetch one table _with_ its guests & count
export function useTableApi(tableId: string) {
  return useQuery<TableWithGuests>({
    queryKey: ["tables", tableId],
    queryFn: () =>
      client
        .get<TableWithGuests>(TablesEndpoints.byId(tableId))
        .then(r => r.data),
    enabled: Boolean(tableId),
  });
}

//
// ——— MUTATIONS ————————————————————————————————————————————————————————
//

function invalidate(qc: ReturnType<typeof useQueryClient>, tableId?: string, eventId?: string) {
  // Force refetch by invalidating and refetching
  if (tableId) {
    qc.invalidateQueries({ queryKey: ["tables", tableId] });
    qc.refetchQueries({ queryKey: ["tables", tableId] });
  }
  if (eventId) {
    qc.invalidateQueries({ queryKey: ["tables", eventId] });
    qc.invalidateQueries({ queryKey: ["rsvps", eventId] });
    qc.invalidateQueries({ queryKey: ["guests", eventId] });
    // Force refetch tables, rsvps, and guests
    qc.refetchQueries({ queryKey: ["tables", eventId] });
    qc.refetchQueries({ queryKey: ["rsvps", eventId] });
    qc.refetchQueries({ queryKey: ["guests", eventId] });
  }
  // Only invalidate all tables if no specific IDs provided
  if (!tableId && !eventId) {
    qc.invalidateQueries({ queryKey: ["tables"] });
    qc.refetchQueries({ queryKey: ["tables"] });
  }
}

export function useCreateTable(eventId?: string) {
  const qc = useQueryClient();
  return useMutation<TableBase, Error, { name: string; capacity: number; eventId: string  }>({
    mutationFn: ({ name, capacity, eventId }) =>
      client.post<TableBase>(TablesEndpoints.create, {
        eventGuid: eventId,
        tableName: name,
        maxSeats: capacity,
      }).then(r => r.data),
    onSuccess: () => invalidate(qc, undefined, eventId),
  });
}

export function useBulkCreateTables(eventId?: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { 
    eventGuid: string; 
    tableName: string; 
    quantity: number; 
    maxSeats: number 
  }>({
    mutationFn: ({ eventGuid, tableName, quantity, maxSeats }) =>
      client.post(TablesEndpoints.bulkCreate, {
        eventGuid,
        tableName,
        quantity,
        maxSeats,
      }).then(r => r.data),
    onSuccess: () => invalidate(qc, undefined, eventId),
  });
}

export function useUpdateTableInfo(tableId: string, eventId?: string) {
  const qc = useQueryClient();
  return useMutation<TableBase, Error, { name: string; capacity: number }>({
    mutationFn: ({ name, capacity }) =>
      client.post<TableBase>(TablesEndpoints.update, {
        tableId: tableId,
        tableName: name,
        maxSeats: capacity,
      }).then(r => r.data),
    onSuccess: () => invalidate(qc, tableId, eventId),
  });
}

export function useDeleteTable(eventId?: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: id => client.delete(TablesEndpoints.delete(id)).then(r => r.data),
    onSuccess: () => invalidate(qc, undefined, eventId),
  });
}

export function useReassignGuest(tableId: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation<
    Rsvp,
    Error,
    { guestId: string; newTableId: string }
  >({
    mutationFn: ({ guestId, newTableId }) =>
      client
        .put<Rsvp>(
          TablesEndpoints.reassignGuest(tableId, guestId),
          { newTableId }
        )
        .then(r => r.data),
    onSuccess: () => invalidate(qc, tableId, eventId),
  });
}

export function useUpdateTableExtras(tableId: string, eventId?: string) {
  const qc = useQueryClient();
  return useMutation<TableWithGuests, Error, { extraGuests: number; tableName: string; maxSeats: number }>({
    mutationFn: ({ extraGuests, tableName, maxSeats }) =>
      client.post<TableWithGuests>(TablesEndpoints.update, {
        tableId: tableId,
        tableName: tableName,
        maxSeats: maxSeats,
        extraGuests: extraGuests,
      }).then(r => r.data),
    onSuccess: () => invalidate(qc, tableId, eventId),
  });
}

export function useUpdateTableLayout(tableId: string, eventId?: string) {
  const qc = useQueryClient();
  return useMutation<TableWithGuests, Error, { layout: { guestId: string; x: number; y: number }[] }>({
    mutationFn: ({ layout }) =>
      client.put<TableWithGuests>(TablesEndpoints.updateLayout(tableId), { layout })
            .then(r => r.data),
    onSuccess: () => invalidate(qc, tableId, eventId),
  });
}

export function useAssignGuestToTable(eventId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { guestId: string; tableId: string }>({
    mutationFn: ({ guestId, tableId }) =>
      client.post(GuestEndpoints.assignTable(guestId, tableId), {})
            .then(r => r.data),
    onSuccess: () => invalidate(qc, undefined, eventId),
  });
}

export function useUnassignGuestFromTable(eventId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (guestId: string) =>
      client.post(GuestEndpoints.unassignTable(guestId), {})
            .then(r => r.data),
    onSuccess: () => invalidate(qc, undefined, eventId),
  });
}
