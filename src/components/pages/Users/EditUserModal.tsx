import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "../../atoms/Spinner";
import { UserFormModal } from "../../molecules/UserFormModal";
import { useUserApi } from "../../../api/hooks/useUsersApi";

export default function EditUserModal() {
  const { id } = useParams<{ id: string }>();
  const nav   = useNavigate();
  const { data, isLoading, isError } = useUserApi(id!);

  if (isLoading) return <div className="p-6 flex justify-center"><Spinner /></div>;
  if (isError || !data) return <div className="p-6 text-red-500 text-center">Couldn’t load user.</div>;

  return (
    <UserFormModal
      isOpen
      initial={data}
      onClose={() => nav(-1)}
    />
  );
}
