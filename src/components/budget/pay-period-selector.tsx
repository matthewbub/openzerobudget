'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PayPeriod } from '@/lib/ledger-storage';

const monthOrder: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

function sortPeriods(periods: PayPeriod[]): PayPeriod[] {
  return [...periods].sort((a, b) => {
    const yearDiff = Number(b.year) - Number(a.year);
    if (yearDiff !== 0) return yearDiff;
    const monthDiff = (monthOrder[b.month] ?? 0) - (monthOrder[a.month] ?? 0);
    if (monthDiff !== 0) return monthDiff;
    return b.payPeriod.localeCompare(a.payPeriod);
  });
}

function periodToKey(p: PayPeriod): string {
  return `${p.year}:${p.month}:${p.payPeriod}`;
}

function periodToLabel(p: PayPeriod): string {
  return `${p.month} ${p.year} - ${p.payPeriod}`;
}

export function PayPeriodSelector({
  periods,
  selected,
  onSelect,
}: {
  periods: PayPeriod[];
  selected: PayPeriod | null;
  onSelect: (period: PayPeriod) => void;
}) {
  const sorted = sortPeriods(periods);
  const selectedKey = selected ? periodToKey(selected) : undefined;

  return (
    <Select
      value={selectedKey}
      onValueChange={(key: string) => {
        const found = sorted.find((p) => periodToKey(p) === key);
        if (found) onSelect(found);
      }}
    >
      <SelectTrigger className="w-full" aria-label="Select pay period">
        <SelectValue placeholder="Select a pay period" />
      </SelectTrigger>
      <SelectContent>
        {sorted.map((p) => {
          const key = periodToKey(p);
          return (
            <SelectItem key={key} value={key}>
              {periodToLabel(p)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
