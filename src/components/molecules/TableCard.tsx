// src/components/molecules/TableCard.tsx
import React, { useState } from "react";
import { Button } from "../atoms/Button";
import { XIcon } from "@heroicons/react/outline";

export interface TableCardProps {
  table: {
    id: string;
    name: string;
    capacity: number;
    assignedCount: number;
    guests: Array<{ id: string; guestName: string; paxCount?: number }>;
    category?: "vip" | "family-bride" | "family-groom" | "friends" | "colleagues";
  };
  onDrop?: (guestId: string, tableId: string) => void;
  onEdit?: (tableId: string) => void;
  onDelete?: (tableId: string) => void;
  onUnassignGuest?: (guestId: string) => void;
  isDropTarget?: boolean;
  draggedGuest?: { id: string; paxCount: number } | null;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  onDrop,
  onEdit,
  onDelete,
  onUnassignGuest,
  draggedGuest,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Calculate if this table can accept the dragged guest
  const availableSeats = table.capacity - table.assignedCount;
  const canAcceptDrop = draggedGuest 
    ? draggedGuest.paxCount <= availableSeats 
    : availableSeats > 0;

  // Color scheme based on category
  const categoryColors = {
    vip: {
      header: "from-purple-50 to-white dark:from-purple-900/20 dark:to-accent",
      icon: "from-purple-500 to-purple-700",
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    },
    "family-bride": {
      header: "from-pink-50 to-white dark:from-pink-900/20 dark:to-accent",
      icon: "from-pink-500 to-rose-600",
      badge: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
    },
    "family-groom": {
      header: "from-blue-50 to-white dark:from-blue-900/20 dark:to-accent",
      icon: "from-blue-500 to-blue-700",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    friends: {
      header: "from-green-50 to-white dark:from-green-900/20 dark:to-accent",
      icon: "from-green-500 to-emerald-600",
      badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    colleagues: {
      header: "from-orange-50 to-white dark:from-orange-900/20 dark:to-accent",
      icon: "from-orange-500 to-amber-600",
      badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    },
  };

  const colors = categoryColors[table.category || "friends"];
  const progress = (table.assignedCount / table.capacity) * 100;
  const isFull = table.assignedCount >= table.capacity;

  const handleDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return; // Don't allow drops if insufficient capacity
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canAcceptDrop) return; // Block drop if insufficient capacity
    
    const guestId = e.dataTransfer.getData("guestId");
    if (guestId && onDrop) {
      onDrop(guestId, table.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative rounded-xl shadow-lg overflow-hidden transition-all
        ${isDragOver && canAcceptDrop ? "ring-4 ring-primary ring-offset-2 shadow-2xl scale-[1.02]" : ""}
        ${!canAcceptDrop && draggedGuest ? "opacity-50 cursor-not-allowed" : ""}
        ${isFull ? "opacity-75" : ""}
        hover:shadow-xl
      `}
      role="region"
      aria-label={`${table.name} - ${table.assignedCount} of ${table.capacity} seats filled`}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${colors.header} p-4 border-b`}>
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
          {table.name}
        </h3>
        {table.category && (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
              {table.category}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-accent p-4">
        {/* Seat count with progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Seats
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {table.assignedCount} / {table.capacity}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFull
                  ? "bg-green-500"
                  : progress > 80
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Guest list */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {table.guests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
              No guests assigned yet
            </p>
          ) : (
            table.guests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800 group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Initial avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {guest.guestName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {guest.guestName}
                  </p>
                  {guest.paxCount && guest.paxCount > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      +{guest.paxCount - 1} guests
                    </p>
                  )}
                </div>
                {onUnassignGuest && (
                  <button
                    onClick={() => onUnassignGuest(guest.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Unassign guest"
                  >
                    <XIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={() => onEdit?.(table.id)}
            className="flex-1 text-sm py-2"
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDelete?.(table.id)}
            className="text-sm py-2"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Drop indicator overlay */}
      {isDragOver && canAcceptDrop && (
        <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-accent px-4 py-2 rounded-lg shadow-lg">
            <p className="text-primary font-semibold">Drop guest here</p>
          </div>
        </div>
      )}
      
      {/* Insufficient capacity indicator */}
      {draggedGuest && !canAcceptDrop && (
        <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-accent px-4 py-2 rounded-lg shadow-lg border-2 border-red-500">
            <p className="text-red-600 font-semibold text-sm">
              Not enough seats
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Need {draggedGuest.paxCount}, only {availableSeats} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
