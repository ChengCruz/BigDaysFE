// src/components/molecules/UserFormModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { PasswordInput } from "./PasswordInput";
import { Button } from "../atoms/Button";
import { useCreateUser, useUpdateUser, useUpdatePassword } from "../../api/hooks/useUsersApi";
import { FormError } from "./FormError";
import { validatePassword } from "../../utils/passwordValidation";
import { ROLE_LABELS } from "../../utils/jwtUtils";


function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: {
    userGuid: string;
    fullName: string;
    email: string;
    id?: number;
    role?: number;
    createdDate?: string;
    lastUpdated?: string;
  };
}

export const UserFormModal: React.FC<Props> = ({ isOpen, onClose, initial }) => {
  const isEdit = Boolean(initial);

  // Profile fields
  const [name, setName] = useState(initial?.fullName || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [role, setRole] = useState<number>(initial?.role ?? 3);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updatePassword = useUpdatePassword();

  useEffect(() => {
    if (isOpen) {
      setName(initial?.fullName || "");
      setEmail(initial?.email || "");
      setRole(initial?.role ?? 3);
      setProfileError(null);
      setProfileSuccess(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdError(null);
      setPwdSuccess(false);
    }
  }, [isOpen, initial]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    try {
      if (isEdit && initial) {
        await updateUser.mutateAsync({ id: initial!.userGuid, fullName: name, email, role });
      } else {
        await createUser.mutateAsync({ fullName: name, email });
        onClose();
      }
      setProfileSuccess(true);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          if (isEdit && initial) {
            await updateUser.mutateAsync({ id: initial!.userGuid, fullName: name, email, role });
          } else {
            await createUser.mutateAsync({ fullName: name, email });
            onClose();
          }
          setProfileSuccess(true);
          return;
        } catch { /* fall through to show error */ }
      }
      setProfileError(err.response?.data?.message || "Something went wrong.");
    }
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
        id: initial!.id!,
        email,
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdSuccess(true);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          await updatePassword.mutateAsync({
            id: initial!.id!,
            email,
            oldPassword,
            newPassword,
          });
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setPwdSuccess(true);
          return;
        } catch { /* fall through to show error */ }
      }
      setPwdError(err.response?.data?.message || "Failed to update password.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit User" : "New User"}
      className="max-w-xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">

        {/* ── Account Info (read-only) ── */}
        {isEdit && (
          <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Created</p>
              <p className="font-medium">{formatDate(initial?.createdDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Last Modified</p>
              <p className="font-medium">{formatDate(initial?.lastUpdated)}</p>
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileError && <FormError message={profileError} />}
          {profileSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Profile saved successfully.</p>
          )}
          <FormField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {isEdit && (
            <div className="space-y-1">
              <label className="block font-medium">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="w-full border border-gray-300 rounded p-2"
              >
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createUser.isPending || updateUser.isPending}>
              {isEdit
                ? updateUser.isPending ? "Saving…" : "Save"
                : createUser.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>

        {/* ── Change Password (edit mode only) ── */}
        {isEdit && initial?.id && (
          <>
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
                <Button type="submit" variant="primary" loading={updatePassword.isPending}>
                  {updatePassword.isPending ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};
