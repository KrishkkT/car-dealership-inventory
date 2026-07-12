import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables (useful for dev/prod runtime)
dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
