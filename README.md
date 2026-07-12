# Car Dealership Inventory System

A full-stack Car Dealership Inventory System built with Node.js, TypeScript, Express, PostgreSQL, and React, following strict Test-Driven Development (TDD) practices.

## Project Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL 17 (installed on host)

### Running the Local Isolated Database
Because local system service permissions can be restrictive, we initialize and run an isolated PostgreSQL cluster directly within the project's workspace:

1. **Initialize the database cluster:**
   ```bash
   "C:\Program Files\PostgreSQL\17\bin\initdb" -D pgdata -U postgres --auth=trust
   ```
2. **Start the database server:**
   ```bash
   "C:\Program Files\PostgreSQL\17\bin\pg_ctl" -D pgdata -o "-p 5433" start
   ```
3. **Create the databases:**
   ```bash
   "C:\Program Files\PostgreSQL\17\bin\createdb" -p 5433 -U postgres car_dealership
   "C:\Program Files\PostgreSQL\17\bin\createdb" -p 5433 -U postgres car_dealership_test
   ```
4. **Apply database schema schemas:**
   ```bash
   "C:\Program Files\PostgreSQL\17\bin\psql" -p 5433 -U postgres -d car_dealership -f db_init.sql
   "C:\Program Files\PostgreSQL\17\bin\psql" -p 5433 -U postgres -d car_dealership_test -f db_init.sql
   ```

### Backend Installation & Testing
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run test suite:
   ```bash
   npm run test
   ```

---

## My AI Usage

### AI Tools Used
- **Antigravity (IDE Agent)**

### Log of AI-Generated Components

#### Setup Phase (Current State)
- **Drafted Boilerplate Configuration:**
  - `package.json`, `tsconfig.json`, `jest.config.ts`, `.env`, and `.env.test` configuration files.
  - SQL schema initialization script (`db_init.sql`).
- **Drafted Test Files:**
  - Jest environment configuration and DB cleanup hook (`tests/setup.ts`).
  - First failing integration test case for user registration (`tests/auth.test.ts`).
- **Troubleshooting & Commands:**
  - Diagnosed Windows service permission issues and set up the isolated PostgreSQL cluster on port 5433.
