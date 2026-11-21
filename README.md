# Wedding Budget Tracker — Hyderabad Edition

A clean, modern full-stack web application to plan, visualize, and track a **Hyderabad wedding budget** in **Indian Rupees (`₹`)**, featuring a soft lavender & royal violet UI, dynamic charts, cloud database support for Vercel, and one-click Excel (`.xlsx`) export.

---

## Key Features
- **5 Live KPI Cards**: Total Budget, Total Estimated, Actual Spend, Remaining Budget, and Advance Paid — formatted in Indian numbering (`₹XX,XX,XXX`) with trend sparklines and over-budget alerts.
- **Dynamic Visualizations**:
  - **Expense Breakdown Donut Chart** with `Actual`, `Estimated`, and `Budget` views + clickable side legend.
  - **Estimated vs Actual Spend Bar Chart** that automatically reflects every category and expense added or updated.
- **Extensible Wedding Categories**: Starts with 8 core categories (*Convention Venue, Food, Photography & Videography, Staying (Hotels), Transport (Hotel to Venue), Pooja, Pandit, Dhol*) — add, edit, or delete custom categories anytime with custom icons, colors, and budget caps.
- **Vendor Expense Tracker**: Search and filter by category, payment status (*Paid / Advance Paid / Pending*), or payer, with auto-calculated balance due, quick **Mark Paid**, inline edit/delete, and totals footer.
- **One-Click Excel Export**: Downloads a formatted 3-sheet `.xlsx` report (*Wedding Summary*, *Category Breakdown*, *All Expenses*) with totals.
- **Flexible Persistent Database**: Automatically uses **PostgreSQL** or **Upstash Redis** on **Vercel**, and local disk storage during local development.

---

## Project Structure
```text
├── api/
│   └── index.js                 # Vercel Serverless Function entrypoint (/api/*)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── defaultData.js   # Default wedding categories & sample entries
│   │   ├── db/
│   │   │   └── database.js      # PostgreSQL / Upstash Redis / Local JSON driver
│   │   ├── services/
│   │   │   └── excelExport.js   # Formatted multi-sheet Excel generator
│   │   └── server.js            # Express REST API & local static server
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
├── docs/
│   └── design-mockup.png        # Reference UI design
├── scripts/
│   └── dev.js                   # Concurrent local dev launcher
├── .env.example                 # Cloud DB environment variable template
├── package.json                 # Root scripts & serverless API dependencies
└── vercel.json                  # Vercel build & routing config
```

---

## Run Locally
```bash
# Install dependencies (first time only)
npm run install:all

# Build & run full app on a single port (http://localhost:5001)
npm run build && npm start

# Or run Frontend + Backend in live-reload dev mode (http://localhost:5173)
npm run dev
```

---

## Database Storage & Vercel Deployment

| Environment | Where Data Is Saved |
| --- | --- |
| **Local (Mac/PC)** | Saved locally in `backend/data/budget.json` (gitignored) & local Excel exports in `exports/wedding-budget.xlsx` |
| **Vercel (Production)** | Saved dynamically in **PostgreSQL** (`POSTGRES_URL` / `DATABASE_URL`) or **Upstash Redis** (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) |

### Deploy to Vercel in 3 Steps
1. Import this GitHub repository into [Vercel](https://vercel.com/new) (`vercel.json` is pre-configured).
2. Open your Vercel project → **Storage → Create Database** → connect **Neon Postgres** *(recommended, free tier)* or **Upstash Redis**.
3. **Redeploy** once — the app automatically creates the SQL tables (`wedding_settings`, `wedding_categories`, `wedding_expenses`), seeds the 8 default categories on first load, and shows **`PostgreSQL Cloud DB`** in the footer.
