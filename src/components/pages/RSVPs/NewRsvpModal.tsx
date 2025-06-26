// src/components/pages/Rsvps/NewRsvpModal.tsx
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateRsvp,
  type CreateRsvpInput,
} from "../../../api/hooks/useRsvpsApi";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import { useEventContext } from "../../../context/EventContext";

export function NewRsvpModal() {
  const nav = useNavigate();
  const { eventId } = useEventContext();
  console.log("NewRsvpModal eventId:", eventId);
  //   const { eventId } = useParams<{ eventId: string }>();
  const create = useCreateRsvp(eventId!);

  const handleSave = (data: CreateRsvpInput) => {
    create.mutate(data, {
      onSuccess: () => {
        nav(-1); // close modal
      },
    });
  };

  return (
    <RsvpFormModal
      isOpen={true}
      onClose={() => nav(-1)}
      eventId={eventId!}
      onSave={handleSave}
    />
  );
}
