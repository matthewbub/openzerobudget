import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { zeroBudgetEntriesTable, zeroBudgetExpensesTable } from '@/db/schema';

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
