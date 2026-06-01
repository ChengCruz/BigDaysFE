// src/components/pages/Tables/TablesPageV3.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import {
  useTablesApi,
  useDeleteTable,
  useBulkDeleteTables,
} from "../../../api/hooks/useTablesApi";
import {
  useGuestsApi,
  useAssignGuestToTable,
  useUnassignGuestFromTable,
  useAutoAssignGuests,
} from "../../../api/hooks/useGuestsApi";
import { Button } from "../../atoms/Button";
import { Dropdown, DropdownItem } from "../../atoms/Dropdown";
import { StatsCard } from "../../atoms/StatsCard";
import { TableCard } from "../../molecules/TableCard";
import { QuickSetupModal } from "../../molecules/QuickSetupModal";
import { TableFormModal } from "../../molecules/TableFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { useState, useMemo } from "react";
import { useEventContext } from "../../../context/EventContext";
import { useAuth } from "../../../api/hooks/useAuth";
import toast from "react-hot-toast";
import { NoEventsState } from "../../molecules/NoEventsState";
import { ChevronDownIcon, ChevronUpIcon, XIcon, CollectionIcon, UserGroupIcon, UserIcon, ChartBarIcon, ArrowsExpandIcon, TrashIcon } from "@heroicons/react/solid";
import { saveAs } from "file-saver";

export default function TablesPageV3() {
  // ─── All hooks first (React Rules of Hooks) ─────────────────────────────────────────
  const { userRole } = useAuth();
  const isReadOnly = userRole === 6;
  const { eventId, eventsLoading } = useEventContext()!;
  const { data: tables = [], isLoading: tablesLoading, isError: tablesError } = useTablesApi(eventId!);
  const { data: guests = [], isLoading: guestsLoading, isError: guestsError } = useGuestsApi(eventId!);
  const deleteTable = useDeleteTable(eventId);
  const bulkDeleteTables = useBulkDeleteTables(eventId);
  const assignGuest = useAssignGuestToTable(eventId || "");
  const unassignGuest = useUnassignGuestFromTable(eventId || "");
  const autoAssign = useAutoAssignGuests(eventId || "");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "hasEmpty" | "full">("all");
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [editingTable, setEditingTable] = useState<{ id: string; name: string; capacity: number } | null>(null);
  const [editInitialTab, setEditInitialTab] = useState<"guests" | "edit">("guests");
  const [deletingTable, setDeletingTable] = useState<{ id: string; name: string } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [showUnassignedSheet, setShowUnassignedSheet] = useState(false);

  // Calculate statistics (must be before early returns - React rules of hooks)
  const stats = useMemo(() => {
    const seatedGuests = guests
      .filter(g => g.tableId)
      .reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0);
    const unassigned = guests
      .filter(g => !g.tableId)
      .reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0);
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    return {
      totalTables: tables.length,
      seatedGuests,
      unassigned,
      totalCapacity,
    };
  }, [tables, guests]);

  // Get unassigned guests (used by assign modal)
  const unassignedGuests = useMemo(() => {
    return guests.filter(g => !g.tableId);
  }, [guests]);

  const handleExportCsv = () => {
    if (!eventId) return;
    const tableMap = new Map(tables.map(t => [t.id, t.name]));
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    let csv = "Table Name,Capacity,Seats Filled,Seats Available\n";
    tables.forEach(t => {
      const filled = guests.filter(g => g.tableId === t.id).reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0);
      csv += [escape(t.name), t.capacity, filled, t.capacity - filled].join(",") + "\n";
    });

    csv += "\nGuest Name,Table,PAX,Phone,Notes,Status\n";
    const seated = guests.filter(g => g.tableId);
    const unassigned = guests.filter(g => !g.tableId);
    [...seated, ...unassigned].forEach(g => {
      const tableName = g.tableId ? (tableMap.get(g.tableId) ?? "Unknown") : "";
      csv += [escape(g.name), escape(tableName), g.pax || g.noOfPax || 1, escape(g.phoneNo || ""), escape(g.notes || ""), g.tableId ? "Seated" : "Unassigned"].join(",") + "\n";
    });

    saveAs(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" }), `table-seating-${eventId}.csv`);
  };

  const handleExportXlsx = async () => {
    if (!eventId) return;
    const XLSX = await import("xlsx");
    const tableMap = new Map(tables.map(t => [t.id, t.name]));

    const summaryRows = tables.map(t => {
      const filled = guests.filter(g => g.tableId === t.id).reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0);
      return { "Table Name": t.name, "Capacity": t.capacity, "Seats Filled": filled, "Seats Available": t.capacity - filled };
    });

    const seated = guests.filter(g => g.tableId);
    const unassigned = guests.filter(g => !g.tableId);
    const guestRows = [...seated, ...unassigned].map(g => ({
      "Guest Name": g.name,
      "Table": g.tableId ? (tableMap.get(g.tableId) ?? "Unknown") : "",
      "PAX": g.pax || g.noOfPax || 1,
      "Phone": g.phoneNo || "",
      "Notes": g.notes || "",
      "Status": g.tableId ? "Seated" : "Unassigned",
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Table Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guestRows), "Guest Seating");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]), `table-seating-${eventId}.xlsx`);
  };

  // Build tables with guest details
  const tablesWithGuests = useMemo(() => {
    return tables.map(table => {
      const tableGuests = guests.filter(g => g.tableId === table.id);
      return {
        ...table,
        guests: tableGuests.map(g => ({
          id: g.id,
          guestName: g.guestName || g.name,
          paxCount: g.pax || g.noOfPax || 1,
        })),
        assignedCount: tableGuests.reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0),
      };
    });
  }, [tables, guests]);

  // Filter tables
  const filteredTables = useMemo(() => {
    return tablesWithGuests.filter(t => {
      if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        const hasMatchingGuest = t.guests.some(g =>
          g.guestName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!hasMatchingGuest) return false;
      }

      if (filterType === "hasEmpty" && t.assignedCount >= t.capacity) return false;
      if (filterType === "full" && t.assignedCount < t.capacity) return false;

      return true;
    });
  }, [tablesWithGuests, searchTerm, filterType]);

  // ─── Early returns AFTER all hooks ─────────────────────────────────────────

  if (eventsLoading) return <PageLoader message="Loading..." />;
  if (!eventId) return <NoEventsState title="No Events for Table Management" message="Create your first event to start organizing seating arrangements and table assignments." />;

  if (tablesLoading || guestsLoading) return <PageLoader message="Loading tables..." />;
  if (tablesError || guestsError) return <ErrorState message="Failed to load data." onRetry={() => window.location.reload()} />;

  const handleUnassignGuest = (guestId: string) => {
    unassignGuest.mutate(guestId, {
      onError: () => toast.error("Failed to unassign guest from table"),
    });
  };

  const handleEditTable = (tableId: string) => {
    const table = tablesWithGuests.find(t => t.id === tableId);
    if (table) {
      setEditInitialTab("edit");
      setEditingTable({ id: table.id, name: table.name, capacity: table.capacity });
    }
  };

  const handleOpenAssignModal = (tableId: string) => {
    const table = tablesWithGuests.find(t => t.id === tableId);
    if (table) {
      setEditInitialTab("guests");
      setEditingTable({ id: table.id, name: table.name, capacity: table.capacity });
    }
  };

  const handleBulkAssign = async (guestIds: string[]) => {
    if (!editingTable) return;
    await Promise.all(
      guestIds.map(guestId =>
        assignGuest.mutateAsync({ guestId, tableId: editingTable.id })
      )
    );
    toast.success(`${guestIds.length} guest${guestIds.length > 1 ? "s" : ""} assigned to ${editingTable.name}.`);
    setEditingTable(null);
  };

  const handleDeleteTable = (tableId: string) => {
    const table = tablesWithGuests.find(t => t.id === tableId);
    if (table) {
      setDeletingTable({ id: table.id, name: table.name });
    }
  };

  const confirmDelete = () => {
    if (deletingTable) {
      deleteTable.mutate(deletingTable.id, {
        onError: () => toast.error("Failed to delete table"),
      });
      setDeletingTable(null);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedTableIds(new Set());
  };

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds(prev => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  };

  const confirmBulkDelete = () => {
    bulkDeleteTables.mutate({ tableIds: Array.from(selectedTableIds) }, {
      onSuccess: () => {
        setShowBulkDeleteConfirm(false);
        setSelectMode(false);
        setSelectedTableIds(new Set());
        toast.success(`${selectedTableIds.size} tables deleted.`);
      },
      onError: () => toast.error("Failed to delete tables"),
    });
  };

  return (
    <div className="flex flex-col lg:h-full">
      {/* Page Title & Actions */}
      <div data-tour="tables-header" className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-primary">Table Arrangement</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organize seating and arrange guests by table</p>
        </div>
        {!isReadOnly && (
          <div data-tour="tables-actions" className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={autoAssign.isPending}
              onClick={() => {
                autoAssign.mutate(undefined, {
                  onSuccess: (res) => {
                    const d = res?.data;
                    if (d) {
                      toast.success(`Auto-assign complete. Assigned: ${d.assignedCount}, Skipped: ${d.skippedCount}.`);
                    } else {
                      toast.success("Auto-assign complete.");
                    }
                  },
                  onError: () => toast.error("Auto-assign failed."),
                });
              }}
            >
              {autoAssign.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Assigning...
                </span>
              ) : "Auto-Assign"}
            </Button>
            {selectMode ? (
              <>
                {selectedTableIds.size > 0 && (
                  <Button variant="primary" onClick={() => setShowBulkDeleteConfirm(true)}>
                    Delete selected ({selectedTableIds.size})
                  </Button>
                )}
                <Button variant="secondary" onClick={toggleSelectMode}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={toggleSelectMode} className="flex items-center gap-1.5">
                <TrashIcon className="w-4 h-4" />
                Bulk Delete
              </Button>
            )}
            <Dropdown trigger={<Button variant="secondary">Export ▾</Button>}>
              <DropdownItem onClick={handleExportXlsx}>Export as XLSX</DropdownItem>
              <DropdownItem onClick={handleExportCsv}>Export as CSV</DropdownItem>
            </Dropdown>
            <Dropdown
              trigger={
                <Button className="flex items-center gap-1.5">
                  + New Table <ChevronDownIcon className="w-4 h-4" />
                </Button>
              }
            >
              <DropdownItem onClick={() => setShowCreateTable(true)}>
                <div>
                  <div className="font-medium">Create Single Table</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Create one table at a time
                  </div>
                </div>
              </DropdownItem>
              <DropdownItem onClick={() => setShowQuickSetup(true)}>
                <div>
                  <div className="font-medium">
                    Bulk Create{" "}
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Create by category or custom prefix
                  </div>
                </div>
              </DropdownItem>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Stats overview — collapsible */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <button
            className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors select-none"
            onClick={() => setStatsExpanded(p => !p)}
          >
            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${statsExpanded ? "" : "-rotate-90"}`} />
            {statsExpanded ? "Hide overview" : "Show overview"}
          </button>
          <button
            data-tour="tables-fullscreen"
            onClick={() => window.open("/app/tables/fullscreen", "_blank")}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-[11px] font-medium text-indigo-700 dark:text-indigo-300"
            title="Open in fullscreen mode — better for 100+ guests"
          >
            <ArrowsExpandIcon className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            <span>Fullscreen mode</span>
            <span className="text-indigo-400 dark:text-indigo-500 group-hover:translate-x-0.5 transition-transform" aria-hidden>↗</span>
          </button>
        </div>
        {statsExpanded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <StatsCard label="Total Tables" value={stats.totalTables} variant="primary" size="sm" icon={<CollectionIcon className="w-4 h-4" />} />
            <StatsCard label="Seated Guests" value={stats.seatedGuests} variant="success" size="sm" icon={<UserGroupIcon className="w-4 h-4" />} />
            <StatsCard label="Unassigned" value={stats.unassigned} variant="warning" size="sm" icon={<UserIcon className="w-4 h-4" />} />
            <StatsCard label="Total Capacity" value={stats.totalCapacity} variant="secondary" size="sm" icon={<ChartBarIcon className="w-4 h-4" />} />
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
        <select
          className="w-full md:w-1/4 border border-primary/20 dark:border-primary/30 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="all">All Tables</option>
          <option value="hasEmpty">Has Empty Seats</option>
          <option value="full">Full Tables</option>
        </select>
        <input
          placeholder="Search guests or tables..."
          className="w-full md:flex-1 border border-primary/20 dark:border-primary/30 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {unassignedGuests.length > 0 && (
          <button
            data-tour="tables-unassigned"
            onClick={() => setShowUnassignedSheet(true)}
            className="hidden lg:flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium whitespace-nowrap transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            {unassignedGuests.length} unassigned →
          </button>
        )}
      </div>

      {/* Tables Grid */}
      <div data-tour="tables-grid" className={`flex-1 lg:overflow-y-auto ${unassignedGuests.length > 0 ? "pb-20 lg:pb-0" : ""}`}>
        {filteredTables.length === 0 ? (
          <div className="p-6 rounded-lg border-2 border-dashed border-primary/25 text-center space-y-2 bg-white/70 dark:bg-accent/70">
            <p className="text-lg font-semibold">No tables found.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchTerm
                ? "No tables match your search. Try a different search term."
                : "Create your first table to start organizing your seating arrangements."}
            </p>
            <Button onClick={() => setShowCreateTable(true)}>+ Create First Table</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-6">
            {filteredTables.map(table => (
              <div key={table.id} className="relative">
                {selectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-primary cursor-pointer"
                      checked={selectedTableIds.has(table.id)}
                      onChange={() => toggleTableSelection(table.id)}
                    />
                  </div>
                )}
                <TableCard
                  table={table}
                  onEdit={(selectMode || isReadOnly) ? undefined : handleEditTable}
                  onAddGuests={(selectMode || isReadOnly) ? undefined : handleOpenAssignModal}
                  onDelete={(selectMode || isReadOnly) ? undefined : handleDeleteTable}
                  onUnassignGuest={(selectMode || isReadOnly) ? undefined : handleUnassignGuest}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickSetupModal
        isOpen={showQuickSetup}
        onClose={() => setShowQuickSetup(false)}
      />

      <TableFormModal
        isOpen={showCreateTable || !!editingTable}
        onClose={() => {
          setShowCreateTable(false);
          setEditingTable(null);
        }}
        initial={editingTable || undefined}
        initialTab={editingTable ? editInitialTab : undefined}
        guests={
          editingTable
            ? guests
                .filter(g => g.tableId === editingTable.id)
                .map(g => ({
                  id: g.id,
                  name: g.guestName || g.name,
                  pax: g.pax || g.noOfPax || 1,
                  flag: (g.remarks || g.notes)?.toLowerCase().includes("vip") ? "VIP" : undefined,
                }))
            : []
        }
        unassignedGuests={
          editingTable
            ? unassignedGuests.map(g => ({
                id: g.id,
                name: g.guestName || g.name,
                pax: g.pax || g.noOfPax || 1,
                flag: (g.remarks || g.notes)?.toLowerCase().includes("vip") ? "VIP" : undefined,
              }))
            : undefined
        }
        onAssignGuests={editingTable ? handleBulkAssign : undefined}
      />

      <DeleteConfirmationModal
        isOpen={!!deletingTable}
        isDeleting={deleteTable.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTable(null)}
        title="Delete Table"
        description="Are you sure you want to delete this table? This action cannot be undone."
      >
        {deletingTable && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                  {deletingTable.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Table ID: {deletingTable.id}
                </p>
              </div>
            </div>
          </div>
        )}
      </DeleteConfirmationModal>

      <DeleteConfirmationModal
        isOpen={showBulkDeleteConfirm}
        isDeleting={bulkDeleteTables.isPending}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        title="Delete Selected Tables"
        description={`Are you sure you want to delete ${selectedTableIds.size} table${selectedTableIds.size > 1 ? "s" : ""}? Guests assigned to these tables will be unassigned. This action cannot be undone.`}
      />

      {/* ── Mobile: sticky unassigned bottom bar ───────────────────────────────
          Only visible on < lg. Hidden when all guests are seated. */}
      {unassignedGuests.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none">
          <button
            onClick={() => setShowUnassignedSheet(true)}
            className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-accent border border-amber-200 dark:border-amber-800/50 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {unassignedGuests.length} unassigned guest{unassignedGuests.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronUpIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* ── Unassigned guests sheet ────────────────────────────────────────────
          Mobile: full-width bottom sheet with backdrop.
          Desktop: compact floating panel in bottom-right corner, no backdrop. */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${showUnassignedSheet ? "visible" : "invisible pointer-events-none"}`}
      >
        {/* Backdrop — mobile only */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 lg:hidden ${showUnassignedSheet ? "opacity-100" : "opacity-0"}`}
          onClick={() => setShowUnassignedSheet(false)}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 lg:left-auto lg:right-4 lg:bottom-4 lg:w-80 lg:rounded-2xl bg-white dark:bg-accent rounded-t-2xl shadow-xl transition-transform duration-300 max-h-[72vh] flex flex-col ${showUnassignedSheet ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Drag handle — mobile only */}
          <div className="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Unassigned Guests ({unassignedGuests.length})
            </h3>
            <button
              onClick={() => setShowUnassignedSheet(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {/* Guest list */}
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {unassignedGuests.map(g => {
              const name = g.guestName || g.name;
              const pax = g.pax || g.noOfPax || 1;
              return (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {name}
                      {pax > 1 && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                          · {pax} pax
                        </span>
                      )}
                    </p>
                    {g.phoneNo && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{g.phoneNo}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
