'use client';

import CurrencyInput from 'react-currency-input-field';
import { RiAddLine } from '@remixicon/react';
import { type ExpenseRow } from '@/lib/ledger-storage';
import { ChartPieDonutText } from '@/components/budget/chart-pie-donut-text';

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
  ledgerCategory: string | null;
  rows: ExpenseRow[];
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function parseCurrencyAmount(value: string): number {
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function BudgetExpensesPanel({ ledgerCategory, rows }: BudgetExpensesPanelProps) {
  const hasCategory = Boolean(ledgerCategory && ledgerCategory.trim());
  const totalAmount = rows.reduce(
    (sum, row) => sum + parseCurrencyAmount(row.amount),
    0,
  );

  return (
    <section className="mt-8 grid grid-cols-12 gap-4">
      <div className="col-span-12 md:col-span-3">
        <ChartPieDonutText rows={rows} />
      </div>
      <div className="col-span-12 md:col-span-9">
        <h2 className="mb-3 text-lg font-semibold">Expenses</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Logged against category: {ledgerCategory ?? '-'}
        </p>

        {!hasCategory && (
          <p className="mb-3 text-sm text-red-600">
            This budget row has no category, so expenses cannot be associated.
          </p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Amount Spent</TableHead>
              <TableHead>Date Spent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={7}>
                  No expenses logged yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{formatDate(row.dateSpent)}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.notes}</TableCell>
                  <TableCell>{row.bank}</TableCell>
                  <TableCell />
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell>
                <div
                  aria-label="Expense ID is auto-generated"
                  className="text-muted-foreground h-8 px-2 text-sm leading-8"
                />
              </TableCell>
              <TableCell>
                <CurrencyInput
                  aria-label="New expense amount spent"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                  decimalsLimit={2}
                  defaultValue={1000}
                  id="expense-amount-input"
                  name="expense-amount-input"
                  onValueChange={(value, name, values) =>
                    console.log(value, name, values)
                  }
                  placeholder="Please enter a number"
                />
              </TableCell>
              <TableCell>
                <input
                  aria-label="New expense date spent"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                  type="date"
                />
              </TableCell>
              <TableCell>
                <input
                  aria-label="New expense status"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Enter status"
                />
              </TableCell>
              <TableCell>
                <input
                  aria-label="New expense notes"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Enter notes"
                />
              </TableCell>
              <TableCell>
                <input
                  aria-label="New expense bank"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Enter bank"
                />
              </TableCell>
              <TableCell>
                <button
                  aria-label="Add expense row"
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
              <TableCell>Total</TableCell>
              <TableCell>{usdFormatter.format(totalAmount)}</TableCell>
              <TableCell colSpan={5} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  );
}

export { BudgetExpensesPanel };
