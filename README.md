# Harsha & Divya — Hyderabad Wedding Budget Tracker

A clean, modern full-stack web app to plan, visualize, and track **Harsha & Divya's Hyderabad wedding budget** in **Indian Rupees (`₹`)**, built with a soft lavender & royal violet UI, dynamic charts, cloud database support for Vercel, and one-click Excel (`.xlsx`) export.

---

## Key Features
- **5 Live KPI Cards**: Total Budget, Total Estimated, Actual Spend, Remaining Budget, and Advance Paid — formatted in Indian numbering (`₹XX,XX,XXX`) with trend sparklines and over-budget indicators.
- **Dynamic Visualizations**:
  - **Expense Breakdown Donut Chart** with `Actual`, `Estimated`, and `Budget` views + clickable side legend.
  - **Estimated vs Actual Spend Bar Chart** that automatically updates whenever you add, edit, or delete categories or expenses.
- **Extensible Wedding Categories**: Starts with 8 Hyderabad wedding categories (*Convention Venue, Food, Photography & Videography, Staying (Hotels), Transport (Hotel to Venue), Pooja, Pandit, Dhol*) — add, edit, or delete custom categories anytime with icons, colors, and budget caps.
- **Vendor Expense Tracker**: Search and filter by category, payment status (*Paid / Advance Paid / Pending*), or payer (*Harsha / Divya / Shared*), with auto-calculated balance due, quick **Mark Paid**, inline edit/delete, and totals footer.
- **One-Click Excel Export**: Generates a formatted 3-sheet `.xlsx` workbook (*Wedding Summary*, *Category Breakdown*, *All Expenses*) with totals.
- **Flexible Persistent Database**: Works out-of-the-box locally and on **Vercel** with **PostgreSQL** or **Upstash Redis**.

---

## Tech Stack & Structure
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons (`Frontend/`)
- **Backend**: Node.js, Express, ExcelJS, `pg` (`Backend/` & Vercel entrypoint `api/index.js`)

```text
├── Frontend/          # React + Vite + Tailwind dashboard UI
├── Backend/
│   ├── server.js      # Express REST API + Excel export
│   ├── db.js          # Auto-switching DB layer (PostgreSQL / Upstash Redis / Local JSON)
│   ├── excelExport.js # Formatted multi-sheet .xlsx generator
│   └── defaultData.js # Pre-loaded Hyderabad wedding categories & sample data
├── api/index.js       # Vercel Serverless Function entrypoint
├── vercel.json        # Vercel build & /api routing configuration
└── package.json       # Root single-command scripts & API dependencies
```

---

## Run Locally
```bash
# Install dependencies (first time only)
npm run install:all

# Build & run full app on one port (http://localhost:5001)
npm run build && npm start

# Or run Frontend + Backend in live-reload dev mode (http://localhost:5173)
npm run dev
```

---

## Database Storage & Vercel Deployment

| Environment | Where Data Is Saved |
| --- | --- |
| **Local (Mac/PC)** | Saved automatically to `Backend/data/budget.json` (+ synced to `harsha-divya.xlsx` on export) |
| **Vercel (Production)** | Saved dynamically in **PostgreSQL** (`POSTGRES_URL` / `DATABASE_URL`) or **Upstash Redis** (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) |

### Deploy to Vercel in 3 Steps
1. Import this GitHub repo into [Vercel](https://vercel.com/new) (`vercel.json` is pre-configured).
2. In your Vercel project, open **Storage → Create Database** and connect **Neon Postgres** *(recommended, free tier)* or **Upstash Redis**.
3. **Redeploy** once — the app automatically creates the SQL tables (`wedding_settings`, `wedding_categories`, `wedding_expenses`), seeds the 8 default categories on first load, and shows **`PostgreSQL Cloud DB`** in the footer.
