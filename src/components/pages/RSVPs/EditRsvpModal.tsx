// src/components/pages/Tables/EditTableModal.tsx
import { useParams, useNavigate } from "react-router-dom";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import { useRsvpApi } from "../../../api/hooks/useRsvpsApi";

export default function EditRsvpModal() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data, isLoading, isError } = useRsvpApi(id!);

  if (isLoading) return <div className="p-6 text-center">Loading…</div>;
  if (isError || !data)
    return (
      <div className="p-6 text-center text-red-500">Couldn’t load Rsvp.</div>
    );

  return <RsvpFormModal isOpen initial={data} onClose={() => nav(-1)} />;
}
