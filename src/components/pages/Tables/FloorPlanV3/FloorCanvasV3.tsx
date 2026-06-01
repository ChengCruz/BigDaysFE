import React, { useRef, useCallback, useEffect } from "react";
import type { FloorItem } from "../useFloorPlanState";
import type { TableBase } from "../../../../api/hooks/useTablesApi";
import type { Guest } from "../../../../api/hooks/useGuestsApi";
import { FloorTableItemV3 } from "./FloorTableItemV3";
import { FloorObstacleItem } from "../FloorObstacleItem";

interface Props {
  floorItems: FloorItem[];
  tables: TableBase[];
  guests: Guest[];
  zoom: number;
  panX: number;
  panY: number;
  selectedIds: string[];
  snapEnabled: boolean;
  snapSize: number;
  toolMode: string;
  draggedGuest: { id: string; pax: number } | null;
  onZoomChange: (z: number) => void;
  onPanChange: (x: number, y: number) => void;
  onSelect: (id: string | null, addToSelection?: boolean) => void;
  onGroupDragStart: () => void;
  onGroupDragMove: (dx: number, dy: number) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onDoubleClickTable: (id: string) => void;
  onDropGuest: (tableId: string, guestId: string) => void;
  onDeleteSelected: () => void;
  onCanvasClick: (x: number, y: number) => void;
  onSeatClick: (tableId: string, seatIndex: number, guestId: string | null, anchorX: number, anchorY: number) => void;
  onResizeItem: (id: string, w: number, h: number) => void;
}

export const FloorCanvasV3: React.FC<Props> = ({
  floorItems,
  tables,
  guests,
  zoom,
  panX,
  panY,
  selectedIds,
  snapEnabled,
  snapSize,
  toolMode,
  draggedGuest,
  onZoomChange,
  onPanChange,
  onSelect,
  onGroupDragStart,
  onGroupDragMove,
  onMoveItem,
  onDoubleClickTable,
  onDropGuest,
  onDeleteSelected,
  onCanvasClick,
  onSeatClick,
  onResizeItem,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    if (selectedIds.length > 0 && containerRef.current) {
      containerRef.current.focus();
    }
  }, [selectedIds]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      onZoomChange(Math.min(2, Math.max(0.3, zoom + delta)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, onZoomChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-floor-item]")) return;

      if (toolMode !== "select") {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left - panX) / zoom;
          const y = (e.clientY - rect.top - panY) / zoom;
          const snapped_x = snapEnabled ? Math.round(x / snapSize) * snapSize : x;
          const snapped_y = snapEnabled ? Math.round(y / snapSize) * snapSize : y;
          onCanvasClick(snapped_x, snapped_y);
        }
        return;
      }

      onSelect(null);
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    },
    [panX, panY, zoom, snapEnabled, snapSize, toolMode, onSelect, onCanvasClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      onPanChange(panStart.current.px + dx, panStart.current.py + dy);
    },
    [onPanChange]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        onDeleteSelected();
      }
      if (e.key === "Escape") {
        onSelect(null);
      }
    },
    [onDeleteSelected, onSelect]
  );

  const tableMap = new Map(tables.map((t) => [t.id, t]));

  const minimapW = 180;
  const minimapH = 120;
  const canvasW = 2000;
  const canvasH = 1400;
  const mmScale = minimapW / canvasW;
  const mmHeaderH = 18;

  const handleMinimapMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const mmRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      const updatePan = (clientX: number, clientY: number) => {
        const mx = clientX - mmRect.left;
        const my = clientY - mmRect.top - mmHeaderH;
        const canvasX = mx / mmScale;
        const canvasY = my / mmScale;
        const cw = containerRef.current?.clientWidth ?? 800;
        const ch = containerRef.current?.clientHeight ?? 500;
        const newPanX = -(canvasX * zoom) + cw / 2;
        const newPanY = -(canvasY * zoom) + ch / 2;
        onPanChange(newPanX, newPanY);
      };

      updatePan(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) => updatePan(ev.clientX, ev.clientY);
      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [zoom, mmScale, onPanChange]
  );

  return (
    <div
      ref={containerRef}
      className="floor-canvas flex-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-slate-900 relative"
      style={{
        background: `
          linear-gradient(90deg, rgba(79,70,229,0.05) 1px, transparent 1px),
          linear-gradient(rgba(79,70,229,0.05) 1px, transparent 1px),
          linear-gradient(to bottom right, #f8fafc, #f1f5f9)`,
        backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        cursor: toolMode !== "select" ? "crosshair" : isPanning.current ? "grabbing" : "grab",
        minHeight: 400,
        userSelect: "none",
      }}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
    >
      <div
        id="floor-canvas-content"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: canvasW,
          height: canvasH,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {floorItems.map((item) => {
          if (item.type === "table") {
            const table = tableMap.get(item.id);
            const assigned = guests.filter((g) => g.tableId === item.id);
            return (
              <div key={item.id} data-floor-item>
                <FloorTableItemV3
                  item={item}
                  table={table}
                  assignedGuests={assigned}
                  zoom={zoom}
                  selected={selectedIds.includes(item.id)}
                  selectedIds={selectedIds}
                  snapEnabled={snapEnabled}
                  snapSize={snapSize}
                  draggedGuest={draggedGuest}
                  onSelect={onSelect}
                  onGroupDragStart={onGroupDragStart}
                  onGroupDragMove={onGroupDragMove}
                  onMove={onMoveItem}
                  onDoubleClick={onDoubleClickTable}
                  onDropGuest={onDropGuest}
                  onSeatClick={onSeatClick}
                  onResize={onResizeItem}
                />
              </div>
            );
          }
          return (
            <div key={item.id} data-floor-item>
              <FloorObstacleItem
                item={item}
                zoom={zoom}
                selected={selectedIds.includes(item.id)}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onGroupDragStart={onGroupDragStart}
                onGroupDragMove={onGroupDragMove}
                onMove={onMoveItem}
                onResize={onResizeItem}
              />
            </div>
          );
        })}
      </div>


      <div
        className="fp-no-print absolute bottom-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 rounded-lg overflow-hidden shadow-md z-20"
        style={{ width: minimapW, height: minimapH + mmHeaderH, cursor: "pointer" }}
        onMouseDown={handleMinimapMouseDown}
      >
        <div className="px-2 py-0.5 text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-slate-900/50 font-medium select-none">
          Overview — drag to navigate
        </div>
        <div className="relative" style={{ height: minimapH }}>
          {floorItems.map((item) => {
            const isTable = item.type === "table";
            const bg = isTable ? "#7c3aed" : item.type === "stage" ? "#4f46e5" : item.type === "danceFloor" ? "#c7d2fe" : "#64748b";
            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  left: item.x * mmScale,
                  top: item.y * mmScale,
                  width: Math.max(4, item.width * mmScale),
                  height: Math.max(4, item.height * mmScale),
                  background: bg,
                  borderRadius: isTable || item.type === "pillar" ? "50%" : 2,
                  pointerEvents: "none",
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              border: "2px solid #4f46e5",
              background: "rgba(79, 70, 229, 0.1)",
              borderRadius: 2,
              pointerEvents: "none",
              left: Math.max(0, -panX / zoom) * mmScale,
              top: Math.max(0, -panY / zoom) * mmScale,
              width: ((containerRef.current?.clientWidth ?? 800) / zoom) * mmScale,
              height: ((containerRef.current?.clientHeight ?? 500) / zoom) * mmScale,
            }}
          />
        </div>
      </div>
    </div>
  );
};
