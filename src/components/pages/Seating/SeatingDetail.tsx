// src/components/pages/Seating/SeatingDetail.tsx
import { PageLoader } from "../../atoms/PageLoader";

import { useParams, useNavigate, Link } from "react-router-dom";
import { useSeatApi } from "../../../api/hooks/useSeatingApi";
import { PencilIcon } from "@heroicons/react/solid";

export default function SeatingDetail() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const { data: s, isLoading, isError } = useSeatApi(id!);

  if (isLoading) return <PageLoader />;
  if (isError || !s) return <p>Couldn’t load seating.</p>;

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">
          Table {s.tableId} → Guest {s.guestId}
        </h2>
        <button title="Edit" onClick={() => nav("edit")} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-accent dark:border-white/10 dark:text-white dark:hover:bg-white/10 transition-colors"><PencilIcon className="h-4 w-4" /></button>
      </header>
      <Link to="/app/seating" className="text-sm text-gray-500 hover:underline">
        ← Back to list
      </Link>
    </div>
  );
}
