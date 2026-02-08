import { useState } from "react";
import { Rnd } from "react-rnd";
import {
  useTableApi,
  useUpdateTableLayout,
} from "../../../api/hooks/useTablesApi";
import { useParams } from "react-router-dom";
import { useEventContext } from "../../../context/EventContext";

export function TableLayoutPlanner() {
  const { tableId } = useParams<{ tableId: string }>();
  const { eventId } = useEventContext();
  const { data: table, isLoading, error } = useTableApi(tableId!);
  const updateLayout = useUpdateTableLayout(tableId!, eventId);

  const [positions, setPositions] = useState(
    () =>
      table?.layout?.reduce<Record<string, { x: number; y: number }>>(
        (acc, p) => ({ ...acc, [p.guestId]: { x: p.x, y: p.y } }),
        {}
      ) ?? {}
  );

  if (isLoading) return <p>Loading layout…</p>;
  if (error || !table) return <p>Error loading layout.</p>;

  const handleDragStop = (guestId: string, d: { x: number; y: number }) => {
    setPositions((ps) => ({ ...ps, [guestId]: { x: d.x, y: d.y } }));
  };

  const handleSave = () => {
    const layout = Object.entries(positions).map(([guestId, pos]) => ({
      guestId,
      x: pos.x,
      y: pos.y,
    }));
    updateLayout.mutate({ layout });
  };

  return (
    <div className="relative h-[500px] border bg-gray-50">
      {table.guests.map((g) => {
        const pos = positions[g.id] ?? { x: 20, y: 20 };
        return (
          <Rnd
            key={g.id}
            size={{ width: 80, height: 30 }}
            position={pos}
            bounds="parent"
            onDragStop={(_e, d) => handleDragStop(g.id, d)}
          >
            <div className="p-1 bg-white dark:bg-gray-800 border rounded text-sm">
              {g.guestName}
            </div>
          </Rnd>
        );
      })}
      <button
        onClick={handleSave}
        className="absolute bottom-4 right-4 bg-button text-white px-4 py-2 rounded"
      >
        Save Layout
      </button>
    </div>
  );
}
