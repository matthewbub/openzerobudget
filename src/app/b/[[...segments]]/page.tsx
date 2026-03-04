import { LedgerTableView } from '@/components/ledger/ledger-table-view';
import type { LedgerFilters } from '@/lib/ledger-storage';

type PageProps = {
  params: Promise<{ segments?: string[] }>;
};

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function FilteredLedgerPage({ params }: PageProps) {
  const { segments = [] } = await params;

  const filters: LedgerFilters = {
    year: segments[0] ? decodeSegment(segments[0]) : undefined,
    month: segments[1] ? decodeSegment(segments[1]) : undefined,
    payPeriod: segments[2] ? decodeSegment(segments[2]) : undefined,
    category: segments[3] ? decodeSegment(segments[3]) : undefined,
  };

  return <LedgerTableView filters={filters} />;
}
