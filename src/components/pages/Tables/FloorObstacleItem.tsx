import React, { useRef, useCallback } from "react";
import type { FloorItem } from "./useFloorPlanState";

interface Props {
  item: FloorItem;
  zoom: number;
  selected: boolean;
  selectedIds: string[];
  onSelect: (id: string, addToSelection?: boolean) => void;
  onGroupDragStart: () => void;
  onGroupDragMove: (dx: number, dy: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

export const FloorObstacleItem: React.FC<Props> = ({ item, zoom, selected, selectedIds, onSelect, onGroupDragStart, onGroupDragMove, onMove, onResize }) => {
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging.current = true;
      dragMoved.current = false;

      const alreadyInGroup = selectedIds.includes(item.id) && selectedIds.length > 1 && !e.shiftKey;

      if (alreadyInGroup) {
        onGroupDragStart();
        const startX = e.clientX;
        const startY = e.clientY;
        const onMouseMove = (ev: MouseEvent) => {
          if (!dragging.current) return;
          dragMoved.current = true;
          onGroupDragMove((ev.clientX - startX) / zoom, (ev.clientY - startY) / zoom);
        };
        const onMouseUp = () => {
          dragging.current = false;
          if (!dragMoved.current) onSelect(item.id);
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      } else {
        onSelect(item.id, e.shiftKey);
        // Compute grab-offset in world coords against the item's stored x/y, not the
        // DOM bbox — getBoundingClientRect() returns the rotated axis-aligned bbox
        // and would jump on drag-start for rotated items.
        const canvas = document.getElementById("floor-canvas-content");
        const canvasRect = canvas?.getBoundingClientRect();
        if (canvasRect) {
          offset.current = {
            x: (e.clientX - canvasRect.left) / zoom - item.x,
            y: (e.clientY - canvasRect.top) / zoom - item.y,
          };
        }
        const onMouseMove = (ev: MouseEvent) => {
          if (!dragging.current) return;
          const canvas = document.getElementById("floor-canvas-content");
          if (!canvas) return;
          const canvasRect = canvas.getBoundingClientRect();
          const nx = (ev.clientX - canvasRect.left) / zoom - offset.current.x;
          const ny = (ev.clientY - canvasRect.top) / zoom - offset.current.y;
          onMove(item.id, nx, ny);
        };
        const onMouseUp = () => {
          dragging.current = false;
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    },
    [item.id, item.x, item.y, zoom, selectedIds, onSelect, onGroupDragStart, onGroupDragMove, onMove]
  );

  const isStage = item.type === "stage";
  const isDanceFloor = item.type === "danceFloor";
  const isPillar = item.type === "pillar";
  const isWalkway = item.type === "walkway";
  const isDeco = item.type === "deco";

  const rotation = item.rotation ?? 0;
  let style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    cursor: "move",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    fontSize: 10,
    zIndex: selected ? 50 : 5,
    transition: "box-shadow 0.2s",
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: "center center",
  };

  if (isStage) {
    style = {
      ...style,
      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
      color: "white",
      fontWeight: 600,
      letterSpacing: 2,
      textTransform: "uppercase",
      fontSize: 12,
      borderRadius: "4px 4px 40px 40px",
    };
  } else if (isDanceFloor) {
    style = {
      ...style,
      background: "repeating-conic-gradient(from 0deg, #f8fafc 0deg 90deg, #e0e7ff 90deg 180deg)",
      backgroundSize: "40px 40px",
      border: "3px solid #e2e8f0",
      borderRadius: 8,
      color: "#64748b",
      fontSize: 11,
    };
  } else if (isPillar) {
    style = {
      ...style,
      background: "radial-gradient(circle at 30% 30%, #78716c, #57534e)",
      border: "3px solid #44403c",
      borderRadius: "50%",
      boxShadow: "inset 0 -3px 8px rgba(0,0,0,0.3)",
      color: "white",
      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    };
  } else if (isWalkway) {
    style = {
      ...style,
      background: "linear-gradient(135deg, #991b1b, #450a0a)",
      border: "2px solid #7f1d1d",
      borderRadius: 6,
      color: "rgba(255,255,255,0.75)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 1,
      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
    };
  } else if (isDeco) {
    style = {
      ...style,
      background: "rgba(255,255,255,0.85)",
      border: "1.5px dashed #d1d5db",
      borderRadius: 10,
      fontSize: 28,
      flexDirection: "column" as const,
    };
  } else {
    // wall
    style = {
      ...style,
      background: "repeating-linear-gradient(45deg, #64748b, #64748b 10px, #475569 10px, #475569 20px)",
      border: "2px solid #334155",
      borderRadius: 4,
      color: "white",
      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    };
  }

  if (selected) {
    style.outline = "3px solid #4f46e5";
    style.outlineOffset = 4;
    style.boxShadow = "0 8px 25px rgba(79, 70, 229, 0.25)";
  }

  const label = isStage
    ? "\ud83c\udfad Stage"
    : isDanceFloor
    ? "\ud83d\udc83 Dance Floor"
    : isPillar
    ? "\ud83d\udd18"
    : isWalkway
    ? "Walkway"
    : isDeco
    ? ((item.meta?.emoji as string) ?? "\ud83c\udf38")
    : "\ud83e\uddf1 Wall";

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
    >
      {item.type === "wall" && item.height > item.width ? (
        <span style={{ transform: "rotate(90deg)", whiteSpace: "nowrap" }}>{label}</span>
      ) : (
        label
      )}

      {/* Resize handle when selected */}
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
              const minSize = isPillar || isDeco ? 20 : 30;
              onResize(item.id, Math.max(minSize, startW + dx), Math.max(minSize, startH + dy));
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
