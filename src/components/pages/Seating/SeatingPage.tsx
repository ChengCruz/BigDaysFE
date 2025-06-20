// src/components/pages/Seating/SeatingPage.tsx
import React, { useState } from "react";
import { useSeatingApi, useDeleteSeat } from "../../../api/hooks/useSeatingApi";
import { SeatingFormModal } from "../../molecules/SeatingFormModal";
import { Button } from "../../atoms/Button";

export default function SeatingPage() {
  const { data: seats, isLoading, isError } = useSeatingApi();
  const deleteSeat = useDeleteSeat();
  const [modal, setModal] = useState<{
    open: boolean;
    seat?: { id: string; tableId: string; guestId: string };
  }>({ open: false });

  if (isLoading) return <p>Loading seating…</p>;
  if (isError) return <p>Failed to load seating.</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">Seating</h2>
        <Button onClick={() => setModal({ open: true })}>New Seating</Button>
      </div>

      <ul className="space-y-2">
        {Array.isArray(seats) && seats.map((s: any) => (
          <li
            key={s.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-medium">Table: {s.tableId}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Guest: {s.guestId}
              </p>
            </div>
            <div className="space-x-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setModal({
                    open: true,
                    seat: { id: s.id, tableId: s.tableId, guestId: s.guestId },
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => deleteSeat.mutate(s.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <SeatingFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.seat}
      />
    </>
  );
}
