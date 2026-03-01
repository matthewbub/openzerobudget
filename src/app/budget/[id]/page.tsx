import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { ledgerTable } from '@/db/schema';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BudgetDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    notFound();
  }

  const [row] = await db
    .select()
    .from(ledgerTable)
    .where(eq(ledgerTable.id, numericId))
    .limit(1);

  if (!row) {
    notFound();
  }

  const fields: Array<{ label: string; value: string | number | null }> = [
    { label: 'ID', value: row.id },
    { label: 'Month', value: row.month },
    { label: 'Pay Period', value: row.payPeriod },
    { label: 'Category', value: row.category },
    { label: 'Amount', value: row.amount },
    { label: 'Status', value: row.status },
    { label: 'Due', value: row.due },
    { label: 'Notes', value: row.notes },
    { label: 'Year', value: row.year },
    { label: 'Bank', value: row.bank },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Budget Item #{row.id}</h1>
        <Link className="text-sm underline" href="/">
          Back to ledger
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <dl className="divide-y">
          {fields.map((field) => (
            <div
              className="grid grid-cols-1 gap-1 p-4 sm:grid-cols-[180px_1fr]"
              key={field.label}
            >
              <dt className="font-medium">{field.label}</dt>
              <dd className="text-muted-foreground">{field.value ?? '-'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
