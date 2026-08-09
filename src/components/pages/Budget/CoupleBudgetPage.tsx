// src/components/pages/Budget/CoupleBudgetPage.tsx
//
// Couple-mode money. Same budget and transactions as BudgetPage; what changes
// is which facts are surfaced.
//
// The transaction record already carries `vendorName`, `paymentStatus` and
// `dueDate` (parsed out of the remarks JSON by parseTransaction), but planner
// mode buries them in table columns. A couple's actual questions are "what do
// we still owe" and "is anything late", so those come first here.
//
// Money is split into three inner tabs held in local state; /app/budget is a
// single route and stays that way.

import { useMemo, useState } from "react";
import { useContext } from "react";
import {
  ExclamationIcon,
  GiftIcon,
  ReceiptTaxIcon,
} from "@heroicons/react/solid";

import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { Button } from "../../atoms/Button";
import { StatsCard } from "../../atoms/StatsCard";
import { NoEventsState } from "../../molecules/NoEventsState";
import { SetupBudgetModal } from "./SetupBudgetModal";
import { TransactionFormModal } from "./TransactionFormModal";

import { useEventContext } from "../../../context/EventContext";
import { AuthContext } from "../../../context/AuthProvider";
import { useBudgetsApi } from "../../../api/hooks/useBudgetApi";
import { useTransactionsApi } from "../../../api/hooks/useTransactionApi";
import { CURRENCY_CONFIG, type Currency } from "../../../types/budget";
import {
  TransactionType,
  PaymentStatus,
  type Transaction,
  type TransactionCategory,
} from "../../../types/transaction";
import { getCategoryConfig } from "../../../utils/categoryConfig";
import { formatAmount } from "../../../utils/transactionUtils";

type Tab = "budget" | "payments" | "gifts";

const TABS: { key: Tab; label: string }[] = [
  { key: "budget", label: "Budget" },
  { key: "payments", label: "Payments" },
  { key: "gifts", label: "Gifts" },
];

function fmtDue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CoupleBudgetPage() {
  const { eventId, eventsLoading } = useEventContext()!;
  const { user } = useContext(AuthContext);

  const { data: budget, isLoading: budgetLoading, isError: budgetError } = useBudgetsApi(
    eventId ?? ""
  );
  const { data: transactions = [] } = useTransactionsApi(budget?.walletGuid ?? "", eventId ?? "");

  const [tab, setTab] = useState<Tab>("budget");
  const [setupOpen, setSetupOpen] = useState(false);
  const [txnModal, setTxnModal] = useState<{ open: boolean; transaction?: Transaction }>({
    open: false,
  });

  const symbol = budget ? CURRENCY_CONFIG[budget.currency as Currency]?.symbol ?? budget.currency : "RM";
  const money = (n: number) => formatAmount(n, symbol);

  const split = useMemo(() => {
    const debits = transactions.filter((t) => t.type === TransactionType.Debit);
    const paid = debits.filter((t) => t.paymentStatus !== PaymentStatus.Pending && t.paymentStatus !== PaymentStatus.Overdue);
    const owed = debits.filter(
      (t) => t.paymentStatus === PaymentStatus.Pending || t.paymentStatus === PaymentStatus.Overdue
    );
    const late = debits.filter((t) => t.paymentStatus === PaymentStatus.Overdue);
    const gifts = transactions.filter(
      (t) => t.type === TransactionType.Credit || (t.category as string) === "Gifts"
    );
    const sum = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);
    return {
      paid,
      owed,
      late,
      gifts,
      paidTotal: sum(paid),
      owedTotal: sum(owed),
      giftTotal: sum(gifts),
    };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = new Map<TransactionCategory, number>();
    transactions
      .filter((t) => t.type === TransactionType.Debit)
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  // ─── Guards ─────────────────────────────────────────────────────────────────

  if (eventsLoading) return <PageLoader message="Loading…" />;
  if (!eventId)
    return (
      <NoEventsState
        title="No wedding yet"
        message="Create your wedding first, then you can start tracking what you spend."
      />
    );
  if (budgetLoading) return <PageLoader message="Loading your budget…" />;
  if (budgetError)
    return (
      <ErrorState message="We couldn’t load your budget." onRetry={() => window.location.reload()} />
    );

  // No budget yet: a warmer first run than the planner setup prompt.
  if (!budget) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold text-text">
            Where the money’s going
          </h1>
          <p className="text-sm text-text/60">Let’s start with what you’re working with.</p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/10 bg-white px-6 py-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sect-money/12">
            <ReceiptTaxIcon className="h-8 w-8 text-sect-money" />
          </span>
          <p className="text-lg font-semibold text-text">Set your budget</p>
          <p className="max-w-[36ch] text-sm text-text/55">
            Put in a number you’re comfortable with. You can change it any time, since nothing here is
            locked in.
          </p>
          <Button variant="primary" onClick={() => setSetupOpen(true)}>
            Set our budget
          </Button>
        </div>
        <SetupBudgetModal
          isOpen={setupOpen}
          onClose={() => setSetupOpen(false)}
          eventGuid={eventId}
          userId={user?.id ?? ""}
        />
      </div>
    );
  }

  const total = budget.totalBudget ?? 0;
  const pct = total > 0 ? Math.round((split.paidTotal / total) * 100) : 0;
  const left = total - split.paidTotal - split.owedTotal;

  const paymentRow = (t: Transaction) => {
    const cfg = getCategoryConfig(t.category);
    const late = t.paymentStatus === PaymentStatus.Overdue;
    const pending = t.paymentStatus === PaymentStatus.Pending;
    return (
      <li
        key={t.transactionGuid}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
      >
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-accent/70 text-base">
          {cfg.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-text">
            {t.transactionName}
          </span>
          <span className="block truncate text-[12.5px] text-text/55">
            {t.vendorName ? `${t.vendorName} · ` : ""}
            {cfg.label}
          </span>
        </span>
        <span className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className="text-[14px] font-bold tabular-nums text-text">{money(t.amount)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              late
                ? "bg-red-100 text-red-700"
                : pending
                  ? "bg-amber-100 text-amber-700"
                  : "bg-sect-guests/15 text-sect-guests"
            }`}
          >
            {late
              ? `Was due ${fmtDue(t.dueDate)}`
              : pending
                ? t.dueDate
                  ? `Due ${fmtDue(t.dueDate)}`
                  : "Not paid yet"
                : "Paid"}
          </span>
        </span>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-text">Where the money’s going</h1>
        <p className="text-sm text-text/60">{money(total)} set aside for the wedding.</p>
      </div>

      {/* ─── Inner tabs (local state; /app/budget stays one route) ───────── */}
      <div className="flex gap-1 rounded-full border border-primary/15 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex-1 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-colors ${
              tab === t.key ? "bg-sect-money/15 text-sect-money" : "text-text/55 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Anything overdue outranks everything else ────────────────────── */}
      {split.late.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-600 px-4 py-4 text-white shadow-md">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/20">
            <ExclamationIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">
              {split.late.length} payment{split.late.length === 1 ? " is" : "s are"} overdue
            </p>
            <p className="mb-3 text-[13px] text-white/90">
              {split.late[0].transactionName}: {money(split.late[0].amount)}
              {split.late[0].dueDate ? `, was due ${fmtDue(split.late[0].dueDate)}` : ""}.
            </p>
            <button
              type="button"
              onClick={() => setTab("payments")}
              className="rounded-full border border-white/55 px-3.5 py-1.5 text-xs font-semibold
                         transition-colors hover:border-white hover:bg-white/15"
            >
              See what’s due
            </button>
          </div>
        </div>
      )}

      {/* ─── Budget ───────────────────────────────────────────────────────── */}
      {tab === "budget" && (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-white p-4">
            <div className="relative h-[74px] w-[74px] flex-shrink-0">
              <svg width="74" height="74" viewBox="0 0 74 74" className="-rotate-90" aria-hidden="true">
                <circle cx="37" cy="37" r="31" fill="none" stroke="currentColor" strokeWidth="8" className="text-accent" />
                <circle
                  cx="37"
                  cy="37"
                  r="31"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 31}
                  strokeDashoffset={2 * Math.PI * 31 * (1 - Math.min(pct, 100) / 100)}
                  className="text-sect-money"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-base font-bold tabular-nums text-text">
                {pct}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-text">{money(split.paidTotal)}</p>
              <p className="text-[13px] text-text/60">paid so far, of {money(total)}</p>
              <p
                className={`mt-1.5 text-[13px] font-semibold ${
                  left < 0 ? "text-red-600" : "text-sect-guests"
                }`}
              >
                {left < 0
                  ? `${money(Math.abs(left))} over once everything is paid`
                  : `${money(left)} left after what’s promised`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatsCard label="Paid" value={money(split.paidTotal)} variant="primary" size="sm" />
            <StatsCard label="Still to pay" value={money(split.owedTotal)} variant="warning" size="sm" />
            <StatsCard label="Gifts in" value={money(split.giftTotal)} variant="success" size="sm" />
          </div>

          <h2 className="font-display text-xl text-text">By category</h2>
          {byCategory.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-white px-4 py-8 text-center text-sm text-text/55">
              Nothing recorded yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white p-4">
              {byCategory.map(([cat, amount]) => {
                const cfg = getCategoryConfig(cat);
                const share = split.paidTotal + split.owedTotal;
                const p = share > 0 ? Math.round((amount / share) * 100) : 0;
                return (
                  <div key={cat} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="font-semibold text-text">
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="tabular-nums text-text/60">{money(amount)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-sect-money"
                        style={{ width: `${Math.min(p, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button variant="primary" className="w-full" onClick={() => setTxnModal({ open: true })}>
            + Add what you spent
          </Button>
        </>
      )}

      {/* ─── Payments ─────────────────────────────────────────────────────── */}
      {tab === "payments" && (
        <>
          {split.owed.length > 0 && (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-text">Coming up</h2>
                <span className="text-[12.5px] tabular-nums text-text/45">
                  {money(split.owedTotal)}
                </span>
              </div>
              <ul className="divide-y divide-primary/10 overflow-hidden rounded-2xl border border-primary/10 bg-white">
                {[...split.owed]
                  .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
                  .map(paymentRow)}
              </ul>
            </>
          )}

          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-text">Already paid</h2>
            <span className="text-[12.5px] text-text/45">{split.paid.length} payments</span>
          </div>
          {split.paid.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-white px-4 py-8 text-center text-sm text-text/55">
              Nothing paid yet.
            </p>
          ) : (
            <ul className="divide-y divide-primary/10 overflow-hidden rounded-2xl border border-primary/10 bg-white">
              {[...split.paid]
                .sort((a, b) => (b.transactionDate ?? "").localeCompare(a.transactionDate ?? ""))
                .map(paymentRow)}
            </ul>
          )}

          <Button variant="primary" className="w-full" onClick={() => setTxnModal({ open: true })}>
            + Add what you spent
          </Button>
        </>
      )}

      {/* ─── Gifts ────────────────────────────────────────────────────────── */}
      {tab === "gifts" && (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white p-4">
            <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-sect-guests/12">
              <GiftIcon className="h-6 w-6 text-sect-guests" />
            </span>
            <div>
              <p className="text-lg font-bold tabular-nums text-text">{money(split.giftTotal)}</p>
              <p className="text-[13px] text-text/60">
                {split.paidTotal > 0
                  ? `Covers ${Math.round((split.giftTotal / split.paidTotal) * 100)}% of what you’ve paid`
                  : `From ${split.gifts.length} guests so far`}
              </p>
            </div>
          </div>

          {split.gifts.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-white px-4 py-8 text-center text-sm text-text/55">
              No gifts recorded yet. They’ll appear here as you add them.
            </p>
          ) : (
            <ul className="divide-y divide-primary/10 overflow-hidden rounded-2xl border border-primary/10 bg-white">
              {split.gifts.map((t) => (
                <li key={t.transactionGuid} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-sect-guests/12 text-base">
                    🎁
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-text">
                      {t.transactionName}
                    </span>
                    {t.referenceId && (
                      <span className="block font-mono text-[11px] text-text/45">
                        {t.referenceId}
                      </span>
                    )}
                  </span>
                  <span className="flex-shrink-0 text-[14px] font-bold tabular-nums text-sect-guests">
                    {money(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Button variant="secondary" className="w-full" onClick={() => setTxnModal({ open: true })}>
            + Record a gift
          </Button>
        </>
      )}

      <p className="text-center text-[11.5px] text-text/40">
        Need reports or to edit the budget itself? Switch to advanced view from your account menu.
      </p>

      <TransactionFormModal
        isOpen={txnModal.open}
        onClose={() => setTxnModal({ open: false })}
        walletGuid={budget.walletGuid}
        eventGuid={eventId}
        transaction={txnModal.transaction}
      />
    </div>
  );
}
