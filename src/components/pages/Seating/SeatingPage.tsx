// src/components/pages/Seating/SeatingPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { useState } from "react";
import { useSeatingApi, useDeleteSeat } from "../../../api/hooks/useSeatingApi";
import { SeatingFormModal } from "../../molecules/SeatingFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Button } from "../../atoms/Button";
import { PencilIcon, TrashIcon } from "@heroicons/react/solid";

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

  if (isLoading) return <PageLoader />;
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Seating</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure individual seat assignments per table</p>
        </div>
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
              <button
                title="Edit"
                onClick={() => setModal({ open: true, seat: { id: s.id, tableId: s.tableId, guestId: s.guestId } })}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-accent dark:border-white/10 dark:text-white dark:hover:bg-white/10 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                title="Delete"
                onClick={() => handleDelete({ id: s.id, tableId: s.tableId, guestId: s.guestId })}
                className="p-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 dark:bg-accent dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
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
