import { useTableApi } from "../../../api/hooks/useTablesApi";
import { PageLoader } from "../../atoms/PageLoader";
import { useParams } from "react-router-dom";

export function TablePrintView() {
  const { tableId } = useParams<{ tableId: string }>();
  const { data: table, isLoading, error } = useTableApi(tableId!);

  if (isLoading) return <PageLoader />;
  if (error || !table) return <p>Error loading print view.</p>;

  return (
    <div className="p-4 print:p-0">
      <h1 className="text-2xl font-semibold mb-4">
        Seating Plan: {table.name}
      </h1>
      <div className="grid grid-cols-4 gap-4">
        {table.guests.map(g => (
          <div
            key={g.id}
            className="border p-2 flex flex-col items-center print:border-gray-800"
          >
            {g.guestName}
          </div>
        ))}
      </div>
    </div>
  );
}
