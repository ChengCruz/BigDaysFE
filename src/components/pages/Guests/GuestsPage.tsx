// src/components/pages/Guests/GuestsPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { useState, useMemo } from "react";
import { UserGroupIcon, UserIcon, CheckCircleIcon } from "@heroicons/react/solid";
import { useAuth } from "../../../api/hooks/useAuth";
import {
  useGuestsApi,
  useAssignGuestToTable,
  useUnassignGuestFromTable,
  type Guest,
} from "../../../api/hooks/useGuestsApi";
import { useTablesApi } from "../../../api/hooks/useTablesApi";
import { useQrListApi, useGenerateQrApi, useRevokeQrApi } from "../../../api/hooks/useQrApi";
import { Button } from "../../atoms/Button";
import { StatsCard } from "../../atoms/StatsCard";
import { useEventContext } from "../../../context/EventContext";
import toast from "react-hot-toast";
import { GuestFormModal } from "./GuestFormModal";
import { NoEventsState } from "../../molecules/NoEventsState";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { Modal } from "../../molecules/Modal";
import QrStatusBadge from "../../molecules/QrStatusBadge";
import QrImageModal from "../../molecules/QrImageModal";
import type { QrToken, QrStatus } from "../../../types/qr";

export default function GuestsPage() {
  // ─── All hooks first (React Rules of Hooks) ─────────────────────────────────────────
  const { userRole } = useAuth();
  const isReadOnly = userRole === 6;
  const { eventId, eventsLoading } = useEventContext()!;
  const { data: guests = [], isLoading: guestsLoading, isError: guestsError } = useGuestsApi(eventId!);
  const { data: tables = [], isLoading: tablesLoading } = useTablesApi(eventId!);
  const assignGuestToTable = useAssignGuestToTable(eventId!);
  const unassignGuestFromTable = useUnassignGuestFromTable(eventId!);
  const { data: qrTokens = [] } = useQrListApi(eventId!);
  const generateQr = useGenerateQrApi();
  const revokeQr = useRevokeQrApi();

  const [bannerDismissed, setBannerDismissed] = useState(() => sessionStorage.getItem("guestBannerDismissed") === "1");
  const [guestTypeFilter, setGuestTypeFilter] = useState<string>("All");
  const [assignFilter, setAssignFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modal, setModal] = useState<{ open: boolean; guest?: Guest }>({
    open: false,
  });
  const [assignModal, setAssignModal] = useState<{ open: boolean; guest?: Guest }>({
    open: false,
  });
  const [unassignConfirm, setUnassignConfirm] = useState<Guest | null>(null);
  const [qrModal, setQrModal] = useState<{ open: boolean; guest?: Guest; token?: string }>({ open: false });
  const [revokeConfirm, setRevokeConfirm] = useState<{ guest: Guest; token: string } | null>(null);
  // Calculate statistics
  const stats = useMemo(() => {
    const total = guests.length;
    const assigned = guests.filter(g => g.tableId).length;
    const unassigned = guests.filter(g => !g.tableId).length;

    return { total, assigned, unassigned };
  }, [guests]);

  // Create table lookup map
  const tableMap = useMemo(() => {
    const map = new Map<string, string>();
    tables.forEach(table => {
      map.set(table.id, table.name);
    });
    return map;
  }, [tables]);

  // Compute assigned pax count per table from guests list
  const tableOccupancy = useMemo(() => {
    const map = new Map<string, number>();
    guests.forEach(g => {
      if (g.tableId) {
        map.set(g.tableId, (map.get(g.tableId) ?? 0) + (g.pax || g.noOfPax || 1));
      }
    });
    return map;
  }, [guests]);

  // QR token lookup map keyed by guestId
  const qrMap = useMemo(() => {
    const map = new Map<string, QrToken>();
    qrTokens.forEach(t => map.set(t.guestId, t));
    return map;
  }, [qrTokens]);

  function getQrStatus(token: QrToken | undefined): QrStatus {
    if (!token) return "None";
    if (token.checkedInAt) return "CheckedIn";
    if (token.isRevoked) return "Revoked";
    return "Generated";
  }

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const okType = guestTypeFilter === "All" || g.guestType === guestTypeFilter;
      const okAssign =
        assignFilter === "all" ||
        (assignFilter === "assigned" && !!g.tableId) ||
        (assignFilter === "unassigned" && !g.tableId);
      const okSearch = (g.guestName ?? g.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      return okType && okAssign && okSearch;
    });
  }, [guests, guestTypeFilter, assignFilter, searchTerm]);

  // ─── Early returns after hooks ─────────────────────────────────────────

  if (eventsLoading) return <PageLoader message="Loading..." />;
  if (!eventId) return <NoEventsState title="No Events for Guest Management" message="Create your first event to start adding and managing your guest list." />;

  if (guestsLoading || tablesLoading) return <PageLoader message="Loading guests..." />;
  if (guestsError) return <ErrorState message="Failed to load guests." onRetry={() => window.location.reload()} />;

  const handleGenerateQr = () => {
    generateQr.mutate(eventId!, {
      onSuccess: (result) => {
        toast.success(`Generated ${result.generated} QR code${result.generated !== 1 ? "s" : ""}. ${result.skipped} skipped.`);
      },
      onError: () => {
        toast.error("Failed to generate QR codes");
      },
    });
  };

  const confirmRevoke = () => {
    if (!revokeConfirm) return;
    revokeQr.mutate({ token: revokeConfirm.token, eventId: eventId! }, {
      onSuccess: () => {
        toast.success(`QR code revoked for ${revokeConfirm.guest.guestName || revokeConfirm.guest.name}`);
        setRevokeConfirm(null);
      },
      onError: () => {
        toast.error("Failed to revoke QR code");
      },
    });
  };

  // Note: Guest deletion is not available in this module.
  // Guests can only be deleted through the RSVP module, as they are managed as part of RSVP records.

  // Handle assign table
  const handleAssignTable = (guest: Guest, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    const currentOccupancy = tableOccupancy.get(tableId) ?? 0;
    const guestPax = guest.pax || guest.noOfPax || 1;
    const willExceed = table && (currentOccupancy + guestPax) > table.capacity;

    assignGuestToTable.mutate({
      guestId: guest.guestId ?? guest.id,
      tableId: tableId,
    }, {
      onSuccess: () => {
        if (willExceed && table) {
          toast(`⚠️ ${table.name} is over capacity (${currentOccupancy + guestPax}/${table.capacity}). Guest assigned anyway.`, {
            duration: 4000,
            style: { background: "#fef3c7", color: "#92400e" },
          });
        } else {
          toast.success(`${guest.guestName || guest.name} assigned to table successfully`);
        }
        setAssignModal({ open: false });
      },
      onError: () => {
        toast.error("Failed to assign guest to table");
      },
    });
  };

  // Handle unassign table
  const handleUnassignTable = (guest: Guest) => {
    setUnassignConfirm(guest);
  };

  const confirmUnassignTable = () => {
    if (!unassignConfirm) return;
    unassignGuestFromTable.mutate(unassignConfirm.guestId ?? unassignConfirm.id, {
      onSuccess: () => {
        toast.success(`${unassignConfirm.guestName || unassignConfirm.name} unassigned from table successfully`);
        setUnassignConfirm(null);
      },
      onError: () => {
        toast.error("Failed to unassign guest from table");
      },
    });
  };

  return (
    <>
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Guests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and organize your guest list</p>
        </div>
        <div className="flex gap-2">
          {!isReadOnly && (
            <Button
              variant="secondary"
              onClick={handleGenerateQr}
              disabled={generateQr.isPending}
            >
              {generateQr.isPending ? "Generating..." : "Generate QR"}
            </Button>
          )}
        </div>
      </div>

      {/* Note Banner */}
      {!bannerDismissed && (
        <div className="flex items-start gap-3 px-4 py-3 mb-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <span className="flex-1">
            <span className="font-medium">Note:</span> Guests are automatically created when RSVP submissions include attendees (pax &gt; 0). Guest deletion is only available through the RSVP module.
          </span>
          <button
            onClick={() => { setBannerDismissed(true); sessionStorage.setItem("guestBannerDismissed", "1"); }}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition text-base leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatsCard label="Total Guests" value={stats.total} variant="primary" size="sm" icon={<UserGroupIcon className="w-4 h-4" />} />
        <StatsCard label="Assigned" value={stats.assigned} variant="success" size="sm" icon={<CheckCircleIcon className="w-4 h-4" />} />
        <StatsCard label="Unassigned" value={stats.unassigned} variant="warning" size="sm" icon={<UserIcon className="w-4 h-4" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
        <select
          value={guestTypeFilter}
          onChange={(e) => setGuestTypeFilter(e.target.value)}
          className="w-full md:w-1/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {["All", "Family", "VIP", "Friend", "Other"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={assignFilter}
          onChange={(e) => setAssignFilter(e.target.value as "all" | "assigned" | "unassigned")}
          className="w-full md:w-1/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Seating</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <input
          type="text"
          placeholder="Search guests by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:flex-1 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Empty State */}
      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || guestTypeFilter !== "All" || assignFilter !== "all"
              ? "No guests match your filters"
              : "No guests yet. Create your first guest!"}
          </p>
        </div>
      )}

      {/* Guest Cards Grid */}
      {filteredGuests.length > 0 && (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredGuests.map((guest) => {
            const isAssigned = !!guest.tableId;
            return (
              <li
                key={guest.id}
                className={`relative p-4 rounded-lg shadow flex flex-col justify-between transition-all ${
                  isAssigned
                    ? "bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800"
                    : "bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800"
                }`}
              >
                {/* Assignment Status Badge - Top Right */}
                <span
                  className={`absolute top-2 right-2 px-3 py-1 text-xs font-bold rounded-full ${
                    isAssigned
                      ? "bg-green-600 text-white"
                      : "bg-orange-600 text-white"
                  }`}
                >
                  {isAssigned ? "ASSIGNED" : "UNASSIGNED"}
                </span>

                <div className="space-y-2 mt-6">
                  {/* Guest Name */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {guest.guestName}
                  </h3>

                  {/* Phone Number */}
                  {guest.phoneNo && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone: {guest.phoneNo.startsWith("+") ? guest.phoneNo : "+" + guest.phoneNo}
                    </p>
                  )}

                  {/* Number of Attendees (Pax) */}
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {guest.pax || guest.noOfPax || 1} {((guest.pax || guest.noOfPax || 1) === 1) ? 'person' : 'people'}
                      {(guest.pax || guest.noOfPax || 1) > 1 }
                    </p>
                  </div>

                  {/* Guest Type Badge */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium border-2 ${
                        guest.guestType === "Family"
                          ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                          : guest.guestType === "VIP"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : guest.guestType === "Friend"
                          ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                          : "border-gray-400 text-gray-600 dark:border-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {guest.guestType || "Other"}
                    </span>
                  </div>

                  {/* QR Status Badge */}
                  <div>
                    <QrStatusBadge status={getQrStatus(qrMap.get(guest.guestId ?? guest.id))} />
                  </div>

                  {/* Table Assignment Display */}
                  <div className={`mt-3 p-3 rounded-lg ${
                    isAssigned
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-orange-100 dark:bg-orange-900/30"
                  }`}>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Table Seating:
                    </p>
                    {guest.tableId ? (
                      <p className="text-sm font-bold text-green-800 dark:text-green-300">
                        {tableMap.get(guest.tableId) || "Unknown Table"}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                        No table assigned
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons — hidden for Staff (read-only) */}
                {!isReadOnly && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setModal({ open: true, guest })}
                    >
                      Edit
                    </Button>
                    {guest.tableId ? (
                      <button
                        onClick={() => handleUnassignTable(guest)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                      >
                        Unassign
                      </button>
                    ) : (
                      <button
                        onClick={() => setAssignModal({ open: true, guest })}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Assign Table
                      </button>
                    )}
                    {(() => {
                      const qrToken = qrMap.get(guest.guestId ?? guest.id);
                      const qrStatus = getQrStatus(qrToken);
                      return (
                        <>
                          {(qrStatus === "Generated" || qrStatus === "CheckedIn") && (
                            <button
                              onClick={() => setQrModal({ open: true, guest, token: qrToken!.token })}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
                            >
                              View QR
                            </button>
                          )}
                          {qrStatus === "Generated" && (
                            <button
                              onClick={() => setRevokeConfirm({ guest, token: qrToken!.token })}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* QR Image Modal */}
      <QrImageModal
        isOpen={qrModal.open}
        guestName={qrModal.guest?.guestName ?? qrModal.guest?.name ?? ""}
        token={qrModal.token ?? ""}
        onClose={() => setQrModal({ open: false })}
      />

      {/* Revoke QR Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!revokeConfirm}
        isDeleting={revokeQr.isPending}
        title="Revoke QR Code"
        description="This will invalidate the guest's QR code. They will no longer be able to check in with it."
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeConfirm(null)}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Revoke QR code for <strong>{revokeConfirm?.guest.guestName || revokeConfirm?.guest.name}</strong>?
        </p>
      </DeleteConfirmationModal>

      {/* Unassign Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!unassignConfirm}
        isDeleting={unassignGuestFromTable.isPending}
        title="Unassign Guest from Table"
        description="This will remove the guest from their assigned table."
        onConfirm={confirmUnassignTable}
        onCancel={() => setUnassignConfirm(null)}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Remove <strong>{unassignConfirm?.guestName || unassignConfirm?.name}</strong> from{" "}
          <strong>{tableMap.get(unassignConfirm?.tableId || "")}</strong>?
        </p>
      </DeleteConfirmationModal>

      {/* Guest Form Modal */}
      <GuestFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        guest={modal.guest}
        eventId={eventId!}
      />

      {/* Table Assignment Modal */}
      <Modal
        isOpen={assignModal.open && !!assignModal.guest}
        title={`Assign ${assignModal.guest?.guestName ?? ""} to Table`}
        onClose={() => setAssignModal({ open: false })}
        className="max-w-md"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tables.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No tables available. Please create tables first.
            </p>
          ) : (
            tables.map((table) => {
              const occupied = tableOccupancy.get(table.id) ?? 0;
              const isFull = occupied >= table.capacity;
              const isOver = occupied > table.capacity;
              return (
                <button
                  key={table.id}
                  onClick={() => handleAssignTable(assignModal.guest!, table.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    isOver
                      ? "border-red-400 dark:border-red-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : isFull
                      ? "border-orange-300 dark:border-orange-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white">{table.name}</p>
                    {isOver && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Over capacity</span>
                    )}
                    {isFull && !isOver && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">Full</span>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${isOver ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                    {occupied} / {table.capacity} seats filled
                  </p>
                </button>
              );
            })
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setAssignModal({ open: false })}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
