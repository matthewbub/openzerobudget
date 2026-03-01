## Setup

Clone the repo, then copy the example.env.local into .env.local. Add your database connection string.

```shell
pnpm install
pnpm run dev
```

## Database

Using Drizzle with Postgres (Neon.com). To modify the database schema, you'd go to the /db/schema.ts as opposed to writing your own migration. Then, run `npx drizzle-kit generate` to auto-generate the schema. Review manually, if taking destructive actions you might need to intervene and handle edge cases as needed.

```shell
# generate migrations after making changes
npx drizzle-kit generate

# run migraitons against database
npx drizzle-kit migrate
```
