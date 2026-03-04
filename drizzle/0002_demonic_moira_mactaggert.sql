DO $$
BEGIN
	IF to_regclass('public.ledger_expenses') IS NOT NULL
		AND to_regclass('public.ledger_expenses_old') IS NULL THEN
		ALTER TABLE "ledger_expenses" RENAME TO "ledger_expenses_old";
	END IF;
END $$;
--> statement-breakpoint
ALTER INDEX IF EXISTS "ledger_expenses_ledger_category_idx" RENAME TO "ledger_expenses_old_ledger_category_idx";

CREATE TABLE IF NOT EXISTS "ledger_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ledger_category" text NOT NULL,
	"amount" text NOT NULL,
	"date_spent" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"bank" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zero_budget_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month" text,
	"pay_period" text,
	"category" text,
	"amount" text,
	"status" text,
	"due" text,
	"notes" text,
	"year" text,
	"bank" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zero_budget_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zero_budget_entry_id" uuid NOT NULL,
	"amount" text NOT NULL,
	"date_spent" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"bank" text NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'ledger'
			AND column_name = 'id'
			AND is_identity = 'YES'
	) THEN
		ALTER TABLE "ledger" ALTER COLUMN "id" DROP IDENTITY;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'zero_budget_expenses_zero_budget_entry_id_zero_budget_entries_id_fk'
	) THEN
		ALTER TABLE "zero_budget_expenses"
		ADD CONSTRAINT "zero_budget_expenses_zero_budget_entry_id_zero_budget_entries_id_fk"
		FOREIGN KEY ("zero_budget_entry_id")
		REFERENCES "public"."zero_budget_entries"("id")
		ON DELETE cascade
		ON UPDATE cascade;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ledger_expenses_ledger_category_idx" ON "ledger_expenses" USING btree ("ledger_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zero_budget_expenses_entry_id_idx" ON "zero_budget_expenses" USING btree ("zero_budget_entry_id");

--> migragte old data to new table
DO $$
BEGIN
	IF to_regclass('public.ledger_expenses_old') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM "ledger_expenses") THEN
		EXECUTE 'INSERT INTO "ledger_expenses" ("ledger_category", "amount", "date_spent", "status", "notes", "bank")
			SELECT "ledger_category", "amount", "date_spent", "status", "notes", "bank"
			FROM "ledger_expenses_old"';
	END IF;
END $$;
