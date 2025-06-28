// TablesPage.tsx
import { useNavigate } from "react-router-dom";
import { useTablesApi, useDeleteTable } from "../../../api/hooks/useTablesApi";
import { Button } from "../../atoms/Button";

export default function TablesPage() {
  const navigate = useNavigate();
  const { data: tables = [], isLoading } = useTablesApi();
  const deleteTable = useDeleteTable();

  if (isLoading) return <p>Loading tables…</p>;

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl">Tables</h2>
        <Button onClick={() => navigate("new")}>+ New Table</Button>
      </div>
      <ul className="space-y-2">
        {tables.map((t : any) => (
          <li
            key={t.id}
            className="p-4 bg-white rounded shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{t.name}</h3>
              <p className="text-sm text-gray-600">
                Seats: {t.capacity} | Guests Assigned: {t.assignedCount}
              </p>
            </div>
            <div className="space-x-2">
              <Button onClick={() => navigate(`${t.id}`)}>View</Button>
              <Button onClick={() => deleteTable.mutate(t.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
