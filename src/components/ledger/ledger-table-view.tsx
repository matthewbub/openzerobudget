'use client';

import { useEffect, useMemo, useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { RiAddLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';

import {
  getLedgerExpenses,
  getLedgerRows,
  type ExpenseRow,
  type LedgerFilters,
  type LedgerRow,
} from '@/lib/ledger-storage';
import { BudgetExpensesPanel } from '@/components/budget/budget-expenses-panel';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const columns: Array<{ key: keyof LedgerRow; label: string }> = [
  { key: 'month', label: 'Month' },
  { key: 'payPeriod', label: 'Pay Period' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due' },
  { key: 'notes', label: 'Notes' },
  { key: 'year', label: 'Year' },
  { key: 'bank', label: 'Bank' },
];

function buildFilteredPath(row: LedgerRow): string | null {
  if (!row.year || !row.month || !row.payPeriod || !row.category) {
    return null;
  }

  const segments = [row.year, row.month, row.payPeriod, row.category].map(
    (value) => encodeURIComponent(value),
  );
  return `/b/${segments.join('/')}`;
}

function parseCurrencyAmount(value: string | null): number {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function LedgerTableView({ filters }: { filters?: LedgerFilters }) {
  const router = useRouter();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMostSpecificView = Boolean(
    filters?.year?.trim() &&
      filters?.month?.trim() &&
      filters?.payPeriod?.trim() &&
      filters?.category?.trim(),
  );

  const filterLabel = useMemo(() => {
    const values = [filters?.year, filters?.month, filters?.payPeriod, filters?.category]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(' / ');

    return values || null;
  }, [filters?.category, filters?.month, filters?.payPeriod, filters?.year]);

  const totalAmount = useMemo(() => {
    return rows.reduce((sum, row) => sum + parseCurrencyAmount(row.amount), 0);
  }, [rows]);

  useEffect(() => {
    let isMounted = true;

    async function fetchLedger() {
      try {
        setLoading(true);
        setError(null);
        const [data, expenseRows] = await Promise.all([
          getLedgerRows(filters),
          isMostSpecificView ? getLedgerExpenses(filters) : Promise.resolve([]),
        ]);
        if (isMounted) {
          setRows(data);
          setExpenses(expenseRows);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Unexpected error';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLedger();

    return () => {
      isMounted = false;
    };
  }, [filters, isMostSpecificView]);

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      <h1 className="mb-2 text-xl font-semibold">Ledger</h1>
      {filterLabel && <p className="text-muted-foreground mb-4 text-sm">Filtered by: {filterLabel}</p>}

      {loading && <p>Loading ledger...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const path = buildFilteredPath(row);
                return (
                  <TableRow
                    key={row.id}
                    className={path ? 'cursor-pointer hover:bg-muted/50' : undefined}
                    onClick={() => {
                      if (path) {
                        router.push(path);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (path && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        router.push(path);
                      }
                    }}
                    role={path ? 'button' : undefined}
                    tabIndex={path ? 0 : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${column.key}-${index}`}>
                        {row[column.key] ?? ''}
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell>
                  <input
                    aria-label="New ledger month"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter month"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger pay period"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter pay period"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger category"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter category"
                  />
                </TableCell>
                <TableCell>
                  <CurrencyInput
                    aria-label="New ledger amount"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    decimalsLimit={2}
                    defaultValue={1000}
                    id="ledger-amount-input"
                    name="ledger-amount-input"
                    onValueChange={(value, name, values) =>
                      console.log(value, name, values)
                    }
                    placeholder="Please enter a number"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger status"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter status"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger due date"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    type="date"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger notes"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter notes"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger year"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter year"
                  />
                </TableCell>
                <TableCell>
                  <input
                    aria-label="New ledger bank"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                    placeholder="Enter bank"
                  />
                </TableCell>
                <TableCell>
                  <button
                    aria-label="Add ledger row"
                    className="border-input text-foreground hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-transparent outline-none focus-visible:ring-2"
                    type="button"
                  >
                    <RiAddLine aria-hidden className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell>{usdFormatter.format(totalAmount)}</TableCell>
                <TableCell colSpan={6} />
              </TableRow>
            </TableFooter>
          </Table>

          {isMostSpecificView && (
            <BudgetExpensesPanel
              ledgerCategory={filters?.category ?? null}
              rows={expenses}
            />
          )}
        </>
      )}
    </main>
  );
}
