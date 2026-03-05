'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { RiAddLine } from '@remixicon/react';
import CurrencyInput from 'react-currency-input-field';
import { useRouter } from 'next/navigation';

import {
  getPayPeriods,
  getLedgerRows,
  getLedgerExpenses,
  updateBudgetEntry,
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

function parseCurrencyInput(value: string): number | null {
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function periodToKey(p: PayPeriod): string {
  return `${p.year}:${p.month}:${p.payPeriod}`;
}

function buildDetailPath(row: LedgerRow): string | null {
  if (!row.id) return null;
  return `/budget/${encodeURIComponent(row.id)}`;
}

function statusVariant(status: string | null) {
  if (!status) return 'outline' as const;
  const s = status.toLowerCase();
  if (s === 'on budget') return 'default' as const;
  if (s === 'under budget') return 'secondary' as const;
  if (s === 'over budget') return 'destructive' as const;
  return 'outline' as const;
}

type BudgetColumnKey =
  | 'category'
  | 'amount'
  | 'remaining'
  | 'status'
  | 'due'
  | 'notes'
  | 'bank';

const budgetColumns: Array<{ key: BudgetColumnKey; label: string }> = [
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'remaining', label: 'Remaining' },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due' },
  { key: 'notes', label: 'Notes' },
  { key: 'bank', label: 'Bank' },
];

function getBudgetStatus(remaining: number): string {
  const tolerance = 0.005;
  if (remaining > tolerance) return 'Under Budget';
  if (remaining < -tolerance) return 'Over Budget';
  return 'On Budget';
}

function getEntrySpentTotal(
  entryId: string,
  expensesByEntryId: Map<string, number>,
): number {
  return expensesByEntryId.get(entryId) ?? 0;
}

export function BudgetDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [income, setIncome] = useState(0);
  const [amountDraftById, setAmountDraftById] = useState<Record<string, string>>({});
  const [amountOverrideById, setAmountOverrideById] = useState<Record<string, string>>({});
  const [savingAmountById, setSavingAmountById] = useState<Record<string, boolean>>({});
  const [amountError, setAmountError] = useState<string | null>(null);

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

  const { data: periodExpenses = [], isLoading: expensesLoading } = useSWR(
    selectedPeriod
      ? [
          'ledger-expenses',
          selectedPeriod.year,
          selectedPeriod.month,
          selectedPeriod.payPeriod,
        ]
      : null,
    () =>
      selectedPeriod
        ? getLedgerExpenses({
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
      (sum, row) =>
        sum +
        Math.abs(parseCurrency(amountOverrideById[row.id] ?? row.amount)),
      0,
    );
  }, [amountOverrideById, budgetRows]);

  const expensesByEntryId = useMemo(() => {
    const totals = new Map<string, number>();

    for (const expense of periodExpenses) {
      const entryId = expense.zeroBudgetEntryId?.trim();
      if (!entryId) continue;
      const next = (totals.get(entryId) ?? 0) + Math.abs(parseCurrency(expense.amount));
      totals.set(entryId, next);
    }

    return totals;
  }, [periodExpenses]);

  const handleIncomeChange = useCallback((value: number) => {
    setIncome(value);
  }, []);

  const isLoading = periodsLoading || rowsLoading || expensesLoading;
  const periodKey = selectedPeriod ? periodToKey(selectedPeriod) : '';

  function getAmountInputValue(row: LedgerRow): string {
    if (Object.prototype.hasOwnProperty.call(amountDraftById, row.id)) {
      return amountDraftById[row.id];
    }
    const sourceAmount = amountOverrideById[row.id] ?? row.amount;
    return Math.abs(parseCurrency(sourceAmount)).toFixed(2);
  }

  async function commitAmount(row: LedgerRow) {
    const rawValue = getAmountInputValue(row).trim();
    const parsedAmount = parseCurrencyInput(rawValue);
    if (rawValue.length === 0 || parsedAmount === null) {
      setAmountError('Amount must be a number greater than or equal to zero.');
      return;
    }

    const normalizedAmount = parsedAmount.toFixed(2);
    const currentAmount = Math.abs(
      parseCurrency(amountOverrideById[row.id] ?? row.amount),
    ).toFixed(2);

    if (normalizedAmount === currentAmount) {
      setAmountDraftById((prev) => ({ ...prev, [row.id]: normalizedAmount }));
      return;
    }

    setAmountError(null);
    setSavingAmountById((prev) => ({ ...prev, [row.id]: true }));

    try {
      const updated = await updateBudgetEntry(row.id, {
        amount: normalizedAmount,
      });
      const updatedAmount = Math.abs(parseCurrency(updated.amount)).toFixed(2);
      setAmountOverrideById((prev) => ({ ...prev, [row.id]: updatedAmount }));
      setAmountDraftById((prev) => ({ ...prev, [row.id]: updatedAmount }));
    } catch (error) {
      setAmountError(
        error instanceof Error
          ? error.message
          : 'Failed to update amount. Please try again.',
      );
    } finally {
      setSavingAmountById((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  function renderCellContent(column: { key: BudgetColumnKey }, row: LedgerRow) {
    const value = row[column.key as keyof LedgerRow];
    const effectiveAmount = amountOverrideById[row.id] ?? row.amount;
    const budgetedAmount = Math.abs(parseCurrency(effectiveAmount));
    const spent = getEntrySpentTotal(row.id, expensesByEntryId);
    const remaining = budgetedAmount - spent;
    const computedStatus = getBudgetStatus(remaining);

    if (column.key === 'remaining') {
      const isZeroRemaining = Math.abs(remaining) <= 0.005;
      return (
        <span
          className={`tabular-nums font-sans ${
            remaining < -0.005 ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {isZeroRemaining ? '-' : usdFormatter.format(remaining)}
        </span>
      );
    }
    if (column.key === 'status') {
      return <Badge variant={statusVariant(computedStatus)}>{computedStatus}</Badge>;
    }
    if (column.key === 'amount') {
      const amountInputValue = getAmountInputValue(row);
      const isSaving = Boolean(savingAmountById[row.id]);
      return (
        <div
          className="flex items-center gap-2"
          onClick={(event) => {
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <CurrencyInput
            aria-label={`Edit amount for ${row.category ?? 'budget row'}`}
            className="text-foreground focus-visible:ring-ring/50 h-auto w-full border-0 bg-transparent p-0 text-sm tabular-nums font-sans outline-none focus-visible:ring-1"
            decimalsLimit={2}
            disabled={isSaving}
            value={amountInputValue}
            onFocus={(event) => {
              event.stopPropagation();
            }}
            onValueChange={(nextValue) => {
              setAmountDraftById((prev) => ({
                ...prev,
                [row.id]: nextValue ?? '',
              }));
            }}
            onBlur={() => {
              void commitAmount(row);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') {
                event.preventDefault();
                (event.currentTarget as HTMLInputElement).blur();
              }
            }}
          />
          {isSaving && (
            <span className="text-muted-foreground shrink-0 text-xs">
              Saving...
            </span>
          )}
        </div>
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
                    const path = buildDetailPath(row);
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
                        aria-label="Remaining balance"
                        className="border-input text-muted-foreground h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                        placeholder="Auto"
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        aria-label="New status"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                        placeholder="Auto"
                        disabled
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
                    <TableCell colSpan={budgetColumns.length - 2} />
                  </TableRow>
                </TableFooter>
              </Table>
              {amountError && (
                <p className="text-destructive px-6 pt-3 text-sm">{amountError}</p>
              )}
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
