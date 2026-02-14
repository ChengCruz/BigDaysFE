// src/components/pages/Tables/TablesPage.tsx
import {
  useTablesApi,
  useDeleteTable,
} from "../../../api/hooks/useTablesApi";
import { 
  useGuestsApi,
  useAssignGuestToTable,
  useUnassignGuestFromTable,
} from "../../../api/hooks/useGuestsApi";
import { Button } from "../../atoms/Button";
import { Dropdown, DropdownItem } from "../../atoms/Dropdown";
import { StatsCard } from "../../atoms/StatsCard";
import { GuestCard } from "../../molecules/GuestCard";
import { TableCard } from "../../molecules/TableCard";
import { QuickSetupModal } from "../../molecules/QuickSetupModal";
import { TableFormModal } from "../../molecules/TableFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { useState, useMemo } from "react";
import { useEventContext } from "../../../context/EventContext";
import toast from "react-hot-toast";

export default function TablesPage() {
  const { eventId } = useEventContext()!;
  const { data: tables = [], isLoading: tablesLoading, isError: tablesError } = useTablesApi(eventId!);
  const { data: guests = [], isLoading: guestsLoading, isError: guestsError } = useGuestsApi(eventId!);
  const deleteTable = useDeleteTable(eventId);
  const assignGuest = useAssignGuestToTable(eventId || "");
  const unassignGuest = useUnassignGuestFromTable(eventId || "");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "hasEmpty" | "full">("all");
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [draggedGuest, setDraggedGuest] = useState<{ id: string; paxCount: number } | null>(null);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [editingTable, setEditingTable] = useState<{ id: string; name: string; capacity: number } | null>(null);
  const [deletingTable, setDeletingTable] = useState<{ id: string; name: string } | null>(null);

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

  // Get unassigned guests
  const unassignedGuests = useMemo(() => {
    return guests.filter(g => !g.tableId);
  }, [guests]);

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
      // Search filter
      if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        const hasMatchingGuest = t.guests.some(g => 
          g.guestName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!hasMatchingGuest) return false;
      }
      
      // Type filter
      if (filterType === "hasEmpty" && t.assignedCount >= t.capacity) {
        return false;
      }
      if (filterType === "full" && t.assignedCount < t.capacity) {
        return false;
      }
      
      return true;
    });
  }, [tablesWithGuests, searchTerm, filterType]);

  // Early returns AFTER all hooks
  if (!eventId) {
    return (
      <div className="p-6 rounded-lg border-2 border-dashed border-primary/25 text-center space-y-2 bg-white/70">
        <p className="text-lg font-semibold">No event selected.</p>
        <p className="text-sm text-gray-600">Please select an event from the sidebar to view tables.</p>
      </div>
    );
  }

  if (tablesLoading || guestsLoading) return <p>Loading tables and guests…</p>;
  if (tablesError || guestsError) return <p>Failed to load data.</p>;

  // Drag and drop handlers
  const handleDragStart = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      setDraggedGuestId(guestId);
      setDraggedGuest({
        id: guestId,
        paxCount: guest.pax || guest.noOfPax || 1,
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedGuestId(null);
    setDraggedGuest(null);
  };

  const handleDrop = (guestId: string, tableId: string) => {
    // Find the guest and table
    const guest = guests.find(g => g.id === guestId);
    const table = tablesWithGuests.find(t => t.id === tableId);
    if (!guest || !table) return;

    // Validate: Check if adding this guest would exceed table capacity
    const guestPaxCount = guest.pax || guest.noOfPax || 1;
    const availableSeats = table.capacity - table.assignedCount;
    
    if (guestPaxCount > availableSeats) {
      // Show error - table would be overfilled
      toast.error(
        `Cannot assign guest. This guest requires ${guestPaxCount} seat(s), but only ${availableSeats} seat(s) available in ${table.name}.`,
        { duration: 4000 }
      );
      return;
    }

    // Call the assign API
    assignGuest.mutate({ guestId, tableId });
  };

  const handleUnassignGuest = (guestId: string) => {
    unassignGuest.mutate(guestId);
  };

  const handleEditTable = (tableId: string) => {
    const table = tablesWithGuests.find(t => t.id === tableId);
    if (table) {
      setEditingTable({
        id: table.id,
        name: table.name,
        capacity: table.capacity,
      });
    }
  };

  const handleDeleteTable = (tableId: string) => {
    const table = tablesWithGuests.find(t => t.id === tableId);
    if (table) {
      setDeletingTable({
        id: table.id,
        name: table.name,
      });
    }
  };

  const confirmDelete = () => {
    if (deletingTable) {
      deleteTable.mutate(deletingTable.id);
      setDeletingTable(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatsCard 
          label="Total Tables" 
          value={stats.totalTables} 
          variant="primary"
        />
        <StatsCard 
          label="Seated Guests" 
          value={stats.seatedGuests} 
          variant="success"
        />
        <StatsCard 
          label="Unassigned" 
          value={stats.unassigned} 
          variant="warning"
        />
        <StatsCard 
          label="Total Capacity" 
          value={stats.totalCapacity} 
          variant="secondary"
        />
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-primary">Table Arrangement</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="secondary" 
            disabled
            className="opacity-50 cursor-not-allowed flex items-center gap-2"
            title="Coming Soon"
          >
            Auto-Assign
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full ml-1">
              Coming Soon
            </span>
          </Button>
          <Dropdown
            trigger={
              <Button>
                + New Table <span className="ml-1">▼</span>
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
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
        <select 
          className="w-full md:w-1/4 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white" 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="all">All Tables</option>
          <option value="hasEmpty">Has Empty Seats</option>
          <option value="full">Full Tables</option>
        </select>
        <input 
          placeholder="Search guests or tables..."
          className="w-full md:flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Drag & Drop Hint */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
        <p className="text-sm text-indigo-700 dark:text-indigo-300">
          <strong>Tip:</strong> Drag guests from the unassigned panel and drop them onto tables
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Unassigned Panel (1 column) */}
        <div className="lg:col-span-1 lg:max-h-full">
          <div className="lg:sticky lg:top-0 bg-white dark:bg-accent rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Unassigned Guests ({unassignedGuests.length})
            </h3>
            <div className="space-y-2 max-h-96 lg:max-h-[calc(100vh-350px)] overflow-y-auto">
              {unassignedGuests.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                  All guests have been assigned!
                </p>
              ) : (
                unassignedGuests.map(guest => (
                  <GuestCard
                    key={guest.id}
                    guest={{
                      id: guest.id,
                      guestName: guest.guestName || guest.name,
                      phoneNo: guest.phoneNo,
                      paxCount: guest.pax || guest.noOfPax || 1,
                      // These fields can be parsed from remarks or added to API later
                      isVip: (guest.remarks || guest.notes)?.toLowerCase().includes('vip'),
                      dietaryRestrictions: (guest.remarks || guest.notes)?.toLowerCase().includes('vegetarian') ? ['Vegetarian'] : undefined,
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedGuestId === guest.id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Tables Grid (3 columns) */}
        <div className="lg:col-span-3 overflow-y-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
              {filteredTables.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  onDrop={handleDrop}
                  onEdit={handleEditTable}
                  onDelete={handleDeleteTable}
                  onUnassignGuest={handleUnassignGuest}
                  isDropTarget={!!draggedGuestId}
                  draggedGuest={draggedGuest}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuickSetupModal
        isOpen={showQuickSetup}
        onClose={() => setShowQuickSetup(false)}
      />

      {/* Create/Edit Table Modal */}
      <TableFormModal
        isOpen={showCreateTable || !!editingTable}
        onClose={() => {
          setShowCreateTable(false);
          setEditingTable(null);
        }}
        initial={editingTable || undefined}
      />

      {/* Delete Confirmation Modal */}
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
    </div>
  );
}
