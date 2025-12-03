import { Pool } from 'pg';

// Database connection pool - uses same env var as Prisma for consistency
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString,
});

export default pool;
