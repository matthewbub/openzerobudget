import { db } from "./index";
import { zeroBudgetEntriesTable } from "./schema";

const ledgerRows = [
  ["March", "1st", "Audible", "-$14.95", "Paid"],
  ["March", "1st", "SoCal Gas", "-$62.59", "Pending"],
  ["March", "1st", "Edison", "-$118.63", "Late"],
  ["March", "1st", "Emergey Fund", "-$287.14", "Not Paid"],
  ["March", "1st", "Savings Home", "-$200.00", "Pending"],
  ["March", "1st", "Frontier", "-$39.00", "Not Paid"],
  ["March", "1st", "AAA", "-$120.00", "Paid"],
  ["March", "1st", "Weed", "-$100.00", "Not Paid"],
  ["March", "1st", "Pets", "-$50.00", "Paid"],
  ["March", "1st", "Food", "-$200.00", "Not Paid"],
  ["March", "1st", "Rent (Mat)", "-$1,550.53", "Paid"],
  ["March", "1st", "Tax Return (Mat)", "$292.48", "Income"],
  ["March", "1st", "Income", "$2,335.41", "Income"],
  ["March", "1st", "Pre-Rent Savings", "$100.00", "Income"],
] as const;

async function main() {
  const rowsToInsert: (typeof zeroBudgetEntriesTable.$inferInsert)[] =
    ledgerRows.map(([month, payPeriod, category, amount, status]) => ({
      month,
      payPeriod,
      category,
      amount,
      status,
      due: "",
      notes: "",
      year: "2026",
      bank: "",
    }));

  if (rowsToInsert.length === 0) {
    console.log("No ledger rows found. Nothing was inserted.");
    return;
  }

  // Keep the seed repeatable; reruns won't duplicate rows.
  await db.delete(zeroBudgetEntriesTable);
  await db.insert(zeroBudgetEntriesTable).values(rowsToInsert);
  console.log(`Seed complete: inserted ${rowsToInsert.length} ledger rows.`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
