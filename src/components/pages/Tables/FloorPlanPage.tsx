import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useEventContext } from "../../../context/EventContext";
import { useTablesApi, useDeleteTable } from "../../../api/hooks/useTablesApi";
import { useGuestsApi, useAssignGuestToTable, useUnassignGuestFromTable } from "../../../api/hooks/useGuestsApi";
import { useFloorPlanState } from "./useFloorPlanState";
import type { FloorItemType } from "./useFloorPlanState";
import { FloorCanvas } from "./FloorCanvas";
import { FloorGuestPanel } from "./FloorGuestPanel";
import { Spinner } from "../../atoms/Spinner";
import { TableFormModal } from "../../molecules/TableFormModal";
import { NoEventsState } from "../../molecules/NoEventsState";

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
  const deleteTable = useDeleteTable(eventId ?? "");

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

  /** Refs for pending table placement (tool mode click → modal → sync) */
  const pendingPlacement = React.useRef<{ x: number; y: number; shape: string } | null>(null);
  const pendingShape = React.useRef<string | null>(null);

  // Sync API tables into floor items when tables load
  useEffect(() => {
    if (tables.length > 0) {
      const shape = pendingShape.current || "round";
      syncTables(tables.map((t) => ({ id: t.id, capacity: t.capacity || 8 })), shape);
      pendingShape.current = null;
    }
  }, [tables, syncTables]);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string, icon = "\u2705") => {
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

  const handleResizeItem = useCallback(
    (id: string, w: number, h: number) => {
      updateItem(id, { width: w, height: h });
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
      // Delete table via API — this invalidates the tables query, which triggers syncTables
      deleteTable.mutate(selectedId, {
        onSuccess: () => {
          removeItem(selectedId);
          setSelectedId(null);
          showToast("Table deleted", "\ud83d\uddd1\ufe0f");
        },
        onError: () => showToast("Failed to delete table", "\u274c"),
      });
      return;
    }
    removeItem(selectedId);
    setSelectedId(null);
    showToast("Element removed", "\ud83d\uddd1\ufe0f");
  }, [selectedId, floorItems, removeItem, deleteTable, showToast]);

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
          showToast(`Table shape changed to ${shape}`, "\u2705");
          return;
        }
      }
      // Otherwise enter placement mode
      setToolMode(shape);
      showToast(`Click on canvas to place ${shape} table`, "\ud83d\udccd");
    },
    [selectedId, floorItems, changeTableShape, showToast]
  );

  /** Handle seat click — empty seat shows guest picker, occupied seat unassigns */
  const handleSeatClick = useCallback(
    (tableId: string, seatIndex: number, guestId: string | null, anchorX: number, anchorY: number) => {
      if (guestId) {
        // Occupied seat — unassign
        unassignGuest.mutate(guestId, {
          onSuccess: () => showToast("Guest unassigned", "\u2705"),
          onError: () => showToast("Failed to unassign guest", "\u274c"),
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
          onSuccess: () => showToast("Guest assigned!", "\u2705"),
          onError: () => showToast("Failed to assign guest", "\u274c"),
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
          onSuccess: () => showToast("Guest assigned!", "\u2705"),
          onError: () => showToast("Failed to assign guest", "\u274c"),
        }
      );
    },
    [assignGuest, showToast]
  );

  const handleAutoArrange = useCallback(() => {
    autoArrange(tables.map((t) => t.id));
    showToast("Tables auto-arranged", "\u2728");
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
        stage: "\ud83c\udfad",
        danceFloor: "\ud83d\udc83",
        pillar: "\ud83d\udd18",
        wall: "\ud83e\uddf1",
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
      showToast(`${type === "danceFloor" ? "Dance floor" : type.charAt(0).toUpperCase() + type.slice(1)} added!`, icons[type] ?? "\u2705");
    },
    [addItem, showToast]
  );

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (toolMode === "select") return;
      pendingPlacement.current = { x, y, shape: toolMode };
      setEditTableId(null);
      setShowTableModal(true);
    },
    [toolMode]
  );

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
    showToast("Layout saved!", "\ud83d\udcbe");
  }, [showToast]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    showToast("View reset", "\ud83c\udfaf");
  }, [showToast]);

  // Stats
  const unassignedCount = useMemo(() => guests.filter((g) => !g.tableId).length, [guests]);
  const seatedCount = guests.length - unassignedCount;
  const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);

  const editTable = editTableId ? tables.find((t) => t.id === editTableId) : undefined;

  // Selection context
  const selectedItem = selectedId ? floorItems.find((i) => i.id === selectedId) : null;
  const selectedTable = selectedItem?.type === "table" ? tables.find((t) => t.id === selectedId) : null;
  const selectedShape = selectedItem?.type === "table" ? (selectedItem.meta?.shape as string) || "round" : null;

  if (!eventId) {
    return <NoEventsState title="No Event Selected" message="Select or create an event to start designing your floor plan." />;
  }

  // ── Tool button helper ──
  const toolBtn = (active: boolean) =>
    `p-1.5 rounded-md transition-all ${
      active
        ? "bg-primary text-white shadow-sm"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-slate-700"
    }`;

  const iconBtn =
    "p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 px-5 pt-4 pb-2 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Floor Plan
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {tables.length} tables
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              {seatedCount}/{totalCapacity} seated
            </span>
            {unassignedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                {unassignedCount} unassigned
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoArrange}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <span className="hidden sm:inline">Auto-Arrange</span>
          </button>
          <button
            onClick={() => { setEditTableId(null); setShowTableModal(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:brightness-110 shadow-sm transition active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">New Table</span>
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-5 py-1.5 overflow-x-auto">
        {/* Shape & Decoration Tools */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-gray-700/60">
          <button onClick={() => handleShapeTool("round")} className={toolBtn(toolMode === "round")} title="Round table">
            <div className={`w-4 h-4 rounded-full border-2 ${toolMode === "round" ? "border-white/60" : "border-primary/60"}`} />
          </button>
          <button onClick={() => handleShapeTool("rect")} className={toolBtn(toolMode === "rect")} title="Long table">
            <div className={`w-6 h-3.5 rounded-sm border-2 ${toolMode === "rect" ? "border-white/60" : "border-secondary/60"}`} />
          </button>
          <button onClick={() => handleShapeTool("square")} className={toolBtn(toolMode === "square")} title="Square table">
            <div className={`w-4 h-4 rounded-sm border-2 ${toolMode === "square" ? "border-white/60" : "border-emerald-500/60"}`} />
          </button>

          <div className="w-px h-5 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

          <button onClick={() => handleAddDecoration("stage")} className={toolBtn(false)} title="Add stage">
            <span className="text-sm leading-none">🎭</span>
          </button>
          <button onClick={() => handleAddDecoration("danceFloor")} className={toolBtn(false)} title="Add dance floor">
            <span className="text-sm leading-none">💃</span>
          </button>

          <div className="w-px h-5 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

          <button onClick={() => handleAddDecoration("wall")} className={toolBtn(false)} title="Add wall">
            <div className="w-5 h-3.5 rounded-sm bg-gradient-to-br from-slate-400 to-slate-600" />
          </button>
          <button onClick={() => handleAddDecoration("pillar")} className={toolBtn(false)} title="Add pillar">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-stone-400 to-stone-600" />
          </button>
        </div>

        {/* ── Selection Context Bar ── */}
        {selectedItem && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 animate-fade-in">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
              {selectedItem.type === "table"
                ? (selectedTable?.name ?? "Table")
                : selectedItem.type === "stage" ? "Stage"
                : selectedItem.type === "danceFloor" ? "Dance Floor"
                : selectedItem.type === "pillar" ? "Pillar"
                : "Wall"}
            </span>

            {/* Table shape switcher */}
            {selectedItem.type === "table" && (
              <div className="flex items-center gap-0.5 ml-1 p-0.5 rounded bg-indigo-100/80 dark:bg-indigo-800/40">
                {(["round", "rect", "square"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => changeTableShape(selectedId!, s)}
                    className={`p-1 rounded transition ${selectedShape === s ? "bg-white dark:bg-indigo-700 shadow-sm" : "hover:bg-white/60 dark:hover:bg-indigo-700/40"}`}
                    title={`Change to ${s}`}
                  >
                    {s === "round" && <div className="w-3 h-3 rounded-full border-2 border-indigo-500" />}
                    {s === "rect" && <div className="w-5 h-2.5 rounded-sm border-2 border-indigo-500" />}
                    {s === "square" && <div className="w-3 h-3 rounded-sm border-2 border-indigo-500" />}
                  </button>
                ))}
              </div>
            )}

            {/* Delete button */}
            <button
              onClick={handleDeleteSelected}
              disabled={deleteTable.isPending}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              {deleteTable.isPending ? "Deleting..." : "Delete"}
            </button>

            {/* Deselect */}
            <button
              onClick={() => setSelectedId(null)}
              className="ml-0.5 p-0.5 rounded text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
              title="Deselect"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Right Controls ── */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Zoom */}
          <div className="flex items-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))}
              className="px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              −
            </button>
            <span className="px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 min-w-[42px] text-center border-x border-gray-200 dark:border-gray-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}
              className="px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              +
            </button>
          </div>

          {/* Snap */}
          <button
            onClick={() => setSnapEnabled((s) => !s)}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
              snapEnabled
                ? "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            }`}
            title={`Snap to grid: ${snapEnabled ? "ON" : "OFF"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 inline-block mr-0.5 -mt-px">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Snap
          </button>

          {/* Reset view */}
          <button onClick={handleResetView} className={iconBtn} title="Reset view">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          {/* Save */}
          <button onClick={handleSaveLayout} className={iconBtn} title="Save layout">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </button>

          {/* Print */}
          <button onClick={() => window.print()} className={iconBtn} title="Print layout">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Canvas + Guest Panel ── */}
      <div className="flex-1 flex gap-3 overflow-hidden px-5 pb-4 min-h-0">
        {tablesLoading || guestsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-primary animate-fade-in">
            <Spinner />
            <p className="text-sm text-text/50 dark:text-white/50">Loading floor plan...</p>
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
              onResizeItem={handleResizeItem}
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
              className="lg:hidden fixed bottom-6 left-6 z-40 bg-primary text-white px-4 py-3 rounded-full shadow-lg shadow-primary/25 flex items-center gap-2 hover:brightness-110 transition active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span className="text-sm font-semibold">Guests</span>
              {unassignedCount > 0 && (
                <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unassignedCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* ── Table form modal ── */}
      <TableFormModal
        isOpen={showTableModal}
        onClose={handleTableModalClose}
        initial={editTable ? { id: editTable.id, name: editTable.name, capacity: editTable.capacity } : undefined}
      />

      {/* ── Mobile guest panel drawer ── */}
      {showGuestPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGuestPanel(false)} />
          <div className="relative ml-auto h-full w-80 max-w-[85vw] animate-slide-left">
            <button
              onClick={() => setShowGuestPanel(false)}
              className="absolute top-3 right-3 z-10 bg-gray-100 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <FloorGuestPanel
              guests={guests}
              tables={tables.map((t) => ({ id: t.id, name: t.name }))}
            />
          </div>
        </div>
      )}

      {/* ── Seat popover — pick guest to assign ── */}
      {seatPopover && (
        <div className="fixed inset-0 z-50" onClick={() => setSeatPopover(null)}>
          <div
            className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-64 max-h-72 overflow-hidden flex flex-col animate-fade-in"
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
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ scrollbarWidth: "thin" }}>
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

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 dark:bg-slate-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slide-up text-sm">
          <span className="text-base">{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
