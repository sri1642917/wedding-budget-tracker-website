# Wedding Budget Tracker — Hyderabad Edition

A clean, modern full-stack web application to plan, visualize, and track a **Hyderabad wedding budget** in **Indian Rupees (`₹`)**, featuring a soft lavender & royal violet UI, dynamic charts, flexible database storage, and one-click Excel (`.xlsx`) export.

---

## Key Features
- **3 Live KPI Cards**: Total Spend, Paid So Far (`% settled`), and Balance Due — exact figures formatted in Indian numbering (`₹XX,XX,XXX`) with trend sparklines.
- **Dynamic Visualizations**:
  - **Expense Breakdown Donut Chart** with `Spend` and `Budget` views + clickable side legend.
  - **Spend vs Paid by Category Bar Chart** that automatically updates whenever you add, edit, or delete categories or expenses.
- **Extensible Wedding Categories**: Starts with 8 core categories (*Convention Venue, Food, Photography & Videography, Staying (Hotels), Transport (Hotel to Venue), Pooja, Pandit, Dhol*) — add, edit, or delete custom categories anytime with custom icons, colors, and budget caps.
- **Wedding Expense Tracker**: Search and filter by category, payment status (*Paid / Advance Paid / Pending*), or payer, with auto-calculated balance due, 1-click inline comments, quick **Mark Paid**, edit/delete, and totals footer.
- **One-Click Excel Export**: Downloads a formatted 3-sheet `.xlsx` report (*Wedding Summary*, *Category Breakdown*, *All Expenses*) with totals.
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

## Database Storage
- **Default (Zero Setup)**: Data saves automatically to `backend/data/budget.json`.
- **Cloud Database (Optional)**: Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` (PostgreSQL) or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — tables are created and seeded automatically on first start.
