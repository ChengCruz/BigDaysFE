import { useState, useCallback, useEffect, useRef } from "react";

export type FloorItemType = "table" | "stage" | "danceFloor" | "pillar" | "wall";
export type TableShape = "round" | "rect" | "square";

export interface FloorItem {
  id: string;
  type: FloorItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** For tables: { shape, tableId }. For decorations: { label } */
  meta?: Record<string, unknown>;
}

const STORAGE_PREFIX = "floorplan-";

function loadItems(eventId: string): FloorItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + eventId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(eventId: string, items: FloorItem[]) {
  localStorage.setItem(STORAGE_PREFIX + eventId, JSON.stringify(items));
}

export function useFloorPlanState(eventId: string) {
  const [floorItems, setFloorItems] = useState<FloorItem[]>(() => loadItems(eventId));
  const initializedRef = useRef(false);

  // Reload when eventId changes
  useEffect(() => {
    setFloorItems(loadItems(eventId));
    initializedRef.current = false;
  }, [eventId]);

  // Persist on every change (skip initial load)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    saveItems(eventId, floorItems);
  }, [eventId, floorItems]);

  const addItem = useCallback((item: FloorItem) => {
    setFloorItems((prev) => [...prev, item]);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<FloorItem>) => {
    setFloorItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setFloorItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const autoArrange = useCallback(
    (tableIds: string[], columns = 3) => {
      setFloorItems((prev) => {
        const nonTables = prev.filter((i) => i.type !== "table");
        const tables = prev.filter((i) => i.type === "table");
        const toArrange = tables.filter((t) => tableIds.includes(t.id));
        // Calculate spacing based on the largest table in each row/column
        const maxW = Math.max(...toArrange.map((t) => t.width), 100);
        const maxH = Math.max(...toArrange.map((t) => t.height), 100);
        const spacingX = maxW + 80; // table width + gap for seats + margin
        const spacingY = maxH + 80;
        const offsetX = 60;
        const offsetY = 60;
        const arranged = toArrange.map((t, idx) => ({
          ...t,
          x: offsetX + (idx % columns) * spacingX,
          y: offsetY + Math.floor(idx / columns) * spacingY,
        }));
        const kept = tables.filter((t) => !tableIds.includes(t.id));
        return [...nonTables, ...arranged, ...kept];
      });
    },
    []
  );

  /** Compute default size for a table based on capacity and shape */
  const tableDimensions = useCallback(
    (capacity: number, shape: string): { width: number; height: number } => {
      if (shape === "rect") {
        // Long table: wider, shorter
        const w = Math.max(160, 60 + capacity * 14);
        return { width: w, height: 70 };
      }
      if (shape === "square") {
        const side = Math.max(90, 50 + Math.ceil(capacity / 4) * 20);
        return { width: side, height: side };
      }
      // round — diameter scales with seats
      const d = Math.max(100, 60 + capacity * 6);
      return { width: d, height: d };
    },
    []
  );

  /** Ensure every API table has a floor item; add missing ones.
   *  Also patches existing table items that are missing meta.shape.
   *  @param defaultShape — shape used for newly added tables (default "round") */
  const syncTables = useCallback(
    (apiTables: { id: string; capacity: number }[], defaultShape: string = "round") => {
      setFloorItems((prev) => {
        let changed = false;
        const capacityMap = new Map(apiTables.map((t) => [t.id, t.capacity]));

        // Patch existing tables missing meta.shape or with wrong dimensions
        const patched = prev.map((item) => {
          if (item.type === "table" && (!item.meta || !item.meta.shape)) {
            changed = true;
            const cap = capacityMap.get(item.id) ?? 8;
            const dims = tableDimensions(cap, "round");
            return { ...item, ...dims, meta: { ...item.meta, shape: "round", capacity: cap } };
          }
          return item;
        });

        const existingIds = new Set(patched.filter((i) => i.type === "table").map((i) => i.id));
        const missing = apiTables.filter((t) => !existingIds.has(t.id));
        if (missing.length === 0) return changed ? patched : prev;

        const columns = 3;
        const spacingX = 260;
        const spacingY = 240;
        const offsetX = 60;
        const baseY = 60;
        const existingTables = patched.filter((i) => i.type === "table");
        const startIdx = existingTables.length;
        const newItems: FloorItem[] = missing.map((t, idx) => {
          const dims = tableDimensions(t.capacity, defaultShape);
          return {
            id: t.id,
            type: "table" as const,
            x: offsetX + ((startIdx + idx) % columns) * spacingX,
            y: baseY + Math.floor((startIdx + idx) / columns) * spacingY,
            ...dims,
            meta: { shape: defaultShape, capacity: t.capacity },
          };
        });
        return [...patched, ...newItems];
      });
    },
    [tableDimensions]
  );

  /** Change a table's shape and resize accordingly */
  const changeTableShape = useCallback(
    (id: string, shape: string) => {
      setFloorItems((prev) =>
        prev.map((item) => {
          if (item.id !== id || item.type !== "table") return item;
          const capacity = (item.meta?.capacity as number) ?? 8;
          const dims = tableDimensions(capacity, shape);
          return { ...item, ...dims, meta: { ...item.meta, shape } };
        })
      );
    },
    [tableDimensions]
  );

  return {
    floorItems,
    setFloorItems,
    addItem,
    updateItem,
    removeItem,
    autoArrange,
    syncTables,
    changeTableShape,
  };
}
