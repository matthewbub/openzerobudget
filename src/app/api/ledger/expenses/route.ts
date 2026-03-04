import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { zeroBudgetEntriesTable, zeroBudgetExpensesTable } from '@/db/schema';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year')?.trim();
    const month = url.searchParams.get('month')?.trim();
    const payPeriod = url.searchParams.get('payPeriod')?.trim();
    const category = url.searchParams.get('category')?.trim();

    const filters = [
      year ? eq(zeroBudgetEntriesTable.year, year) : undefined,
      month ? eq(zeroBudgetEntriesTable.month, month) : undefined,
      payPeriod ? eq(zeroBudgetEntriesTable.payPeriod, payPeriod) : undefined,
      category ? eq(zeroBudgetEntriesTable.category, category) : undefined,
    ].filter((value): value is NonNullable<typeof value> => Boolean(value));

    const matchingEntries =
      filters.length > 0
        ? await db
            .select({ id: zeroBudgetEntriesTable.id })
            .from(zeroBudgetEntriesTable)
            .where(and(...filters))
        : await db.select({ id: zeroBudgetEntriesTable.id }).from(zeroBudgetEntriesTable);

    const entryIds = matchingEntries.map((entry) => entry.id);
    if (entryIds.length === 0) {
      return NextResponse.json([]);
    }

    const expenses = await db
      .select()
      .from(zeroBudgetExpensesTable)
      .where(inArray(zeroBudgetExpensesTable.zeroBudgetEntryId, entryIds));

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Failed to fetch ledger expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger expenses' },
      { status: 500 },
    );
  }
}
