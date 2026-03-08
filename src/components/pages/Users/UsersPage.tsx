// src/components/pages/Users/UsersPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { useState } from "react";
import { useUserByGuidApi, useUsersListApi, useDeleteUser } from "../../../api/hooks/useUsersApi";
import { UserFormModal } from "../../molecules/UserFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Button } from "../../atoms/Button";
import { useAuth } from "../../../api/hooks/useAuth";

export default function UsersPage() {
  const { userGuid, userRole } = useAuth();

  const { data: currentUser, isLoading: loadingCurrentUser, isError: errorCurrentUser } = useUserByGuidApi(userGuid || "");
  const { data: allUsers, isLoading: loadingAllUsers, refetch: fetchAllUsers } = useUsersListApi();
  
  const deleteUser = useDeleteUser();
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    user?: { userGuid: string; fullName: string; email: string };
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    user: { userGuid: string; fullName: string; email: string } | null;
  }>({ open: false, user: null });

  const isAdmin = userRole === 1 || userRole === 2;

  const handleViewAllUsers = async () => {
    await fetchAllUsers();
    setShowAllUsers(true);
  };

  if (loadingCurrentUser) return <PageLoader message="Loading user profile..." />;
  if (errorCurrentUser) return <p className="text-red-500">Failed to load user profile.</p>;

  // Delete modal handlers
  const handleDelete = (user: { userGuid: string; fullName: string; email: string }) => {
    setDeleteModal({ open: true, user });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ open: false, user: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    
    try {
      await deleteUser.mutateAsync(deleteModal.user.userGuid);
      setDeleteModal({ open: false, user: null });
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const usersToDisplay = showAllUsers ? allUsers : (currentUser ? [currentUser] : []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">
          {showAllUsers ? "All Users" : "My Profile"}
        </h2>
        <div className="flex gap-2">
          {isAdmin && !showAllUsers && (
            <Button onClick={handleViewAllUsers} disabled={loadingAllUsers}>
              {loadingAllUsers ? "Loading..." : "View All Users"}
            </Button>
          )}
          {showAllUsers && (
            <Button variant="secondary" onClick={() => setShowAllUsers(false)}>
              View My Profile
            </Button>
          )}
          {showAllUsers && (
            <Button onClick={() => setModal({ open: true })}>New User</Button>
          )}
        </div>
      </div>

      {!currentUser && !showAllUsers ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            Unable to load user profile. Please try logging in again.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {Array.isArray(usersToDisplay) &&
            usersToDisplay.map((u: any) => (
              <li
                key={u.userGuid}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <p className="text-lg font-medium">{u.fullName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {u.email}
                  </p>
                  {u.role !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Role: {u.role}
                    </p>
                  )}
                </div>
                {showAllUsers && (
                  <div className="space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setModal({
                          open: true,
                          user: { userGuid: u.userGuid, fullName: u.fullName, email: u.email },
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete({ userGuid: u.userGuid, fullName: u.fullName, email: u.email })}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}

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
                  {deleteModal.user.fullName}
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
