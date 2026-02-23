import React, { useRef, useCallback, useState, useEffect } from "react";
import type { FloorItem } from "./useFloorPlanState";
import type { TableBase } from "../../../api/hooks/useTablesApi";
import type { Guest } from "../../../api/hooks/useGuestsApi";
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [showHint, setShowHint] = useState(true);

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
              />
            </div>
          );
        })}
      </div>

      {/* Hint box – matches mockup */}
      {showHint && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 shadow-lg max-w-xs z-20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">💡</span>
            <button
              className="text-gray-400 hover:text-gray-600 text-sm"
              onClick={() => setShowHint(false)}
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium mb-1">Drag & Drop Layout</p>
          <ul className="text-xs text-indigo-600/80 dark:text-indigo-400/80 space-y-0.5">
            <li>• Drag tables to reposition</li>
            <li>• Double-click table to edit</li>
            <li>• Drag guests to empty seats</li>
            <li>• Add obstacles (pillars/walls)</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px]">Delete</kbd> to remove selected</li>
            <li>• Scroll to zoom in/out</li>
          </ul>
        </div>
      )}

      {/* Minimap */}
      <div
        className="absolute bottom-5 right-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-lg z-20"
        style={{ width: minimapW, height: minimapH + 22 }}
      >
        <div className="p-1 text-[8px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
          Overview
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
