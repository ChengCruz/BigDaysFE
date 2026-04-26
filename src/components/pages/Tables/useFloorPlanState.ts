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

/**
 * Manages floor plan item state.
 * Initial items are loaded from the API (passed in via initialItems/isLoaded).
 * On eventId change the state resets so the next API load repopulates it.
 */
export function useFloorPlanState(
  eventId: string,
  initialItems: FloorItem[],
  isLoaded: boolean
) {
  const [floorItems, setFloorItems] = useState<FloorItem[]>([]);
  const initializedRef = useRef(false);

  // Reset when the event changes so the incoming API data is accepted fresh
  useEffect(() => {
    initializedRef.current = false;
    setFloorItems([]);
  }, [eventId]);

  // Populate from API data exactly once per event (even if the list is empty)
  useEffect(() => {
    if (isLoaded && !initializedRef.current) {
      initializedRef.current = true;
      setFloorItems(initialItems);
    }
  }, [isLoaded, initialItems]);

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
    (tableIds: string[], columns?: number) => {
      setFloorItems((prev) => {
        const nonTables = prev.filter((i) => i.type !== "table");
        const tables = prev.filter((i) => i.type === "table");
        const toArrange = tables.filter((t) => tableIds.includes(t.id));
        if (toArrange.length === 0) return prev;

        const canvasW = 2000;
        const canvasH = 1400;
        const maxW = Math.max(...toArrange.map((t) => t.width), 100);
        const maxH = Math.max(...toArrange.map((t) => t.height), 100);
        const spacingX = maxW + 80;
        const spacingY = maxH + 80;

        // Adaptive column count based on canvas aspect ratio and table count
        const cols =
          columns ??
          Math.max(
            1,
            Math.min(
              toArrange.length,
              Math.round(Math.sqrt(toArrange.length * (canvasW / canvasH)))
            )
          );
        const rows = Math.ceil(toArrange.length / cols);

        // Push grid below any stage/dance floor sitting at the top of the canvas
        const topObstacle = nonTables
          .filter((i) => (i.type === "stage" || i.type === "danceFloor") && i.y < 220)
          .sort((a, b) => b.y + b.height - (a.y + a.height))[0];
        const baseOffsetY = topObstacle ? topObstacle.y + topObstacle.height + 60 : 60;

        const totalW = cols * spacingX - 80;
        const totalH = rows * spacingY - 80;
        const offsetX = Math.max(60, Math.round((canvasW - totalW) / 2));
        const offsetY = Math.max(baseOffsetY, Math.round((canvasH - totalH - baseOffsetY) / 2) + 40);

        const arranged = toArrange.map((t, idx) => ({
          ...t,
          x: offsetX + (idx % cols) * spacingX,
          y: offsetY + Math.floor(idx / cols) * spacingY,
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

  /** Ensure every API table has a floor item; add missing ones. */
  const syncTables = useCallback(
    (apiTables: { id: string; capacity: number }[], defaultShape: string = "round") => {
      setFloorItems((prev) => {
        let changed = false;
        const capacityMap = new Map(apiTables.map((t) => [t.id, t.capacity]));

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

  /**
   * Set every table to the same shape, and optionally the same size.
   * - sizeMode "byCapacity" — each table keeps its own capacity-based dimensions
   * - sizeMode "uniform" — all tables get the dimensions of the largest-capacity table
   * Returns the number of tables affected.
   */
  const standardizeTables = useCallback(
    (shape: string, sizeMode: "byCapacity" | "uniform") => {
      let affected = 0;
      setFloorItems((prev) => {
        const tables = prev.filter((i) => i.type === "table");
        if (tables.length === 0) return prev;

        let uniformDims: { width: number; height: number } | null = null;
        if (sizeMode === "uniform") {
          const maxCap = tables.reduce((m, t) => {
            const cap = (t.meta?.capacity as number) ?? 8;
            return Math.max(m, cap);
          }, 0);
          uniformDims = tableDimensions(maxCap || 8, shape);
        }

        affected = tables.length;
        return prev.map((item) => {
          if (item.type !== "table") return item;
          const capacity = (item.meta?.capacity as number) ?? 8;
          const dims = uniformDims ?? tableDimensions(capacity, shape);
          return { ...item, ...dims, meta: { ...item.meta, shape } };
        });
      });
      return affected;
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
    standardizeTables,
  };
}
