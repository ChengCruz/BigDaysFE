import { useNavigate } from "react-router-dom";
import { CalendarIcon } from "@heroicons/react/outline";
import { Button } from "../atoms/Button";
import { useEventsApi } from "../../api/hooks/useEventsApi";

interface NoEventsStateProps {
  title?: string;
  message?: string;
  showButton?: boolean;
}

export function NoEventsState({
  title = "No Events Yet",
  message = "Create your first event to get started with planning your big day!",
  showButton = true,
}: NoEventsStateProps) {
  const navigate = useNavigate();
  const { data: events = [] } = useEventsApi();

  // Only show this component if there are no events
  const activeEvents = events.filter((ev) => !ev.raw?.isDeleted);
  if (activeEvents.length > 0) return null;

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 grid place-items-center">
          <CalendarIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>
        {showButton && (
          <Button
            onClick={() => navigate("/app/events?new=1")}
            className="inline-flex items-center gap-2"
          >
            <CalendarIcon className="h-5 w-5" />
            Create Your First Event
          </Button>
        )}
      </div>
    </div>
  );
}
