// src/components/organisms/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { XIcon } from "@heroicons/react/outline";

import {
  CalendarIcon,
  ClipboardListIcon,
  UserIcon,
  TableIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserGroupIcon,
  HomeIcon,
} from "@heroicons/react/solid";
import { useEventContext } from "../../context/EventContext";
import { Button } from "../atoms/Button";

interface SidebarLink {
  to: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

const links: SidebarLink[] = [
  { to: "/app/dashboard", label: "Member Dashboard", Icon: HomeIcon, description: "Overview & insights" },
  { to: "/app/events", label: "Events", Icon: CalendarIcon, description: "Manage dates & details" },
  { to: "/app/rsvps", label: "RSVPs", Icon: ClipboardListIcon, description: "Guest responses" },
  { to: "/app/guests", label: "Guests", Icon: UserGroupIcon, description: "Guest list" },
  { to: "/app/tables", label: "Tables", Icon: TableIcon, description: "Seating & arrangements" },
  { to: "/app/wallet", label: "Wallet", Icon: CurrencyDollarIcon, description: "Budget & Expenses" },
  { to: "/app/users", label: "Users", Icon: UserIcon, description: "Team" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { event, openSelector, mustChooseEvent } = useEventContext();

  const [collapsed, setCollapsed] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!event?.title) return "EV";
    return event.title
      .split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [event?.title]);

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
          fixed inset-y-0 left-0 w-72 text-white
          bg-gradient-to-b from-primary/95 via-slate-900 to-secondary/90
          dark:from-primary/70 dark:via-slate-950 dark:to-secondary/70
          z-30 transform transition-all shadow-xl shadow-primary/25
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:shadow-none
          ${collapsed ? "md:w-20" : "md:w-72"}
        `}
      >
        <div
          className={`flex items-center justify-between px-4 py-5 border-b border-white/10 ${
            collapsed ? "md:px-3" : "md:px-6"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center text-white/90 font-semibold">
              {initials}
            </div>
            {!collapsed && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200/80">Workspace</p>
                <p className="text-sm font-semibold">Event Control</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="hidden md:inline-flex p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              onClick={() => setCollapsed(c => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span aria-hidden className="text-xs font-semibold tracking-wide text-indigo-100">
                {collapsed ? "▶" : "◀"}
              </span>
            </button>
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <XIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className={`p-4 space-y-3 ${collapsed ? "md:px-3" : "md:px-5"}`}>
          <div
            className={`rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition-all ${
              collapsed ? "px-2 py-3" : "p-4 space-y-2"
            }`}
          >
            <div className={`flex items-start gap-3 ${collapsed ? "justify-center" : ""}`}>
              <div className="p-2 rounded-xl bg-white/10">
                <SparklesIcon className="h-5 w-5 text-amber-200" />
              </div>
              {!collapsed && (
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-indigo-200/90 font-semibold">Current event</p>
                  <p className="text-base font-semibold text-white line-clamp-1">{event?.title ?? "Choose an event"}</p>
                  <p className="text-xs text-indigo-100/80 line-clamp-1">
                    {event?.location || "Add a venue"} • {event?.date ? new Date(event.date).toLocaleDateString() : "Set a date"}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              className={`w-full justify-center ${collapsed ? "text-xs px-2" : ""}`}
              onClick={openSelector}
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                {!collapsed && (mustChooseEvent ? "Select an event" : "Switch event")}
              </span>
            </Button>
            {mustChooseEvent && !collapsed && (
              <p className="text-[11px] text-amber-100 bg-amber-500/20 border border-amber-200/30 rounded-lg px-3 py-2">
                Choose an event to unlock the dashboard pages. Switching later stays here in the sidebar.
              </p>
            )}
          </div>

          <nav className="space-y-1">
            {links.map(({ to, label, Icon, description }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 ${collapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl border transition-colors text-sm
                   ${
                     isActive
                       ? "border-white/30 bg-white/15 text-white shadow-lg shadow-black/20"
                       : "border-transparent text-indigo-100 hover:border-white/20 hover:bg-white/10"
                   }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <div className="flex-1">
                    <p className="font-semibold">{label}</p>
                    {description && (
                      <p className="text-[12px] text-indigo-100/80 group-hover:text-white/90">{description}</p>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
