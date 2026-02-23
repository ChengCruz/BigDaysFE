import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "../../atoms/Spinner";
import { SeatingFormModal } from "../../molecules/SeatingFormModal";
import { useSeatApi } from "../../../api/hooks/useSeatingApi";

export default function EditSeatingModal() {
  const { id } = useParams<{ id: string }>();
  const nav   = useNavigate();
  const { data, isLoading, isError } = useSeatApi(id!);

  if (isLoading) return <div className="p-6 flex justify-center"><Spinner /></div>;
  if (isError || !data) return <div className="p-6 text-red-500 text-center">Couldn’t load seating.</div>;

  return (
    <SeatingFormModal
      isOpen
      initial={data}
      onClose={() => nav(-1)}
    />
  );
}
