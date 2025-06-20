// src/components/pages/Costing/CostingPage.tsx
import React, { useState } from "react";
import { useCostingApi, useDeleteCost } from "../../../api/hooks/useCostingApi";
import { CostFormModal } from "../../molecules/CostFormModal";
import { Button } from "../../atoms/Button";

export default function CostingPage() {
  const { data: costs, isLoading, isError } = useCostingApi();
  const deleteCost = useDeleteCost();
  const [modal, setModal] = useState<{
    open: boolean;
    cost?: { id: string; description: string; amount: number };
  }>({ open: false });

  if (isLoading) return <p>Loading costs…</p>;
  if (isError) return <p>Failed to load costs.</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">Costing</h2>
        <Button onClick={() => setModal({ open: true })}> New Cost</Button>
      </div>
      <ul className="space-y-2">
        {Array.isArray(costs) &&
          costs.map((c: any) => (
            <li
              key={c.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-medium">{c.description}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${c.amount.toFixed(2)}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setModal({
                      open: true,
                      cost: {
                        id: c.id,
                        description: c.description,
                        amount: c.amount,
                      },
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => deleteCost.mutate(c.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
      </ul>
      <CostFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.cost}
      />
    </>
  );
}
