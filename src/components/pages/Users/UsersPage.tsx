// src/components/pages/Users/UsersPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { useState } from "react";
import { useUserByGuidApi, useUsersListApi, useDeleteUser, useUpdatePassword } from "../../../api/hooks/useUsersApi";
import { UserFormModal } from "../../molecules/UserFormModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Button } from "../../atoms/Button";
import { PasswordInput } from "../../molecules/PasswordInput";
import { FormError } from "../../molecules/FormError";
import { useAuth } from "../../../api/hooks/useAuth";
import { validatePassword } from "../../../utils/passwordValidation";

const ROLE_LABELS: Record<number, string> = {
  1: "Super Admin",
  2: "Admin",
  3: "Member",
  6: "Staff",
};

function getRoleLabel(role?: number) {
  if (role === undefined || role === null) return "—";
  return ROLE_LABELS[role] || `Role ${role}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function UsersPage() {
  const { userGuid, userRole } = useAuth();

  const { data: currentUser, isLoading: loadingCurrentUser, isError: errorCurrentUser } = useUserByGuidApi(userGuid || "");
  const { data: allUsers, isLoading: loadingAllUsers, refetch: fetchAllUsers } = useUsersListApi();

  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();

  const [showAllUsers, setShowAllUsers] = useState(false);

  // Password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [modal, setModal] = useState<{
    open: boolean;
    user?: {
      userGuid: string;
      fullName: string;
      email: string;
      id?: number;
      role?: number;
      createdDate?: string;
      lastUpdated?: string;
    };
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPwdError(validation.errors.join(" · "));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    try {
      await updatePassword.mutateAsync({
        id: currentUser!.id,
        email: currentUser!.email,
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdSuccess(true);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    }
  };

  if (loadingCurrentUser) return <PageLoader message="Loading user profile..." />;
  if (errorCurrentUser) return <p className="text-red-500">Failed to load user profile.</p>;

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

  // ─── Non-admin: inline editable profile + change password ─────────────────
  if (!isAdmin) {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary">My Profile</h2>
        </div>

        {!currentUser ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Unable to load user profile. Please try logging in again.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-xl space-y-6">

            {/* Account Info (read-only) */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Role</p>
                <p className="font-medium">{getRoleLabel(currentUser.role)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Created</p>
                <p className="font-medium">{formatDate(currentUser.createdDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Last Modified</p>
                <p className="font-medium">{formatDate(currentUser.lastUpdated)}</p>
              </div>
            </div>

            {/* Profile info (read-only) */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Name</p>
                <p className="font-medium">{currentUser.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                <p className="font-medium text-gray-500 dark:text-gray-400">{currentUser.email}</p>
              </div>
            </div>

            {/* Change Password */}
            <div className="border-t border-gray-200 dark:border-gray-700" />
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Change Password
              </h4>
              {pwdError && <FormError message={pwdError} />}
              {pwdSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">Password updated successfully.</p>
              )}
              <PasswordInput
                label="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                showValidation
                showStrength
                required
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              <div className="flex justify-end">
                <Button type="submit" loading={updatePassword.isPending}>
                  {updatePassword.isPending ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </>
    );
  }

  // ─── Admin: list view with View All Users ──────────────────────────────────
  const usersToDisplay = showAllUsers ? allUsers : (currentUser ? [currentUser] : []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">
          {showAllUsers ? "All Users" : "My Profile"}
        </h2>
        <div className="flex gap-2">
          {!showAllUsers && (
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                  {u.role !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {getRoleLabel(u.role)}
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
                          user: {
                            userGuid: u.userGuid,
                            fullName: u.fullName,
                            email: u.email,
                            id: u.id,
                            role: u.role,
                            createdDate: u.createdDate,
                            lastUpdated: u.lastUpdated,
                          },
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
