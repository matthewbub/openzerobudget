"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { BudgetBreadcrumbTitle } from "@/components/budget/budget-breadcrumb-title";
import { BudgetExpensesPanel } from "@/components/budget/budget-expenses-panel";
import {
  getBudgetDetail,
  type ExpenseRow,
  type LedgerRow,
} from "@/lib/ledger-storage";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const columns: Array<{ key: keyof LedgerRow; label: string }> = [
  { key: "month", label: "Month" },
  { key: "payPeriod", label: "Pay Period" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "due", label: "Due" },
  { key: "notes", label: "Notes" },
  { key: "year", label: "Year" },
  { key: "bank", label: "Bank" },
];

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

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      {loading && <p>Loading budget...</p>}
      {!loading && notFound && (
        <p className="text-red-600">Budget not found.</p>
      )}
      {!loading && error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && !notFound && row && (
        <>
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="text-muted-foreground flex items-center gap-2 text-sm">
              <li>
                <Link className="hover:text-foreground underline" href="/">
                  Ledger
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground font-medium">
                <BudgetBreadcrumbTitle
                  category={row.category}
                  fallbackId={row.id}
                  month={row.month}
                  payPeriod={row.payPeriod}
                  year={row.year}
                />
              </li>
            </ol>
          </nav>

          <h1 className="mb-4 text-xl font-semibold">Ledger</h1>

          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {row[column.key] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell>{usdFormatter.format(parseCurrencyAmount(row.amount))}</TableCell>
                <TableCell colSpan={5} />
              </TableRow>
            </TableFooter>
          </Table>

          <BudgetExpensesPanel
            ledgerCategory={row.category}
            rows={expenses}
          />
        </>
      )}
    </main>
  );
}
