import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Make sure .env.local is loaded.');
}

const db = drizzle(process.env.DATABASE_URL);

async function runMigrations() {
  console.log('[v0] Starting database migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[v0] ✓ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] ✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
