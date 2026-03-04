'use client';

import { cn } from '@/lib/utils';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

type AssignmentState = 'remaining' | 'balanced' | 'over';

function getState(leftToAssign: number): AssignmentState {
  if (Math.abs(leftToAssign) < 0.01) return 'balanced';
  if (leftToAssign > 0) return 'remaining';
  return 'over';
}

export function AssignmentBar({
  income,
  totalAssigned,
}: {
  income: number;
  totalAssigned: number;
}) {
  const leftToAssign = income - totalAssigned;
  const state = getState(leftToAssign);
  const pct = income > 0 ? Math.min((totalAssigned / income) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Left to assign
          </span>
          <span
            className={cn(
              'text-xl font-semibold tabular-nums font-sans',
              state === 'balanced' && 'text-emerald-600 dark:text-emerald-400',
              state === 'remaining' && 'text-primary',
              state === 'over' && 'text-destructive',
            )}
          >
            {state === 'over' ? '-' : ''}
            {usdFormatter.format(Math.abs(leftToAssign))}
          </span>
        </div>
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            state === 'balanced'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground',
          )}
        >
          {state === 'balanced'
            ? 'Fully budgeted'
            : state === 'over'
              ? 'Over-assigned'
              : `${Math.round(pct)}% assigned`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            state === 'balanced' && 'bg-emerald-500',
            state === 'remaining' && 'bg-primary',
            state === 'over' && 'bg-destructive',
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Summary row */}
      <div className="text-muted-foreground flex items-center justify-between text-xs tabular-nums">
        <span>
          Assigned: <span className="text-foreground font-medium">{usdFormatter.format(totalAssigned)}</span>
        </span>
        <span>
          Income: <span className="text-foreground font-medium">{usdFormatter.format(income)}</span>
        </span>
      </div>
    </div>
  );
}
