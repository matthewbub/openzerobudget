'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type LedgerRow = {
  id: number;
  month: string | null;
  payPeriod: string | null;
  category: string | null;
  amount: string | null;
  status: string | null;
  due: string | null;
  notes: string | null;
  year: string | null;
  bank: string | null;
};

const columns: Array<{ key: keyof LedgerRow; label: string }> = [
  { key: 'id', label: 'ID' },
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

export default function Page() {
  const router = useRouter();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLedger() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/ledger');
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const data = (await response.json()) as LedgerRow[];
        if (isMounted) {
          setRows(data);
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
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Ledger</h1>

      {loading && <p>Loading ledger...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  router.push(`/budget/${row.id}`);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/budget/${row.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {columns.map((column) => (
                  <TableCell key={`${column.key}-${index}`}>
                    {row[column.key] ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
