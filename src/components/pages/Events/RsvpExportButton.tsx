import { useExportRsvps } from "../../../api/hooks/useExportRsvps";
import { saveAs } from "file-saver"; // install file-saver
import { Button } from "../../atoms/Button";

export function RsvpExportButton({ eventId }: { eventId: string }) {
  const { mutateAsync, isPending } = useExportRsvps(eventId);

  const handleExport = async () => {
    const blob = await mutateAsync();
    saveAs(blob, `rsvps-event-${eventId}.xlsx`);
  };

  return (
    <Button onClick={handleExport} loading={isPending} variant="secondary">
      {isPending ? "Exporting…" : "Export RSVPs"}
    </Button>
  );
}
