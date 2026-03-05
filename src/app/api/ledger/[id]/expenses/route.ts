import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { zeroBudgetEntriesTable, zeroBudgetExpensesTable } from '@/db/schema';

type PostExpensePayload = {
  amount?: string;
  status?: string;
  dateSpent?: string;
  notes?: string;
  bank?: string;
};

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

function parsePositiveAmount(value: string): number | null {
  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseDateInput(dateInput: string): Date | null {
  if (!dateInputPattern.test(dateInput)) {
    return null;
  }

  const [yearText, monthText, dayText] = dateInput.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);

  const parsed = new Date(`${dateInput}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const trimmedId = id.trim();
  if (!trimmedId) {
    return NextResponse.json({ error: 'Invalid ledger id' }, { status: 400 });
  }

  try {
    const entries = await db
      .select({ id: zeroBudgetEntriesTable.id })
      .from(zeroBudgetEntriesTable)
      .where(eq(zeroBudgetEntriesTable.id, trimmedId))
      .limit(1);

    if (entries.length === 0) {
      return NextResponse.json({ error: 'Budget row not found' }, { status: 404 });
    }

    const payload = (await request.json()) as PostExpensePayload;

    const amountInput = payload.amount?.trim() ?? '';
    const parsedAmount = parsePositiveAmount(amountInput);
    if (!parsedAmount) {
      return NextResponse.json(
        { error: 'Amount must be a number greater than zero.' },
        { status: 400 },
      );
    }

    const statusInput = payload.status?.trim() ?? '';
    if (!statusInput) {
      return NextResponse.json(
        { error: 'Status is required.' },
        { status: 400 },
      );
    }

    const dateInput = payload.dateSpent?.trim();
    const dateSpent = dateInput ? parseDateInput(dateInput) : new Date();
    if (!dateSpent) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format.' },
        { status: 400 },
      );
    }

    const notes = payload.notes?.trim() ?? '';
    const bank = payload.bank?.trim() ?? '';

    const insertedRows = await db
      .insert(zeroBudgetExpensesTable)
      .values({
        zeroBudgetEntryId: trimmedId,
        amount: parsedAmount.toFixed(2),
        dateSpent,
        status: statusInput,
        notes,
        bank,
      })
      .returning();

    const inserted = insertedRows[0];
    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error('Failed to create budget expense:', error);
    return NextResponse.json(
      { error: 'Failed to create budget expense' },
      { status: 500 },
    );
  }
}
