const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db/database');
const { buildWeddingWorkbook } = require('./services/excelExport');

const app = express();
const PORT = process.env.PORT || 5001;

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const LOCAL_XLSX = path.join(DATA_DIR, 'wedding-budget.xlsx');
const FRONTEND_DIST = path.resolve(__dirname, '..', '..', 'frontend', 'dist');

app.use(cors());
app.use(express.json());

function withMeta(data) {
  return {
    ...data,
    _meta: db.getStorageInfo(),
  };
}

function handleError(res, err, fallbackMessage) {
  const status = err?.statusCode || 500;
  if (status >= 500) {
    console.error(fallbackMessage, err);
  }
  res.status(status).json({ error: err?.message || fallbackMessage });
}

async function writeLocalExcel(workbook) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  await workbook.xlsx.writeFile(LOCAL_XLSX);
}

// Health check & active database info
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'wedding-budget-api',
    storage: db.getStorageInfo(),
  });
});

// Get full budget state
app.get('/api/budget', async (_req, res) => {
  try {
    const data = await db.getBudget();
    res.json(withMeta(data));
  } catch (err) {
    handleError(res, err, 'Failed to load wedding budget');
  }
});

// Update wedding settings
app.put('/api/settings', async (req, res) => {
  try {
    const data = await db.updateSettings(req.body);
    res.json(withMeta(data));
  } catch (err) {
    handleError(res, err, 'Failed to update settings');
  }
});

// Add category
app.post('/api/categories', async (req, res) => {
  try {
    const result = await db.addCategory(req.body);
    res.status(201).json({ category: result.category, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to add category');
  }
});

// Update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const result = await db.updateCategory(req.params.id, req.body);
    res.json({ category: result.category, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to update category');
  }
});

// Delete category (and its expenses)
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const result = await db.deleteCategory(req.params.id);
    res.json({ data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to delete category');
  }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  try {
    const result = await db.addExpense(req.body);
    res.status(201).json({ expense: result.expense, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to add expense');
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const result = await db.updateExpense(req.params.id, req.body);
    res.json({ expense: result.expense, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to update expense');
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const result = await db.deleteExpense(req.params.id);
    res.json({ data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to delete expense');
  }
});

// Clear all expenses OR restore sample data
app.post('/api/reset', async (req, res) => {
  try {
    const mode = req.body?.mode || 'clear-expenses';
    const result = await db.resetBudget(mode);
    res.json({ data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to reset budget');
  }
});

// Sync Excel workbook locally (backend/data/wedding-budget.xlsx)
app.post('/api/sync-excel', async (_req, res) => {
  try {
    const data = await db.getBudget();
    const workbook = await buildWeddingWorkbook(data);
    await writeLocalExcel(workbook);
    res.json({ ok: true, filePath: LOCAL_XLSX });
  } catch (err) {
    handleError(res, err, 'Failed to sync Excel file');
  }
});

// Download formatted Excel workbook
app.get('/api/export-excel', async (_req, res) => {
  try {
    const data = await db.getBudget();
    const workbook = await buildWeddingWorkbook(data);
    try {
      await writeLocalExcel(workbook);
    } catch {
      // Ignore disk write failure on read-only hosts; still stream download
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="wedding-budget.xlsx"'
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    handleError(res, err, 'Failed to export Excel file');
  }
});

// Serve built frontend when frontend/dist exists
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    const info = db.getStorageInfo();
    console.log(`Wedding Budget Tracker running on http://localhost:${PORT} [${info.label}]`);
  });
}

module.exports = app;
