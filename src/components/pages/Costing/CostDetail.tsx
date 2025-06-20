// src/components/pages/Costing/CostDetail.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCostApi } from "../../../api/hooks/useCostingApi";
import { Button } from "../../atoms/Button";

export default function CostDetail() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const { data: c, isLoading, isError } = useCostApi(id!);

  if (isLoading) return <p>Loading cost…</p>;
  if (isError || !c) return <p>Couldn’t load cost.</p>;

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">{c.description}</h2>
        <Button variant="secondary" onClick={() => nav("edit")}>
          Edit
        </Button>
      </header>
      <p className="text-gray-600 dark:text-gray-400">
        Amount: ${c.amount.toFixed(2)}
      </p>
      <Link to="/app/costing" className="text-sm text-gray-500 hover:underline">
        ← Back to list
      </Link>
    </div>
  );
}
