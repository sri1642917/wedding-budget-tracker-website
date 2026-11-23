const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DEFAULT_DATA = require('../config/defaultData');
const {
  normalizeUsername,
  validateUsername,
  hashUsername,
  encryptField,
  decryptField,
  hashSecret,
  verifySecret,
} = require('../auth/auth');

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
const KV_KEY = 'wedding_budget:v2';
const LEGACY_KV_KEY = 'wedding_budget:v1';

const LOCAL_DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'budget.json');
const EPHEMERAL_FILE = path.join('/tmp', 'wedding-budget.json');

const ADMIN_USER_ID = 'user-admin';

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

function normalizePayerMode(mode) {
  if (mode === 'groom' || mode === 'bride' || mode === 'both') return mode;
  return 'both';
}

function parseCoupleNames(coupleNames, groomName, brideName) {
  let cleanGroom = String(groomName || '').trim();
  let cleanBride = String(brideName || '').trim();
  const raw = String(coupleNames || '').trim();

  if (!cleanGroom || !cleanBride) {
    if (raw.includes('&')) {
      const [g, b] = raw.split('&').map((s) => s.trim());
      cleanGroom = cleanGroom || g || 'Groom';
      cleanBride = cleanBride || b || 'Bride';
    } else {
      cleanGroom = cleanGroom || raw || 'Groom';
      cleanBride = cleanBride || 'Bride';
    }
  }

  // Case B: If Groom and Bride share the exact same name (e.g., Kiran & Kiran), disambiguate labels
  const baseGroom = cleanGroom.replace(/\s*\(Groom\)$/i, '').trim();
  const baseBride = cleanBride.replace(/\s*\(Bride\)$/i, '').trim();
  if (baseGroom && baseBride && baseGroom.toLowerCase() === baseBride.toLowerCase()) {
    cleanGroom = `${baseGroom} (Groom)`;
    cleanBride = `${baseBride} (Bride)`;
  }

  return {
    groomName: cleanGroom,
    brideName: cleanBride,
    coupleNames:
      raw ||
      (baseGroom && baseBride ? `${baseGroom} & ${baseBride}` : 'My Wedding'),
  };
}

function buildUsernameSuggestions(cleanUsername, groomName, brideName) {
  const gSlug = String(groomName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const bSlug = String(brideName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const base = (
    cleanUsername ||
    (gSlug && bSlug ? `${gSlug}_${bSlug}` : 'wedding_couple')
  ).slice(0, 22);
  const suffixNum = Math.floor(10 + Math.random() * 89);
  return [
    `${base}_2027`,
    gSlug && bSlug ? `${gSlug}.${bSlug}${suffixNum}` : `${base}_${suffixNum}`,
    `${base}_${suffixNum + 1}`,
  ];
}

function normalizeSplit(exp) {
  const hasExplicit = exp.harshaPaid !== undefined || exp.divyaPaid !== undefined;
  let harshaPaid = Math.max(0, Number(exp.harshaPaid || 0));
  let divyaPaid = Math.max(0, Number(exp.divyaPaid || 0));
  let paid = Math.max(0, Number(exp.paid || 0));

  if (hasExplicit) {
    paid = harshaPaid + divyaPaid;
  } else if (paid > 0) {
    if (exp.paidBy === 'Harsha' || exp.paidBy === 'Groom') {
      harshaPaid = paid;
      divyaPaid = 0;
    } else if (exp.paidBy === 'Divya' || exp.paidBy === 'Bride') {
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

function buildFreshUserBudget(displayName, groomName = '', brideName = '') {
  const base = cloneDefaultData();
  const parsed = parseCoupleNames(displayName, groomName, brideName);
  return {
    settings: {
      coupleNames: parsed.coupleNames,
      groomName: parsed.groomName,
      brideName: parsed.brideName,
      subtitle: 'Wedding Budget Tracker',
      location: '',
      weddingDate: '',
      targetBudget: 0,
      notes: '',
    },
    categories: base.categories.map((c) => ({
      ...c,
      id: makeId('cat'),
      payerMode: normalizePayerMode(c.payerMode),
      notes: '',
    })),
    expenses: [],
  };
}

function createAdminUserRecord() {
  return {
    id: ADMIN_USER_ID,
    usernameHash: hashUsername('admin'),
    usernameEnc: encryptField('admin'),
    displayName: 'Harsha & Divya',
    groomName: 'Harsha',
    brideName: 'Divya',
    passwordHash: hashSecret('admin@123'),
    securityPlaceHash: hashSecret('hyderabad', true),
    securityColorHash: hashSecret('purple', true),
    securityFoodHash: hashSecret('biryani', true),
    securitySchoolHash: hashSecret('delhi public school', true),
    createdAt: new Date().toISOString(),
  };
}

function sanitizeUser(u) {
  if (!u) return null;
  const plainUsername = u.usernameEnc
    ? decryptField(u.usernameEnc, 'user')
    : u.username || 'user';
  const parsed = parseCoupleNames(u.displayName, u.groomName, u.brideName);
  return {
    id: u.id,
    username: plainUsername,
    displayName: parsed.coupleNames,
    groomName: parsed.groomName,
    brideName: parsed.brideName,
  };
}

function upgradeUserRecordEncryption(u) {
  let changed = false;
  const copy = { ...u };
  if (copy.username && !copy.usernameHash) {
    const clean = normalizeUsername(copy.username);
    copy.usernameHash = hashUsername(clean);
    copy.usernameEnc = encryptField(clean);
    delete copy.username;
    changed = true;
  } else if (copy.username) {
    delete copy.username;
    changed = true;
  }
  if (!copy.groomName || !copy.brideName) {
    const parsed = parseCoupleNames(copy.displayName, copy.groomName, copy.brideName);
    copy.groomName = parsed.groomName;
    copy.brideName = parsed.brideName;
    copy.displayName = parsed.coupleNames;
    changed = true;
  }
  return { user: copy, changed };
}

function normalizeUserBudgetDoc(doc) {
  if (!doc) return cloneDefaultData();
  const rawSettings = { ...(doc.settings || cloneDefaultData().settings) };
  if (rawSettings.weddingDate === '2027-02-14') {
    rawSettings.weddingDate = '2027-03-24';
  }
  if (
    rawSettings.subtitle === 'Hyderabad Wedding Budget' ||
    rawSettings.subtitle === 'Hyderabad Wedding Budget Tracker'
  ) {
    rawSettings.subtitle = 'Wedding Budget Tracker';
  }
  const parsedNames = parseCoupleNames(
    rawSettings.coupleNames,
    rawSettings.groomName,
    rawSettings.brideName
  );
  rawSettings.coupleNames = parsedNames.coupleNames;
  rawSettings.groomName = parsedNames.groomName;
  rawSettings.brideName = parsedNames.brideName;

  return {
    settings: rawSettings,
    categories: (Array.isArray(doc.categories) ? doc.categories : []).map((c) => ({
      ...c,
      payerMode: normalizePayerMode(c.payerMode),
    })),
    expenses: (Array.isArray(doc.expenses) ? doc.expenses : []).map((e) => ({
      ...e,
      ...normalizeSplit(e),
    })),
  };
}

// Upgrade legacy single-user document or plaintext user records into encrypted multi-user v2 structure
function migrateToMultiUserDoc(rawDoc) {
  if (rawDoc && rawDoc.version === 2 && Array.isArray(rawDoc.users) && rawDoc.budgets) {
    let migrated = false;
    if (rawDoc.users.length === 0) {
      const admin = createAdminUserRecord();
      rawDoc.users.push(admin);
      rawDoc.budgets[ADMIN_USER_ID] = rawDoc.budgets[ADMIN_USER_ID] || cloneDefaultData();
      migrated = true;
    }
    rawDoc.users = rawDoc.users.map((u) => {
      const { user, changed } = upgradeUserRecordEncryption(u);
      if (changed) migrated = true;
      return user;
    });
    return { doc: rawDoc, migrated };
  }

  const admin = createAdminUserRecord();
  const existingBudget =
    rawDoc && rawDoc.settings && Array.isArray(rawDoc.categories)
      ? normalizeUserBudgetDoc(rawDoc)
      : cloneDefaultData();

  return {
    doc: {
      version: 2,
      users: [admin],
      budgets: {
        [ADMIN_USER_ID]: existingBudget,
      },
    },
    migrated: true,
  };
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
      CREATE TABLE IF NOT EXISTS wedding_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        username_enc TEXT NOT NULL DEFAULT '',
        display_name TEXT NOT NULL,
        groom_name TEXT NOT NULL DEFAULT '',
        bride_name TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL,
        security_place_hash TEXT NOT NULL,
        security_color_hash TEXT NOT NULL,
        security_food_hash TEXT NOT NULL DEFAULT '',
        security_school_hash TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE wedding_users ADD COLUMN IF NOT EXISTS username_enc TEXT NOT NULL DEFAULT '';`);
    await pool.query(`ALTER TABLE wedding_users ADD COLUMN IF NOT EXISTS groom_name TEXT NOT NULL DEFAULT '';`);
    await pool.query(`ALTER TABLE wedding_users ADD COLUMN IF NOT EXISTS bride_name TEXT NOT NULL DEFAULT '';`);
    await pool.query(`ALTER TABLE wedding_users ADD COLUMN IF NOT EXISTS security_food_hash TEXT NOT NULL DEFAULT '';`);
    await pool.query(`ALTER TABLE wedding_users ADD COLUMN IF NOT EXISTS security_school_hash TEXT NOT NULL DEFAULT '';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wedding_user_settings (
        user_id TEXT PRIMARY KEY REFERENCES wedding_users(id) ON DELETE CASCADE,
        couple_names TEXT NOT NULL DEFAULT 'Harsha & Divya',
        groom_name TEXT NOT NULL DEFAULT 'Harsha',
        bride_name TEXT NOT NULL DEFAULT 'Divya',
        subtitle TEXT NOT NULL DEFAULT 'Wedding Budget Tracker',
        location TEXT NOT NULL DEFAULT '',
        wedding_date TEXT NOT NULL DEFAULT '',
        target_budget NUMERIC NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE wedding_user_settings ADD COLUMN IF NOT EXISTS groom_name TEXT NOT NULL DEFAULT 'Harsha';`);
    await pool.query(`ALTER TABLE wedding_user_settings ADD COLUMN IF NOT EXISTS bride_name TEXT NOT NULL DEFAULT 'Divya';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wedding_categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'user-admin',
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'Tag',
        color TEXT NOT NULL DEFAULT '#5D2EC2',
        budget_cap NUMERIC NOT NULL DEFAULT 0,
        payer_mode TEXT NOT NULL DEFAULT 'both',
        notes TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE wedding_categories ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'user-admin';`);
    await pool.query(`ALTER TABLE wedding_categories ADD COLUMN IF NOT EXISTS payer_mode TEXT NOT NULL DEFAULT 'both';`);
    await pool.query(`ALTER TABLE wedding_categories ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wedding_expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'user-admin',
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
    await pool.query(`ALTER TABLE wedding_expenses ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'user-admin';`);
    await pool.query(`ALTER TABLE wedding_expenses ADD COLUMN IF NOT EXISTS harsha_paid NUMERIC NOT NULL DEFAULT 0;`);
    await pool.query(`ALTER TABLE wedding_expenses ADD COLUMN IF NOT EXISTS divya_paid NUMERIC NOT NULL DEFAULT 0;`);

    // Migrate any plaintext usernames in wedding_users to hashed username + encrypted username_enc
    const allUsers = await pool.query('SELECT id, username, username_enc FROM wedding_users');
    for (const row of allUsers.rows) {
      if (!row.username_enc && row.username && row.username.length < 64) {
        const clean = normalizeUsername(row.username);
        await pool.query(
          'UPDATE wedding_users SET username = $1, username_enc = $2 WHERE id = $3',
          [hashUsername(clean), encryptField(clean), row.id]
        );
      }
    }

    // Ensure admin user exists
    const adminCheck = await pool.query('SELECT id FROM wedding_users WHERE id = $1', [
      ADMIN_USER_ID,
    ]);
    if (adminCheck.rows.length === 0) {
      const admin = createAdminUserRecord();
      await pool.query(
        `INSERT INTO wedding_users (id, username, username_enc, display_name, groom_name, bride_name, password_hash, security_place_hash, security_color_hash, security_food_hash, security_school_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (username) DO NOTHING`,
        [
          admin.id,
          admin.usernameHash,
          admin.usernameEnc,
          admin.displayName,
          admin.groomName,
          admin.brideName,
          admin.passwordHash,
          admin.securityPlaceHash,
          admin.securityColorHash,
          admin.securityFoodHash,
          admin.securitySchoolHash,
        ]
      );
    }

    const adminSettingsCheck = await pool.query(
      'SELECT user_id FROM wedding_user_settings WHERE user_id = $1',
      [ADMIN_USER_ID]
    );
    if (adminSettingsCheck.rows.length === 0) {
      await seedPgUserBudget(pool, ADMIN_USER_ID, cloneDefaultData());
    }
  })().catch((err) => {
    pgInitPromise = null;
    throw err;
  });
  return pgInitPromise;
}

async function seedPgUserBudget(pool, userId, seed) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM wedding_expenses WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM wedding_categories WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM wedding_user_settings WHERE user_id = $1', [userId]);

    const s = seed.settings;
    const parsed = parseCoupleNames(s.coupleNames, s.groomName, s.brideName);
    await client.query(
      `INSERT INTO wedding_user_settings (user_id, couple_names, groom_name, bride_name, subtitle, location, wedding_date, target_budget, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        parsed.coupleNames,
        parsed.groomName,
        parsed.brideName,
        s.subtitle || 'Wedding Budget Tracker',
        s.location || '',
        s.weddingDate || '',
        Number(s.targetBudget) || 0,
        s.notes || '',
      ]
    );

    for (let i = 0; i < seed.categories.length; i += 1) {
      const c = seed.categories[i];
      await client.query(
        `INSERT INTO wedding_categories (id, user_id, name, icon, color, budget_cap, payer_mode, notes, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          c.id,
          userId,
          c.name,
          c.icon || 'Tag',
          c.color || '#5D2EC2',
          Number(c.budgetCap) || 0,
          normalizePayerMode(c.payerMode),
          c.notes || '',
          i,
        ]
      );
    }

    for (let i = 0; i < seed.expenses.length; i += 1) {
      const e = seed.expenses[i];
      const split = normalizeSplit(e);
      const createdAt = new Date(Date.now() - i * 1000);
      await client.query(
        `INSERT INTO wedding_expenses
          (id, user_id, category_id, title, vendor, estimated, actual, paid, harsha_paid, divya_paid, status, paid_by, due_date, notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          e.id,
          userId,
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

async function pgGetBudget(userId) {
  await ensurePgSchema();
  const pool = getPgPool();
  const [settingsRes, categoriesRes, expensesRes] = await Promise.all([
    pool.query('SELECT * FROM wedding_user_settings WHERE user_id = $1', [userId]),
    pool.query(
      'SELECT * FROM wedding_categories WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC',
      [userId]
    ),
    pool.query('SELECT * FROM wedding_expenses WHERE user_id = $1 ORDER BY created_at DESC', [
      userId,
    ]),
  ]);

  const sRow = settingsRes.rows[0];
  let settings = cloneDefaultData().settings;
  if (sRow) {
    const parsedNames = parseCoupleNames(sRow.couple_names, sRow.groom_name, sRow.bride_name);
    settings = {
      coupleNames: parsedNames.coupleNames,
      groomName: parsedNames.groomName,
      brideName: parsedNames.brideName,
      subtitle:
        sRow.subtitle === 'Hyderabad Wedding Budget' ||
        sRow.subtitle === 'Hyderabad Wedding Budget Tracker'
          ? 'Wedding Budget Tracker'
          : sRow.subtitle,
      location: sRow.location,
      weddingDate: sRow.wedding_date === '2027-02-14' ? '2027-03-24' : sRow.wedding_date,
      targetBudget: Number(sRow.target_budget || 0),
      notes: sRow.notes || '',
    };
  }

  const categories = categoriesRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    budgetCap: Number(r.budget_cap || 0),
    payerMode: normalizePayerMode(r.payer_mode),
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

async function kvReadStore() {
  let raw = await kvCommand(['GET', KV_KEY]);
  if (!raw) {
    const legacyRaw = await kvCommand(['GET', LEGACY_KV_KEY]);
    const legacyParsed = legacyRaw
      ? typeof legacyRaw === 'string'
        ? JSON.parse(legacyRaw)
        : legacyRaw
      : null;
    const { doc } = migrateToMultiUserDoc(legacyParsed);
    await kvCommand(['SET', KV_KEY, JSON.stringify(doc)]);
    return doc;
  }
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const { doc, migrated } = migrateToMultiUserDoc(parsed);
  if (migrated) {
    await kvCommand(['SET', KV_KEY, JSON.stringify(doc)]);
  }
  return doc;
}

async function kvWriteStore(doc) {
  await kvCommand(['SET', KV_KEY, JSON.stringify(doc)]);
}

// ============================================================================
// Driver 3: Local JSON File (or /tmp fallback)
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
    const { doc } = migrateToMultiUserDoc(null);
    fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8');
  }
}

function jsonReadStore() {
  ensureJsonFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(getJsonFilePath(), 'utf8'));
    const { doc, migrated } = migrateToMultiUserDoc(parsed);
    if (migrated) {
      fs.writeFileSync(getJsonFilePath(), JSON.stringify(doc, null, 2), 'utf8');
    }
    return doc;
  } catch {
    const { doc } = migrateToMultiUserDoc(null);
    return doc;
  }
}

function jsonWriteStore(doc) {
  ensureJsonFile();
  fs.writeFileSync(getJsonFilePath(), JSON.stringify(doc, null, 2), 'utf8');
}

async function readStore() {
  if (KV_URL && KV_TOKEN) return kvReadStore();
  return jsonReadStore();
}

async function writeStore(doc) {
  if (KV_URL && KV_TOKEN) return kvWriteStore(doc);
  jsonWriteStore(doc);
}

// ============================================================================
// Authentication Operations (Encrypted Usernames & Hashed Passwords)
// ============================================================================
function matchesUserUsername(u, cleanUsername, unameHash) {
  if (u.usernameHash && u.usernameHash === unameHash) return true;
  if (u.username && normalizeUsername(u.username) === cleanUsername) return true;
  if (u.usernameEnc && decryptField(u.usernameEnc) === cleanUsername) return true;
  return false;
}

async function registerUser({
  username,
  password,
  displayName,
  groomName,
  brideName,
  favouritePlace,
  favouriteColor,
  favouriteFood,
  firstSchool,
}) {
  const cleanUsername = validateUsername(username);
  const unameHash = hashUsername(cleanUsername);
  const unameEnc = encryptField(cleanUsername);

  if (!password || String(password).length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }
  const place = String(favouritePlace || '').trim();
  const color = String(favouriteColor || '').trim();
  const food = String(favouriteFood || '').trim();
  const school = String(firstSchool || '').trim();
  if (!place || !color || !food || !school) {
    const err = new Error('Please answer all 4 security questions');
    err.statusCode = 400;
    throw err;
  }

  const parsedNames = parseCoupleNames(displayName, groomName, brideName);

  const userRecord = {
    id: makeId('user'),
    usernameHash: unameHash,
    usernameEnc: unameEnc,
    displayName: parsedNames.coupleNames,
    groomName: parsedNames.groomName,
    brideName: parsedNames.brideName,
    passwordHash: hashSecret(String(password)),
    securityPlaceHash: hashSecret(place, true),
    securityColorHash: hashSecret(color, true),
    securityFoodHash: hashSecret(food, true),
    securitySchoolHash: hashSecret(school, true),
    createdAt: new Date().toISOString(),
  };

  const starterBudget = buildFreshUserBudget(
    parsedNames.coupleNames,
    parsedNames.groomName,
    parsedNames.brideName
  );

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const existing = await pool.query(
      'SELECT id FROM wedding_users WHERE username = $1 OR username = $2',
      [unameHash, cleanUsername]
    );
    if (existing.rows.length > 0) {
      const suggestions = buildUsernameSuggestions(
        cleanUsername,
        parsedNames.groomName,
        parsedNames.brideName
      );
      const err = new Error(
        `Username "${cleanUsername}" is already taken (two couples can have the same Groom & Bride names, just pick a unique username). Try: ${suggestions.join(', ')}`
      );
      err.statusCode = 409;
      err.suggestions = suggestions;
      throw err;
    }
    await pool.query(
      `INSERT INTO wedding_users (id, username, username_enc, display_name, groom_name, bride_name, password_hash, security_place_hash, security_color_hash, security_food_hash, security_school_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userRecord.id,
        userRecord.usernameHash,
        userRecord.usernameEnc,
        userRecord.displayName,
        userRecord.groomName,
        userRecord.brideName,
        userRecord.passwordHash,
        userRecord.securityPlaceHash,
        userRecord.securityColorHash,
        userRecord.securityFoodHash,
        userRecord.securitySchoolHash,
      ]
    );
    await seedPgUserBudget(pool, userRecord.id, starterBudget);
    return sanitizeUser(userRecord);
  }

  const store = await readStore();
  if (store.users.some((u) => matchesUserUsername(u, cleanUsername, unameHash))) {
    const suggestions = buildUsernameSuggestions(
      cleanUsername,
      parsedNames.groomName,
      parsedNames.brideName
    );
    const err = new Error(
      `Username "${cleanUsername}" is already taken (two couples can have the same Groom & Bride names, just pick a unique username). Try: ${suggestions.join(', ')}`
    );
    err.statusCode = 409;
    err.suggestions = suggestions;
    throw err;
  }
  store.users.push(userRecord);
  store.budgets[userRecord.id] = starterBudget;
  await writeStore(store);
  return sanitizeUser(userRecord);
}

async function loginUser({ username, password }) {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername || !password) {
    const err = new Error('Username and password are required');
    err.statusCode = 400;
    throw err;
  }
  const unameHash = hashUsername(cleanUsername);

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT * FROM wedding_users WHERE username = $1 OR username = $2',
      [unameHash, cleanUsername]
    );
    const row = res.rows[0];
    if (!row || !verifySecret(String(password), row.password_hash)) {
      const err = new Error('Invalid username or password');
      err.statusCode = 401;
      throw err;
    }
    const parsedNames = parseCoupleNames(row.display_name, row.groom_name, row.bride_name);
    return {
      id: row.id,
      username: row.username_enc ? decryptField(row.username_enc, cleanUsername) : cleanUsername,
      displayName: parsedNames.coupleNames,
      groomName: parsedNames.groomName,
      brideName: parsedNames.brideName,
    };
  }

  const store = await readStore();
  const user = store.users.find((u) => matchesUserUsername(u, cleanUsername, unameHash));
  if (!user || !verifySecret(String(password), user.passwordHash)) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }
  return sanitizeUser(user);
}

async function resetPasswordWithQuestions({
  username,
  favouritePlace,
  favouriteColor,
  favouriteFood,
  firstSchool,
  newPassword,
}) {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) {
    const err = new Error('Username is required');
    err.statusCode = 400;
    throw err;
  }
  if (!newPassword || String(newPassword).length < 6) {
    const err = new Error('New password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }

  const unameHash = hashUsername(cleanUsername);
  const newHash = hashSecret(String(newPassword));

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT * FROM wedding_users WHERE username = $1 OR username = $2',
      [unameHash, cleanUsername]
    );
    const row = res.rows[0];
    const foodOk =
      !row?.security_food_hash || verifySecret(favouriteFood, row.security_food_hash, true);
    const schoolOk =
      !row?.security_school_hash || verifySecret(firstSchool, row.security_school_hash, true);
    if (
      !row ||
      !verifySecret(favouritePlace, row.security_place_hash, true) ||
      !verifySecret(favouriteColor, row.security_color_hash, true) ||
      !foodOk ||
      !schoolOk
    ) {
      const err = new Error('Username or security answers do not match');
      err.statusCode = 401;
      throw err;
    }
    await pool.query('UPDATE wedding_users SET password_hash = $1 WHERE id = $2', [
      newHash,
      row.id,
    ]);
    return {
      id: row.id,
      username: row.username_enc ? decryptField(row.username_enc, cleanUsername) : cleanUsername,
      displayName: row.display_name,
    };
  }

  const store = await readStore();
  const user = store.users.find((u) => matchesUserUsername(u, cleanUsername, unameHash));
  const foodOk =
    !user?.securityFoodHash || verifySecret(favouriteFood, user.securityFoodHash, true);
  const schoolOk =
    !user?.securitySchoolHash || verifySecret(firstSchool, user.securitySchoolHash, true);
  if (
    !user ||
    !verifySecret(favouritePlace, user.securityPlaceHash, true) ||
    !verifySecret(favouriteColor, user.securityColorHash, true) ||
    !foodOk ||
    !schoolOk
  ) {
    const err = new Error('Username or security answers do not match');
    err.statusCode = 401;
    throw err;
  }
  user.passwordHash = newHash;
  await writeStore(store);
  return sanitizeUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const err = new Error('Current and new passwords are required');
    err.statusCode = 400;
    throw err;
  }
  if (String(newPassword).length < 6) {
    const err = new Error('New password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }

  const newHash = hashSecret(String(newPassword));

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const res = await pool.query('SELECT * FROM wedding_users WHERE id = $1', [userId]);
    const row = res.rows[0];
    if (!row || !verifySecret(String(currentPassword), row.password_hash)) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 401;
      throw err;
    }
    await pool.query('UPDATE wedding_users SET password_hash = $1 WHERE id = $2', [
      newHash,
      userId,
    ]);
    return { ok: true };
  }

  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user || !verifySecret(String(currentPassword), user.passwordHash)) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }
  user.passwordHash = newHash;
  await writeStore(store);
  return { ok: true };
}

async function getUserById(userId) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT id, username, username_enc, display_name, groom_name, bride_name FROM wedding_users WHERE id = $1',
      [userId]
    );
    const row = res.rows[0];
    if (!row) return null;
    const parsed = parseCoupleNames(row.display_name, row.groom_name, row.bride_name);
    return {
      id: row.id,
      username: row.username_enc ? decryptField(row.username_enc, 'user') : row.username,
      displayName: parsed.coupleNames,
      groomName: parsed.groomName,
      brideName: parsed.brideName,
    };
  }
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  return sanitizeUser(user);
}

// ============================================================================
// Per-User Budget Operations
// ============================================================================
async function getBudget(userId = ADMIN_USER_ID) {
  if (POSTGRES_CONN) return pgGetBudget(userId);
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  const userBudget =
    store.budgets[userId] ||
    buildFreshUserBudget(
      user?.displayName || 'My Wedding',
      user?.groomName || '',
      user?.brideName || ''
    );
  return normalizeUserBudgetDoc(userBudget);
}

async function updateSettings(userId, payload = {}) {
  const { coupleNames, groomName, brideName, subtitle, location, weddingDate, targetBudget, notes } =
    payload;

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const current = (await pgGetBudget(userId)).settings;
    const nextGroom =
      groomName !== undefined ? String(groomName).trim() || current.groomName : current.groomName;
    const nextBride =
      brideName !== undefined ? String(brideName).trim() || current.brideName : current.brideName;
    const nextCouple =
      coupleNames !== undefined && String(coupleNames).trim()
        ? String(coupleNames).trim()
        : nextGroom && nextBride
          ? `${nextGroom} & ${nextBride}`
          : current.coupleNames;

    const next = {
      coupleNames: nextCouple,
      groomName: nextGroom,
      brideName: nextBride,
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
      `UPDATE wedding_user_settings
       SET couple_names = $1, groom_name = $2, bride_name = $3, subtitle = $4, location = $5, wedding_date = $6, target_budget = $7, notes = $8, updated_at = NOW()
       WHERE user_id = $9`,
      [
        next.coupleNames,
        next.groomName,
        next.brideName,
        next.subtitle,
        next.location,
        next.weddingDate,
        next.targetBudget,
        next.notes,
        userId,
      ]
    );
    return pgGetBudget(userId);
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
  const nextGroom =
    groomName !== undefined
      ? String(groomName).trim() || data.settings.groomName
      : data.settings.groomName;
  const nextBride =
    brideName !== undefined
      ? String(brideName).trim() || data.settings.brideName
      : data.settings.brideName;
  const nextCouple =
    coupleNames !== undefined && String(coupleNames).trim()
      ? String(coupleNames).trim()
      : groomName !== undefined || brideName !== undefined
        ? `${nextGroom} & ${nextBride}`
        : data.settings.coupleNames;

  data.settings = {
    ...data.settings,
    coupleNames: nextCouple,
    groomName: nextGroom,
    brideName: nextBride,
    ...(subtitle !== undefined ? { subtitle: String(subtitle).trim() } : {}),
    ...(location !== undefined ? { location: String(location).trim() } : {}),
    ...(weddingDate !== undefined ? { weddingDate: String(weddingDate).trim() } : {}),
    ...(targetBudget !== undefined
      ? { targetBudget: Math.max(0, Number(targetBudget) || 0) }
      : {}),
    ...(notes !== undefined ? { notes: String(notes).trim() } : {}),
  };
  store.budgets[userId] = data;
  await writeStore(store);
  return data;
}

async function addCategory(userId, payload = {}) {
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
    payerMode: normalizePayerMode(payload.payerMode),
    notes: String(payload.notes || '').trim(),
  };

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const maxSort = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1)::int AS max_sort FROM wedding_categories WHERE user_id = $1',
      [userId]
    );
    const nextOrder = maxSort.rows[0].max_sort + 1;
    await pool.query(
      `INSERT INTO wedding_categories (id, user_id, name, icon, color, budget_cap, payer_mode, notes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newCategory.id,
        userId,
        newCategory.name,
        newCategory.icon,
        newCategory.color,
        newCategory.budgetCap,
        newCategory.payerMode,
        newCategory.notes,
        nextOrder,
      ]
    );
    return { category: newCategory, data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
  data.categories.push(newCategory);
  store.budgets[userId] = data;
  await writeStore(store);
  return { category: newCategory, data };
}

async function updateCategory(userId, id, payload = {}) {
  const { name, icon, color, budgetCap, payerMode, notes } = payload;

  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const existingRes = await pool.query(
      'SELECT * FROM wedding_categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
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
      payerMode:
        payerMode !== undefined
          ? normalizePayerMode(payerMode)
          : normalizePayerMode(existing.payer_mode),
      notes: notes !== undefined ? String(notes).trim() : existing.notes || '',
    };
    await pool.query(
      `UPDATE wedding_categories
       SET name = $1, icon = $2, color = $3, budget_cap = $4, payer_mode = $5, notes = $6
       WHERE id = $7 AND user_id = $8`,
      [
        updated.name,
        updated.icon,
        updated.color,
        updated.budgetCap,
        updated.payerMode,
        updated.notes,
        id,
        userId,
      ]
    );
    return { category: updated, data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
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
    ...(payerMode !== undefined ? { payerMode: normalizePayerMode(payerMode) } : {}),
    ...(notes !== undefined ? { notes: String(notes).trim() } : {}),
  };
  store.budgets[userId] = data;
  await writeStore(store);
  return { category: data.categories[idx], data };
}

async function deleteCategory(userId, id) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const res = await pool.query(
      'DELETE FROM wedding_categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (res.rows.length === 0) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    return { data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
  const exists = data.categories.some((c) => c.id === id);
  if (!exists) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  data.categories = data.categories.filter((c) => c.id !== id);
  data.expenses = data.expenses.filter((e) => e.categoryId !== id);
  store.budgets[userId] = data;
  await writeStore(store);
  return { data };
}

async function addExpense(userId, body = {}) {
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
    const catCheck = await pool.query(
      'SELECT id FROM wedding_categories WHERE id = $1 AND user_id = $2',
      [body.categoryId, userId]
    );
    if (catCheck.rows.length === 0) {
      const err = new Error('Valid category is required');
      err.statusCode = 400;
      throw err;
    }
    await pool.query(
      `INSERT INTO wedding_expenses
        (id, user_id, category_id, title, vendor, estimated, actual, paid, harsha_paid, divya_paid, status, paid_by, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        newExpense.id,
        userId,
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
    return { expense: newExpense, data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
  const categoryExists = data.categories.some((c) => c.id === body.categoryId);
  if (!categoryExists) {
    const err = new Error('Valid category is required');
    err.statusCode = 400;
    throw err;
  }
  data.expenses.unshift(newExpense);
  store.budgets[userId] = data;
  await writeStore(store);
  return { expense: newExpense, data };
}

async function updateExpense(userId, id, body = {}) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    const existingRes = await pool.query(
      'SELECT * FROM wedding_expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
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
       WHERE id=$13 AND user_id=$14`,
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
        userId,
      ]
    );
    return { expense: updated, data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
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

  store.budgets[userId] = data;
  await writeStore(store);
  return { expense: data.expenses[idx], data };
}

async function deleteExpense(userId, id) {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query('DELETE FROM wedding_expenses WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
    return { data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
  data.expenses = data.expenses.filter((e) => e.id !== id);
  store.budgets[userId] = data;
  await writeStore(store);
  return { data };
}

async function resetBudget(userId, mode = 'clear-expenses') {
  if (POSTGRES_CONN) {
    await ensurePgSchema();
    const pool = getPgPool();
    if (mode === 'restore-sample') {
      const seed = cloneDefaultData();
      if (userId !== ADMIN_USER_ID) {
        seed.categories = seed.categories.map((c) => ({ ...c, id: makeId('cat') }));
        const catLookup = new Map(
          DEFAULT_DATA.categories.map((orig, idx) => [orig.id, seed.categories[idx].id])
        );
        seed.expenses = seed.expenses.map((e) => ({
          ...e,
          id: makeId('exp'),
          categoryId: catLookup.get(e.categoryId) || seed.categories[0].id,
        }));
      }
      await seedPgUserBudget(pool, userId, seed);
    } else {
      await pool.query('DELETE FROM wedding_expenses WHERE user_id = $1', [userId]);
    }
    return { data: await pgGetBudget(userId) };
  }

  const store = await readStore();
  if (mode === 'restore-sample') {
    const fresh = cloneDefaultData();
    store.budgets[userId] = fresh;
    await writeStore(store);
    return { data: normalizeUserBudgetDoc(fresh) };
  }
  const data = normalizeUserBudgetDoc(store.budgets[userId]);
  data.expenses = [];
  store.budgets[userId] = data;
  await writeStore(store);
  return { data };
}

module.exports = {
  IS_VERCEL,
  getStorageInfo,
  registerUser,
  loginUser,
  resetPasswordWithQuestions,
  changePassword,
  getUserById,
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
