import { useParams, useNavigate } from "react-router-dom";
import { CostFormModal } from "../../molecules/CostFormModal";
import { useCostApi } from "../../../api/hooks/useCostingApi";

export default function EditCostModal() {
  const { id } = useParams<{ id: string }>();
  const nav   = useNavigate();
  const { data, isLoading, isError } = useCostApi(id!);

  if (isLoading) return <div className="p-6 text-center">Loading…</div>;
  if (isError || !data) return <div className="p-6 text-red-500 text-center">Couldn’t load cost.</div>;

  return (
    <CostFormModal
      isOpen
      initial={data}
      onClose={() => nav(-1)}
    />
  );
}
