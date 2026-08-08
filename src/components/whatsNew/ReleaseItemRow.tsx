// src/components/whatsNew/ReleaseItemRow.tsx
//
// One line of a release, shared by the announcement modal and the What's New
// page so the two can never drift apart.
//
// Deliberately read-only. An earlier version put a "Show me" link on every row;
// five of them down a list pulled the eye away from the words, and on the
// history page they were plainly wrong — that page is a record of what changed,
// not an onboarding flow.

import { FALLBACK_ICON, TOUR_ICONS } from "../tour/tourIcons";
import type { ReleaseItem } from "./releases";

export function ReleaseItemRow({ item }: { item: ReleaseItem }) {
  const Icon = TOUR_ICONS[item.icon] ?? FALLBACK_ICON;

  return (
    <div className="flex items-start gap-3" data-testid="whats-new-item">
      <div className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text dark:text-white">{item.text}</p>
        {item.detail && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.detail}</p>
        )}
      </div>
    </div>
  );
}
