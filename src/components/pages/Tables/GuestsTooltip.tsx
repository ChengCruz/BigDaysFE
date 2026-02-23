// src/components/pages/Tables/GuestsTooltip.tsx
import { Spinner } from "../../atoms/Spinner";
import { useTableApi } from "../../../api/hooks/useTablesApi";

interface GuestsTooltipProps {
  tableId: string;
}

export function GuestsTooltip({ tableId }: GuestsTooltipProps) {
  const { data: table, isLoading, error } = useTableApi(tableId);

  if (isLoading) return <div className="p-2 flex justify-center"><Spinner /></div>;
  if (error)
    return <div className="p-2 text-sm text-red-600">Error loading guests</div>;

  const guests = table?.guests ?? [];
  if (guests.length === 0) {
    return <div className="p-2 text-sm italic">No one assigned</div>;
  }

  return (
    <div className="p-2 text-sm">
      {guests.map((g: any) => (
        <div key={g.id} className="truncate">
          • {g.guestName}
        </div>
      ))}
    </div>
  );
}
