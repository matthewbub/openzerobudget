import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { zeroBudgetEntriesTable, zeroBudgetExpensesTable } from '@/db/schema';

type PatchLedgerPayload = {
  amount?: string;
};

function parseNonNegativeAmount(value: string): number | null {
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const trimmedId = id.trim();
  if (!trimmedId) {
    return NextResponse.json({ error: 'Invalid ledger id' }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(zeroBudgetEntriesTable)
      .where(eq(zeroBudgetEntriesTable.id, trimmedId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: 'Budget row not found' }, { status: 404 });
    }

    const expenses = await db
      .select()
      .from(zeroBudgetExpensesTable)
      .where(eq(zeroBudgetExpensesTable.zeroBudgetEntryId, trimmedId));

    return NextResponse.json({ row, expenses });
  } catch (error) {
    console.error('Failed to fetch budget detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget detail' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const trimmedId = id.trim();
  if (!trimmedId) {
    return NextResponse.json({ error: 'Invalid ledger id' }, { status: 400 });
  }

  try {
    const payload = (await request.json()) as PatchLedgerPayload;
    const amountInput = payload.amount?.trim() ?? '';
    const amount = parseNonNegativeAmount(amountInput);
    if (!amountInput || amount === null) {
      return NextResponse.json(
        { error: 'Amount must be a number greater than or equal to zero.' },
        { status: 400 },
      );
    }

    const updatedRows = await db
      .update(zeroBudgetEntriesTable)
      .set({ amount: amount.toFixed(2) })
      .where(eq(zeroBudgetEntriesTable.id, trimmedId))
      .returning();

    const updated = updatedRows[0];
    if (!updated) {
      return NextResponse.json({ error: 'Budget row not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update budget row:', error);
    return NextResponse.json(
      { error: 'Failed to update budget row' },
      { status: 500 },
    );
  }
}
