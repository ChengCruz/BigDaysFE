import React from "react";
import { FloorGuestPanel } from "./FloorGuestPanel";
import type { Guest } from "../../../../api/hooks/useGuestsApi";

interface Props {
  guests: Guest[];
  tables: { id: string; name: string }[];
  onClose: () => void;
}

export const MobileGuestDrawer: React.FC<Props> = ({ guests, tables, onClose }) => {
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-80 max-w-[85vw] animate-slide-left">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-gray-100 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <FloorGuestPanel guests={guests} tables={tables} />
      </div>
    </div>
  );
};
