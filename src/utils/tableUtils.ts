import type { TableBase } from "../api/hooks/useTablesApi";

export interface ApiTable {
  tableId: string;
  tableName: string;
  maxSeats: number;
  guests?: unknown[];
  assignedCount?: number;
  extraGuests?: number;
  layout?: { guestId: string; x: number; y: number }[];
}

export function normalizeTable(table: ApiTable): TableBase {
  return {
    id: table.tableId,
    name: table.tableName,
    capacity: table.maxSeats,
    guests: table.guests ?? [],
    assignedCount: table.assignedCount ?? table.guests?.length ?? 0,
    extraGuests: table.extraGuests,
    layout: table.layout,
  };
}
