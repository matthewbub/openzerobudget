'use client';

import CurrencyInput from 'react-currency-input-field';
import { RiAddLine } from '@remixicon/react';
import { type ExpenseRow } from '@/lib/ledger-storage';
import { ChartPieDonutText } from '@/components/budget/chart-pie-donut-text';
import { Badge } from '@/components/ui/badge';
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
  rows: ExpenseRow[];
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

function parseCurrencyAmount(value: string): number {
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function statusVariant(status: string) {
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'cleared') return 'default' as const;
  if (s === 'pending') return 'secondary' as const;
  return 'outline' as const;
}

function BudgetExpensesPanel({ budgetedAmount, ledgerCategory, rows }: BudgetExpensesPanelProps) {
  const hasCategory = Boolean(ledgerCategory && ledgerCategory.trim());
  const totalAmount = rows.reduce(
    (sum, row) => sum + parseCurrencyAmount(row.amount),
    0,
  );

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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead className="w-10">
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
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {row.notes || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.bank}</TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                )}

                {/* Inline add row */}
                <TableRow className="hover:bg-transparent">
                  <TableCell>
                    <CurrencyInput
                      aria-label="New expense amount"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      decimalsLimit={2}
                      placeholder="Amount"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense date"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      type="date"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense status"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      placeholder="Status"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense notes"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      placeholder="Notes"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      aria-label="New expense bank"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                      placeholder="Bank"
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
