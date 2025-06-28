// src/components/pages/Tables/TablesPage.tsx
import { useNavigate } from "react-router-dom";
import {
  useTablesApi,
  useDeleteTable,
  useTableApi,
} from "../../../api/hooks/useTablesApi";
import { Button } from "../../atoms/Button";
import { ViewListIcon, ViewGridIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { GuestsTooltip } from "./GuestsTooltip";

export default function TablesPage() {
  const navigate = useNavigate();
  const { data: tables = [], isLoading, isError } = useTablesApi();
  const deleteTable = useDeleteTable();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  if (isLoading) return <p>Loading tables…</p>;
  if (isError) return <p>Failed to load tables.</p>;

  const guestByTable = (tableId: string) => {
    const { data: guestTable } = useTableApi(tableId);
    const guests = guestTable?.guests ?? [];
    return guests;
  };

  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* header + new‐table button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Tables</h2>
        <Button onClick={() => navigate("new")}>+ New Table</Button>
      </div>

      {/* search + view toggle */}
      <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search Tables"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:flex-1 border rounded p-2"
        />
        <div className="flex space-x-2 md:ml-auto">
          <Button
            variant={viewMode === "list" ? "primary" : "secondary"}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <ViewListIcon className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "primary" : "secondary"}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <ViewGridIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* <-- THIS DIV will scroll if content is too tall --> */}
      <div className="flex-1 overflow-auto">
        {viewMode === "grid" ? (
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t: any) => (
              <li
                key={t.id}
                className="group relative p-4 bg-white rounded shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`${t.id}`)}
                title={
                  t.guests?.length
                    ? t.guests.map((g: any) => g.name).join(", ")
                    : "No guests assigned"
                }
              >
                <h3 className="text-lg font-medium">{t.name}</h3>
                <p className="text-sm text-gray-600">
                  Seats: {t.capacity} | Assigned: {t.assignedCount}
                </p>

                {/* hover popup */}
                <div
                  className="absolute left-0 right-0 top-full mt-1 hidden
                          group-hover:block bg-white border rounded shadow z-50"
                >
                  <strong className="block px-2 pt-2 text-sm font-semibold">
                    Guests:
                  </strong>
                  <GuestsTooltip tableId={t.id} />
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${t.id}`);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTable.mutate(t.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t: any) => (
              <li
                key={t.id}
                className="group relative flex justify-between items-center p-4 bg-white rounded shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`${t.id}`)}
                title={
                  t.guests?.length
                    ? t.guests.map((g: any) => g.name).join(", ")
                    : "No guests assigned"
                }
              >
                <div>
                  <h3 className="text-lg font-medium">{t.name}</h3>
                  <p className="text-sm text-gray-600">
                    Seats: {t.capacity} | Assigned: {t.assignedCount}
                  </p>
                </div>

                {/* hover popup */}
                <div
                  className="absolute left-0 right-0 top-full mt-1 hidden
                         group-hover:block bg-white border rounded shadow z-50"
                >
                  <strong className="block px-2 pt-1 text-sm font-semibold">
                    Guests:
                  </strong>
                  <GuestsTooltip tableId={t.id} />
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${t.id}`);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTable.mutate(t.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
