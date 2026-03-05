import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/db';

export type PayPeriod = {
  year: string;
  month: string;
  payPeriod: string;
};

export async function GET() {
  try {
    const rows = await db.execute<PayPeriod>(
      sql`SELECT DISTINCT year, month, pay_period as "payPeriod"
          FROM zero_budget_entries
          WHERE year IS NOT NULL AND month IS NOT NULL AND pay_period IS NOT NULL
          ORDER BY year DESC, month DESC, pay_period DESC`,
    );

    return NextResponse.json(rows.rows);
  } catch (error) {
    console.error('Failed to fetch pay periods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pay periods' },
      { status: 500 },
    );
  }
}
