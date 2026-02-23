import React, { useRef, useCallback, useState, useEffect } from "react";
import type { FloorItem } from "./useFloorPlanState";
import type { TableBase } from "../../../../api/hooks/useTablesApi";
import type { Guest } from "../../../../api/hooks/useGuestsApi";
import { FloorTableItem } from "./FloorTableItem";
import { FloorObstacleItem } from "./FloorObstacleItem";

interface Props {
  floorItems: FloorItem[];
  tables: TableBase[];
  guests: Guest[];
  zoom: number;
  panX: number;
  panY: number;
  selectedId: string | null;
  snapEnabled: boolean;
  snapSize: number;
  toolMode: string;
  onZoomChange: (z: number) => void;
  onPanChange: (x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onDoubleClickTable: (id: string) => void;
  onDropGuest: (tableId: string, guestId: string) => void;
  onDeleteSelected: () => void;
  onCanvasClick: (x: number, y: number) => void;
  onSeatClick: (tableId: string, seatIndex: number, guestId: string | null, anchorX: number, anchorY: number) => void;
  onResizeItem: (id: string, w: number, h: number) => void;
}

export const FloorCanvas: React.FC<Props> = ({
  floorItems,
  tables,
  guests,
  zoom,
  panX,
  panY,
  selectedId,
  snapEnabled,
  snapSize,
  toolMode,
  onZoomChange,
  onPanChange,
  onSelect,
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
  const [showHint, setShowHint] = useState(true);

  // Focus canvas when an item is selected so keyboard shortcuts (Delete) work
  useEffect(() => {
    if (selectedId && containerRef.current) {
      containerRef.current.focus();
    }
  }, [selectedId]);

  // Auto-dismiss hint after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Wheel zoom — use native listener to prevent default (React onWheel is passive)
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

  // Pan via mousedown on canvas background, or place tool item
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only act on canvas background, not on items
      const target = e.target as HTMLElement;
      if (target.closest("[data-floor-item]")) return;

      // If a table tool is active, place it at click position
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

  // Keyboard
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

  // Minimap
  const minimapW = 180;
  const minimapH = 120;
  const canvasW = 2000;
  const canvasH = 1400;
  const mmScale = minimapW / canvasW;
  const mmHeaderH = 18; // height of the "Overview" header

  /** Drag from minimap to pan the main canvas */
  const handleMinimapMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const mmRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      const updatePan = (clientX: number, clientY: number) => {
        const mx = clientX - mmRect.left;
        const my = clientY - mmRect.top - mmHeaderH;
        // Convert minimap coords → canvas coords
        const canvasX = mx / mmScale;
        const canvasY = my / mmScale;
        // Center the viewport on that canvas point
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
      }}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
    >
      {/* Transformed canvas content layer */}
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
                <FloorTableItem
                  item={item}
                  table={table}
                  assignedGuests={assigned}
                  zoom={zoom}
                  selected={selectedId === item.id}
                  snapEnabled={snapEnabled}
                  snapSize={snapSize}
                  onSelect={onSelect}
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
                selected={selectedId === item.id}
                onSelect={onSelect}
                onMove={onMoveItem}
                onResize={onResizeItem}
              />
            </div>
          );
        })}
      </div>

      {/* Hint box */}
      {showHint && (
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 rounded-lg px-3 py-2.5 shadow-lg max-w-[240px] z-20 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Quick Tips</p>
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition -mt-0.5"
              onClick={() => setShowHint(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5 leading-relaxed">
            <li>Drag tables to reposition</li>
            <li>Double-click table to edit</li>
            <li>Click seats to assign/unassign guests</li>
            <li>Drag corner handle to resize</li>
            <li>Select + <kbd className="px-1 py-px bg-gray-100 dark:bg-slate-700 rounded text-[9px] font-mono">Del</kbd> to remove obstacles</li>
            <li>Scroll to zoom, drag minimap to navigate</li>
          </ul>
        </div>
      )}

      {/* Minimap — click/drag to navigate */}
      <div
        className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 rounded-lg overflow-hidden shadow-md z-20"
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
          {/* Viewport indicator */}
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
