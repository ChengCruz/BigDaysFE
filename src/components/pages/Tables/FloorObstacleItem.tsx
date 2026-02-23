import React, { useRef, useCallback } from "react";
import type { FloorItem } from "./useFloorPlanState";

interface Props {
  item: FloorItem;
  zoom: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

export const FloorObstacleItem: React.FC<Props> = ({ item, zoom, selected, onSelect, onMove }) => {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect(item.id);
      dragging.current = true;
      offset.current = {
        x: (e.clientX - (e.currentTarget as HTMLElement).getBoundingClientRect().left) / zoom,
        y: (e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top) / zoom,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        // We need to get the canvas rect to compute position relative to canvas content
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
    },
    [item.id, zoom, onSelect, onMove]
  );

  const isStage = item.type === "stage";
  const isDanceFloor = item.type === "danceFloor";
  const isPillar = item.type === "pillar";

  let className = "";
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
    zIndex: 5,
    transition: "box-shadow 0.2s",
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
    style.outline = "3px solid #ef4444";
    style.outlineOffset = 3;
  }

  const label = isStage ? "🎭 Stage" : isDanceFloor ? "💃 Dance Floor" : isPillar ? "🔘" : "🧱 Wall";

  return (
    <div
      className={className}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
    >
      {item.type === "wall" && item.height > item.width ? (
        <span style={{ transform: "rotate(90deg)", whiteSpace: "nowrap" }}>{label}</span>
      ) : (
        label
      )}
    </div>
  );
};
