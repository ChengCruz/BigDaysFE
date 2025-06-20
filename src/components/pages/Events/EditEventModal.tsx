// src/components/pages/Tables/EditTableModal.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEventApi } from "../../../api/hooks/useEventsApi";
import { EventFormModal } from "../../molecules/EventFormModal";

export default function EditEventModal() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data, isLoading, isError } = useEventApi(id!);

  if (isLoading) return <div className="p-6 text-center">Loading…</div>;
  if (isError || !data)
    return (
      <div className="p-6 text-center text-red-500">Couldn’t load Event.</div>
    );

  return <EventFormModal isOpen initial={data} onClose={() => nav(-1)} />;
}
