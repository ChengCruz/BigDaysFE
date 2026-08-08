// src/components/pages/WhatsNew/WhatsNewPage.tsx
//
// The full history, so dismissing the announcement modal never loses anything.
// Lists quiet releases too — the ones that were never worth interrupting anyone
// for still belong on the record.

import { useEffect } from "react";

import { Card } from "../../molecules/Card";
import { RELEASES } from "../../whatsNew/releases";
import { ReleaseItemRow } from "../../whatsNew/ReleaseItemRow";
import { markAllSeen } from "../../../utils/whatsNew";

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function WhatsNewPage() {
  const releases = RELEASES;

  // Reading the page counts as reading everything on it — this is what clears
  // the dot on the link that got you here.
  useEffect(() => {
    markAllSeen();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-primary">What's new</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Everything we've added and improved, newest first.
        </p>
      </div>

      {releases.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nothing to report yet. We'll list changes here as they ship.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
            <Card key={release.id}>
              <div className="space-y-4" data-testid="whats-new-release">
                <div>
                  <h3 className="text-base font-semibold text-text dark:text-white">
                    {release.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(release.date)}
                  </p>
                  {/* No fallback here — the modal needs a line under the title,
                      a card in a list does not. */}
                  {release.intro && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {release.intro}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  {release.items.map((item) => (
                    <ReleaseItemRow key={item.text} item={item} />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
