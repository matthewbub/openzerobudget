export type LedgerRow = {
  id: string;
  month: string | null;
  payPeriod: string | null;
  category: string | null;
  amount: string | null;
  status: string | null;
  due: string | null;
  notes: string | null;
  year: string | null;
  bank: string | null;
};

export type ExpenseRow = {
  id: string;
  zeroBudgetEntryId?: string;
  ledgerCategory?: string;
  amount: string;
  dateSpent: string;
  status: string;
  notes: string;
  bank: string;
};

export type BudgetDetailResponse = {
  row: LedgerRow;
  expenses: ExpenseRow[];
};

export type CreateBudgetExpenseInput = {
  amount: string;
  status: string;
  dateSpent?: string;
  notes?: string;
  bank?: string;
};

export type UpdateBudgetExpenseStatusInput = {
  status: string;
};

export type UpdateBudgetEntryInput = {
  amount: string;
};

export type LedgerFilters = {
  year?: string;
  month?: string;
  payPeriod?: string;
  category?: string;
};

export async function getLedgerRows(
  filters?: LedgerFilters,
): Promise<LedgerRow[]> {
  const params = new URLSearchParams();

  if (filters?.year?.trim()) {
    params.set('year', filters.year.trim());
  }
  if (filters?.month?.trim()) {
    params.set('month', filters.month.trim());
  }
  if (filters?.payPeriod?.trim()) {
    params.set('payPeriod', filters.payPeriod.trim());
  }
  if (filters?.category?.trim()) {
    params.set('category', filters.category.trim());
  }

  const query = params.toString();
  const endpoint = query ? `/api/ledger?${query}` : '/api/ledger';
  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ledger rows (${response.status})`);
  }

  const data = (await response.json()) as Array<LedgerRow & { id: number | string }>;

  return data.map((row) => ({
    ...row,
    id: String(row.id),
  }));
}

export async function getLedgerExpenses(
  filters?: LedgerFilters,
): Promise<ExpenseRow[]> {
  const params = new URLSearchParams();

  if (filters?.year?.trim()) {
    params.set('year', filters.year.trim());
  }
  if (filters?.month?.trim()) {
    params.set('month', filters.month.trim());
  }
  if (filters?.payPeriod?.trim()) {
    params.set('payPeriod', filters.payPeriod.trim());
  }
  if (filters?.category?.trim()) {
    params.set('category', filters.category.trim());
  }

  const query = params.toString();
  const endpoint = query
    ? `/api/ledger/expenses?${query}`
    : '/api/ledger/expenses';
  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ledger expenses (${response.status})`);
  }

  return (await response.json()) as ExpenseRow[];
}

export type PayPeriod = {
  year: string;
  month: string;
  payPeriod: string;
};

export async function getPayPeriods(): Promise<PayPeriod[]> {
  const response = await fetch('/api/ledger/periods', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch pay periods (${response.status})`);
  }
  return (await response.json()) as PayPeriod[];
}

export async function getBudgetDetail(id: string): Promise<BudgetDetailResponse | null> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return null;
  }

  const response = await fetch(`/api/ledger/${encodeURIComponent(trimmedId)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch budget detail (${response.status})`);
  }

  const payload = (await response.json()) as BudgetDetailResponse & {
    row: LedgerRow & { id: number | string };
  };

  return {
    ...payload,
    row: {
      ...payload.row,
      id: String(payload.row.id),
    },
  };
}

export async function createBudgetExpense(
  entryId: string,
  input: CreateBudgetExpenseInput,
): Promise<ExpenseRow> {
  const trimmedId = entryId.trim();
  if (!trimmedId) {
    throw new Error('Missing budget entry id');
  }

  const response = await fetch(
    `/api/ledger/${encodeURIComponent(trimmedId)}/expenses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    let errorMessage = `Failed to create expense (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error?.trim()) {
        errorMessage = payload.error;
      }
    } catch {
      // No-op: keep default error message if response is not JSON.
    }
    throw new Error(errorMessage);
  }

  const payload = (await response.json()) as ExpenseRow & {
    id: string | number;
    dateSpent: string | Date;
  };
  const dateSpent =
    typeof payload.dateSpent === 'string'
      ? payload.dateSpent
      : new Date(payload.dateSpent).toISOString();

  return {
    ...payload,
    id: String(payload.id),
    dateSpent,
  };
}

export async function updateBudgetExpenseStatus(
  expenseId: string,
  input: UpdateBudgetExpenseStatusInput,
): Promise<ExpenseRow> {
  const trimmedExpenseId = expenseId.trim();
  if (!trimmedExpenseId) {
    throw new Error('Missing expense id');
  }

  const response = await fetch(
    `/api/ledger/expenses/${encodeURIComponent(trimmedExpenseId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    let errorMessage = `Failed to update expense (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error?.trim()) {
        errorMessage = payload.error;
      }
    } catch {
      // No-op: keep default error message if response is not JSON.
    }
    throw new Error(errorMessage);
  }

  const payload = (await response.json()) as ExpenseRow & {
    id: string | number;
    dateSpent: string | Date;
  };
  const dateSpent =
    typeof payload.dateSpent === 'string'
      ? payload.dateSpent
      : new Date(payload.dateSpent).toISOString();

  return {
    ...payload,
    id: String(payload.id),
    dateSpent,
  };
}

export async function updateBudgetEntry(
  id: string,
  input: UpdateBudgetEntryInput,
): Promise<LedgerRow> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error('Missing budget row id');
  }

  const response = await fetch(`/api/ledger/${encodeURIComponent(trimmedId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Failed to update budget row (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error?.trim()) {
        errorMessage = payload.error;
      }
    } catch {
      // No-op: keep default error message if response is not JSON.
    }
    throw new Error(errorMessage);
  }

  const payload = (await response.json()) as LedgerRow & { id: string | number };
  return {
    ...payload,
    id: String(payload.id),
  };
}
