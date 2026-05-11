// src/components/pages/Events/EventDetail.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { useParams, Link } from "react-router-dom";
import { useEventApi } from "../../../api/hooks/useEventsApi";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { PencilIcon, TrashIcon } from "@heroicons/react/solid";
import { ImportRsvpsModal } from "../../molecules/ImportRsvpsModal";
import { RsvpExportButton } from "./RsvpExportButton";
import { useFormFields, useCreateFormField, useUpdateFormField, useDeleteFormField, type FormFieldConfig } from "../../../api/hooks/useFormFieldsApi";
import { formatEventDate, formatEventTime } from "../../../utils/eventUtils";
import { FieldBuilderModal } from "../../molecules/FieldBuilderModal";
import { useRsvpsApi } from "../../../api/hooks/useRsvpsApi";
import { useAuth } from "../../../api/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { ShareWithGuestsCard } from "../../molecules/ShareWithGuestsCard";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, isError } = useEventApi(id!);
const [impOpen, setImpOpen] = useState(false);

  const { data: fields, isLoading: formFieldsLoading } = useFormFields(id!);
  const { data: rsvps = [] } = useRsvpsApi(id!);
  const { user } = useAuth();
  const actor = user?.id ?? user?.name ?? "System";
  const qc = useQueryClient();
  const createField = useCreateFormField(id!);
  // const getUpdateField = (fieldId: string) => useUpdateFormField(id!, fieldId);
  const updateField = useUpdateFormField(id!);

  const deleteField = useDeleteFormField(id!);
  const [fb, setFb] = useState<{ open: boolean; field?: FormFieldConfig }>({ open: false });

  if (isLoading) return <PageLoader />;
  if (isError   ) return <p>Couldn’t load event.</p>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-semibold text-primary">{event?.title}</h2>
          {event?.slug && (
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${event.isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              RSVP {event.isExpired ? "Closed" : "Open"}
            </span>
          )}
        </div>
        <Link
          to="edit"
          className="px-4 py-2 bg-secondary text-white rounded shadow"
        >
          Edit Event
        </Link>
      </header>
      <div className="flex space-x-4 mb-6">
      <ImportRsvpsModal
        isOpen={impOpen}
        onClose={() => setImpOpen(false)}
        eventId={id!}
        eventTitle={event?.title ?? ""}
        formFields={fields ?? []}
        formFieldsLoading={formFieldsLoading}
        existingRsvps={rsvps}
        actor={actor}
        onImportComplete={() => qc.invalidateQueries({ queryKey: ["rsvps", id] })}
      />
      <Button onClick={() => setImpOpen(true)}>Import RSVPs</Button>
      <RsvpExportButton eventId={id!} />
    </div>
    
      <p className="text-gray-600 dark:text-gray-400">
        Date: {event ? formatEventDate(event.date) : "N/A"}
        {event?.time && ` · ${formatEventTime(event.date, event.time)} (GMT+8)`}
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
         {(fields as any[] | undefined)?.map((f: any) => (
           <li key={f.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded">
             <span>{f.label} <em className="text-sm text-gray-500">({f.type})</em></span>
             <div className="space-x-2">
               <button title="Edit" onClick={()=>setFb({open:true,field:f})} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-accent dark:border-white/10 dark:text-white dark:hover:bg-white/10 transition-colors"><PencilIcon className="h-4 w-4" /></button>
               <button title="Delete" onClick={()=>deleteField.mutate(f.id!)} className="p-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 dark:bg-accent dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"><TrashIcon className="h-4 w-4" /></button>
             </div>
           </li>
         ))}
       </ul>
       <FieldBuilderModal
         isOpen={fb.open}
         initial={fb.field}
         onClose={()=>setFb({open:false})}
         onSave={cfg => {
           if (cfg.id) updateField.mutate(cfg as FormFieldConfig & { id: string });
           else createField.mutate(cfg);
         }}
       />
     </section>

      <section className="mt-6">
        <ShareWithGuestsCard eventId={id!} />
      </section>
    </div>
  );
}
