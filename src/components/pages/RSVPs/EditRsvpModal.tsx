// src/components/pages/Rsvps/EditRsvpModal.tsx
import { useNavigate, useParams } from "react-router-dom";
import {
  useRsvpApi,
  useUpdateRsvp,
  type CreateRsvpInput,
} from "../../../api/hooks/useRsvpsApi";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import { useEventContext } from "../../../context/EventContext";

export function EditRsvpModal() {
  const nav = useNavigate();
  const { eventId } = useEventContext();
  const { id } = useParams<{ id: string }>();
  const { data: initial, isLoading } = useRsvpApi(eventId!, id!);
  const update = useUpdateRsvp(eventId!);

  if (isLoading) return null;

  const handleSave = (data: CreateRsvpInput, _id?: string) => {
    // _id will always be defined here
    const guid = _id!;
    update.mutate(
      { rsvpGuid: guid, ...data },
      {
        onSuccess: () => nav(-1),
      }
    );
  };

  return (
    <RsvpFormModal
      isOpen={true}
      onClose={() => nav(-1)}
      eventId={eventId!}
      initial={initial}
      onSave={handleSave}
    />
  );
}
