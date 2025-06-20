import { NavLink } from "react-router-dom";

const links = [
  { to: "/",       label: "HOME"    },
  { to: "/contact", label: "CONTACT"  },
  { to: "/story",  label: "STORY"   },
  { to: "/events", label: "EVENTS"  },
  { to: "/people", label: "PEOPLE"  },
  { to: "/gallery",label: "GALLERY" },
  { to: "/rsvp",   label: "RSVP"    },
  { to: "/blog",   label: "BLOG"    },
  { to: "/login", label: "LOGIN"  },

];

export function PublicNavbar() {
  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-background text-text shadow-sm">
      <div className="flex-1 text-2xl font-playfair italic text-primary">C &amp; C</div>
      <ul className="flex-grow hidden md:flex space-x-6 font-medium">
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "text-secondary underline"
                  : "hover:text-secondary"
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      {/* Mobile menu toggle could go here */}
    </nav>
  );
}
