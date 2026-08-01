// src/components/organisms/coupleSections.ts
//
// The five couple-mode destinations. This is the single source of truth for
// both the desktop rail and the mobile tab bar — add a section in one place.
//
// Nothing here changes any route. Every `to` and `match` value is an existing
// path from src/routers/routes.tsx, so bookmarks and email deep-links keep
// working. What changed is only which paths are *listed*.

import type React from "react";
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from "@heroicons/react/solid";
import { Chair } from "@phosphor-icons/react";

export interface CoupleSection {
  key: string;
  label: string;
  /** Where the tab navigates to. */
  to: string;
  /**
   * Paths that keep this tab lit. Matched by PREFIX, which is deliberately the
   * opposite of the planner sidebar's `end: true` NavLinks: a couple on
   * /app/tables/floorplan should still see "Seating" as the active tab.
   */
  match: string[];
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  /**
   * Full Tailwind class strings, not composed at runtime. Tailwind scans source
   * for literal class names, so `text-sect-${key}` would never be generated.
   */
  tone: {
    text: string;
    /** Active nav row background. */
    bg: string;
    /** Icon chip background. */
    chip: string;
  };
}

export const COUPLE_SECTIONS: CoupleSection[] = [
  {
    key: "home",
    label: "Home",
    to: "/app/dashboard",
    match: ["/app/dashboard", "/app/checklist", "/app/events"],
    Icon: HomeIcon,
    tone: { text: "text-sect-home", bg: "bg-sect-home/12", chip: "bg-sect-home/12" },
  },
  {
    key: "guests",
    label: "Guests",
    to: "/app/guests",
    match: ["/app/guests", "/app/rsvps", "/app/form-fields"],
    Icon: UserGroupIcon,
    tone: { text: "text-sect-guests", bg: "bg-sect-guests/12", chip: "bg-sect-guests/12" },
  },
  {
    key: "seating",
    label: "Seating",
    to: "/app/tables/v3",
    match: ["/app/tables"],
    Icon: Chair as React.FC<React.SVGProps<SVGSVGElement>>,
    tone: { text: "text-sect-seating", bg: "bg-sect-seating/12", chip: "bg-sect-seating/12" },
  },
  {
    key: "money",
    label: "Money",
    to: "/app/budget",
    match: ["/app/budget"],
    Icon: CurrencyDollarIcon,
    tone: { text: "text-sect-money", bg: "bg-sect-money/12", chip: "bg-sect-money/12" },
  },
  {
    key: "bigday",
    label: "Big Day",
    to: "/app/checkin",
    match: ["/app/checkin", "/app/crew"],
    Icon: SparklesIcon,
    tone: { text: "text-sect-bigday", bg: "bg-sect-bigday/12", chip: "bg-sect-bigday/12" },
  },
];

/** The section a path belongs to, or null for account/settings routes. */
export function sectionForPath(pathname: string): CoupleSection | null {
  return (
    COUPLE_SECTIONS.find((s) =>
      s.match.some((m) => pathname === m || pathname.startsWith(`${m}/`))
    ) ?? null
  );
}
