import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || 'postgresql://amuser:AmMtg2025Secure@localhost:5432/american_mortgage',
});

export default pool;
