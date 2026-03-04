import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Make sure .env.local is loaded.');
}

async function runMigrations() {
  console.log('[v0] Starting database migrations...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    const client = await pool.connect();
    
    try {
      // Read migration files
      const migrationsDir = path.join(process.cwd(), 'drizzle');
      const files = await fs.readdir(migrationsDir);
      const sqlFiles = files
        .filter(f => f.endsWith('.sql') && !f.startsWith('meta'))
        .sort();
      
      console.log(`[v0] Found ${sqlFiles.length} migration files`);
      
      for (const file of sqlFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf-8');
        
        console.log(`[v0] Running migration: ${file}`);
        await client.query(sql);
        console.log(`[v0]   ✓ ${file} completed`);
      }
      
      console.log('[v0] ✓ All migrations completed successfully!');
      process.exit(0);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[v0] ✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
