import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

function getSslConfig(connectionString: string): { rejectUnauthorized: false } | false | undefined {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get('sslmode');
    
    if (sslmode === 'require') {
      return { rejectUnauthorized: false };
    }
  } catch {}
  
  return undefined;
}

function removeSslModeFromConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return connectionString.replace(/[?&]sslmode=[^&]*/g, '');
  }
}

const sslConfig = getSslConfig(process.env.DATABASE_URL);
const connectionString = sslConfig !== undefined && sslConfig !== false
  ? removeSslModeFromConnectionString(process.env.DATABASE_URL)
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
});

const db = drizzle(pool);

export { db };
