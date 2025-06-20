import { useState } from "react";
import { useTablesApi, useDeleteTable } from "../../../api/hooks/useTablesApi";
import { TableFormModal } from "../../molecules/TableFormModal";
import { Button } from "../../atoms/Button";
import { useNavigate } from "react-router-dom";

export default function TablesPage() {
  const { data: tables, isLoading, isError } = useTablesApi();
  const deleteTable = useDeleteTable();
  const [modal, setModal] = useState<{
    open: boolean;
    table?: { id: string; name: string; capacity: number };
  }>({ open: false });
  const navigate = useNavigate();

  if (isLoading) return <p>Loading tables…</p>;
  if (isError) return <p>Failed to load tables.</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">Tables</h2>
        {/* <Button onClick={() => setModal({ open: true })}>New Table</Button> */}
        <Button onClick={() => navigate("new")}>+ New Table</Button>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(tables) &&
          tables.map((t: any) => (
            <li
              key={t.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-medium">{t.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Seats: {t.capacity}
                </p>
              </div>
              <div className="space-x-2">
                {/* <Button
                  variant="secondary"
                  onClick={() =>
                    setModal({
                      open: true,
                      table: { id: t.id, name: t.name, capacity: t.capacity },
                    })
                  }
                >
                  Edit
                </Button> */}
                <Button onClick={() => navigate(`${t.id}/edit`)}>Edit</Button>
                <Button
                  variant="secondary"
                  onClick={() => deleteTable.mutate(t.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
      </ul>

      <TableFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.table}
      />
    </>
  );
}
