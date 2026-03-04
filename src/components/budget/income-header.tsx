'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { RiPencilLine } from '@remixicon/react';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function IncomeHeader({
  periodKey,
  defaultIncome,
  onChange,
}: {
  periodKey: string;
  defaultIncome: number;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [income, setIncome] = useState<number>(defaultIncome);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when period changes
  useEffect(() => {
    const stored = localStorage.getItem(`income:${periodKey}`);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (Number.isFinite(parsed)) {
        setIncome(parsed);
        onChange(parsed);
        return;
      }
    }
    setIncome(defaultIncome);
    onChange(defaultIncome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey, defaultIncome]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(
    (value: number) => {
      setIncome(value);
      localStorage.setItem(`income:${periodKey}`, String(value));
      onChange(value);
      setEditing(false);
    },
    [periodKey, onChange],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        Income
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-2xl font-semibold">$</span>
          <CurrencyInput
            ref={inputRef}
            className="bg-transparent text-2xl font-semibold text-foreground outline-none border-b-2 border-primary w-full font-sans"
            decimalsLimit={2}
            defaultValue={income}
            allowNegativeValue={false}
            onValueChange={(value) => {
              if (value !== undefined) {
                const parsed = parseFloat(value);
                if (Number.isFinite(parsed)) {
                  setIncome(parsed);
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commit(income);
              }
              if (e.key === 'Escape') {
                setEditing(false);
              }
            }}
            onBlur={() => commit(income)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group flex items-center gap-2 text-left"
          aria-label="Edit income amount"
        >
          <span className="text-foreground text-2xl font-semibold font-sans tabular-nums">
            {usdFormatter.format(income)}
          </span>
          <RiPencilLine
            aria-hidden
            className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>
      )}
    </div>
  );
}
