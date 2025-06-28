import { useState } from "react";
import { useParams } from "react-router-dom";
import { useEventContext } from "../../../context/EventContext";
import { useRsvpsApi } from "../../../api/hooks/useRsvpsApi";
import {
  useTableApi,
  useUpdateTableExtras,
} from "../../../api/hooks/useTablesApi";
import { useReassignGuest } from "../../../api/hooks/useTablesApi";
import { Button } from "../../atoms/Button";

export function TableAssignments() {
  const { tableId } = useParams<{ tableId: string }>();
  const { eventId } = useEventContext();

  const { data: table, isLoading: loadingTable } = useTableApi(tableId!);
  const { data: rsvps = [], isLoading: loadingRsvps } = useRsvpsApi(eventId!);

  const reassign = useReassignGuest(tableId!, eventId!);
  const updateExtras = useUpdateTableExtras(tableId!);

  const [extra, setExtra] = useState(table?.extraGuests || 0);

  if (loadingTable || loadingRsvps) return <p>Loading…</p>;

  const assigned = rsvps.filter((r: any) => r.tableId === tableId);
  const unassigned = rsvps.filter((r: any) => !r.tableId);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-semibold">Unassigned Guests</h2>
        {unassigned.length === 0 ? (
          <p>All guests are assigned.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {unassigned.map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm"
              >
                <span>{r.guestName}</span>
                <Button
                  onClick={() =>
                    reassign.mutate({
                      guestId: r.id,
                      newTableId: tableId!,
                    })
                  }
                >
                  Assign →
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold">Assigned Guests</h2>
        {assigned.length === 0 ? (
          <p>No one assigned yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {assigned.map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm"
              >
                <span>{r.guestName}</span>
                <Button
                  variant="secondary"
                  onClick={() =>
                    reassign.mutate({
                      guestId: r.id,
                      newTableId: "",
                    })
                  }
                >
                  ← Unassign
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <h3 className="font-medium">Additional Guests</h3>
          <div className="flex items-center space-x-2 mt-2">
            <Button onClick={() => setExtra((x) => Math.max(0, x - 1))}>
              –
            </Button>
            <span className="px-4">{extra}</span>
            <Button onClick={() => setExtra((x) => x + 1)}>＋</Button>
            <Button
              variant="primary"
              onClick={() => updateExtras.mutate({ extraGuests: extra })}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
