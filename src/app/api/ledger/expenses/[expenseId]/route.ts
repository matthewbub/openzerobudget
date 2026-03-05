import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { zeroBudgetExpensesTable } from '@/db/schema';

type PatchExpensePayload = {
  status?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ expenseId: string }> },
) {
  const { expenseId } = await context.params;
  const trimmedExpenseId = expenseId.trim();

  if (!trimmedExpenseId) {
    return NextResponse.json({ error: 'Invalid expense id' }, { status: 400 });
  }

  try {
    const payload = (await request.json()) as PatchExpensePayload;
    const statusInput = payload.status?.trim() ?? '';

    if (!statusInput) {
      return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
    }

    const updatedRows = await db
      .update(zeroBudgetExpensesTable)
      .set({ status: statusInput })
      .where(eq(zeroBudgetExpensesTable.id, trimmedExpenseId))
      .returning();

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Failed to update expense status:', error);
    return NextResponse.json(
      { error: 'Failed to update expense status' },
      { status: 500 },
    );
  }
}
