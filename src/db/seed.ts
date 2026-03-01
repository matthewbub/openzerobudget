import { db } from "./index";
// import ledgerRows from "./ledger.json";
import { ledgerTable } from "./schema";

// If you want to load from a JSON file, uncomment the import above and make sure to create a ledger.json file with the appropriate structure. For now, we'll use hardcoded data for seeding.
const ledgerRows = [
  {
    Month: "January",
    Pay_Period: "1-15",
    Category: "Rent",
    Amount: "2200",
    Status: "Paid",
    Due: "2026-01-01",
    Notes: "Paid via bank transfer",
    Year: "2024",
    Bank: "Bank of America",
  },
] as const;

type LedgerRow = {
  Month: string;
  Pay_Period: string;
  Category: string;
  Amount: string;
  Status: string;
  Due: string;
  Notes: string;
  Year: string;
  Bank: string;
};

async function main() {
  const rowsToInsert: (typeof ledgerTable.$inferInsert)[] = (
    ledgerRows as LedgerRow[]
  ).map((row) => ({
    month: row.Month,
    payPeriod: row["Pay_Period"],
    category: row.Category,
    amount: row.Amount,
    status: row.Status,
    due: row.Due,
    notes: row.Notes,
    year: row.Year,
    bank: row.Bank,
  }));

  if (rowsToInsert.length === 0) {
    console.log("No ledger rows found in JSON. Nothing was inserted.");
    return;
  }

  await db.insert(ledgerTable).values(rowsToInsert);
  console.log(`Seed complete: inserted ${rowsToInsert.length} ledger rows.`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
