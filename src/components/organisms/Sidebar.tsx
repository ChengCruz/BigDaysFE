// src/components/organisms/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { XIcon } from "@heroicons/react/outline";

import {
  CalendarIcon,
  ClipboardListIcon,
  CogIcon,
  UserIcon,
  TableIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/solid";

interface SidebarLink {
  to: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const links: SidebarLink[] = [
  { to: "/app/events", label: "Events", Icon: CalendarIcon },
  { to: "/app/rsvps", label: "RSVPs", Icon: ClipboardListIcon },
  { to: "/app/tables", label: "Tables", Icon: TableIcon },
  { to: "/app/seating", label: "Seating", Icon: CogIcon },
  { to: "/app/users", label: "Users", Icon: UserIcon },
  { to: "/app/costing", label: "Costing", Icon: CurrencyDollarIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-20 transition-opacity md:hidden
          ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={onClose}
      />

      {/* panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-60 bg-background border-r border-gray-200 dark:border-gray-700
          z-30 transform transition-transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-bold text-primary">Menu</h1>
          <button
            className="md:hidden p-2 rounded hover:bg-secondary/10 transition"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <XIcon className="h-5 w-5 text-text" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors
                 ${
                   isActive
                     ? "bg-primary text-white"
                     : "text-text hover:bg-secondary/10"
                 }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
