"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RiArrowLeftLine } from "@remixicon/react";

import { BudgetExpensesPanel } from "@/components/budget/budget-expenses-panel";
import {
  getBudgetDetail,
  type ExpenseRow,
  type LedgerRow,
} from "@/lib/ledger-storage";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

function parseCurrencyAmount(value: string | null): number {
  if (!value) {
    return 0;
  }
  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function statusVariant(status: string | null) {
  if (!status) return "outline" as const;
  const s = status.toLowerCase();
  if (s === "paid") return "default" as const;
  if (s === "income") return "secondary" as const;
  if (s === "late") return "destructive" as const;
  return "outline" as const;
}

export default function BudgetDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<LedgerRow | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchBudgetDetail() {
      const id = params.id;
      const trimmedId = id.trim();
      if (!trimmedId) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const data = await getBudgetDetail(trimmedId);
        if (!data) {
          if (isMounted) {
            setNotFound(true);
            setRow(null);
            setExpenses([]);
          }
          return;
        }

        if (isMounted) {
          setRow(data.row);
          setExpenses(data.expenses);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Unexpected error";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBudgetDetail();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const budgetedAmount = row ? Math.abs(parseCurrencyAmount(row.amount)) : 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
        href="/"
      >
        <RiArrowLeftLine aria-hidden className="size-4" />
        Back to budget
      </Link>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}

      {!loading && notFound && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive text-sm">Budget entry not found.</p>
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive text-sm">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && !notFound && row && (
        <div className="flex flex-col gap-6">
          {/* Category header card */}
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="text-foreground text-xl font-semibold tracking-tight text-balance">
                    {row.category || `Budget #${row.id.slice(0, 8)}`}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {[row.month, row.payPeriod, row.year]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.status && (
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  )}
                </div>
              </div>

              <div className="bg-border h-px" />

              {/* Key details */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Budgeted
                  </span>
                  <span className="text-foreground text-lg font-semibold tabular-nums font-sans">
                    {usdFormatter.format(budgetedAmount)}
                  </span>
                </div>
                {row.due && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Due
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {row.due}
                    </span>
                  </div>
                )}
                {row.bank && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Bank
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {row.bank}
                    </span>
                  </div>
                )}
                {row.notes && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Notes
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {row.notes}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expenses panel with chart */}
          <BudgetExpensesPanel
            budgetedAmount={budgetedAmount}
            ledgerCategory={row.category}
            rows={expenses}
          />
        </div>
      )}
    </main>
  );
}
