// src/components/pages/Seating/SeatingPage.tsx
import { useState } from "react";
import { useSeatingApi, useDeleteSeat } from "../../../api/hooks/useSeatingApi";
import { SeatingFormModal } from "../../molecules/SeatingFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Button } from "../../atoms/Button";

export default function SeatingPage() {
  const { data: seats, isLoading, isError } = useSeatingApi();
  const deleteSeat = useDeleteSeat();
  const [modal, setModal] = useState<{
    open: boolean;
    seat?: { id: string; tableId: string; guestId: string };
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    seat: { id: string; tableId: string; guestId: string } | null;
  }>({ open: false, seat: null });

  if (isLoading) return <p>Loading seating…</p>;
  if (isError) return <p>Failed to load seating.</p>;

  // Delete modal handlers
  const handleDelete = (seat: { id: string; tableId: string; guestId: string }) => {
    setDeleteModal({ open: true, seat });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ open: false, seat: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.seat) return;
    
    try {
      await deleteSeat.mutateAsync(deleteModal.seat.id);
      setDeleteModal({ open: false, seat: null });
    } catch (error) {
      console.error("Failed to delete seat:", error);
    }
  };

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
                onClick={() => handleDelete({ id: s.id, tableId: s.tableId, guestId: s.guestId })}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        isDeleting={deleteSeat.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Seating Assignment?"
        description="Are you sure you want to delete this seating assignment? This action cannot be undone."
      >
        {deleteModal.seat && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                  Table ID: {deleteModal.seat.tableId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Guest ID: {deleteModal.seat.guestId}
                </p>
              </div>
            </div>
          </div>
        )}
      </DeleteConfirmationModal>
    </>
  );
}
