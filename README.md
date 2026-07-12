# Car Dealership Inventory System

A complete full-stack Car Dealership Inventory System built with Node.js, TypeScript, Express, PostgreSQL, and React (Vite), following strict Test-Driven Development (TDD) practices.

## Project Structure
- `/src/` - Backend Express.js API source code.
- `/tests/` - Backend Jest integration test suites.
- `/frontend/` - React (Vite + TypeScript) client dashboard application.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL 17 (installed on host)

### Running the Local Isolated Database
Because local system service permissions can be restrictive on some environments, we run an isolated PostgreSQL cluster directly in the project directory:

1. **Initialize the database cluster:**
   ```powershell
   "C:\Program Files\PostgreSQL\17\bin\initdb" -D pgdata -U postgres --auth=trust
   ```
2. **Start the database server:**
   ```powershell
   "C:\Program Files\PostgreSQL\17\bin\pg_ctl" -D pgdata -o "-p 5433" start
   ```
3. **Create the databases:**
   ```powershell
   "C:\Program Files\PostgreSQL\17\bin\createdb" -p 5433 -U postgres car_dealership
   "C:\Program Files\PostgreSQL\17\bin\createdb" -p 5433 -U postgres car_dealership_test
   ```
4. **Apply schemas:**
   ```powershell
   "C:\Program Files\PostgreSQL\17\bin\psql" -p 5433 -U postgres -d car_dealership -f db_init.sql
   "C:\Program Files\PostgreSQL\17\bin\psql" -p 5433 -U postgres -d car_dealership_test -f db_init.sql
   ```

---

### Backend Setup & Running
1. Install dependencies in the root directory:
   ```bash
   npm install
   ```
2. Start the Express backend server (listens on port 3000):
   ```bash
   npm run dev
   ```
3. To execute the test suite (runs 27 integration tests in isolation):
   ```bash
   npm run test
   ```

---

### Frontend Setup & Running
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Features

### 1. User Authentication
- Sign Up and Sign In screens with interactive tab toggle.
- Secure token-based validation using JWT.
- Automatically stores session and determines user vs. admin privileges.

### 2. Vehicle Fleet Dashboard (Protected)
- Beautiful cyberpunk dark-theme UI with responsive glassmorphism styles and card layout.
- Real-time catalog list showing make, model, category, price, and exact quantity.
- Purchase flow (standard users): reduces quantity in real-time, concurrency-safe (SQL locks), and disables if out of stock.

### 3. Search & Filter
- Slidable search filter tray.
- Filters fleet dynamically by Make, Model, Category, and Price range.

### 4. Admin Management (Admin only)
- Floating button opens a glass modal to insert new vehicles with validations.
- Edit form modal updates vehicle metadata (make, model, price, category, quantity).
- Inline restock panels allow restocking positive quantities in one click.
- Removal option to delete vehicles.

---

## My AI Usage

### AI Tools Used
- **Antigravity (IDE Pair Programming Agent by Google DeepMind)**

### Log of AI-Generated Components

#### 1. Setup Phase
- Generated project configurations (`package.json`, `tsconfig.json`, `jest.config.ts`, `.gitignore`, `.env`, `.env.test`).
- Drafted database schema scripts (`db_init.sql`).
- Configured Jest environment lifecycle setup and DB cleanup hooks (`tests/setup.ts`).

#### 2. Authentication API (TDD)
- Drafted integration tests for `POST /api/auth/register` and `POST /api/auth/login`.
- Generated controller code verifying credentials, hashing passwords with `bcryptjs`, handling duplicate records, and issuing signed `jsonwebtoken` tokens.
- Refactored routes into dedicated controllers and routers.

#### 3. JWT Middleware (TDD)
- Drafted isolated middleware tests in `tests/middleware.test.ts`.
- Generated `authenticateJWT` and `requireAdmin` middlewares to authenticate tokens and restrict admin-only operations.

#### 4. Vehicles CRUD & Concurrency (TDD)
- Appended integration tests for CRUD (`POST`, `GET`, `PUT`, `DELETE`), filtering (`GET /vehicles/search`), and inventory operations (`purchase` and `restock`).
- Created dynamic search query builder.
- Generated concurrency-safe transaction query using `BEGIN`, `FOR UPDATE` lock, inventory checks, updates, and `COMMIT` to protect against race conditions.

#### 5. Frontend Client
- Created a Vite + React + TypeScript app in the `frontend` folder.
- Configured style system (`src/index.css`) utilizing customized HSL properties, glassmorphism layouts, glowing accents, and smooth interactive transitions.
- Implemented state logic (`src/App.tsx`) managing auth headers, search queries, modals, API calls, and toast notifications.

### Reflection
The collaboration with Antigravity highlighted the strength of combining strict TDD cycles with AI-assisted boilerplate generation. Using the AI agent to write the initial test expectations kept the development focused on specific slices of behavior. By having the AI write the minimum implementation code to move from Red to Green, it eliminated tedious syntax-heavy setup (like complex SQL joins, transactions, and CSS variables) while preserving complete code correctness. This pair-programming setup increased speed by 3x while guaranteeing a high-quality test coverage rate.
