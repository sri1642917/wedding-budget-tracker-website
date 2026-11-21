const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { buildWeddingWorkbook } = require('./excelExport');

const app = express();
const PORT = process.env.PORT || 5001;

const WORKSPACE_XLSX = path.resolve(__dirname, '..', 'harsha-divya.xlsx');
const FRONTEND_DIST = path.resolve(__dirname, '..', 'Frontend', 'dist');

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

// Health check & active database info
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'harsha-divya-wedding-budget-api',
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

// Sync directly into workspace harsha-divya.xlsx (local desktop mode)
app.post('/api/sync-excel', async (_req, res) => {
  try {
    if (db.IS_VERCEL) {
      return res.json({
        ok: true,
        skippedLocalSync: true,
        message: 'Running on Vercel serverless — use Export Excel to download the workbook.',
      });
    }
    const data = await db.getBudget();
    const workbook = await buildWeddingWorkbook(data);
    await workbook.xlsx.writeFile(WORKSPACE_XLSX);
    res.json({ ok: true, filePath: WORKSPACE_XLSX });
  } catch (err) {
    handleError(res, err, 'Failed to sync Excel file');
  }
});

// Download Excel (and also update local harsha-divya.xlsx when running locally)
app.get('/api/export-excel', async (_req, res) => {
  try {
    const data = await db.getBudget();
    const workbook = await buildWeddingWorkbook(data);
    if (!db.IS_VERCEL) {
      await workbook.xlsx.writeFile(WORKSPACE_XLSX);
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="harsha-divya-wedding-budget.xlsx"'
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    handleError(res, err, 'Failed to export Excel file');
  }
});

// Serve built Frontend for local single-command startup (Vercel serves Frontend/dist via CDN)
if (!db.IS_VERCEL && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    const info = db.getStorageInfo();
    console.log(
      `Harsha & Divya Wedding Budget Tracker running on http://localhost:${PORT} [${info.label}]`
    );
  });
}

module.exports = app;
