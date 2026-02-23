import React, { useRef, useCallback } from "react";
import type { FloorItem } from "./useFloorPlanState";
import type { TableBase } from "../../../../api/hooks/useTablesApi";
import type { Guest } from "../../../../api/hooks/useGuestsApi";

interface Props {
  item: FloorItem;
  table: TableBase | undefined;
  assignedGuests: Guest[];
  zoom: number;
  selected: boolean;
  snapEnabled: boolean;
  snapSize: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onDropGuest: (tableId: string, guestId: string) => void;
  onSeatClick: (tableId: string, seatIndex: number, guestId: string | null, anchorX: number, anchorY: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

function snap(v: number, size: number, enabled: boolean) {
  return enabled ? Math.round(v / size) * size : v;
}

const SEAT_SIZE = 26;
const SEAT_HALF = SEAT_SIZE / 2;
const SEAT_GAP = 6; // gap between seat edge and table edge

/** Position seats around the table perimeter – matches mockup placement */
function seatPositions(
  shape: string,
  capacity: number,
  w: number,
  h: number
): { x: number; y: number }[] {
  const seats: { x: number; y: number }[] = [];

  if (shape === "round") {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.max(w, h) / 2 + SEAT_GAP + SEAT_HALF;
    for (let i = 0; i < capacity; i++) {
      const angle = (2 * Math.PI * i) / capacity - Math.PI / 2;
      seats.push({
        x: cx + Math.cos(angle) * radius - SEAT_HALF,
        y: cy + Math.sin(angle) * radius - SEAT_HALF,
      });
    }
  } else if (shape === "rect") {
    // Rectangular: top and bottom edges get most seats, 1 each on left/right
    const sideSeats = capacity >= 6 ? 1 : 0;
    const remaining = capacity - sideSeats * 2;
    const topCount = Math.ceil(remaining / 2);
    const bottomCount = remaining - topCount;
    let idx = 0;
    // top edge
    for (let i = 0; i < topCount && idx < capacity; i++, idx++) {
      seats.push({
        x: (w / (topCount + 1)) * (i + 1) - SEAT_HALF,
        y: -(SEAT_GAP + SEAT_SIZE),
      });
    }
    // right edge
    for (let i = 0; i < sideSeats && idx < capacity; i++, idx++) {
      seats.push({ x: w + SEAT_GAP, y: h / 2 - SEAT_HALF });
    }
    // bottom edge
    for (let i = 0; i < bottomCount && idx < capacity; i++, idx++) {
      seats.push({
        x: (w / (bottomCount + 1)) * (i + 1) - SEAT_HALF,
        y: h + SEAT_GAP,
      });
    }
    // left edge
    for (let i = 0; i < sideSeats && idx < capacity; i++, idx++) {
      seats.push({ x: -(SEAT_GAP + SEAT_SIZE), y: h / 2 - SEAT_HALF });
    }
  } else {
    // Square: evenly around 4 sides
    const perSide = Math.ceil(capacity / 4);
    let idx = 0;
    // top
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (i + 1) / (perSide + 1);
      seats.push({ x: frac * w - SEAT_HALF, y: -(SEAT_GAP + SEAT_SIZE) });
    }
    // right
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (i + 1) / (perSide + 1);
      seats.push({ x: w + SEAT_GAP, y: frac * h - SEAT_HALF });
    }
    // bottom
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (perSide - i) / (perSide + 1);
      seats.push({ x: frac * w - SEAT_HALF, y: h + SEAT_GAP });
    }
    // left
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (perSide - i) / (perSide + 1);
      seats.push({ x: -(SEAT_GAP + SEAT_SIZE), y: frac * h - SEAT_HALF });
    }
  }
  return seats;
}

const TABLE_COLORS = [
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #ec4899, #f43f5e)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #22c55e, #16a34a)",
  "linear-gradient(135deg, #f97316, #ea580c)",
  "linear-gradient(135deg, #8b5cf6, #6366f1)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #eab308, #ca8a04)",
];

function getTableColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return TABLE_COLORS[Math.abs(hash) % TABLE_COLORS.length];
}

export const FloorTableItem: React.FC<Props> = ({
  item,
  table,
  assignedGuests,
  zoom,
  selected,
  snapEnabled,
  snapSize,
  onSelect,
  onMove,
  onDoubleClick,
  onDropGuest,
  onSeatClick,
  onResize,
}) => {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect(item.id);
      dragging.current = true;
      dragMoved.current = false;
      offset.current = {
        x: (e.clientX - (e.currentTarget as HTMLElement).getBoundingClientRect().left) / zoom,
        y: (e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top) / zoom,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        dragMoved.current = true;
        const canvas = document.getElementById("floor-canvas-content");
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const rawX = (ev.clientX - canvasRect.left) / zoom - offset.current.x;
        const rawY = (ev.clientY - canvasRect.top) / zoom - offset.current.y;
        onMove(item.id, snap(rawX, snapSize, snapEnabled), snap(rawY, snapSize, snapEnabled));
      };
      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [item.id, zoom, snapEnabled, snapSize, onSelect, onMove]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dragMoved.current) onDoubleClick(item.id);
    },
    [item.id, onDoubleClick]
  );

  // Drag-and-drop guest onto table
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const guestId = e.dataTransfer.getData("guestId");
      if (guestId && table) {
        onDropGuest(table.id, guestId);
      }
    },
    [table, onDropGuest]
  );

  if (!table) return null;

  const capacity = table.capacity || 8;
  const assigned = assignedGuests.length;
  const shape = (item.meta?.shape as string) || "round";
  const bgColor = getTableColor(item.id);

  const isRound = shape === "round";
  const borderRadius = isRound ? "50%" : shape === "rect" ? 12 : 8;

  const seats = seatPositions(shape, capacity, item.width, item.height);

  return (
    <div
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        cursor: "move",
        zIndex: selected ? 100 : 10,
        transition: "box-shadow 0.2s, transform 0.1s",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Seats around the table */}
      {seats.map((pos, idx) => {
        const guest = assignedGuests[idx];
        const occupied = !!guest;
        const isVip = guest?.flag === "VIP";
        return (
          <div
            key={idx}
            title={
              occupied
                ? `${guest.name} — click to unassign`
                : `Seat ${idx + 1} — click to assign`
            }
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onSeatClick(
                item.id,
                idx,
                occupied ? guest.id : null,
                rect.left + rect.width / 2,
                rect.top
              );
            }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: SEAT_SIZE,
              height: SEAT_SIZE,
              borderRadius: "50%",
              border: occupied
                ? isVip
                  ? "2px solid #a855f7"
                  : "2px solid #22c55e"
                : "2px dashed #cbd5e1",
              background: occupied
                ? isVip
                  ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                  : "linear-gradient(135deg, #22c55e, #16a34a)"
                : "white",
              color: occupied ? "white" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              zIndex: 2,
            }}
          >
            {occupied ? (guest.name?.[0] ?? "G") : idx + 1}
          </div>
        );
      })}

      {/* Table body */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: bgColor,
          borderRadius,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          outline: selected ? "3px solid #4f46e5" : "none",
          outlineOffset: selected ? 4 : undefined,
          boxShadow: selected
            ? "0 12px 30px rgba(79, 70, 229, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.08)",
          transition: "box-shadow 0.2s, outline 0.15s",
        }}
      >
        <span style={{ color: "white", fontSize: 14, lineHeight: 1 }}>
          {assigned >= capacity ? "\u2705" : "\ud83e\ude91"}
        </span>
        <span style={{ color: "white", fontSize: 10, fontWeight: 700, marginTop: 2, letterSpacing: 0.3 }}>{table.name}</span>
        <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: 500 }}>
          {assigned}/{capacity}
        </span>
      </div>

      {/* Resize handle when selected */}
      {selected && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = item.width;
            const startH = item.height;
            const onMouseMove = (ev: MouseEvent) => {
              const dx = (ev.clientX - startX) / zoom;
              const dy = (ev.clientY - startY) / zoom;
              onResize(item.id, Math.max(50, startW + dx), Math.max(50, startH + dy));
            };
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
          style={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 14,
            height: 14,
            background: "white",
            border: "2px solid #4f46e5",
            borderRadius: 3,
            cursor: "nwse-resize",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};
