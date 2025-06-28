// src/components/organisms/PublicNavbar.tsx
import  { useState } from "react";
import { NavLink } from "react-router-dom";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

const links = [
  { to: "/",       label: "HOME"    },
  { to: "/contact", label: "CONTACT"  },
  { to: "/story",  label: "STORY"   },
  { to: "/events", label: "EVENTS"  },
  { to: "/people", label: "PEOPLE"  },
  { to: "/gallery",label: "GALLERY" },
  { to: "/rsvp",   label: "RSVP"    },
  { to: "/blog",   label: "BLOG"    },
  { to: "/login",  label: "LOGIN"   },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background text-text shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        <div className="text-2xl font-playfair italic text-primary">C &amp; C</div>

        {/* desktop links */}
        <nav className="hidden md:flex space-x-6 font-medium">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "text-secondary underline" : "hover:text-secondary"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* mobile hamburger */}
        <button
          className="md:hidden p-2 rounded hover:bg-secondary/10"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <XIcon className="h-6 w-6 text-text" />
          ) : (
            <MenuIcon className="h-6 w-6 text-text" />
          )}
        </button>
      </div>

      {/* mobile menu panel */}
      {open && (
        <nav className="md:hidden bg-background border-t border-gray-200">
          <ul className="space-y-1 py-4 px-6 font-medium">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    isActive
                      ? "block py-2 text-secondary underline"
                      : "block py-2 hover:text-secondary"
                  }
                  onClick={() => setOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
