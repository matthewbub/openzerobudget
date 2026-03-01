import { NextResponse } from 'next/server';

import { db } from '@/db';
import { ledgerTable } from '@/db/schema';

export async function GET() {
  try {
    const rows = await db.select().from(ledgerTable);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch ledger rows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger data' },
      { status: 500 },
    );
  }
}
