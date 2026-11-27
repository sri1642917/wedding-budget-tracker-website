# Wedding Budget Tracker

**Live Demo**: [https://wedding-budget-tracker-website-fron.vercel.app/](https://wedding-budget-tracker-website-fron.vercel.app/)

A clean, modern full-stack web application to plan, visualize, and track a **wedding budget** in **Indian Rupees (`₹`)**, featuring a soft lavender & royal violet UI, dynamic charts, multi-user authentication, flexible database storage, and one-click Excel (`.xlsx`) export.

---

## Key Features
- **3 Live KPI Cards**: Total Spend, Paid So Far (`% settled`), and Balance Due — exact figures formatted in Indian numbering (`₹XX,XX,XXX`) with trend sparklines.
- **Dynamic Visualizations**:
  - **Expense Breakdown Donut Chart** with `Spend` and `Budget` views + clickable side legend.
  - **Spend vs Paid by Category Bar Chart** that automatically updates whenever you add, edit, or delete categories or expenses.
- **Extensible Wedding Categories**: Starts with 8 core categories (*Convention Venue, Food, Photography & Videography, Staying (Hotels), Transport (Hotel to Venue), Pooja, Pandit, Dhol*) — add, edit, or delete custom categories anytime with custom icons, colors, and budget caps.
- **Wedding Expense Tracker**: Search and filter by category, payment status (*Paid / Advance Paid / Pending*), or payer, with auto-calculated balance due, 1-click inline comments, quick **Mark Paid**, edit/delete, and totals footer.
- **One-Click Excel Export**: Downloads a formatted 3-sheet `.xlsx` report (*Wedding Summary*, *Category Breakdown*, *All Expenses*) with totals.
- **Multi-User Accounts & Security**: Register, Sign In, Forgot Password (4 security questions: Favourite Place, Colour, Food, First School), Change Password, and strict per-user data isolation.
- **Flexible Database Storage**: Saves locally in `backend/data/budget.json` by default, or automatically connects to **PostgreSQL** (`DATABASE_URL`) / **Upstash Redis** when configured.

---

## Project Structure
```text
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── defaultData.js   # Default wedding categories & sample entries
│   │   ├── db/
│   │   │   └── database.js      # PostgreSQL / Upstash Redis / Local JSON driver
│   │   ├── services/
│   │   │   └── excelExport.js   # Formatted multi-sheet Excel generator
│   │   └── server.js            # Express REST API & static frontend server
│   ├── .env.example             # Optional cloud DB environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # API client wrapper
│   │   ├── components/          # Modular React UI components & modals
│   │   ├── utils/format.js      # INR formatting, icons & badge helpers
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2. Run Locally (Development Mode)
In terminal 1 (Backend API on port `5001`):
```bash
npm --prefix backend run dev
```
In terminal 2 (Frontend UI on port `5173`):
```bash
npm --prefix frontend run dev
```
Open **http://localhost:5173** in your browser.

### Or Run as a Single Server (Production Build)
```bash
npm --prefix frontend run build
npm --prefix backend start
```
Open **http://localhost:5001** in your browser.

---

## How Data Storage & Backend Architecture Works

The application provides a seamless dual-layer architecture designed for zero-config local development, instant multi-device cloud synchronization, and massive production scaling:

### 1. Live Production Deployment (Vercel + Multi-Device Cloud KV)
When accessed via the live Vercel production URL:
- **Client-Side Encryption**: User credentials never travel or store in plaintext. Passwords and security answers are irreversibly hashed using multi-round salted cryptographic hashes (`pwd`, `sq:<q>`), while usernames and partner names are cipher-encrypted (`enc1:`).
- **Direct Cloud Key-Value Store (`keyvalue.immanuel.co`)**:
  - **Account Credentials**: Saved deterministically under `u_<usernameHash16>` (holding encrypted username, partner names, password hash, security hashes, and chunk index).
  - **Budget & Expense Payload**: Encoded using compact JSON delta serialization and partitioned into small chunks (`b_<usernameHash12>_0`, `b_<usernameHash12>_1`, etc.) to stay well within network transport limits.
  - **Fast Multi-Device Sync**: Any account registered on a PC is immediately accessible from a mobile phone (or any other browser) in **1 compact request**.
  - **Cold-Start Pre-Warming & Auto-Retry**: Built-in 6x backoff retry recovery and background pinging eliminate 503 wake-up delays on mobile networks.
- **Browser LocalStorage Cache**: Provides instant offline fallback and page load acceleration (`wedding_budget_multiuser_v4`) guarded by timestamp conflict resolution (`updatedAt`).

### 2. Local Backend Server (`localhost:5001`)
When running locally via `npm --prefix backend start`:
- **Local Disk DB**: Persists multi-user accounts and wedding budgets directly in `backend/data/budget.json`.
- **JWT Authentication**: Protected REST endpoints (`/api/budget`, `/api/categories`, `/api/expenses`, `/api/settings`) authenticated via standard Bearer tokens.
- **Excel Generator**: Powers the native `/api/export-excel` multi-sheet `.xlsx` workbook generation.

### 3. Scaling to 50k – 5 Lakh Users (Neon PostgreSQL / Upstash Redis)
For large-scale enterprise production:
- Our backend database layer (`backend/src/db/database.js`) comes pre-equipped with native drivers and optimized schema indexes (`idx_wedding_categories_user_sort`, `idx_wedding_expenses_user_created`).
- Simply connect **Neon PostgreSQL** or **Upstash Redis** in your Vercel Dashboard Storage settings—the app automatically detects `POSTGRES_URL` or `KV_REST_API_URL` and switches to the managed cloud database with zero code modifications.

---

## Database Storage
- **Live Vercel Site**: Syncs across devices via the Cloud Key-Value service + encrypted local storage cache.
- **Local Development**: Saves automatically to `backend/data/budget.json`.
- **Enterprise Cloud DB (Optional)**: Connect PostgreSQL (`POSTGRES_URL` / `DATABASE_URL`) or Upstash Redis (`UPSTASH_REDIS_REST_URL`) for automatic high-volume table indexing and persistence.
