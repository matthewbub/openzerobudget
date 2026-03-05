'use client';

import { useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { RiAddLine } from '@remixicon/react';
import {
  createBudgetExpense,
  updateBudgetExpenseStatus,
  type ExpenseRow,
} from '@/lib/ledger-storage';
import { ChartPieDonutText } from '@/components/budget/chart-pie-donut-text';
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

type BudgetExpensesPanelProps = {
  budgetedAmount: number;
  ledgerCategory: string | null;
  entryId?: string | null;
  rows: ExpenseRow[];
  onExpenseCreated?: (expense: ExpenseRow) => void;
  onExpenseUpdated?: (expense: ExpenseRow) => void;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseCurrencyAmount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTodayDateInput(): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const expenseStatusOptions = ['Pending', 'Paid', 'Cleared'] as const;

function BudgetExpensesPanel({
  budgetedAmount,
  ledgerCategory,
  entryId,
  rows,
  onExpenseCreated,
  onExpenseUpdated,
}: BudgetExpensesPanelProps) {
  const hasCategory = Boolean(ledgerCategory && ledgerCategory.trim());
  const canSaveInThisView = Boolean(entryId && onExpenseCreated);

  const [amountInput, setAmountInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [bankInput, setBankInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [updatingStatusById, setUpdatingStatusById] = useState<Record<string, boolean>>({});

  const totalAmount = rows.reduce(
    (sum, row) => sum + parseCurrencyAmount(row.amount),
    0,
  );
  const addButtonDisabled = isSubmitting || !hasCategory || !canSaveInThisView;

  async function handleAddExpense() {
    if (!hasCategory) {
      setSubmitError('This budget row has no category, so expenses cannot be added.');
      return;
    }

    if (!entryId || !onExpenseCreated) {
      setSubmitError('Expense saving is unavailable in this view.');
      return;
    }

    const amountNumber = parseCurrencyAmount(amountInput);
    if (amountNumber <= 0) {
      setSubmitError('Amount must be greater than zero.');
      return;
    }

    const trimmedStatus = statusInput.trim();
    if (!trimmedStatus) {
      setSubmitError('Status is required.');
      return;
    }

    const dateSpent = dateInput || getTodayDateInput();

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const expense = await createBudgetExpense(entryId, {
        amount: amountNumber.toFixed(2),
        dateSpent,
        status: trimmedStatus,
        notes: notesInput.trim(),
        bank: bankInput.trim(),
      });

      onExpenseCreated(expense);
      setAmountInput('');
      setDateInput('');
      setStatusInput('');
      setNotesInput('');
      setBankInput('');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to save expense. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusUpdate(row: ExpenseRow, nextStatus: string) {
    if (!onExpenseUpdated || nextStatus === row.status) {
      return;
    }

    setUpdatingStatusById((previous) => ({
      ...previous,
      [row.id]: true,
    }));
    setSubmitError(null);

    try {
      const updatedExpense = await updateBudgetExpenseStatus(row.id, {
        status: nextStatus,
      });
      onExpenseUpdated(updatedExpense);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to update expense status. Please try again.',
      );
    } finally {
      setUpdatingStatusById((previous) => ({
        ...previous,
        [row.id]: false,
      }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Chart + Expenses side by side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Pie chart card */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPieDonutText budgetedAmount={budgetedAmount} rows={rows} />
          </CardContent>
        </Card>

        {/* Expenses table card */}
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {!hasCategory && (
              <p className="text-destructive px-6 pb-3 text-sm">
                This budget row has no category, so expenses cannot be associated.
              </p>
            )}

            <Table className="w-max min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead className="bg-muted sticky right-0 z-20 w-10 min-w-10 border-l">
                    <span className="sr-only">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground py-8 text-center" colSpan={6}>
                      No expenses logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums font-sans font-medium">
                        {usdFormatter.format(parseCurrencyAmount(row.amount))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(row.dateSpent)}
                      </TableCell>
                      <TableCell>
                        <select
                          aria-label={`Expense status for ${row.id}`}
                          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-[140px] min-w-[140px] rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                          value={row.status}
                          disabled={!onExpenseUpdated || updatingStatusById[row.id]}
                          onChange={(event) => {
                            void handleStatusUpdate(row, event.target.value);
                          }}
                        >
                          {expenseStatusOptions.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {row.notes || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.bank}</TableCell>
                      <TableCell className="bg-muted sticky right-0 z-10 border-l" />
                    </TableRow>
                  ))
                )}

                {/* Inline add row */}
                <TableRow className="hover:bg-transparent">
                  <TableCell>
                    <CurrencyInput
                      aria-label="New expense amount"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-[130px] min-w-[130px] rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      decimalsLimit={2}
                      placeholder="Amount"
                      value={amountInput}
                      onValueChange={(value) => {
                        setAmountInput(value ?? '');
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense date"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-[190px] min-w-[190px] rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      type="date"
                      value={dateInput}
                      onChange={(event) => {
                        setDateInput(event.target.value);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      aria-label="New expense status"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-[140px] min-w-[140px] rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      value={statusInput}
                      onChange={(event) => {
                        setStatusInput(event.target.value);
                      }}
                    >
                      <option value="">Select status</option>
                      {expenseStatusOptions.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense notes"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-[180px] min-w-[180px] rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      placeholder="Notes"
                      value={notesInput}
                      onChange={(event) => {
                        setNotesInput(event.target.value);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense bank"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-[120px] min-w-[120px] rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      placeholder="Bank"
                      value={bankInput}
                      onChange={(event) => {
                        setBankInput(event.target.value);
                      }}
                    />
                  </TableCell>
                  <TableCell className="bg-background sticky right-0 z-20 border-l">
                    <button
                      aria-label="Add expense row"
                      className="border-input text-foreground hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-transparent outline-none focus-visible:ring-2"
                      type="button"
                      disabled={addButtonDisabled}
                      onClick={handleAddExpense}
                    >
                      <RiAddLine aria-hidden className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
                {submitError && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="text-destructive text-sm" colSpan={6}>
                      {submitError}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="tabular-nums font-sans font-medium">
                    {usdFormatter.format(totalAmount)}
                  </TableCell>
                  <TableCell colSpan={5}>
                    <span className="text-muted-foreground text-xs">total spent</span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { BudgetExpensesPanel };
