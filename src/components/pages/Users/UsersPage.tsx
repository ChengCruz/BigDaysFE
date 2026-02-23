// src/components/pages/Users/UsersPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { useState } from "react";
import { useUsersApi, useDeleteUser } from "../../../api/hooks/useUsersApi";
import { UserFormModal } from "../../molecules/UserFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Button } from "../../atoms/Button";

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsersApi();
  const deleteUser = useDeleteUser();
  const [modal, setModal] = useState<{
    open: boolean;
    user?: { id: string; name: string; email: string };
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    user: { id: string; name: string; email: string } | null;
  }>({ open: false, user: null });

  if (isLoading) return <PageLoader message="Loading users..." />;
  if (isError) return <p>Failed to load users.</p>;

  // Delete modal handlers
  const handleDelete = (user: { id: string; name: string; email: string }) => {
    setDeleteModal({ open: true, user });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ open: false, user: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    
    try {
      await deleteUser.mutateAsync(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">Users</h2>
        <Button onClick={() => setModal({ open: true })}> New User</Button>
      </div>
      <ul className="space-y-2">
        {Array.isArray(users) &&
          users.map((u: any) => (
            <li
              key={u.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-medium">{u.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {u.email}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setModal({
                      open: true,
                      user: { id: u.id, name: u.name, email: u.email },
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDelete({ id: u.id, name: u.name, email: u.email })}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
      </ul>
      <UserFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.user}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        isDeleting={deleteUser.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete User?"
        description="Are you sure you want to delete this user? This action cannot be undone."
      >
        {deleteModal.user && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                  {deleteModal.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email: {deleteModal.user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </DeleteConfirmationModal>
    </>
  );
}
