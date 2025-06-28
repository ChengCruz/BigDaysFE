import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { TablesEndpoints } from "../endpoints";
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
export function useTablesApi() {
  return useQuery<TableBase[]>({
    queryKey: ["tables"],
    queryFn: () => client.get<TableBase[]>(TablesEndpoints.all).then(r => r.data),
    staleTime: 5 * 60_000,
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
  qc.invalidateQueries({ queryKey: ["tables"] });
  if (tableId) qc.invalidateQueries({ queryKey: ["tables", tableId] });
  if (eventId) qc.invalidateQueries({ queryKey: ["rsvps", eventId] });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation<TableBase, Error, { name: string; capacity: number }>({
    mutationFn: data =>
      client.post<TableBase>(TablesEndpoints.create, data).then(r => r.data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateTableInfo(tableId: string) {
  const qc = useQueryClient();
  return useMutation<TableBase, Error, Partial<Pick<TableBase, "name" | "capacity">>>({
    mutationFn: data =>
      client.put<TableBase>(TablesEndpoints.update(tableId), data).then(r => r.data),
    onSuccess: () => invalidate(qc, tableId),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: id => client.delete(TablesEndpoints.delete(id)).then(r => r.data),
    onSuccess: () => invalidate(qc),
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

export function useUpdateTableExtras(tableId: string) {
  const qc = useQueryClient();
  return useMutation<TableWithGuests, Error, { extraGuests: number }>({
    mutationFn: payload =>
      client.put<TableWithGuests>(TablesEndpoints.update(tableId), payload)
            .then(r => r.data),
    onSuccess: () => invalidate(qc, tableId),
  });
}

export function useUpdateTableLayout(tableId: string) {
  const qc = useQueryClient();
  return useMutation<TableWithGuests, Error, { layout: { guestId: string; x: number; y: number }[] }>({
    mutationFn: ({ layout }) =>
      client.put<TableWithGuests>(TablesEndpoints.update(tableId), { layout })
            .then(r => r.data),
    onSuccess: () => invalidate(qc, tableId),
  });
}
