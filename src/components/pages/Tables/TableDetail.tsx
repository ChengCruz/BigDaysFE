// src/components/pages/RSVPs/RsvpDetail.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTableApi } from "../../../api/hooks/useTablesApi";

export default function TableDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: r, isLoading, isError } = useTableApi(id!);

  if (isLoading) return <p>Loading…</p>;
  if (isError)   return <p>Couldn’t load Table.</p>;

  return (
    <div className="space-y-4">
      <header className="flex justify-between">
        <h2 className="text-2xl font-semibold text-primary">{r.guestName}</h2>
        <button
          className="px-3 py-1 bg-secondary text-white rounded"
          onClick={() => nav("edit")}
        >
          Edit
        </button>
      </header>
      <p>Status: <strong>{r.status}</strong></p>
      <Link to="/app/tables" className="text-sm text-gray-500 hover:underline">
        ← Back to list
      </Link>
    </div>
  );
}
