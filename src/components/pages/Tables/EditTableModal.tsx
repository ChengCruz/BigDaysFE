// src/components/pages/Tables/EditTableModal.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useTableApi } from "../../../api/hooks/useTablesApi";
import { TableFormModal } from "../../molecules/TableFormModal";

export default function EditTableModal() {
  const { tableId } = useParams<{ tableId: string }>();
  const nav = useNavigate();
  const { data, isLoading, isError } = useTableApi(tableId!);

  if (isLoading) return <div className="p-6 text-center">Loading…</div>;
  if (isError || !data)
    return (
      <div className="p-6 text-center text-red-500">Couldn’t load table.</div>
    );

  // `data` should have shape { id, name, capacity }
  return <TableFormModal isOpen initial={data} onClose={() => nav(-1)} />;
}
