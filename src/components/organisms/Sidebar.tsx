// src/components/organisms/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import XIcon from "@heroicons/react/outline/XIcon";
import ChevronLeftIcon from "@heroicons/react/outline/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/outline/ChevronRightIcon";
import LogoutIcon from "@heroicons/react/outline/LogoutIcon";
import UserCircleIcon from "@heroicons/react/outline/UserCircleIcon";
import SwitchHorizontalIcon from "@heroicons/react/outline/SwitchHorizontalIcon";

import {
  CalendarIcon,
  ClipboardListIcon,
  UserIcon,
  TableIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserGroupIcon,
  HomeIcon,
  ViewGridIcon,
  HeartIcon,
} from "@heroicons/react/solid";
import { useEventContext } from "../../context/EventContext";
import { useAuth } from "../../api/hooks/useAuth";

interface SidebarLink {
  to: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  end?: boolean;
}

const links: SidebarLink[] = [
  { to: "/app/dashboard", label: "Dashboard", Icon: HomeIcon },
  { to: "/app/events", label: "Events", Icon: CalendarIcon },
  { to: "/app/rsvps", label: "RSVPs", Icon: ClipboardListIcon },
  { to: "/app/guests", label: "Guests", Icon: UserGroupIcon },
  { to: "/app/tables", label: "Tables", Icon: TableIcon, end: true },
  { to: "/app/tables/floorplan", label: "Floor Plan", Icon: ViewGridIcon },
  { to: "/app/wallet", label: "Wallet", Icon: CurrencyDollarIcon },
  { to: "/app/users", label: "Users", Icon: UserIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { event, openSelector, mustChooseEvent } = useEventContext();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = React.useState(false);

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
          fixed inset-y-0 left-0 w-72 text-text
          bg-background border-r border-primary/10
          dark:bg-slate-900 dark:border-white/10 dark:text-white
          z-30 transform transition-all
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
          ${collapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header: logo + collapse toggle */}
          <div
            className={`flex items-center justify-between px-4 py-4 border-b border-primary/10 dark:border-white/10 ${
              collapsed ? "md:px-3" : "md:px-5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-white grid place-items-center flex-shrink-0">
                <HeartIcon className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-sm font-semibold tracking-tight">My Big Days</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="hidden md:inline-flex p-1.5 rounded-lg text-text/50 hover:text-text hover:bg-primary/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10 transition"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </button>
              <button
                className="md:hidden p-1.5 rounded-lg text-text/50 hover:text-text transition"
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Event card + Nav links — scrollable middle */}
          <div className={`flex-1 overflow-y-auto py-3 space-y-3 ${collapsed ? "md:px-2" : "px-3"}`}>
            {/* Event selector card */}
            <div className={collapsed ? "px-1" : "px-1"}>
              <button
                onClick={openSelector}
                className={`w-full rounded-xl p-3 text-left transition
                  bg-primary/5 hover:bg-primary/10 border border-primary/10
                  dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10
                  ${collapsed ? "px-2 py-3 flex justify-center" : ""}
                `}
              >
                <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                  <SparklesIcon className={`h-5 w-5 flex-shrink-0 ${mustChooseEvent ? "text-amber-500" : "text-primary"}`} />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] uppercase tracking-wide font-medium ${mustChooseEvent ? "text-amber-600 dark:text-amber-400" : "text-text/50 dark:text-white/50"}`}>
                        {mustChooseEvent ? "Select an event" : "Current event"}
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {event?.title ?? "No event selected"}
                      </p>
                    </div>
                  )}
                  {!collapsed && (
                    <SwitchHorizontalIcon className="h-4 w-4 text-text/30 dark:text-white/30 flex-shrink-0" />
                  )}
                </div>
              </button>
              {mustChooseEvent && !collapsed && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
                  Select an event to get started.
                </p>
              )}
            </div>

            {/* Navigation links */}
            <nav className="space-y-0.5">
              {links.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={label}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 ${collapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-lg transition-colors text-sm
                     ${
                       isActive
                         ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-primary"
                         : "text-text/70 hover:bg-primary/5 hover:text-text dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                     }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer: user profile + logout */}
          <div className="border-t border-primary/10 dark:border-white/10 p-3">
            {!collapsed ? (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-white/10 grid place-items-center flex-shrink-0">
                  <UserCircleIcon className="h-5 w-5 text-primary dark:text-white/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
                  <p className="text-xs text-text/50 dark:text-white/40 truncate">{user?.email ?? ""}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-text/40 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition"
                  aria-label="Logout"
                >
                  <LogoutIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="w-full flex justify-center p-2 rounded-lg text-text/40 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition"
                aria-label="Logout"
              >
                <LogoutIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
