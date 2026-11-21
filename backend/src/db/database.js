const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DEFAULT_DATA = require('../config/defaultData');

// Load local .env if present (zero external dependencies)
(function loadDotEnv() {
  const envPaths = [
    path.resolve(__dirname, '..', '..', '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
})();

const IS_VERCEL = Boolean(process.env.VERCEL);
const POSTGRES_CONN =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const KV_KEY = 'wedding_budget:v1';

const LOCAL_DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'budget.json');
const EPHEMERAL_FILE = path.join('/tmp', 'wedding-budget.json');

function getStorageInfo() {
  if (POSTGRES_CONN) {
    return { mode: 'postgres', label: 'PostgreSQL Cloud DB', persistent: true };
  }
  if (KV_URL && KV_TOKEN) {
    return { mode: 'upstash-redis', label: 'Upstash Redis Cloud DB', persistent: true };
  }
  return { mode: 'local-json', label: 'Local Disk DB', persistent: true };
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function deriveStatus(actual, paid, explicitStatus) {
  const act = Number(actual || 0);
  const pd = Number(paid || 0);
  if (explicitStatus && ['Paid', 'Advance Paid', 'Pending'].includes(explicitStatus)) {
    return explicitStatus;
  }
  if (act > 0 && pd >= act) return 'Paid';
  if (pd > 0) return 'Advance Paid';
  return 'Pending';
}

function derivePaidBy(harshaPaid, divyaPaid, fallback = 'Shared') {
  const h = Number(harshaPaid || 0);
  const d = Number(divyaPaid || 0);
  if (h > 0 && d > 0) return 'Shared';
  if (h > 0) return 'Harsha';
  if (d > 0) return 'Divya';
  return ['Harsha', 'Divya', 'Shared'].includes(fallback) ? fallback : 'Shared';
}

function normalizeSplit(exp) {
  const hasExplicit =
    exp.harshaPaid !== undefined || exp.divyaPaid !== undefined;
  let harshaPaid = Math.max(0, Number(exp.harshaPaid || 0));
  let divyaPaid = Math.max(0, Number(exp.divyaPaid || 0));
  let paid = Math.max(0, Number(exp.paid || 0));

  if (hasExplicit) {
    paid = harshaPaid + divyaPaid;
  } else if (paid > 0) {
    if (exp.paidBy === 'Harsha') {
      harshaPaid = paid;
      divyaPaid = 0;
    } else if (exp.paidBy === 'Divya') {
      harshaPaid = 0;
      divyaPaid = paid;
    } else {
      harshaPaid = Math.floor(paid / 2);
      divyaPaid = paid - harshaPaid;
    }
  }
  return {
    harshaPaid,
    divyaPaid,
    paid,
    paidBy: derivePaidBy(harshaPaid, divyaPaid, exp.paidBy),
  };
}

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// ============================================================================
// Driver 1: PostgreSQL (Neon / Supabase / Vercel Postgres)
// ============================================================================
let pgPool = null;
let pgInitPromise = null;

function getPgPool() {
  if (!pgPool) {
    const { Pool } = require('pg');
    const isLocalHost =
      POSTGRES_CONN.includes('localhost') || POSTGRES_CONN.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: POSTGRES_CONN,
      ssl: isLocalHost ? false : { rejectUnauthorized: false },
      max: IS_VERCEL ? 4 : 10,
      idleTimeoutMillis: 10000,
    });
  }
  return pgPool;
}

async function ensurePgSchema() {
  if (pgInitPromise) return pgInitPromise;
  pgInitPromise = (async () => {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wedding_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        couple_names TEXT NOT NULL DEFAULT 'Harsha & Divya',
        subtitle TEXT NOT NULL DEFAULT 'Hyderabad Wedding Budget',
        location TEXT NOT NULL DEFAULT 'Hyderabad, Telangana',
        wedding_date TEXT NOT NULL DEFAULT '',
        target_budget NUMERIC NOT NULL DEFAULT 2000000,
        notes TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE wedding_settings ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wedding_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'Tag',
        color TEXT NOT NULL DEFAULT '#5D2EC2',
        budget_cap NUMERIC NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE wedding_categories ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wedding_expenses (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES wedding_categories(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        vendor TEXT NOT NULL DEFAULT '',
        estimated NUMERIC NOT NULL DEFAULT 0,
        actual NUMERIC NOT NULL DEFAULT 0,
        paid NUMERIC NOT NULL DEFAULT 0,
        harsha_paid NUMERIC NOT NULL DEFAULT 0,
        divya_paid NUMERIC NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        paid_by TEXT NOT NULL DEFAULT 'Shared',
        due_date TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE wedding_expenses ADD COLUMN IF NOT EXISTS harsha_paid NUMERIC NOT NULL DEFAULT 0;`);
    await pool.query(`ALTER TABLE wedding_expenses ADD COLUMN IF NOT EXISTS divya_paid NUMERIC NOT NULL DEFAULT 0;`);

    const existing = await pool.query('SELECT COUNT(*)::int AS cnt FROM wedding_settings');
    if (existing.rows[0].cnt === 0) {
      await seedPgData(pool, cloneDefaultData());
    }
  })().catch((err) => {
    pgInitPromise = null;
    throw err;
  });
  return pgInitPromise;
}

async function seedPgData(pool, seed) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM wedding_expenses');
    await client.query('DELETE FROM wedding_categories');
    await client.query('DELETE FROM wedding_settings');

    const s = seed.settings;
    await client.query(
      `INSERT INTO wedding_settings (id, couple_names, subtitle, location, wedding_date, target_budget, notes)
       VALUES (1, $1, $2, $3, $4, $5, $6)`,
      [
        s.coupleNames || 'Harsha & Divya',
        s.subtitle || 'Hyderabad Wedding Budget',
        s.location || 'Hyderabad, Telangana',
        s.weddingDate || '',
        Number(s.targetBudget) || 0,
        s.notes || '',
      ]
    );

    for (let i = 0; i < seed.categories.length; i += 1) {
      const c = seed.categories[i];
      await client.query(
        `INSERT INTO wedding_categories (id, name, icon, color, budget_cap, notes, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          c.id,
          c.name,
          c.icon || 'Tag',
          c.color || '#5D2EC2',
          Number(c.budgetCap) || 0,
          c.notes || '',
          i,
        ]
      );
    }

    for (let i = 0; i < seed.expenses.length; i += 1) {
      const e = seed.expenses[i];
      const split = normalizeSplit(e);
      // Preserve order: newest first when sorted by created_at DESC
      const createdAt = new Date(Date.now() - i * 1000);
      await client.query(
        `INSERT INTO wedding_expenses
          (id, category_id, title, vendor, estimated, actual, paid, harsha_paid, divya_paid, status, paid_by, due_date, notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          e.id,
          e.categoryId,
          e.title,
          e.vendor || '',
          Number(e.estimated) || 0,
          Number(e.actual) || 0,
          split.paid,
          split.harshaPaid,
          split.divyaPaid,
          deriveStatus(e.actual, split.paid, e.status),
          split.paidBy,
          e.dueDate || '',
          e.notes || '',
          createdAt,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function pgGetBudget() {
  await ensurePgSchema();
  const pool = getPgPool();
  const [settingsRes, categoriesRes, expensesRes] = await Promise.all([
    pool.query('SELECT * FROM wedding_settings WHERE id = 1'),
    pool.query('SELECT * FROM wedding_categories ORDER BY sort_order ASC, created_at ASC'),
    pool.query('SELECT * FROM wedding_expenses ORDER BY created_at DESC'),
  ]);

  const sRow = settingsRes.rows[0];
  const settings = sRow
    ? {
        coupleNames: sRow.couple_names,
        subtitle: sRow.subtitle,
        location: sRow.location,
        weddingDate: sRow.wedding_date,
        targetBudget: Number(sRow.target_budget || 0),
        notes: sRow.notes || '',
      }
    : cloneDefaultData().settings;

  const categories = categoriesRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    budgetCap: Number(r.budget_cap || 0),
    notes: r.notes || '',
  }));

  const expenses = expensesRes.rows.map((r) => {
    const raw = {
      id: r.id,
      categoryId: r.category_id,
      title: r.title,
      vendor: r.vendor,
      estimated: Number(r.estimated || 0),
      actual: Number(r.actual || 0),
      paid: Number(r.paid || 0),
      harshaPaid:
        Number(r.harsha_paid || 0) + Number(r.divya_paid || 0) > 0 || Number(r.paid || 0) === 0
          ? Number(r.harsha_paid || 0)
          : undefined,
      divyaPaid:
        Number(r.harsha_paid || 0) + Number(r.divya_paid || 0) > 0 || Number(r.paid || 0) === 0
          ? Number(r.divya_paid || 0)
          : undefined,
      status: r.status,
      paidBy: r.paid_by,
      dueDate: r.due_date,
      notes: r.notes,
    };
    const split = normalizeSplit(raw);
    return { ...raw, ...split };
  });

  return { settings, categories, expenses };
}

// ============================================================================
// Driver 2: Upstash Redis / Vercel KV (REST API)
// ============================================================================
async function kvCommand(args) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upstash Redis error (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

async function kvReadData() {
  const raw = await kvCommand(['GET', KV_KEY]);
  if (!raw) {
    const fresh = cloneDefaultData();
    await kvCommand(['SET', KV_KEY, JSON.stringify(fresh)]);
    return fresh;
  }
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function kvWriteData(data) {
  await kvCommand(['SET', KV_KEY, JSON.stringify(data)]);
}

// ============================================================================
// Driver 3: Local JSON File (or /tmp fallback on unconfigured Vercel)
// ============================================================================
function getJsonFilePath() {
  return IS_VERCEL ? EPHEMERAL_FILE : LOCAL_DATA_FILE;
}

function ensureJsonFile() {
  const filePath = getJsonFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(cloneDefaultData(), null, 2), 'utf8');
  }
}

function jsonReadData() {
  ensureJsonFile();
  try {
    return JSON.parse(fs.readFileSync(getJsonFilePath(), 'utf8'));
  } catch {
    return cloneDefaultData();
  }
}

function jsonWriteData(data) {
  ensureJsonFile();
  fs.writeFileSync(getJsonFilePath(), JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================================
// Unified Async Repository API
// ============================================================================
async function readDoc() {
  if (KV_URL && KV_TOKEN) return kvReadData();
  return jsonReadData();
}

async function writeDoc(data) {
  if (KV_URL && KV_TOKEN) return kvWriteData(data);
  jsonWriteData(data);
}

async function getBudget() {
  if (POSTGRES_CONN) return pgGetBudget();
  const doc = await readDoc();
  return {
    ...doc,
    expenses: (doc.expenses || []).map((e) => ({
      ...e,
      ...normalizeSplit(e),
    })),
  };
}

async function updateSettings(payload = {}) {
  const { coupleNames, subtitle, location, weddingDate, targetBudget, notes } = payload;

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const current = (await pgGetBudget()).settings;
    const next = {
      coupleNames:
        coupleNames !== undefined
          ? String(coupleNames).trim() || 'Harsha & Divya'
          : current.coupleNames,
      subtitle: subtitle !== undefined ? String(subtitle).trim() : current.subtitle,
      location: location !== undefined ? String(location).trim() : current.location,
      weddingDate:
        weddingDate !== undefined ? String(weddingDate).trim() : current.weddingDate,
      targetBudget:
        targetBudget !== undefined
          ? Math.max(0, Number(targetBudget) || 0)
          : current.targetBudget,
      notes: notes !== undefined ? String(notes).trim() : current.notes || '',
    };
    await pool.query(
      `UPDATE wedding_settings
       SET couple_names = $1, subtitle = $2, location = $3, wedding_date = $4, target_budget = $5, notes = $6, updated_at = NOW()
       WHERE id = 1`,
      [
        next.coupleNames,
        next.subtitle,
        next.location,
        next.weddingDate,
        next.targetBudget,
        next.notes,
      ]
    );
    return pgGetBudget();
  }

  const data = await readDoc();
  data.settings = {
    ...data.settings,
    ...(coupleNames !== undefined
      ? { coupleNames: String(coupleNames).trim() || 'Harsha & Divya' }
      : {}),
    ...(subtitle !== undefined ? { subtitle: String(subtitle).trim() } : {}),
    ...(location !== undefined ? { location: String(location).trim() } : {}),
    ...(weddingDate !== undefined ? { weddingDate: String(weddingDate).trim() } : {}),
    ...(targetBudget !== undefined
      ? { targetBudget: Math.max(0, Number(targetBudget) || 0) }
      : {}),
    ...(notes !== undefined ? { notes: String(notes).trim() } : {}),
  };
  await writeDoc(data);
  return data;
}

async function addCategory(payload = {}) {
  const trimmedName = String(payload.name || '').trim();
  if (!trimmedName) {
    const err = new Error('Category name is required');
    err.statusCode = 400;
    throw err;
  }

  const newCategory = {
    id: makeId('cat'),
    name: trimmedName,
    icon: payload.icon || 'Tag',
    color: payload.color || '#5D2EC2',
    budgetCap: Math.max(0, Number(payload.budgetCap) || 0),
    notes: String(payload.notes || '').trim(),
  };

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const maxSort = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1)::int AS max_sort FROM wedding_categories'
    );
    const nextOrder = maxSort.rows[0].max_sort + 1;
    await pool.query(
      `INSERT INTO wedding_categories (id, name, icon, color, budget_cap, notes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        newCategory.id,
        newCategory.name,
        newCategory.icon,
        newCategory.color,
        newCategory.budgetCap,
        newCategory.notes,
        nextOrder,
      ]
    );
    return { category: newCategory, data: await pgGetBudget() };
  }

  const data = await readDoc();
  data.categories.push(newCategory);
  await writeDoc(data);
  return { category: newCategory, data };
}

async function updateCategory(id, payload = {}) {
  const { name, icon, color, budgetCap, notes } = payload;

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const existingRes = await pool.query('SELECT * FROM wedding_categories WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    const existing = existingRes.rows[0];
    const updated = {
      id,
      name:
        name !== undefined && String(name).trim() ? String(name).trim() : existing.name,
      icon: icon !== undefined ? icon : existing.icon,
      color: color !== undefined ? color : existing.color,
      budgetCap:
        budgetCap !== undefined
          ? Math.max(0, Number(budgetCap) || 0)
          : Number(existing.budget_cap || 0),
      notes: notes !== undefined ? String(notes).trim() : existing.notes || '',
    };
    await pool.query(
      `UPDATE wedding_categories
       SET name = $1, icon = $2, color = $3, budget_cap = $4, notes = $5
       WHERE id = $6`,
      [updated.name, updated.icon, updated.color, updated.budgetCap, updated.notes, id]
    );
    return { category: updated, data: await pgGetBudget() };
  }

  const data = await readDoc();
  const idx = data.categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  const existing = data.categories[idx];
  data.categories[idx] = {
    ...existing,
    ...(name !== undefined && String(name).trim() ? { name: String(name).trim() } : {}),
    ...(icon !== undefined ? { icon } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(budgetCap !== undefined ? { budgetCap: Math.max(0, Number(budgetCap) || 0) } : {}),
    ...(notes !== undefined ? { notes: String(notes).trim() } : {}),
  };
  await writeDoc(data);
  return { category: data.categories[idx], data };
}

async function deleteCategory(id) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const res = await pool.query('DELETE FROM wedding_categories WHERE id = $1 RETURNING id', [id]);
    if (res.rows.length === 0) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    return { data: await pgGetBudget() };
  }

  const data = await readDoc();
  const exists = data.categories.some((c) => c.id === id);
  if (!exists) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  data.categories = data.categories.filter((c) => c.id !== id);
  data.expenses = data.expenses.filter((e) => e.categoryId !== id);
  await writeDoc(data);
  return { data };
}

async function addExpense(body = {}) {
  const title = String(body.title || '').trim();
  if (!title) {
    const err = new Error('Expense title is required');
    err.statusCode = 400;
    throw err;
  }

  const estimated = Math.max(0, Number(body.estimated) || 0);
  const actual = Math.max(0, Number(body.actual) || 0);
  const split = normalizeSplit(body);

  const newExpense = {
    id: makeId('exp'),
    categoryId: body.categoryId,
    title,
    vendor: String(body.vendor || '').trim(),
    estimated,
    actual,
    paid: split.paid,
    harshaPaid: split.harshaPaid,
    divyaPaid: split.divyaPaid,
    status: deriveStatus(actual, split.paid, body.status),
    paidBy: split.paidBy,
    dueDate: String(body.dueDate || '').trim(),
    notes: String(body.notes || '').trim(),
  };

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const catCheck = await pool.query('SELECT id FROM wedding_categories WHERE id = $1', [
      body.categoryId,
    ]);
    if (catCheck.rows.length === 0) {
      const err = new Error('Valid category is required');
      err.statusCode = 400;
      throw err;
    }
    await pool.query(
      `INSERT INTO wedding_expenses
        (id, category_id, title, vendor, estimated, actual, paid, harsha_paid, divya_paid, status, paid_by, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        newExpense.id,
        newExpense.categoryId,
        newExpense.title,
        newExpense.vendor,
        newExpense.estimated,
        newExpense.actual,
        newExpense.paid,
        newExpense.harshaPaid,
        newExpense.divyaPaid,
        newExpense.status,
        newExpense.paidBy,
        newExpense.dueDate,
        newExpense.notes,
      ]
    );
    return { expense: newExpense, data: await pgGetBudget() };
  }

  const data = await readDoc();
  const categoryExists = data.categories.some((c) => c.id === body.categoryId);
  if (!categoryExists) {
    const err = new Error('Valid category is required');
    err.statusCode = 400;
    throw err;
  }
  data.expenses.unshift(newExpense);
  await writeDoc(data);
  return { expense: newExpense, data: await getBudget() };
}

async function updateExpense(id, body = {}) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const existingRes = await pool.query('SELECT * FROM wedding_expenses WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }
    const existing = existingRes.rows[0];
    const existingSplit = normalizeSplit({
      paid: existing.paid,
      harshaPaid:
        Number(existing.harsha_paid || 0) + Number(existing.divya_paid || 0) > 0 ||
        Number(existing.paid || 0) === 0
          ? Number(existing.harsha_paid || 0)
          : undefined,
      divyaPaid:
        Number(existing.harsha_paid || 0) + Number(existing.divya_paid || 0) > 0 ||
        Number(existing.paid || 0) === 0
          ? Number(existing.divya_paid || 0)
          : undefined,
      paidBy: existing.paid_by,
    });
    const estimated =
      body.estimated !== undefined
        ? Math.max(0, Number(body.estimated) || 0)
        : Number(existing.estimated || 0);
    const actual =
      body.actual !== undefined
        ? Math.max(0, Number(body.actual) || 0)
        : Number(existing.actual || 0);

    const hasSplitUpdate = body.harshaPaid !== undefined || body.divyaPaid !== undefined;
    const split = hasSplitUpdate
      ? normalizeSplit({
          harshaPaid:
            body.harshaPaid !== undefined ? body.harshaPaid : existingSplit.harshaPaid,
          divyaPaid:
            body.divyaPaid !== undefined ? body.divyaPaid : existingSplit.divyaPaid,
        })
      : body.paid !== undefined
        ? normalizeSplit({ paid: body.paid, paidBy: body.paidBy || existingSplit.paidBy })
        : existingSplit;

    const updated = {
      id,
      categoryId: body.categoryId !== undefined ? body.categoryId : existing.category_id,
      title:
        body.title !== undefined && String(body.title).trim()
          ? String(body.title).trim()
          : existing.title,
      vendor: body.vendor !== undefined ? String(body.vendor).trim() : existing.vendor,
      estimated,
      actual,
      paid: split.paid,
      harshaPaid: split.harshaPaid,
      divyaPaid: split.divyaPaid,
      status: deriveStatus(actual, split.paid, body.status),
      paidBy: split.paidBy,
      dueDate: body.dueDate !== undefined ? String(body.dueDate).trim() : existing.due_date,
      notes: body.notes !== undefined ? String(body.notes).trim() : existing.notes,
    };

    await pool.query(
      `UPDATE wedding_expenses
       SET category_id=$1, title=$2, vendor=$3, estimated=$4, actual=$5, paid=$6, harsha_paid=$7, divya_paid=$8, status=$9, paid_by=$10, due_date=$11, notes=$12
       WHERE id=$13`,
      [
        updated.categoryId,
        updated.title,
        updated.vendor,
        updated.estimated,
        updated.actual,
        updated.paid,
        updated.harshaPaid,
        updated.divyaPaid,
        updated.status,
        updated.paidBy,
        updated.dueDate,
        updated.notes,
        id,
      ]
    );
    return { expense: updated, data: await pgGetBudget() };
  }

  const data = await readDoc();
  const idx = data.expenses.findIndex((e) => e.id === id);
  if (idx === -1) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }
  const existing = data.expenses[idx];
  const existingSplit = normalizeSplit(existing);
  const estimated =
    body.estimated !== undefined ? Math.max(0, Number(body.estimated) || 0) : existing.estimated;
  const actual =
    body.actual !== undefined ? Math.max(0, Number(body.actual) || 0) : existing.actual;
  const hasSplitUpdate = body.harshaPaid !== undefined || body.divyaPaid !== undefined;
  const split = hasSplitUpdate
    ? normalizeSplit({
        harshaPaid: body.harshaPaid !== undefined ? body.harshaPaid : existingSplit.harshaPaid,
        divyaPaid: body.divyaPaid !== undefined ? body.divyaPaid : existingSplit.divyaPaid,
      })
    : body.paid !== undefined
      ? normalizeSplit({ paid: body.paid, paidBy: body.paidBy || existingSplit.paidBy })
      : existingSplit;

  data.expenses[idx] = {
    ...existing,
    ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
    ...(body.title !== undefined && String(body.title).trim()
      ? { title: String(body.title).trim() }
      : {}),
    ...(body.vendor !== undefined ? { vendor: String(body.vendor).trim() } : {}),
    estimated,
    actual,
    paid: split.paid,
    harshaPaid: split.harshaPaid,
    divyaPaid: split.divyaPaid,
    status: deriveStatus(actual, split.paid, body.status),
    paidBy: split.paidBy,
    ...(body.dueDate !== undefined ? { dueDate: String(body.dueDate).trim() } : {}),
    ...(body.notes !== undefined ? { notes: String(body.notes).trim() } : {}),
  };

  await writeDoc(data);
  return { expense: data.expenses[idx], data: await getBudget() };
}

async function deleteExpense(id) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query('DELETE FROM wedding_expenses WHERE id = $1', [id]);
    return { data: await pgGetBudget() };
  }

  const data = await readDoc();
  data.expenses = data.expenses.filter((e) => e.id !== id);
  await writeDoc(data);
  return { data };
}

async function resetBudget(mode = 'clear-expenses') {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    if (mode === 'restore-sample') {
      await seedPgData(pool, cloneDefaultData());
    } else {
      await pool.query('DELETE FROM wedding_expenses');
    }
    return { data: await pgGetBudget() };
  }

  if (mode === 'restore-sample') {
    const fresh = cloneDefaultData();
    await writeDoc(fresh);
    return { data: fresh };
  }
  const data = await readDoc();
  data.expenses = [];
  await writeDoc(data);
  return { data };
}

module.exports = {
  IS_VERCEL,
  getStorageInfo,
  getBudget,
  updateSettings,
  addCategory,
  updateCategory,
  deleteCategory,
  addExpense,
  updateExpense,
  deleteExpense,
  resetBudget,
};
