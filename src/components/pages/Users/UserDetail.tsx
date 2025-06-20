// src/components/pages/Users/UserDetail.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUserApi } from "../../../api/hooks/useUsersApi";
import { Button } from "../../atoms/Button";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const { data: u, isLoading, isError } = useUserApi(id!);

  if (isLoading) return <p>Loading user…</p>;
  if (isError || !u) return <p>Couldn’t load user.</p>;

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">{u.name}</h2>
        <Button variant="secondary" onClick={() => nav("edit")}>
          Edit
        </Button>
      </header>
      <p className="text-gray-600 dark:text-gray-400">Email: {u.email}</p>
      <Link to="/app/users" className="text-sm text-gray-500 hover:underline">
        ← Back to list
      </Link>
    </div>
  );
}
