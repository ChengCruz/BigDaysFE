// src/components/pages/Guests/GuestsPage.tsx
import { useState, useMemo } from "react";
import { UserGroupIcon, UserIcon } from "@heroicons/react/solid";
import {
  useGuestsApi,
  useAssignGuestToTable,
  useUnassignGuestFromTable,
  type Guest,
} from "../../../api/hooks/useGuestsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { Button } from "../../atoms/Button";
import { StatsCard } from "../../atoms/StatsCard";
import { useEventContext } from "../../../context/EventContext";
import toast from "react-hot-toast";
import { GuestFormModal } from "./GuestFormModal";

export default function GuestsPage() {
  const { eventId } = useEventContext()!;
  const { data: guests = [], isLoading: guestsLoading, isError: guestsError } = useGuestsApi(eventId!);
  const { data: tables = [], isLoading: tablesLoading } = useTablesApi(eventId!);
  const assignGuestToTable = useAssignGuestToTable(eventId!);
  const unassignGuestFromTable = useUnassignGuestFromTable(eventId!);

  const [guestTypeFilter, setGuestTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modal, setModal] = useState<{ open: boolean; guest?: Guest }>({
    open: false,
  });
  const [assignModal, setAssignModal] = useState<{ open: boolean; guest?: Guest }>({
    open: false,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = guests.length;
    const assigned = guests.filter(g => g.tableId).length;
    const unassigned = guests.filter(g => !g.tableId).length;
    const vips = guests.filter(g => g.guestType === "VIP").length;

    return { total, assigned, unassigned, vips };
  }, [guests]);

  // Create table lookup map
  const tableMap = useMemo(() => {
    const map = new Map<string, string>();
    tables.forEach(table => {
      map.set(table.id, table.name);
    });
    return map;
  }, [tables]);

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const okType = guestTypeFilter === "All" || g.guestType === guestTypeFilter;
      const okSearch = (g.guestName ?? g.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      return okType && okSearch;
    });
  }, [guests, guestTypeFilter, searchTerm]);

  // Note: Guest deletion is not available in this module.
  // Guests can only be deleted through the RSVP module, as they are managed as part of RSVP records.

  // Handle assign table
  const handleAssignTable = async (guest: Guest, tableId: string) => {
    try {
      await assignGuestToTable.mutateAsync({
        guestId: guest.guestId ?? guest.id,
        tableId: tableId,
      });
      toast.success(`${guest.guestName || guest.name} assigned to table successfully`);
      setAssignModal({ open: false });
    } catch (err) {
      console.error("Assign table error:", err);
      toast.error("Failed to assign guest to table");
    }
  };

  // Handle unassign table
  const handleUnassignTable = async (guest: Guest) => {
    if (!window.confirm(`Remove ${guest.guestName || guest.name} from ${tableMap.get(guest.tableId || "")}?`)) {
      return;
    }

    try {
      await unassignGuestFromTable.mutateAsync(guest.guestId ?? guest.id);
      toast.success(`${guest.guestName || guest.name} unassigned from table successfully`);
    } catch (err) {
      console.error("Unassign table error:", err);
      toast.error("Failed to unassign guest from table");
    }
  };

  // Early returns
  if (!eventId) {
    return (
      <div className="p-6 rounded-lg border-2 border-dashed border-primary/25 text-center space-y-2 bg-white/70">
        <p className="text-lg font-semibold">No event selected.</p>
        <p className="text-sm text-gray-600">Please select an event from the sidebar to view guests.</p>
      </div>
    );
  }

  if (guestsLoading || tablesLoading) return <p>Loading guests…</p>;
  if (guestsError) return <p>Failed to load guests.</p>;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatsCard
          label="Total Guests"
          value={stats.total}
          variant="primary"
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <StatsCard
          label="Assigned"
          value={stats.assigned}
          variant="success"
          icon={<UserIcon className="h-6 w-6" />}
        />
        <StatsCard
          label="Unassigned"
          value={stats.unassigned}
          variant="warning"
          icon={<UserIcon className="h-6 w-6" />}
        />
        <StatsCard
          label="VIPs"
          value={stats.vips}
          variant="accent"
          icon={<UserIcon className="h-6 w-6" />}
        />
      </div>

      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-primary">Guests</h2>
        <div className="flex flex-wrap gap-2">
          {/* <Button onClick={() => setModal({ open: true })}>+ New Guest</Button> */}
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">Note:</span> Guests are automatically created when RSVP submissions include attendees (pax &gt; 0). <br></br>Guest deletion is only available through the RSVP module.
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
        <select
          value={guestTypeFilter}
          onChange={(e) => setGuestTypeFilter(e.target.value)}
          className="w-full md:w-1/4 border rounded-xl p-2 bg-white dark:bg-accent dark:border-white/10"
        >
          {["All", "Family", "VIP", "Friend", "Other"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search guests by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:flex-1 border rounded-xl p-2 bg-white dark:bg-accent dark:border-white/10"
        />
      </div>

      {/* Empty State */}
      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || guestTypeFilter !== "All"
              ? "No guests match your filters"
              : "No guests yet. Create your first guest!"}
          </p>
        </div>
      )}

      {/* Guest Cards Grid */}
      {filteredGuests.length > 0 && (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredGuests.map((guest) => {
            const isAssigned = !!guest.tableId;
            
            return (
              <li
                key={guest.id}
                className={`relative p-4 rounded-lg shadow flex flex-col justify-between transition-all ${
                  isAssigned 
                    ? "bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800" 
                    : "bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800"
                }`}
              >
                {/* Assignment Status Badge - Top Right */}
                <span 
                  className={`absolute top-2 right-2 px-3 py-1 text-xs font-bold rounded-full ${
                    isAssigned
                      ? "bg-green-600 text-white"
                      : "bg-orange-600 text-white"
                  }`}
                >
                  {isAssigned ? "ASSIGNED" : "UNASSIGNED"}
                </span>

                <div className="space-y-2 mt-6">
                  {/* Guest Name */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {guest.guestName}
                  </h3>

                  {/* Phone Number */}
                  {guest.phoneNo && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone: {guest.phoneNo}
                    </p>
                  )}

                  {/* Guest Type Badge */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium border-2 ${
                        guest.guestType === "Family"
                          ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                          : guest.guestType === "VIP"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : guest.guestType === "Friend"
                          ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                          : "border-gray-400 text-gray-600 dark:border-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {guest.guestType || "Other"}
                    </span>
                  </div>

                  {/* Table Assignment Display */}
                  <div className={`mt-3 p-3 rounded-lg ${
                    isAssigned 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-orange-100 dark:bg-orange-900/30"
                  }`}>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Table Seating:
                    </p>
                    {guest.tableId ? (
                      <p className="text-sm font-bold text-green-800 dark:text-green-300">
                        {tableMap.get(guest.tableId) || "Unknown Table"}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                        No table assigned
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setModal({ open: true, guest })}
                  >
                    Edit
                  </Button>
                  {guest.tableId ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleUnassignTable(guest)}
                      className="!bg-orange-600 !text-white hover:!bg-orange-700"
                    >
                      Unassign
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => setAssignModal({ open: true, guest })}
                      className="!bg-green-600 !text-white hover:!bg-green-700"
                    >
                      Assign Table
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Guest Form Modal */}
      <GuestFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        guest={modal.guest}
        eventId={eventId!}
      />

      {/* Table Assignment Modal */}
      {assignModal.open && assignModal.guest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-accent rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Assign {assignModal.guest.guestName} to Table
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No tables available. Please create tables first.
                </p>
              ) : (
                tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleAssignTable(assignModal.guest!, table.id)}
                    className="w-full text-left p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {table.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capacity: {table.capacity}
                    </p>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setAssignModal({ open: false })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
