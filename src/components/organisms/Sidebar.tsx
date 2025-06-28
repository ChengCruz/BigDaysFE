// src/components/organisms/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { XIcon }   from "@heroicons/react/outline";

const links = [
  { to: "/app/events",  label: "Events"  },
  { to: "/app/rsvps",   label: "RSVPs"   },
  { to: "/app/tables",  label: "Tables"  },
  { to: "/app/seating", label: "Seating" },
  { to: "/app/users",   label: "Users"   },
  { to: "/app/costing", label: "Costing" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop */}
     <div
       className={`
         fixed inset-0 bg-black/30 z-20 transition-opacity
         ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
       `}
       onClick={onClose}
     />

      {/* Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-60 bg-background border-r border-gray-200 dark:border-gray-700
    z-30 transform transition-transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"}

        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Menu</h2>
          <button
            className="p-2 rounded hover:bg-secondary/10"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-1 p-4">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-button text-white"
                      : "text-text hover:bg-secondary/10"
                  }`
                }
                onClick={onClose}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
