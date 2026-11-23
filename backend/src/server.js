const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db/database');
const { signToken, verifyToken } = require('./auth/auth');
const { buildWeddingWorkbook } = require('./services/excelExport');

const app = express();
const PORT = process.env.PORT || 5001;

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const LOCAL_XLSX = path.join(DATA_DIR, 'wedding-budget.xlsx');
const FRONTEND_DIST = path.resolve(__dirname, '..', '..', 'frontend', 'dist');

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
};

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});
app.use(cors(corsOptions));
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
  res.status(status).json({
    error: err?.message || fallbackMessage,
    ...(err?.suggestions ? { suggestions: err.suggestions } : {}),
  });
}

async function writeLocalExcel(workbook) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  await workbook.xlsx.writeFile(LOCAL_XLSX);
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const token = bearer || String(req.query?.token || '').trim();
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Please sign in to continue' });
    }
    const user = await db.getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return handleError(res, err, 'Authentication failed');
  }
}

// Health check & active database info
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'wedding-budget-api',
    storage: db.getStorageInfo(),
  });
});

// ============================================================================
// Authentication Endpoints
// ============================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await db.registerUser(req.body || {});
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    handleError(res, err, 'Failed to register account');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await db.loginUser(req.body || {});
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    handleError(res, err, 'Failed to sign in');
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const user = await db.resetPasswordWithQuestions(req.body || {});
    res.json({ ok: true, user, message: 'Password reset successful. You can now sign in.' });
  } catch (err) {
    handleError(res, err, 'Failed to reset password');
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    await db.changePassword(req.user.id, req.body || {});
    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (err) {
    handleError(res, err, 'Failed to change password');
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user, storage: db.getStorageInfo() });
});

// ============================================================================
// Protected Per-User Wedding Budget Endpoints
// ============================================================================
app.get('/api/budget', requireAuth, async (req, res) => {
  try {
    const data = await db.getBudget(req.user.id);
    res.json(withMeta(data));
  } catch (err) {
    handleError(res, err, 'Failed to load wedding budget');
  }
});

app.put('/api/settings', requireAuth, async (req, res) => {
  try {
    const data = await db.updateSettings(req.user.id, req.body);
    res.json(withMeta(data));
  } catch (err) {
    handleError(res, err, 'Failed to update settings');
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const result = await db.addCategory(req.user.id, req.body);
    res.status(201).json({ category: result.category, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to add category');
  }
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.updateCategory(req.user.id, req.params.id, req.body);
    res.json({ category: result.category, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to update category');
  }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.deleteCategory(req.user.id, req.params.id);
    res.json({ data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to delete category');
  }
});

app.post('/api/expenses', requireAuth, async (req, res) => {
  try {
    const result = await db.addExpense(req.user.id, req.body);
    res.status(201).json({ expense: result.expense, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to add expense');
  }
});

app.put('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.updateExpense(req.user.id, req.params.id, req.body);
    res.json({ expense: result.expense, data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to update expense');
  }
});

app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.deleteExpense(req.user.id, req.params.id);
    res.json({ data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to delete expense');
  }
});

app.post('/api/reset', requireAuth, async (req, res) => {
  try {
    const mode = req.body?.mode || 'clear-expenses';
    const result = await db.resetBudget(req.user.id, mode);
    res.json({ data: withMeta(result.data) });
  } catch (err) {
    handleError(res, err, 'Failed to reset budget');
  }
});

app.post('/api/sync-excel', requireAuth, async (req, res) => {
  try {
    const data = await db.getBudget(req.user.id);
    const workbook = await buildWeddingWorkbook(data);
    await writeLocalExcel(workbook);
    res.json({ ok: true, filePath: LOCAL_XLSX });
  } catch (err) {
    handleError(res, err, 'Failed to sync Excel file');
  }
});

app.get('/api/export-excel', requireAuth, async (req, res) => {
  try {
    const data = await db.getBudget(req.user.id);
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

// Serve built frontend when frontend/dist exists; otherwise show API status on GET /
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'wedding-budget-api',
      storage: db.getStorageInfo(),
    });
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    const info = db.getStorageInfo();
    console.log(`Wedding Budget Tracker running on http://localhost:${PORT} [${info.label}]`);
  });
}

module.exports = app;
