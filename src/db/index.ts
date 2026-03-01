import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Make sure .env.local is loaded.');
}

export const db = drizzle(process.env.DATABASE_URL);
