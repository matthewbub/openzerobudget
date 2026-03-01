import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const ledgerTable = pgTable("ledger", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
