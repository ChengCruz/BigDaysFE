// final Sidebar.tsx
import { NavLink } from "react-router-dom";

const links = [
  { to: "/app/events",  label: "Events" },
  { to: "/app/rsvps",   label: "RSVPs" },
  { to: "/app/tables",  label: "Tables" },
  { to: "/app/seating", label: "Seating" },
  { to: "/app/users",   label: "Users" },
  { to: "/app/costing", label: "Costing" },
];

export function Sidebar() {
  return (
    <nav className="w-60 bg-background border-r border-gray-200 dark:border-gray-700">
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
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
