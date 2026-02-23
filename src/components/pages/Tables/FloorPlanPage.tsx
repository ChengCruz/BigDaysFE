import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useEventContext } from "../../../context/EventContext";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useGuestsApi, useAssignGuestToTable, useUnassignGuestFromTable } from "../../../api/hooks/useGuestsApi";
import { useFloorPlanState } from "./useFloorPlanState";
import type { FloorItemType } from "./useFloorPlanState";
import { FloorCanvas } from "./FloorCanvas";
import { FloorGuestPanel } from "./FloorGuestPanel";
import { StatsCard } from "../../atoms/StatsCard";
import { Button } from "../../atoms/Button";
import { TableFormModal } from "../../molecules/TableFormModal";

let idCounter = 0;
function uid() {
  return `fp-${Date.now()}-${++idCounter}`;
}

type ToolMode = "select" | "round" | "rect" | "square";

export default function FloorPlanPage() {
  const { eventId } = useEventContext();
  const { data: tables = [], isLoading: tablesLoading } = useTablesApi(eventId ?? "");
  const { data: guests = [], isLoading: guestsLoading } = useGuestsApi(eventId ?? "");
  const assignGuest = useAssignGuestToTable(eventId ?? "");
  const unassignGuest = useUnassignGuestFromTable(eventId ?? "");

  const {
    floorItems,
    addItem,
    updateItem,
    removeItem,
    autoArrange,
    syncTables,
    changeTableShape,
  } = useFloorPlanState(eventId ?? "");

  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [showTableModal, setShowTableModal] = useState(false);
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);
  const [showGuestPanel, setShowGuestPanel] = useState(false);
  const [seatPopover, setSeatPopover] = useState<{
    tableId: string;
    seatIndex: number;
    guestId: string | null;
    anchorX: number;
    anchorY: number;
  } | null>(null);
  const snapSize = 40;

  // Sync API tables into floor items when tables load
  useEffect(() => {
    if (tables.length > 0) {
      syncTables(tables.map((t) => ({ id: t.id, capacity: t.capacity || 8 })));
    }
  }, [tables, syncTables]);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string, icon = "✅") => {
    setToast({ message, icon });
  }, []);

  const handlePanChange = useCallback((x: number, y: number) => {
    setPanX(x);
    setPanY(y);
  }, []);

  const handleMoveItem = useCallback(
    (id: string, x: number, y: number) => {
      updateItem(id, { x, y });
    },
    [updateItem]
  );

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    const item = floorItems.find((i) => i.id === selectedId);
    if (!item) return;
    if (item.type === "table") {
      showToast("Cannot delete table from floor plan", "⚠️");
      return;
    }
    removeItem(selectedId);
    setSelectedId(null);
    showToast("Element removed", "🗑️");
  }, [selectedId, floorItems, removeItem, showToast]);

  const handleDoubleClickTable = useCallback((id: string) => {
    setEditTableId(id);
    setShowTableModal(true);
  }, []);

  /** Change shape of selected table, or enter tool mode if nothing selected */
  const handleShapeTool = useCallback(
    (shape: ToolMode) => {
      if (shape === "select") {
        setToolMode("select");
        return;
      }
      // If a table is selected, change its shape directly
      if (selectedId) {
        const item = floorItems.find((i) => i.id === selectedId);
        if (item?.type === "table") {
          changeTableShape(selectedId, shape);
          showToast(`Table shape changed to ${shape}`, "✅");
          return;
        }
      }
      // Otherwise enter placement mode
      setToolMode(shape);
      showToast(`Click on canvas to place ${shape} table`, "📍");
    },
    [selectedId, floorItems, changeTableShape, showToast]
  );

  /** Handle seat click — empty seat shows guest picker, occupied seat unassigns */
  const handleSeatClick = useCallback(
    (tableId: string, seatIndex: number, guestId: string | null, anchorX: number, anchorY: number) => {
      if (guestId) {
        // Occupied seat — unassign
        unassignGuest.mutate(guestId, {
          onSuccess: () => showToast("Guest unassigned", "✅"),
          onError: () => showToast("Failed to unassign guest", "❌"),
        });
      } else {
        // Empty seat — show popover to pick a guest
        setSeatPopover({ tableId, seatIndex, guestId: null, anchorX, anchorY });
      }
    },
    [unassignGuest, showToast]
  );

  /** Assign a guest from the seat popover */
  const handlePopoverAssign = useCallback(
    (guestId: string) => {
      if (!seatPopover) return;
      assignGuest.mutate(
        { guestId, tableId: seatPopover.tableId },
        {
          onSuccess: () => showToast("Guest assigned!", "✅"),
          onError: () => showToast("Failed to assign guest", "❌"),
        }
      );
      setSeatPopover(null);
    },
    [seatPopover, assignGuest, showToast]
  );

  const handleDropGuest = useCallback(
    (tableId: string, guestId: string) => {
      assignGuest.mutate(
        { guestId, tableId },
        {
          onSuccess: () => showToast("Guest assigned!", "✅"),
          onError: () => showToast("Failed to assign guest", "❌"),
        }
      );
    },
    [assignGuest, showToast]
  );

  const handleAutoArrange = useCallback(() => {
    autoArrange(tables.map((t) => t.id));
    showToast("Tables auto-arranged", "✨");
  }, [autoArrange, tables, showToast]);

  const handleAddDecoration = useCallback(
    (type: FloorItemType) => {
      const defaults: Record<string, { w: number; h: number }> = {
        stage: { w: 280, h: 50 },
        danceFloor: { w: 180, h: 160 },
        pillar: { w: 45, h: 45 },
        wall: { w: 80, h: 40 },
      };
      const icons: Record<string, string> = {
        stage: "🎭",
        danceFloor: "💃",
        pillar: "🔘",
        wall: "🧱",
      };
      const d = defaults[type] ?? { w: 100, h: 100 };
      addItem({
        id: uid(),
        type,
        x: 200 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: d.w,
        height: d.h,
      });
      showToast(`${type === "danceFloor" ? "Dance floor" : type.charAt(0).toUpperCase() + type.slice(1)} added!`, icons[type] ?? "✅");
    },
    [addItem, showToast]
  );

  /** Called by FloorCanvas when clicking on canvas with a tool active.
   *  Opens the new table modal and stores desired position/shape. */
  const pendingPlacement = React.useRef<{ x: number; y: number; shape: string } | null>(null);

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (toolMode === "select") return;
      // Store placement info and open the new-table modal
      pendingPlacement.current = { x, y, shape: toolMode };
      setEditTableId(null);
      setShowTableModal(true);
    },
    [toolMode]
  );

  // Store the pending placement shape so syncTables can use it
  const pendingShape = React.useRef<string | null>(null);

  // After table modal creates a table, place it at the pending position
  const handleTableModalClose = useCallback(() => {
    setShowTableModal(false);
    setEditTableId(null);
    if (pendingPlacement.current) {
      pendingShape.current = pendingPlacement.current.shape;
      pendingPlacement.current = null;
      setToolMode("select");
    }
  }, []);

  const handleSaveLayout = useCallback(() => {
    showToast("Layout saved!", "💾");
  }, [showToast]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    showToast("View reset", "🎯");
  }, [showToast]);

  // Stats
  const unassignedCount = useMemo(() => guests.filter((g) => !g.tableId).length, [guests]);
  const seatedCount = guests.length - unassignedCount;
  const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);

  const editTable = editTableId ? tables.find((t) => t.id === editTableId) : undefined;

  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Please select an event first.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pt-4 pb-2">
        <StatsCard label="Total Tables" value={tables.length} variant="primary" />
        <StatsCard label="Seated Guests" value={seatedCount} variant="success" />
        <StatsCard label="Unassigned" value={unassignedCount} variant="warning" />
        <StatsCard label="Total Capacity" value={totalCapacity} variant="secondary" />
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center px-6 py-2 gap-2">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Floor Plan Layout</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 sm:mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            <span className="hidden sm:inline">Print Layout</span>
          </Button>
          <button
            onClick={handleAutoArrange}
            className="px-4 py-2 rounded-xl font-semibold inline-flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-500 text-white shadow-lg shadow-green-500/25 hover:brightness-105 active:translate-y-[1px] focus:ring-green-500/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 sm:mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <span className="hidden sm:inline">Auto-Arrange</span>
          </button>
          <Button variant="primary" onClick={() => { setEditTableId(null); setShowTableModal(true); }}>
            + New Table
          </Button>
          <Button variant="secondary" onClick={handleSaveLayout}>
            💾 Save Layout
          </Button>
        </div>
      </div>

      {/* Toolbar – matches mockup grouped style */}
      <div className="flex flex-wrap items-center px-6 py-2 gap-2">
        {/* Table Shape Tools */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
          <span className="text-xs text-gray-500 dark:text-gray-400 px-2">Tables:</span>
          <button
            onClick={() => handleShapeTool("round")}
            className={`tool-btn p-2 rounded-lg border flex items-center gap-2 transition-all ${
              toolMode === "round"
                ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent"
                : "border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
            }`}
            title="Round Table (or change selected table)"
          >
            <div className={`w-5 h-5 rounded-full ${toolMode === "round" ? "bg-white/40" : "bg-primary/80"}`} />
            <span className={`text-xs hidden sm:inline ${toolMode === "round" ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>Round</span>
          </button>
          <button
            onClick={() => handleShapeTool("rect")}
            className={`tool-btn p-2 rounded-lg border flex items-center gap-2 transition-all ${
              toolMode === "rect"
                ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent"
                : "border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
            }`}
            title="Long Table (or change selected table)"
          >
            <div className={`w-7 h-4 rounded ${toolMode === "rect" ? "bg-white/40" : "bg-secondary/80"}`} />
            <span className={`text-xs hidden sm:inline ${toolMode === "rect" ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>Long</span>
          </button>
          <button
            onClick={() => handleShapeTool("square")}
            className={`tool-btn p-2 rounded-lg border flex items-center gap-2 transition-all ${
              toolMode === "square"
                ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent"
                : "border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
            }`}
            title="Square Table (or change selected table)"
          >
            <div className={`w-5 h-5 rounded ${toolMode === "square" ? "bg-white/40" : "bg-green-500/80"}`} />
            <span className={`text-xs hidden sm:inline ${toolMode === "square" ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>Square</span>
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

          <button
            onClick={() => handleAddDecoration("stage")}
            className="tool-btn p-2 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
            title="Stage"
          >
            <span>🎭</span>
            <span className="text-xs hidden sm:inline text-gray-600 dark:text-gray-300">Stage</span>
          </button>
          <button
            onClick={() => handleAddDecoration("danceFloor")}
            className="tool-btn p-2 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
            title="Dance Floor"
          >
            <span>💃</span>
            <span className="text-xs hidden sm:inline text-gray-600 dark:text-gray-300">Dance</span>
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

          <span className="text-xs text-gray-500 dark:text-gray-400">Obstacles:</span>
          <button
            onClick={() => handleAddDecoration("wall")}
            className="tool-btn p-2 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
            title="Rectangle Obstacle (Wall)"
          >
            <div className="w-6 h-4 rounded-sm bg-gradient-to-br from-slate-500 to-slate-700" />
            <span className="text-xs hidden sm:inline text-gray-600 dark:text-gray-300">Rect</span>
          </button>
          <button
            onClick={() => handleAddDecoration("pillar")}
            className="tool-btn p-2 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
            title="Circle Obstacle (Pillar)"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-stone-400 to-stone-600" />
            <span className="text-xs hidden sm:inline text-gray-600 dark:text-gray-300">Circle</span>
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold transition"
            >
              −
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold transition"
            >
              +
            </button>
          </div>
          <button
            onClick={handleResetView}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-1 shadow-sm"
          >
            🎯 Reset
          </button>
          <button
            onClick={() => setSnapEnabled((s) => !s)}
            className={`px-3 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-1 shadow-sm ${
              snapEnabled
                ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            🧲 Snap: {snapEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Main Layout Area: Canvas + Guest Panel */}
      <div className="flex-1 flex gap-4 overflow-hidden px-6 pb-4 min-h-0">
        {tablesLoading || guestsLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Loading...
          </div>
        ) : (
          <>
            <FloorCanvas
              floorItems={floorItems}
              tables={tables}
              guests={guests}
              zoom={zoom}
              panX={panX}
              panY={panY}
              selectedId={selectedId}
              snapEnabled={snapEnabled}
              snapSize={snapSize}
              toolMode={toolMode}
              onZoomChange={setZoom}
              onPanChange={handlePanChange}
              onSelect={handleSelect}
              onMoveItem={handleMoveItem}
              onDoubleClickTable={handleDoubleClickTable}
              onDropGuest={handleDropGuest}
              onDeleteSelected={handleDeleteSelected}
              onCanvasClick={handleCanvasClick}
              onSeatClick={handleSeatClick}
            />
            {/* Desktop guest panel */}
            <div className="hidden lg:flex h-full">
              <FloorGuestPanel
                guests={guests}
                tables={tables.map((t) => ({ id: t.id, name: t.name }))}
              />
            </div>
            {/* Mobile guest panel toggle */}
            <button
              onClick={() => setShowGuestPanel(true)}
              className="lg:hidden fixed bottom-6 left-6 z-40 bg-primary text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:brightness-110 transition"
            >
              <span>👤</span>
              <span className="text-sm font-semibold">Guests</span>
              {unassignedCount > 0 && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unassignedCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Table form modal */}
      <TableFormModal
        isOpen={showTableModal}
        onClose={handleTableModalClose}
        initial={editTable ? { id: editTable.id, name: editTable.name, capacity: editTable.capacity } : undefined}
      />

      {/* Mobile guest panel drawer */}
      {showGuestPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowGuestPanel(false)} />
          <div className="relative ml-auto h-full w-80 max-w-[85vw] animate-slide-left">
            <button
              onClick={() => setShowGuestPanel(false)}
              className="absolute top-3 right-3 z-10 bg-gray-100 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              ✕
            </button>
            <FloorGuestPanel
              guests={guests}
              tables={tables.map((t) => ({ id: t.id, name: t.name }))}
            />
          </div>
        </div>
      )}

      {/* Seat popover — pick guest to assign */}
      {seatPopover && (
        <div className="fixed inset-0 z-50" onClick={() => setSeatPopover(null)}>
          <div
            className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-64 max-h-72 overflow-hidden flex flex-col"
            style={{
              left: Math.min(seatPopover.anchorX - 128, window.innerWidth - 272),
              top: Math.max(8, seatPopover.anchorY - 280),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Assign Guest to Seat</p>
              <p className="text-xs text-gray-500">Seat #{seatPopover.seatIndex + 1}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: "thin" }}>
              {guests.filter((g) => !g.tableId).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No unassigned guests</p>
              ) : (
                guests
                  .filter((g) => !g.tableId)
                  .map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handlePopoverAssign(g.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-white">{g.name}</span>
                        {g.flag === "VIP" && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-400 text-white text-[10px] font-bold">VIP</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-primary">{g.pax ?? 1} pax</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast – matches mockup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="text-xl">{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
