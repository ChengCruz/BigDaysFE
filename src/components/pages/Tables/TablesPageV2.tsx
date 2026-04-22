// src/components/pages/Tables/TablesPageV2.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useGuestsApi } from "../../../api/hooks/useGuestsApi";
import { StatsCard } from "../../atoms/StatsCard";
import { useState, useMemo } from "react";
import { useEventContext } from "../../../context/EventContext";
import { NoEventsState } from "../../molecules/NoEventsState";
import {
  CollectionIcon,
  UserGroupIcon,
  UserIcon,
  ChartBarIcon,
} from "@heroicons/react/solid";
import { ChevronDownIcon } from "@heroicons/react/outline";

export default function TablesPageV2() {
  const { eventId, eventsLoading } = useEventContext()!;
  const { data: tables = [], isLoading: tablesLoading, isError: tablesError } = useTablesApi(eventId!);
  const { data: guests = [], isLoading: guestsLoading, isError: guestsError } = useGuestsApi(eventId!);

  const [statsExpanded, setStatsExpanded] = useState(true);

  const stats = useMemo(() => {
    const seatedGuests = guests
      .filter(g => g.tableId)
      .reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0);
    const unassigned = guests
      .filter(g => !g.tableId)
      .reduce((sum, g) => sum + (g.pax || g.noOfPax || 1), 0);
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    return {
      totalTables: tables.length,
      seatedGuests,
      unassigned,
      totalCapacity,
    };
  }, [tables, guests]);

  if (eventsLoading) return <PageLoader message="Loading..." />;
  if (!eventId) return <NoEventsState title="No Events for Table Management" message="Create your first event to start organizing seating arrangements and table assignments." />;
  if (tablesLoading || guestsLoading) return <PageLoader message="Loading tables..." />;
  if (tablesError || guestsError) return <ErrorState message="Failed to load data." onRetry={() => window.location.reload()} />;

  return (
    <div className="flex flex-col h-full">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary">Table Arrangement V2</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">New high-density design for large events</p>
      </div>

      {/* Stats — collapsible */}
      <div className="mb-6">
        <button
          className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-2 transition-colors select-none"
          onClick={() => setStatsExpanded(p => !p)}
        >
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${statsExpanded ? "" : "-rotate-90"}`} />
          {statsExpanded ? "Hide overview" : "Show overview"}
        </button>
        {statsExpanded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard label="Total Tables"    value={stats.totalTables}    variant="primary"   size="sm" icon={<CollectionIcon  className="w-4 h-4" />} />
            <StatsCard label="Seated Guests"   value={stats.seatedGuests}   variant="success"   size="sm" icon={<UserGroupIcon    className="w-4 h-4" />} />
            <StatsCard label="Unassigned"      value={stats.unassigned}     variant="warning"   size="sm" icon={<UserIcon         className="w-4 h-4" />} />
            <StatsCard label="Total Capacity"  value={stats.totalCapacity}  variant="secondary" size="sm" icon={<ChartBarIcon     className="w-4 h-4" />} />
          </div>
        )}
      </div>

      {/* New design preview CTA */}
      <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-10 text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <CollectionIcon className="w-7 h-7 text-primary" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Need a bigger screen for table arrangement?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
            We've got you covered. Switch to full-screen mode for a distraction-free workspace —
            compact guest list on the left, tile-based table grid in the center, and an instant
            detail panel on the right. Perfect for large events with 100+ guests and 20+ tables.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href="/app/tables/fullscreen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm shadow hover:bg-primary/90 transition-colors"
          >
            Full Screen Mode
            <CollectionIcon className="w-4 h-4" />
          </a>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600">
          Opens in a new tab · Live data · All changes sync instantly
        </p>
      </div>
    </div>
  );
}
