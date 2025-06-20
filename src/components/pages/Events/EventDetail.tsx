// src/components/pages/Events/EventDetail.tsx
import { useParams, Link } from "react-router-dom";
import { useEventApi } from "../../../api/hooks/useEventsApi";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { ImportRsvpsModal } from "../../molecules/ImportRsvpsModal";
import { RsvpExportButton } from "./RsvpExportButton";
import { useFormFields, useCreateFormField, useUpdateFormField, useDeleteFormField, type FormFieldConfig } from "../../../api/hooks/useFormFieldsApi";
import { FieldBuilderModal } from "../../molecules/FieldBuilderModal";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, isError } = useEventApi(id!);
const [impOpen, setImpOpen] = useState(false);

  const { data: fields } = useFormFields(id!);
  const createField = useCreateFormField(id!);
  // const getUpdateField = (fieldId: string) => useUpdateFormField(id!, fieldId);
  const updateField = useUpdateFormField(id!);

  const deleteField = useDeleteFormField(id!);
  const [fb, setFb] = useState<{ open: boolean; field?: FormFieldConfig }>({ open: false });

  if (isLoading) return <p>Loading event…</p>;
  if (isError   ) return <p>Couldn’t load event.</p>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-primary">{event?.title}</h2>
        <Link
          to="edit"
          className="px-4 py-2 bg-secondary text-white rounded shadow"
        >
          Edit Event
        </Link>
      </header>
      <div className="flex space-x-4 mb-6">
      <ImportRsvpsModal isOpen={impOpen} onClose={() => setImpOpen(false)} eventId={id!} />
      <Button onClick={() => setImpOpen(true)}>Import RSVPs</Button>
      <RsvpExportButton eventId={id!} />
    </div>
    
      <p className="text-gray-600 dark:text-gray-400">
        Date: {event ? new Date(event.date).toLocaleDateString() : "N/A"}
      </p>

      {/* You could embed sub‐lists here, e.g. RSVPs for this event */}
      <section>
        <h3 className="text-2xl font-medium mb-4">RSVPs</h3>
        <Link
          to={`/app/rsvps?eventId=${id}`}
          className="text-secondary hover:underline"
        >
          View RSVPs for this event
        </Link>
      </section>

           <section className="mt-12">
       <h3 className="text-xl font-semibold text-primary mb-4">Customize RSVP Form</h3>
       <Button onClick={()=>setFb({open:true})}> Add Field</Button>
       <ul className="mt-4 space-y-2">
         {fields?.map(f => (
           <li key={f.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded">
             <span>{f.label} <em className="text-sm text-gray-500">({f.type})</em></span>
             <div className="space-x-2">
               <Button variant="secondary" onClick={()=>setFb({open:true,field:f})}>Edit</Button>
               <Button variant="secondary" onClick={()=>deleteField.mutate(f.id!)}>Delete</Button>
             </div>
           </li>
         ))}
       </ul>
       <FieldBuilderModal
         isOpen={fb.open}
         initial={fb.field}
         onClose={()=>setFb({open:false})}
         onSave={cfg => {
           if (cfg.id) updateField.mutate(cfg);
           else createField.mutate(cfg);
         }}
       />
     </section>
    </div>
  );
}
