import React, { useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import type { FloorItem } from "../useFloorPlanState";
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
  draggedGuest?: { id: string; pax: number } | null;
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
const SEAT_GAP = 6;

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
    const sideSeats = capacity >= 6 ? 1 : 0;
    const remaining = capacity - sideSeats * 2;
    const topCount = Math.ceil(remaining / 2);
    const bottomCount = remaining - topCount;
    let idx = 0;
    for (let i = 0; i < topCount && idx < capacity; i++, idx++) {
      seats.push({
        x: (w / (topCount + 1)) * (i + 1) - SEAT_HALF,
        y: -(SEAT_GAP + SEAT_SIZE),
      });
    }
    for (let i = 0; i < sideSeats && idx < capacity; i++, idx++) {
      seats.push({ x: w + SEAT_GAP, y: h / 2 - SEAT_HALF });
    }
    for (let i = 0; i < bottomCount && idx < capacity; i++, idx++) {
      seats.push({
        x: (w / (bottomCount + 1)) * (i + 1) - SEAT_HALF,
        y: h + SEAT_GAP,
      });
    }
    for (let i = 0; i < sideSeats && idx < capacity; i++, idx++) {
      seats.push({ x: -(SEAT_GAP + SEAT_SIZE), y: h / 2 - SEAT_HALF });
    }
  } else {
    const perSide = Math.ceil(capacity / 4);
    let idx = 0;
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (i + 1) / (perSide + 1);
      seats.push({ x: frac * w - SEAT_HALF, y: -(SEAT_GAP + SEAT_SIZE) });
    }
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (i + 1) / (perSide + 1);
      seats.push({ x: w + SEAT_GAP, y: frac * h - SEAT_HALF });
    }
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (perSide - i) / (perSide + 1);
      seats.push({ x: frac * w - SEAT_HALF, y: h + SEAT_GAP });
    }
    for (let i = 0; i < perSide && idx < capacity; i++, idx++) {
      const frac = (perSide - i) / (perSide + 1);
      seats.push({ x: -(SEAT_GAP + SEAT_SIZE), y: frac * h - SEAT_HALF });
    }
  }
  return seats;
}

const TABLE_COLOR = "linear-gradient(135deg, #6366f1, #7c3aed)";

export const FloorTableItemV3: React.FC<Props> = ({
  item,
  table,
  assignedGuests,
  zoom,
  selected,
  snapEnabled,
  snapSize,
  draggedGuest,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<{ top: number; bottom: number; left: number } | null>(null);

  const captureAnchor = useCallback(() => {
    if (!rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    setTooltipAnchor({ top: r.top, bottom: r.bottom, left: r.left + r.width / 2 });
  }, []);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const guestId = e.dataTransfer.getData("guestId");
      if (guestId && table) {
        onDropGuest(table.id, guestId);
      }
    },
    [table, onDropGuest]
  );

  if (!table) return null;

  const capacity = table.capacity || 8;
  const shape = (item.meta?.shape as string) || "round";
  const bgColor = TABLE_COLOR;

  const isRound = shape === "round";
  const borderRadius = isRound ? "50%" : shape === "rect" ? 12 : 8;

  const expandedGuests = assignedGuests.flatMap((g) => Array(g.pax ?? 1).fill(g));
  const assigned = expandedGuests.length;

  const availableSeats = capacity - assigned;
  const canAcceptDrop = draggedGuest ? draggedGuest.pax <= availableSeats : true;

  const seats = seatPositions(shape, capacity, item.width, item.height);

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        cursor: "move",
        zIndex: selected ? 100 : hovered || isDragOver ? 50 : 10,
        transition: "box-shadow 0.2s, transform 0.1s",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => {
        captureAnchor();
        setHovered(true);
      }}
      onMouseMove={() => {
        if (hovered) captureAnchor();
      }}
      onMouseLeave={() => {
        setHovered(false);
        setTooltipAnchor(null);
      }}
    >
      {seats.map((pos, idx) => {
        const guest = expandedGuests[idx];
        const occupied = !!guest;
        const isVip = guest?.flag === "VIP";
        return (
          <div
            key={idx}
            title={
              occupied
                ? `${guest.name} — click for options`
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
          outline: selected
            ? "3px solid #4f46e5"
            : isDragOver && canAcceptDrop
            ? "3px solid #22c55e"
            : isDragOver && !canAcceptDrop
            ? "3px solid #ef4444"
            : "none",
          outlineOffset: selected || isDragOver ? 4 : undefined,
          boxShadow: selected
            ? "0 12px 30px rgba(79, 70, 229, 0.3)"
            : isDragOver && canAcceptDrop
            ? "0 10px 28px rgba(34, 197, 94, 0.3)"
            : isDragOver && !canAcceptDrop
            ? "0 10px 28px rgba(239, 68, 68, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.08)",
          transition: "box-shadow 0.2s, outline 0.15s",
          opacity: draggedGuest && !canAcceptDrop && !isDragOver ? 0.55 : 1,
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

      {/* Drop feedback badge — appears on the table during drag-over */}
      {isDragOver && draggedGuest && (
        <div
          className="fp-no-print"
          style={{
            position: "absolute",
            left: "50%",
            top: -8,
            transform: `translate(-50%, -100%) scale(${1 / zoom})`,
            transformOrigin: "bottom center",
            background: canAcceptDrop ? "#16a34a" : "#dc2626",
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 8px",
            borderRadius: 6,
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 150,
          }}
        >
          {canAcceptDrop
            ? `Drop to assign (${draggedGuest.pax} pax → ${assigned + draggedGuest.pax}/${capacity})`
            : `Not enough seats — need ${draggedGuest.pax}, ${Math.max(0, availableSeats)} open`}
        </div>
      )}

      {/* Hover tooltip — guest list */}
      {hovered && !dragging.current && !isDragOver && tooltipAnchor &&
        createPortal(
          (() => {
            const TOOLTIP_MAX_H = 240;
            const GAP = 10;
            const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
            const viewportW = typeof window !== "undefined" ? window.innerWidth : 1200;
            const placeBelow = tooltipAnchor.top < TOOLTIP_MAX_H + GAP;
            const top = placeBelow ? tooltipAnchor.bottom + GAP : tooltipAnchor.top - GAP;
            const clampedLeft = Math.min(
              Math.max(tooltipAnchor.left, 132),
              viewportW - 132
            );
            return (
              <div
                className="fp-no-print"
                style={{
                  position: "fixed",
                  left: clampedLeft,
                  top,
                  transform: placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
                  background: "white",
                  color: "#1f2937",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "8px 10px",
                  minWidth: 180,
                  maxWidth: 260,
                  maxHeight: Math.min(TOOLTIP_MAX_H, viewportH - 16),
                  overflowY: "auto",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
                  pointerEvents: "none",
                  zIndex: 9999,
                  fontSize: 12,
                  lineHeight: 1.35,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{table.name}</span>
                  <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                    {assigned}/{capacity}
                  </span>
                </div>
                {(() => {
                  const pct = capacity > 0 ? Math.min(100, (assigned / capacity) * 100) : 0;
                  const full = assigned >= capacity;
                  const barColor = full ? "#16a34a" : pct >= 75 ? "#4f46e5" : "#6366f1";
                  return (
                    <div
                      style={{
                        height: 4,
                        background: "#f1f5f9",
                        borderRadius: 2,
                        overflow: "hidden",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: barColor,
                          transition: "width 0.2s",
                        }}
                      />
                    </div>
                  );
                })()}
                {assignedGuests.length > 0 && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      marginBottom: 6,
                      paddingBottom: 6,
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{assignedGuests.length} {assignedGuests.length === 1 ? "guest" : "guests"}</span>
                    <span>·</span>
                    <span>{assigned} pax</span>
                    {capacity - assigned > 0 && (
                      <>
                        <span>·</span>
                        <span style={{ color: "#0ea5e9" }}>{capacity - assigned} open</span>
                      </>
                    )}
                  </div>
                )}
                {assignedGuests.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 11, paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                    No guests assigned
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    {assignedGuests.map((g) => {
                      const pax = g.pax ?? 1;
                      const isVip = g.flag === "VIP";
                      const note = g.notes || g.remarks;
                      return (
                        <li
                          key={g.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: "#1f2937",
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {isVip && (
                                <span
                                  style={{
                                    display: "inline-block",
                                    background: "#fbbf24",
                                    color: "#78350f",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: "1px 4px",
                                    borderRadius: 3,
                                    marginRight: 4,
                                    verticalAlign: "middle",
                                  }}
                                >
                                  VIP
                                </span>
                              )}
                              {g.name}
                            </span>
                            {pax > 1 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#475569",
                                  background: "#e0e7ff",
                                  padding: "1px 5px",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                                title={`${pax} pax total`}
                              >
                                {pax}
                              </span>
                            )}
                          </div>
                          {note && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "#94a3b8",
                                fontStyle: "italic",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                paddingLeft: isVip ? 0 : 2,
                              }}
                              title={note}
                            >
                              {note}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })(),
          document.body
        )}

      {selected && (
        <div
          className="fp-no-print"
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
