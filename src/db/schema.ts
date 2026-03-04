import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const zeroBudgetEntriesTable = pgTable("zero_budget_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  month: text("month"),
  payPeriod: text("pay_period"),
  category: text("category"),
  amount: text("amount"),
  status: text("status"),
  due: text("due"),
  notes: text("notes"),
  year: text("year"),
  bank: text("bank"),
});

export const zeroBudgetExpensesTable = pgTable(
  "zero_budget_expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zeroBudgetEntryId: uuid("zero_budget_entry_id")
      .notNull()
      .references(() => zeroBudgetEntriesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    amount: text("amount").notNull(),
    dateSpent: timestamp("date_spent", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: text("status").notNull(),
    notes: text("notes").notNull().default(""),
    bank: text("bank").notNull(),
  },
  (table) => ({
    zeroBudgetEntryIdx: index("zero_budget_expenses_entry_id_idx").on(
      table.zeroBudgetEntryId,
    ),
  }),
);

// Legacy tables kept for backward-compatible reads while migration rolls out.
export const ledgerTableLegacy = pgTable("ledger", {
  id: integer("id").primaryKey(),
  month: text("Month"),
  payPeriod: text("Pay_Period"),
  category: text("Category"),
  amount: text("Amount"),
  status: text("Status"),
  due: text("Due"),
  notes: text("Notes"),
  year: text("Year"),
  bank: text("Bank"),
});

export const ledgerExpensesTableLegacy = pgTable(
  "ledger_expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ledgerCategory: text("ledger_category").notNull(),
    amount: text("amount").notNull(),
    dateSpent: timestamp("date_spent", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: text("status").notNull(),
    notes: text("notes").notNull().default(""),
    bank: text("bank").notNull(),
  },
  (table) => ({
    ledgerCategoryIdx: index("ledger_expenses_ledger_category_idx").on(
      table.ledgerCategory,
    ),
  }),
);
