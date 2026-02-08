// src/components/molecules/GuestCard.tsx
import React, { useState } from "react";

export interface GuestCardProps {
  guest: {
    id: string;
    guestName: string;
    paxCount?: number;
    phoneNo?: string;
    isVip?: boolean;
    dietaryRestrictions?: string[];
  };
  onDragStart?: (guestId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export const GuestCard: React.FC<GuestCardProps> = ({
  guest,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("guestId", guest.id);
    onDragStart?.(guest.id);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`
        p-3 rounded-lg border-2 border-dashed border-gray-200 
        bg-white dark:bg-accent/50 dark:border-gray-600
        transition-all cursor-grab active:cursor-grabbing
        touch-none select-none
        ${isHovering ? "border-primary bg-indigo-50 dark:bg-primary/10 shadow-md" : ""}
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
      role="button"
      tabIndex={0}
      aria-label={`Drag ${guest.guestName} to assign to a table`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
          {guest.guestName}
        </h4>
        {guest.paxCount && guest.paxCount > 1 && (
          <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 rounded">
            +{guest.paxCount - 1}
          </span>
        )}
      </div>

      {guest.phoneNo && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {guest.phoneNo}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {guest.isVip && (
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full">
            VIP
          </span>
        )}
        {guest.dietaryRestrictions?.map((restriction, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-medium rounded-full"
          >
            {restriction}
          </span>
        ))}
      </div>
    </div>
  );
};
