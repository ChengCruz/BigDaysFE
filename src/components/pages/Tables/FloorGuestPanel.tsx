import React, { useState, useMemo } from "react";
import type { Guest } from "../../../api/hooks/useGuestsApi";

interface Props {
  guests: Guest[];
  tables: { id: string; name: string }[];
}

export const FloorGuestPanel: React.FC<Props> = ({ guests, tables }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const unassigned = useMemo(
    () => guests.filter((g) => !g.tableId),
    [guests]
  );
  const assignedGuests = useMemo(
    () => guests.filter((g) => !!g.tableId),
    [guests]
  );

  const filtered = useMemo(() => {
    if (!searchTerm) return unassigned;
    const term = searchTerm.toLowerCase();
    return unassigned.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.phoneNo?.toLowerCase().includes(term)
    );
  }, [unassigned, searchTerm]);

  const tableNameMap = useMemo(() => new Map(tables.map(t => [t.id, t.name])), [tables]);

  return (
    <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <h3 className="font-semibold text-slate-800 dark:text-white">Guests</h3>
        </div>
        <div className="flex gap-1">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            {assignedGuests.length} seated
          </span>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
            {unassigned.length} pending
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search guests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: "thin" }}>
        {/* Unassigned section */}
        <p className="text-[10px] uppercase tracking-wider text-yellow-600 dark:text-yellow-400 font-semibold flex items-center gap-1 mb-2">
          ⚠️ Unassigned ({unassigned.length})
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-400">
              {searchTerm ? "No matches found" : "All guests are assigned!"}
            </p>
          </div>
        ) : (
          filtered.map((guest) => (
            <div
              key={guest.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("guestId", guest.id);
                setDraggingId(guest.id);
              }}
              onDragEnd={() => setDraggingId(null)}
              className={`p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 cursor-grab hover:border-primary hover:bg-indigo-50 dark:hover:bg-primary/10 transition-all ${
                draggingId === guest.id ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-slate-800 dark:text-white">{guest.name}</span>
                {(guest.pax ?? 1) > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    {guest.pax ?? 1} pax
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {guest.phoneNo && <span>📱 {guest.phoneNo}</span>}
                {guest.flag === "VIP" && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-white text-[10px] font-bold">VIP</span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Assigned section */}
        {assignedGuests.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 mt-4 mb-2">
              ✅ Assigned ({assignedGuests.length})
            </p>
            {assignedGuests.slice(0, 5).map((guest) => (
              <div key={guest.id} className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-white">{guest.name}</p>
                    <p className="text-[10px] text-green-600 dark:text-green-400">
                      {tableNameMap.get(guest.tableId ?? "") ?? "Table"} • Seat {guest.seatIndex ?? "?"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    {guest.pax ?? 1} pax
                  </span>
                </div>
              </div>
            ))}
            {assignedGuests.length > 5 && (
              <p className="text-center text-xs text-gray-400 py-2">
                + {assignedGuests.length - 5} more assigned...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
