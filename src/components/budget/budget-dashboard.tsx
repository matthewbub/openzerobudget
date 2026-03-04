'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { RiAddLine } from '@remixicon/react';
import CurrencyInput from 'react-currency-input-field';
import { useRouter } from 'next/navigation';

import {
  getPayPeriods,
  getLedgerRows,
  type LedgerRow,
  type PayPeriod,
} from '@/lib/ledger-storage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PayPeriodSelector } from './pay-period-selector';
import { IncomeHeader } from './income-header';
import { AssignmentBar } from './assignment-bar';

function parseCurrency(value: string | null): number {
  if (!value) return 0;
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function periodToKey(p: PayPeriod): string {
  return `${p.year}:${p.month}:${p.payPeriod}`;
}

function buildFilteredPath(row: LedgerRow): string | null {
  if (!row.year || !row.month || !row.payPeriod || !row.category) return null;
  const segments = [row.year, row.month, row.payPeriod, row.category].map(
    (value) => encodeURIComponent(value),
  );
  return `/b/${segments.join('/')}`;
}

function statusVariant(status: string | null) {
  if (!status) return 'outline' as const;
  const s = status.toLowerCase();
  if (s === 'paid') return 'default' as const;
  if (s === 'income') return 'secondary' as const;
  if (s === 'late') return 'destructive' as const;
  return 'outline' as const;
}

const budgetColumns: Array<{ key: keyof LedgerRow; label: string }> = [
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due' },
  { key: 'notes', label: 'Notes' },
  { key: 'bank', label: 'Bank' },
];

export function BudgetDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [income, setIncome] = useState(0);

  // Fetch available periods
  const { data: periods = [], isLoading: periodsLoading } = useSWR(
    'pay-periods',
    getPayPeriods,
  );

  // Auto-select most recent period
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);

  // Fetch rows for selected period
  const { data: allRows = [], isLoading: rowsLoading } = useSWR(
    selectedPeriod
      ? [
          'ledger-rows',
          selectedPeriod.year,
          selectedPeriod.month,
          selectedPeriod.payPeriod,
        ]
      : null,
    () =>
      selectedPeriod
        ? getLedgerRows({
            year: selectedPeriod.year,
            month: selectedPeriod.month,
            payPeriod: selectedPeriod.payPeriod,
          })
        : [],
  );

  // Separate income rows from budget rows
  const { budgetRows, incomeRows } = useMemo(() => {
    const budget: LedgerRow[] = [];
    const inc: LedgerRow[] = [];
    for (const row of allRows) {
      if (row.status?.toLowerCase() === 'income') {
        inc.push(row);
      } else {
        budget.push(row);
      }
    }
    return { budgetRows: budget, incomeRows: inc };
  }, [allRows]);

  // Derive default income from income-status rows
  const defaultIncome = useMemo(() => {
    return incomeRows.reduce(
      (sum, row) => sum + Math.abs(parseCurrency(row.amount)),
      0,
    );
  }, [incomeRows]);

  // Total assigned is the sum of absolute values of all budget row amounts
  const totalAssigned = useMemo(() => {
    return budgetRows.reduce(
      (sum, row) => sum + Math.abs(parseCurrency(row.amount)),
      0,
    );
  }, [budgetRows]);

  const handleIncomeChange = useCallback((value: number) => {
    setIncome(value);
  }, []);

  const isLoading = periodsLoading || rowsLoading;
  const periodKey = selectedPeriod ? periodToKey(selectedPeriod) : '';

  function renderCellContent(column: { key: keyof LedgerRow }, row: LedgerRow) {
    const value = row[column.key];
    if (column.key === 'status' && value) {
      return <Badge variant={statusVariant(value)}>{value}</Badge>;
    }
    if (column.key === 'amount' && value) {
      const num = parseCurrency(value);
      return (
        <span className="tabular-nums font-sans">
          {usdFormatter.format(Math.abs(num))}
        </span>
      );
    }
    return value ?? '';
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header row: title + period selector */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-foreground text-xl font-semibold tracking-tight text-balance">
          Zero Budget
        </h1>
        {periods.length > 0 && (
          <div className="w-full sm:w-64">
            <PayPeriodSelector
              periods={periods}
              selected={selectedPeriod}
              onSelect={setSelectedPeriod}
            />
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}

      {!isLoading && selectedPeriod && (
        <div className="flex flex-col gap-6">
          {/* Income + Assignment section */}
          <Card>
            <CardContent className="flex flex-col gap-6">
              <IncomeHeader
                periodKey={periodKey}
                defaultIncome={defaultIncome}
                onChange={handleIncomeChange}
              />
              <div className="bg-border h-px" />
              <AssignmentBar income={income} totalAssigned={totalAssigned} />
            </CardContent>
          </Card>

          {/* Budget table */}
          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {budgetColumns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={budgetColumns.length}
                        className="text-muted-foreground py-8 text-center"
                      >
                        No budget entries for this period yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {budgetRows.map((row) => {
                    const path = buildFilteredPath(row);
                    return (
                      <TableRow
                        key={row.id}
                        className={
                          path
                            ? 'cursor-pointer transition-colors hover:bg-muted/50'
                            : undefined
                        }
                        onClick={() => {
                          if (path) router.push(path);
                        }}
                        onKeyDown={(e) => {
                          if (
                            path &&
                            (e.key === 'Enter' || e.key === ' ')
                          ) {
                            e.preventDefault();
                            router.push(path);
                          }
                        }}
                        role={path ? 'button' : undefined}
                        tabIndex={path ? 0 : undefined}
                      >
                        {budgetColumns.map((col) => (
                          <TableCell key={col.key}>
                            {renderCellContent(col, row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}

                  {/* Inline add row */}
                  <TableRow className="hover:bg-transparent">
                    <TableCell>
                      <input
                        aria-label="New category"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                        placeholder="Category"
                      />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        aria-label="New amount"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                        decimalsLimit={2}
                        placeholder="Amount"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        aria-label="New status"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                        placeholder="Status"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        aria-label="New due date"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                        type="date"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        aria-label="New notes"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                        placeholder="Notes"
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        aria-label="Add budget row"
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
                    <TableCell>Total Assigned</TableCell>
                    <TableCell className="tabular-nums font-sans font-medium">
                      {usdFormatter.format(totalAssigned)}
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && periods.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground text-sm">
            No budget data found. Add some entries to get started.
          </p>
        </div>
      )}
    </main>
  );
}
