import { useState } from "react";
import { useRsvpsApi, useDeleteRsvp } from "../../../api/hooks/useRsvpsApi";
import { RsvpFormModal } from "../../molecules/RsvpFormModal";
import { Button } from "../../atoms/Button";
import { useNavigate } from "react-router-dom";

export default function RsvpsPage() {
  const { data: rsvps, isLoading, isError } = useRsvpsApi();
  const deleteRsvp = useDeleteRsvp();
  const [modal, setModal] = useState<{
    open: boolean;
    rsvp?: { id: string; guestName: string; status: string };
  }>({ open: false });
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>("All");

const list = Array.isArray(rsvps) ? rsvps : [];
const filtered = list.filter(r => filterType === "All" || r.guestType === filterType);

  if (isLoading) return <p>Loading RSVPs…</p>;
  if (isError) return <p>Failed to load RSVPs.</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">RSVPs</h2>
        {/* <Button onClick={() => setModal({ open: true })}>New RSVP</Button> */}
        <Button onClick={() => navigate("new")}>+ New RSVP</Button>
      </div>
    <select
      value={filterType}
      onChange={e => setFilterType(e.target.value)}
      className="w-100 border rounded p-2"
    >
      {["All","Family","VIP","Friend","Other"].map(t => <option key={t}>{t}</option>)}
    </select>
      <ul className="space-y-2">
        {Array.isArray(filtered) &&
          filtered.map((r: any) => (
            <li
              key={r.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-medium">{r.guestName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {r.status}
                </p>
                <span className="inline-block px-2 py-0.5 bg-accent text-white rounded">
                  {r.guestType}
                </span>
              </div>
              <div className="space-x-2">
                {/* <Button
                variant="secondary"
                onClick={() =>
                  setModal({
                    open: true,
                    rsvp: {
                      id: r.id,
                      guestName: r.guestName,
                      status: r.status,
                    },
                  })
                }
              >
                Edit
              </Button> */}
                <Button
                  variant="secondary"
                  onClick={() => navigate(`${r.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => deleteRsvp.mutate(r.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
      </ul>

      <RsvpFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.rsvp}
      />
    </>
  );
}
