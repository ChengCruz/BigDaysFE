// src/components/pages/Users/UsersPage.tsx
import { useState } from "react";
import { useUsersApi, useDeleteUser } from "../../../api/hooks/useUsersApi";
import { UserFormModal } from "../../molecules/UserFormModal";
import { Button } from "../../atoms/Button";

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsersApi();
  const deleteUser = useDeleteUser();
  const [modal, setModal] = useState<{
    open: boolean;
    user?: { id: string; name: string; email: string };
  }>({ open: false });

  if (isLoading) return <p>Loading users…</p>;
  if (isError) return <p>Failed to load users.</p>;

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
                  onClick={() => deleteUser.mutate(u.id)}
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
    </>
  );
}
