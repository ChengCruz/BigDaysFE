// src/components/pages/Tables/TableSummary.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { useParams } from "react-router-dom";
import { useTableApi } from "../../../api/hooks/useTablesApi";

export function TableSummary() {
  const { tableId } = useParams<{tableId:string}>();
  const { data: table, isLoading, error } = useTableApi(tableId!);

  if (isLoading) return <PageLoader />;
  if (error || !table) return <p>Failed to load table.</p>;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Guests at “{table.name}” ({table.assignedCount}/{table.capacity})
      </h3>
      <ul className="space-y-2">
        {table.guests.map(g => (
          <li key={g.id} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
            <p className="font-medium">{g.guestName}</p>
            <p className="text-sm">Status: {g.status}</p>
            <p className="text-sm">Type: {g.guestType}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
