import { useState } from "react";
import { PageLoader } from "../../atoms/PageLoader";
import { useParams } from "react-router-dom";
import { useEventContext } from "../../../context/EventContext";
import { useGuestsApi } from "../../../api/hooks/useGuestsApi";
import {
  useTableApi,
  useUpdateTableExtras,
  useAssignGuestToTable,
  useUnassignGuestFromTable,
} from "../../../api/hooks/useTablesApi";
import { Button } from "../../atoms/Button";
import toast from "react-hot-toast";

export function TableAssignments() {
  const { tableId } = useParams<{ tableId: string }>();
  const { eventId } = useEventContext();

  const { data: table, isLoading: loadingTable } = useTableApi(tableId!);
  const { data: guests = [], isLoading: loadingGuests } = useGuestsApi(eventId!);

  const assignGuest = useAssignGuestToTable(eventId!);
  const unassignGuest = useUnassignGuestFromTable(eventId!);
  const updateExtras = useUpdateTableExtras(tableId!, eventId);

  const [extra, setExtra] = useState(table?.extraGuests || 0);

  if (loadingTable || loadingGuests) return <PageLoader />;

  const assigned = guests.filter((g: any) => g.tableId === tableId);
  const unassigned = guests.filter((g: any) => !g.tableId);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-semibold">Unassigned Guests</h2>
        {unassigned.length === 0 ? (
          <p>All guests are assigned.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {unassigned.map((g) => (
              <li
                key={g.id}
                className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm"
              >
                <span>{g.guestName || g.name}</span>
                <Button
                  onClick={() => {
                    const guestPax = (g as any).pax || (g as any).noOfPax || 1;
                    const newCount = assigned.reduce((s: number, ag: any) => s + ((ag.pax || ag.noOfPax || 1)), 0) + guestPax;
                    assignGuest.mutate(
                      { guestId: g.id, tableId: tableId! },
                      {
                        onSuccess: () => {
                          if (newCount > (table?.capacity ?? 0)) {
                            toast(`⚠️ ${table?.name} is over capacity (${newCount}/${table?.capacity}). Guest assigned anyway.`, {
                              duration: 4000,
                              style: { background: "#fef3c7", color: "#92400e" },
                            });
                          }
                        },
                      }
                    );
                  }}
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
            {assigned.map((g) => (
              <li
                key={g.id}
                className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm"
              >
                <span>{g.guestName || g.name}</span>
                <Button
                  variant="secondary"
                  onClick={() => unassignGuest.mutate(g.id)}
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
              onClick={() => updateExtras.mutate({ 
                extraGuests: extra,
                tableName: table?.name || "",
                maxSeats: table?.capacity || 0
              })}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
