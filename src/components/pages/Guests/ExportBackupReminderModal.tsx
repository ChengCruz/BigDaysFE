// src/components/pages/Guests/ExportBackupReminderModal.tsx
//
// The paper-backup prompt itself.
//
// Mounted only when the reminder is actually due (see ExportBackupReminder),
// so these five queries never fire for users outside the reminder window.
// React Query dedupes them against whatever the Guests page already cached.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DownloadIcon, PrinterIcon, WifiIcon } from "@heroicons/react/solid";
import toast from "react-hot-toast";

import { Modal } from "../../molecules/Modal";
import { Button } from "../../atoms/Button";
import { Dropdown, DropdownItem } from "../../atoms/Dropdown";

import { useGuestsApi } from "../../../api/hooks/useGuestsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useRsvpsApi } from "../../../api/hooks/useRsvpsApi";
import { useEventRsvpInternal } from "../../../api/hooks/useEventsApi";
import { useBudgetsApi } from "../../../api/hooks/useBudgetApi";
import { useTransactionsApi } from "../../../api/hooks/useTransactionApi";
import { CURRENCY_CONFIG } from "../../../types/budget";
import type { Currency } from "../../../types/budget";

import { buildGuestRows } from "../../../utils/guestExport";
import { buildRsvpRows } from "../../../utils/rsvpExport";
import { downloadCsv, downloadXlsx } from "../../../utils/exportUtils";
import { dismissForSession, snooze, type ReminderStage } from "../../../utils/exportReminder";

interface ExportBackupReminderModalProps {
  eventId: string;
  daysLeft: number;
  stage: ReminderStage;
  onClose: () => void;
}

export function ExportBackupReminderModal({
  eventId,
  daysLeft,
  stage,
  onClose,
}: ExportBackupReminderModalProps) {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const { data: guests = [], isLoading: guestsLoading } = useGuestsApi(eventId);
  const { data: tables = [] } = useTablesApi(eventId);
  const { data: rsvps = [], isLoading: rsvpsLoading } = useRsvpsApi(eventId);
  const { data: formFields = [] } = useEventRsvpInternal(eventId);
  const { data: budget } = useBudgetsApi(eventId);
  const { data: transactions = [] } = useTransactionsApi(budget?.walletGuid ?? "", eventId);

  const giftMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => (t.category as string) === "Gift")
      .forEach((t) => {
        if (t.referenceId) map.set(t.referenceId, t.amount);
      });
    return map;
  }, [transactions]);

  const currencySymbol = budget
    ? (CURRENCY_CONFIG[budget.currency as Currency]?.symbol ?? budget.currency)
    : "";

  const isFinal = stage === "final";
  const dayLabel = `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;

  const handleClose = () => {
    if (dontShowAgain) snooze(eventId);
    else dismissForSession(eventId);
    onClose();
  };

  const guestRows = () => buildGuestRows({ guests, tables, giftMap, currencySymbol });
  const rsvpRows = () => buildRsvpRows({ rsvps, guests, tables, formFields });

  const exportGuestsXlsx = async () => {
    await downloadXlsx(guestRows(), `guests-event-${eventId}.xlsx`, "Guests");
    toast.success("Guest list downloaded");
  };
  const exportGuestsCsv = () => {
    downloadCsv(guestRows(), `guests-event-${eventId}.csv`);
    toast.success("Guest list downloaded");
  };
  const exportRsvpsXlsx = async () => {
    await downloadXlsx(rsvpRows(), `rsvps-event-${eventId}.xlsx`, "RSVPs");
    toast.success("RSVPs downloaded");
  };
  const exportRsvpsCsv = () => {
    downloadCsv(rsvpRows(), `rsvps-event-${eventId}.csv`);
    toast.success("RSVPs downloaded");
  };

  const goToPrintSheet = () => {
    // Treat reaching the print view as acting on the reminder for this session.
    dismissForSession(eventId);
    onClose();
    navigate("/app/guests/print");
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      showCloseButton
      title={
        isFinal
          ? `Last reminder — ${dayLabel} to your big day`
          : `${dayLabel} to go — save an offline copy`
      }
      className="max-w-xl"
    >
      <div className="space-y-5">
        {/* The why. This is what actually makes someone act. */}
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/15">
          <WifiIcon className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
            <p>
              Venue Wi-Fi and mobile data often fail on the day. We've had couples reach their
              venue and find they couldn't log in to check anyone in.
            </p>
            <p className="font-medium">
              A printed guest list is the one backup that always works. It takes two minutes.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Dropdown's root is inline-block, so w-full has to go on the
              wrapper — putting it on the Button alone leaves it shrink-wrapped. */}
          <Dropdown
            className="w-full"
            trigger={
              <Button variant="secondary" className="w-full" disabled={guestsLoading}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                {guestsLoading ? "Loading guest list…" : `Export guest list (${guests.length})`}
              </Button>
            }
          >
            <DropdownItem onClick={exportGuestsXlsx}>Export as XLSX</DropdownItem>
            <DropdownItem onClick={exportGuestsCsv}>Export as CSV</DropdownItem>
          </Dropdown>

          <Dropdown
            className="w-full"
            trigger={
              <Button variant="secondary" className="w-full" disabled={rsvpsLoading}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                {rsvpsLoading ? "Loading RSVPs…" : `Export RSVPs (${rsvps.length})`}
              </Button>
            }
          >
            <DropdownItem onClick={exportRsvpsXlsx}>Export as XLSX</DropdownItem>
            <DropdownItem onClick={exportRsvpsCsv}>Export as CSV</DropdownItem>
          </Dropdown>

          <Button variant="primary" className="w-full" onClick={goToPrintSheet}>
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print check-in sheet
          </Button>
        </div>

        {isFinal && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is the last time we'll bring this up.
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            {isFinal ? "Don't show this again" : "Don't show this again for now"}
          </label>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
