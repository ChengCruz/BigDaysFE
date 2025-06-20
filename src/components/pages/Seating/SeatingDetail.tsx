// src/components/pages/Seating/SeatingDetail.tsx

import { useParams, useNavigate, Link } from "react-router-dom";
import { useSeatApi } from "../../../api/hooks/useSeatingApi";
import { Button } from "../../atoms/Button";

export default function SeatingDetail() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const { data: s, isLoading, isError } = useSeatApi(id!);

  if (isLoading) return <p>Loading seating…</p>;
  if (isError || !s) return <p>Couldn’t load seating.</p>;

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">
          Table {s.tableId} → Guest {s.guestId}
        </h2>
        <Button variant="secondary" onClick={() => nav("edit")}>
          Edit
        </Button>
      </header>
      <Link to="/app/seating" className="text-sm text-gray-500 hover:underline">
        ← Back to list
      </Link>
    </div>
  );
}
