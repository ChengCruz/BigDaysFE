// src/components/tour/tourIcons.ts
//
// The one place a TourIconKey turns into an actual icon component. Shared by
// TutorialPage and the What's New surfaces so a new key can never render in one
// place and fall back to a house in the other.
//
// Solid icons only: the outline set resolves locally but fails the Netlify
// build.
import {
  HomeIcon,
  CalendarIcon,
  ClipboardListIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ViewBoardsIcon,
  TemplateIcon,
  CurrencyDollarIcon,
  QrcodeIcon,
  UserIcon,
  BriefcaseIcon,
  PencilAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/solid";

import type { TourIconKey } from "./tours";

export type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

/**
 * Index this directly: `TOUR_ICONS[key] ?? FALLBACK_ICON`. A helper that
 * *returns* the component trips react-hooks/static-components at every call
 * site, since the rule can't tell a lookup from a component factory.
 */
export const TOUR_ICONS: Record<TourIconKey, IconComponent> = {
  home: HomeIcon,
  calendar: CalendarIcon,
  rsvps: ClipboardListIcon,
  questions: QuestionMarkCircleIcon,
  guests: UserGroupIcon,
  tables: ViewBoardsIcon,
  floorplan: TemplateIcon,
  budget: CurrencyDollarIcon,
  checkin: QrcodeIcon,
  users: UserIcon,
  crew: BriefcaseIcon,
  "rsvp-designer": PencilAltIcon,
  checklist: CheckCircleIcon,
};

/** Used when a key somehow has no mapping; see the note above. */
export const FALLBACK_ICON: IconComponent = HomeIcon;
