import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

beforeAll(async () => {
  // Ensure the database connection works
  await pool.query('SELECT 1');
});

beforeEach(async () => {
  // Clear tables before each test to guarantee isolation
  await pool.query('TRUNCATE TABLE purchases, vehicles, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  // Clean up connection pool
  await pool.end();
});

export { pool };
