const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? rawBase.endsWith('/api')
    ? rawBase
    : `${rawBase}/api`
  : '/api';

const SESSION_KEY = 'wedding_auth_session_v1';
const LOCAL_MULTI_KEY = 'wedding_budget_multiuser_v4';
const PREV_LOCAL_MULTI_KEY = 'wedding_budget_multiuser_v3';
const CLOUD_API_OBJECTS = 'https://api.restful-api.dev/objects';
const CLOUD_DIRECTORY_ID =
  import.meta.env.VITE_CLOUD_DIRECTORY_ID || 'ff808181a09d98f701a2142991934d15';
const CLOUD_CHUNK_LEN = 550;

// ============================================================================
// Client-side Hashing & Encryption for Browser DB (zero plaintext credentials)
// ============================================================================
function fnv1aHash(str, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function hashLocalSecret(input, domain = 'wb-v4') {
  const s = `${domain}:${String(input || '')}`;
  return [
    fnv1aHash(s, 0x811c9dc5),
    fnv1aHash(s, 0x9e3779b9),
    fnv1aHash(s, 0x85ebca6b),
    fnv1aHash(s, 0xc2b2ae35),
  ].join('');
}

function encryptLocalField(text, key = 'wb-cipher-key-2027') {
  const str = String(text || '');
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const b = (str.charCodeAt(i) & 0xff) ^ key.charCodeAt(i % key.length) ^ ((i * 31) & 0xff);
    out += b.toString(16).padStart(2, '0');
  }
  return `enc1:${out}`;
}

function decryptLocalField(payload, fallback = '', key = 'wb-cipher-key-2027') {
  if (!payload || typeof payload !== 'string' || !payload.startsWith('enc1:')) {
    return payload || fallback;
  }
  try {
    const hex = payload.slice(5);
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      const idx = i / 2;
      const b = parseInt(hex.slice(i, i + 2), 16);
      const ch = b ^ key.charCodeAt(idx % key.length) ^ ((idx * 31) & 0xff);
      out += String.fromCharCode(ch);
    }
    return out || fallback;
  } catch {
    return fallback;
  }
}

export function parseCoupleNames(coupleNames, groomName, brideName) {
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
      raw || (baseGroom && baseBride ? `${baseGroom} & ${baseBride}` : 'My Wedding'),
  };
}

export function buildUsernameSuggestions(cleanUsername, groomName, brideName) {
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

const DEFAULT_FALLBACK_DATA = {
  settings: {
    coupleNames: 'Harsha & Divya',
    groomName: 'Harsha',
    brideName: 'Divya',
    subtitle: 'Wedding Budget Tracker',
    location: 'Hyderabad, Telangana',
    weddingDate: '2027-03-24',
    targetBudget: 2000000,
    notes: '',
  },
  categories: [
    { id: 'convention-venue', name: 'Convention Venue', icon: 'Building2', color: '#3B1786', budgetCap: 600000, payerMode: 'both', notes: '' },
    { id: 'food', name: 'Food', icon: 'UtensilsCrossed', color: '#5D2EC2', budgetCap: 550000, payerMode: 'both', notes: '' },
    { id: 'photography', name: 'Photography & Videography', icon: 'Camera', color: '#7C51DA', budgetCap: 250000, payerMode: 'both', notes: '' },
    { id: 'staying', name: 'Staying (Hotels)', icon: 'Hotel', color: '#9A72EC', budgetCap: 250000, payerMode: 'both', notes: '' },
    { id: 'transport', name: 'Transport (Hotel to Venue)', icon: 'Bus', color: '#B695F5', budgetCap: 85000, payerMode: 'both', notes: '' },
    { id: 'pooja', name: 'Pooja', icon: 'Flame', color: '#C8B0FA', budgetCap: 50000, payerMode: 'both', notes: '' },
    { id: 'pandit', name: 'Pandit', icon: 'Sparkles', color: '#8B4CB8', budgetCap: 50000, payerMode: 'both', notes: '' },
    { id: 'dhol', name: 'Dhol', icon: 'Music', color: '#D8C7FC', budgetCap: 40000, payerMode: 'both', notes: '' },
    { id: 'cat-f04dd894', name: 'Decoration', icon: 'Flower2', color: '#5D2EC2', budgetCap: 400000, payerMode: 'both', notes: '' },
    { id: 'cat-gold-jewellery', name: 'Gold Jewellery', icon: 'Gem', color: '#5D2EC2', budgetCap: 1600000, payerMode: 'both', notes: '' },
  ],
  expenses: [
    {
      id: 'exp-1d6305ae',
      categoryId: 'staying',
      title: 'Hotel Staying',
      vendor: '',
      estimated: 120000,
      actual: 120000,
      paid: 0,
      harshaPaid: 0,
      divyaPaid: 0,
      status: 'Pending',
      paidBy: 'Shared',
      dueDate: '2027-03-10',
      notes: '',
    },
    {
      id: 'exp-508d57d1',
      categoryId: 'convention-venue',
      title: 'The Hive',
      vendor: '',
      estimated: 180000,
      actual: 180000,
      paid: 30000,
      harshaPaid: 20000,
      divyaPaid: 10000,
      status: 'Advance Paid',
      paidBy: 'Shared',
      dueDate: '2027-03-15',
      notes: '',
    },
  ],
};

function makeLocalId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function deriveLocalStatus(actual, paid, explicitStatus) {
  const act = Number(actual || 0);
  const pd = Number(paid || 0);
  if (explicitStatus && ['Paid', 'Advance Paid', 'Pending'].includes(explicitStatus)) {
    return explicitStatus;
  }
  if (act > 0 && pd >= act) return 'Paid';
  if (pd > 0) return 'Advance Paid';
  return 'Pending';
}

// ============================================================================
// Session Helpers (sessionStorage so opening the site in a new tab/visit always shows Login)
// ============================================================================
function getSession() {
  try {
    // Clear any legacy persistent localStorage login session
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(session) {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
  try {
    if (!session) {
      window.sessionStorage.removeItem(SESSION_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

function encryptLocalUserRecord(u) {
  if (u.usernameHash && u.passwordHash && !u.username && !u.password) {
    return u;
  }
  const cleanUname = u.usernameEnc
    ? decryptLocalField(u.usernameEnc, 'admin')
    : String(u.username || 'admin').trim().toLowerCase();
  const parsed = parseCoupleNames(u.displayName, u.groomName, u.brideName);
  return {
    id: u.id,
    usernameHash: u.usernameHash || hashLocalSecret(cleanUname, 'uname'),
    usernameEnc: u.usernameEnc || encryptLocalField(cleanUname),
    displayName: parsed.coupleNames,
    groomName: parsed.groomName,
    brideName: parsed.brideName,
    passwordHash: u.passwordHash || hashLocalSecret(u.password || 'admin@123', 'pwd'),
    placeHash:
      u.placeHash || hashLocalSecret(String(u.favouritePlace || 'hyderabad').trim().toLowerCase(), 'place'),
    colorHash:
      u.colorHash || hashLocalSecret(String(u.favouriteColor || 'purple').trim().toLowerCase(), 'color'),
    foodHash:
      u.foodHash || hashLocalSecret(String(u.favouriteFood || 'biryani').trim().toLowerCase(), 'food'),
    schoolHash:
      u.schoolHash ||
      hashLocalSecret(String(u.firstSchool || 'delhi public school').trim().toLowerCase(), 'school'),
  };
}

function sanitizeLocalUser(u) {
  const uname = u.usernameEnc ? decryptLocalField(u.usernameEnc, 'user') : u.username || 'user';
  const parsed = parseCoupleNames(u.displayName, u.groomName, u.brideName);
  return {
    id: u.id,
    username: uname,
    displayName: parsed.coupleNames,
    groomName: parsed.groomName,
    brideName: parsed.brideName,
  };
}

// ============================================================================
// Multi-User Browser Fallback Store (Encrypted Credentials)
// ============================================================================
function readLocalMultiStore() {
  try {
    const raw =
      window.localStorage.getItem(LOCAL_MULTI_KEY) ||
      window.localStorage.getItem(PREV_LOCAL_MULTI_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let changed = !window.localStorage.getItem(LOCAL_MULTI_KEY);
      if (Array.isArray(parsed?.users)) {
        parsed.users = parsed.users.map((u) => {
          if (u.username || u.password || !u.groomName) changed = true;
          return encryptLocalUserRecord(u);
        });
      }
      if (parsed?.budgets?.['user-admin']?.settings) {
        const s = parsed.budgets['user-admin'].settings;
        if (s.weddingDate === '2027-02-14') {
          s.weddingDate = '2027-03-24';
          changed = true;
        }
        if (
          s.subtitle === 'Hyderabad Wedding Budget' ||
          s.subtitle === 'Hyderabad Wedding Budget Tracker'
        ) {
          s.subtitle = 'Wedding Budget Tracker';
          changed = true;
        }
        if (!s.groomName || !s.brideName) {
          const p = parseCoupleNames(s.coupleNames, s.groomName, s.brideName);
          s.groomName = p.groomName;
          s.brideName = p.brideName;
          s.coupleNames = p.coupleNames;
          changed = true;
        }
      }
      if (changed) {
        writeLocalMultiStore(parsed);
        try {
          window.localStorage.removeItem(PREV_LOCAL_MULTI_KEY);
        } catch {
          // ignore
        }
      }
      return parsed;
    }
  } catch {
    // Ignore
  }

  const adminId = 'user-admin';
  const initial = {
    users: [
      {
        id: adminId,
        usernameHash: '65126d1a7aabf3ced96fe460ba76f56a',
        usernameEnc: 'enc1:16197e577b',
        displayName: 'Harsha & Divya',
        groomName: 'Harsha',
        brideName: 'Divya',
        passwordHash: '9f31d89599b336d9a83476f34bb59be5',
        placeHash: 'ac494d66985822ba5455d9f04df63af6',
        colorHash: '19a89af4b23957e85ec3f6ba3a2b8864',
        foodHash: 'fb9509cdef6009992755d1cf12d6029d',
        schoolHash: 'b347b43e17a6ad1a8a51be90ab3b9e8e',
      },
    ],
    budgets: {
      [adminId]: JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA)),
    },
  };
  writeLocalMultiStore(initial);
  return initial;
}

function writeLocalMultiStore(store) {
  try {
    window.localStorage.setItem(LOCAL_MULTI_KEY, JSON.stringify(store));
  } catch {
    // Ignore
  }
}

// ============================================================================
// Free Multi-Device Sharded Cloud Store Sync (Encrypted Accounts & Budgets)
// ============================================================================
async function cloudGetObject(id) {
  const res = await fetch(`${CLOUD_API_OBJECTS}/${id}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function cloudCreateObject(name, data) {
  const res = await fetch(CLOUD_API_OBJECTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function cloudPutObject(id, name, data) {
  const res = await fetch(`${CLOUD_API_OBJECTS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function readCloudDirectory() {
  try {
    const obj = await cloudGetObject(CLOUD_DIRECTORY_ID);
    const dir = obj?.data?.dir && typeof obj.data.dir === 'object' ? obj.data.dir : {};
    return dir;
  } catch {
    return {};
  }
}

async function writeCloudDirectory(dir) {
  try {
    await cloudPutObject(CLOUD_DIRECTORY_ID, 'wb-directory-v4', { dir });
  } catch {
    // ignore
  }
}

async function saveUserAndBudgetToCloud(user, budget) {
  try {
    const encUser = encryptLocalUserRecord(user);
    const shortKey = encUser.usernameHash.slice(0, 12);
    const dir = await readCloudDirectory();
    let userObjId = dir[shortKey] || encUser.cloudObjId || null;

    // Split budget JSON into 550-char chunks so each cloud object stays well under 800 bytes
    const rawBudget = JSON.stringify({
      settings: budget?.settings || DEFAULT_FALLBACK_DATA.settings,
      categories: budget?.categories || DEFAULT_FALLBACK_DATA.categories,
      expenses: budget?.expenses || [],
    });
    const parts = [];
    for (let i = 0; i < rawBudget.length; i += CLOUD_CHUNK_LEN) {
      parts.push(rawBudget.slice(i, i + CLOUD_CHUNK_LEN));
    }

    let existingChildIds = [];
    if (userObjId) {
      const existingUserObj = await cloudGetObject(userObjId);
      if (Array.isArray(existingUserObj?.data?.c)) {
        existingChildIds = existingUserObj.data.c;
      }
    }

    const chunkIds = [];
    for (let idx = 0; idx < parts.length; idx += 1) {
      const chunkPayload = { s: parts[idx] };
      if (existingChildIds[idx]) {
        const updated = await cloudPutObject(
          existingChildIds[idx],
          `wb-c-${idx}`,
          chunkPayload
        );
        if (updated?.id) {
          chunkIds.push(updated.id);
          continue;
        }
      }
      const created = await cloudCreateObject(`wb-c-${idx}`, chunkPayload);
      if (created?.id) chunkIds.push(created.id);
    }

    const compactUserPayload = {
      id: encUser.id,
      uh: encUser.usernameHash,
      ue: encUser.usernameEnc,
      dn: encUser.displayName,
      gn: encUser.groomName,
      bn: encUser.brideName,
      ph: encUser.passwordHash,
      sq: encUser.securityQuestion || 'place',
      sa: encUser.securityAnswerHash || encUser.placeHash || '',
      pl: encUser.placeHash || '',
      cl: encUser.colorHash || '',
      fd: encUser.foodHash || '',
      sc: encUser.schoolHash || '',
      c: chunkIds,
    };

    if (userObjId) {
      const up = await cloudPutObject(userObjId, `wb-u-${shortKey}`, compactUserPayload);
      if (!up?.id) {
        const cr = await cloudCreateObject(`wb-u-${shortKey}`, compactUserPayload);
        userObjId = cr?.id || userObjId;
      }
    } else {
      const cr = await cloudCreateObject(`wb-u-${shortKey}`, compactUserPayload);
      userObjId = cr?.id || null;
    }

    if (userObjId && dir[shortKey] !== userObjId) {
      const latestDir = await readCloudDirectory();
      latestDir[shortKey] = userObjId;
      await writeCloudDirectory(latestDir);
    }
  } catch {
    // Offline fallback remains in localStorage
  }
}

async function fetchUserAndBudgetFromCloudByHash(uHash) {
  try {
    const shortKey = uHash.slice(0, 12);
    const dir = await readCloudDirectory();
    const userObjId = dir[shortKey];
    if (!userObjId) return null;

    const userObj = await cloudGetObject(userObjId);
    const d = userObj?.data;
    if (!d || !d.uh) return null;

    const userRecord = {
      id: d.id,
      usernameHash: d.uh,
      usernameEnc: d.ue,
      displayName: d.dn,
      groomName: d.gn,
      brideName: d.bn,
      passwordHash: d.ph,
      securityQuestion: d.sq || 'place',
      securityAnswerHash: d.sa || d.pl || '',
      placeHash: d.pl || d.sa || '',
      colorHash: d.cl || d.sa || '',
      foodHash: d.fd || d.sa || '',
      schoolHash: d.sc || d.sa || '',
      cloudObjId: userObjId,
    };

    let budget = null;
    if (Array.isArray(d.c) && d.c.length > 0) {
      const query = d.c.map((cid) => `id=${encodeURIComponent(cid)}`).join('&');
      const res = await fetch(`${CLOUD_API_OBJECTS}?${query}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const arr = await res.json().catch(() => []);
        const byId = new Map(arr.map((item) => [item.id, item?.data?.s || '']));
        const fullJson = d.c.map((cid) => byId.get(cid) || '').join('');
        if (fullJson) {
          budget = JSON.parse(fullJson);
        }
      }
    }

    // Merge into local cache
    const store = readLocalMultiStore();
    const existingIdx = store.users.findIndex((u) => u.usernameHash === userRecord.usernameHash);
    if (existingIdx !== -1) {
      store.users[existingIdx] = userRecord;
    } else {
      store.users.push(userRecord);
    }
    if (budget) {
      store.budgets[userRecord.id] = budget;
    }
    writeLocalMultiStore(store);

    return { userRecord, budget, store };
  } catch {
    return null;
  }
}

async function pullCloudMultiStore(targetUsername = '') {
  const local = readLocalMultiStore();
  if (targetUsername) {
    const clean = String(targetUsername || '').trim().toLowerCase();
    const uHash = hashLocalSecret(clean, 'uname');
    const cloudHit = await fetchUserAndBudgetFromCloudByHash(uHash);
    if (cloudHit?.store) return cloudHit.store;
  } else {
    const session = getSession();
    if (session?.user?.username) {
      const clean = String(session.user.username || '').trim().toLowerCase();
      const uHash = hashLocalSecret(clean, 'uname');
      const cloudHit = await fetchUserAndBudgetFromCloudByHash(uHash);
      if (cloudHit?.store) return cloudHit.store;
    }
  }
  return local;
}

async function pushCloudMultiStore(store, targetUserId = '') {
  writeLocalMultiStore(store);
  const uid = targetUserId || getLocalUserId();
  const user = store.users.find((u) => u.id === uid);
  const budget = store.budgets[uid];
  if (user && budget) {
    await saveUserAndBudgetToCloud(user, budget);
  }
  return store;
}

function getLocalUserId() {
  const session = getSession();
  return session?.user?.id || 'user-admin';
}

function readLocalUserBudget() {
  const store = readLocalMultiStore();
  const uid = getLocalUserId();
  const data = store.budgets[uid] || JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
  const parsed = parseCoupleNames(
    data.settings?.coupleNames,
    data.settings?.groomName,
    data.settings?.brideName
  );
  data.settings = {
    ...data.settings,
    coupleNames: parsed.coupleNames,
    groomName: parsed.groomName,
    brideName: parsed.brideName,
  };
  data.categories = (data.categories || []).map((c) => ({
    ...c,
    payerMode: c.payerMode || 'both',
  }));
  return {
    ...data,
    _meta: { mode: 'cloud-storage', label: 'Cloud DB (Encrypted)', persistent: true },
  };
}

function writeLocalUserBudget(data) {
  const store = readLocalMultiStore();
  const uid = getLocalUserId();
  const parsed = parseCoupleNames(
    data.settings?.coupleNames,
    data.settings?.groomName,
    data.settings?.brideName
  );
  const clean = {
    settings: {
      ...data.settings,
      coupleNames: parsed.coupleNames,
      groomName: parsed.groomName,
      brideName: parsed.brideName,
    },
    categories: (data.categories || []).map((c) => ({
      ...c,
      payerMode: c.payerMode || 'both',
    })),
    expenses: data.expenses,
  };
  store.budgets[uid] = clean;
  writeLocalMultiStore(store);
  pushCloudMultiStore(store);
  return {
    ...clean,
    _meta: { mode: 'cloud-storage', label: 'Cloud DB (Encrypted)', persistent: true },
  };
}

// ============================================================================
// HTTP Request Wrapper
// ============================================================================
async function request(path, options = {}) {
  const session = getSession();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    const body = contentType.includes('application/json')
      ? await res.json().catch(() => ({}))
      : {};
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    if (Array.isArray(body.suggestions)) {
      err.suggestions = body.suggestions;
    }
    err.isApiUnavailable =
      res.status === 404 ||
      res.status === 502 ||
      res.status === 503 ||
      !contentType.includes('application/json');
    throw err;
  }
  return res.json();
}

let backendUnavailable = false;

async function withFallback(apiCall, fallbackFn) {
  if (backendUnavailable) {
    return fallbackFn();
  }
  try {
    return await apiCall();
  } catch (err) {
    if (err?.isApiUnavailable || err?.name === 'TypeError') {
      backendUnavailable = true;
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  auth: {
    getSession,
    logout: () => setSession(null),
    getHeaders: () => {
      const session = getSession();
      return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
    },

    login: async ({ username, password }) => {
      const cleanUsername = String(username || '').trim().toLowerCase();
      const cleanPassword = String(password || '').trim();
      const res = await withFallback(
        () =>
          request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
          }),
        async () => {
          const store = await pullCloudMultiStore(cleanUsername);
          const uHash = hashLocalSecret(cleanUsername, 'uname');
          const pHash = hashLocalSecret(cleanPassword, 'pwd');
          const rawPHash = hashLocalSecret(String(password || ''), 'pwd');
          const user = store.users.find(
            (u) =>
              u.usernameHash === uHash &&
              (u.passwordHash === pHash || u.passwordHash === rawPHash)
          );
          if (!user) {
            const err = new Error('Invalid username or password');
            err.status = 401;
            throw err;
          }
          // Push local user & budget to cloud in background so any previously local-only account is synced
          pushCloudMultiStore(store, user.id);
          return {
            token: `local-${user.id}`,
            user: sanitizeLocalUser(user),
          };
        }
      );
      setSession({ token: res.token, user: res.user });
      return res;
    },

    register: async ({
      username,
      password,
      displayName,
      groomName,
      brideName,
      securityQuestion = 'place',
      securityAnswer = '',
      favouritePlace,
      favouriteColor,
      favouriteFood,
      firstSchool,
    }) => {
      const cleanUsername = String(username || '').trim().toLowerCase();
      const cleanPassword = String(password || '').trim();
      const qKey = String(securityQuestion || 'place').trim() || 'place';
      const ansVal = String(
        securityAnswer || favouritePlace || favouriteColor || favouriteFood || firstSchool || ''
      ).trim();
      const parsedNames = parseCoupleNames(displayName, groomName, brideName);
      const res = await withFallback(
        () =>
          request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              username: cleanUsername,
              password: cleanPassword,
              displayName: parsedNames.coupleNames,
              groomName: parsedNames.groomName,
              brideName: parsedNames.brideName,
              securityQuestion: qKey,
              securityAnswer: ansVal,
              favouritePlace: favouritePlace || ansVal,
              favouriteColor: favouriteColor || ansVal,
              favouriteFood: favouriteFood || ansVal,
              firstSchool: firstSchool || ansVal,
            }),
          }),
        async () => {
          const store = await pullCloudMultiStore(cleanUsername);
          if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
            throw new Error('Username must be 3–32 characters (letters, numbers, ., _, or -)');
          }
          if (!cleanPassword || cleanPassword.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          if (!ansVal) {
            throw new Error('Please select a security question and enter your answer');
          }
          const uHash = hashLocalSecret(cleanUsername, 'uname');
          if (store.users.some((u) => u.usernameHash === uHash)) {
            const suggestions = buildUsernameSuggestions(
              cleanUsername,
              parsedNames.groomName,
              parsedNames.brideName
            );
            const err = new Error(
              `Username "${cleanUsername}" is already taken (two couples can have the same Groom & Bride names, just pick a unique username).`
            );
            err.suggestions = suggestions;
            throw err;
          }
          const ansNorm = ansVal.toLowerCase();
          const user = {
            id: makeLocalId('user'),
            usernameHash: uHash,
            usernameEnc: encryptLocalField(cleanUsername),
            displayName: parsedNames.coupleNames,
            groomName: parsedNames.groomName,
            brideName: parsedNames.brideName,
            passwordHash: hashLocalSecret(cleanPassword, 'pwd'),
            securityQuestion: qKey,
            securityAnswerHash: hashLocalSecret(ansNorm, `sq:${qKey}`),
            placeHash: hashLocalSecret(ansNorm, 'place'),
            colorHash: hashLocalSecret(ansNorm, 'color'),
            foodHash: hashLocalSecret(ansNorm, 'food'),
            schoolHash: hashLocalSecret(ansNorm, 'school'),
          };
          store.users.push(user);
          const fresh = JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
          fresh.settings = {
            coupleNames: parsedNames.coupleNames,
            groomName: parsedNames.groomName,
            brideName: parsedNames.brideName,
            subtitle: 'Wedding Budget Tracker',
            location: '',
            weddingDate: '',
            targetBudget: 0,
            notes: '',
          };
          fresh.categories = fresh.categories.map((c) => ({
            ...c,
            id: makeLocalId('cat'),
            payerMode: 'both',
          }));
          fresh.expenses = [];
          store.budgets[user.id] = fresh;
          await pushCloudMultiStore(store, user.id);
          return {
            token: `local-${user.id}`,
            user: sanitizeLocalUser(user),
          };
        }
      );
      setSession({ token: res.token, user: res.user });
      return res;
    },

    forgotPassword: ({
      username,
      securityQuestion = 'place',
      securityAnswer = '',
      favouritePlace,
      favouriteColor,
      favouriteFood,
      firstSchool,
      newPassword,
    }) =>
      withFallback(
        () =>
          request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
              username: String(username || '').trim().toLowerCase(),
              securityQuestion,
              securityAnswer,
              favouritePlace,
              favouriteColor,
              favouriteFood,
              firstSchool,
              newPassword: String(newPassword || '').trim(),
            }),
          }),
        async () => {
          const clean = String(username || '').trim().toLowerCase();
          const store = await pullCloudMultiStore(clean);
          const cleanNewPw = String(newPassword || '').trim();
          const uHash = hashLocalSecret(clean, 'uname');
          const user = store.users.find((u) => u.usernameHash === uHash);
          const qKey = String(securityQuestion || 'place').trim() || 'place';
          const ansNorm = String(securityAnswer || '').trim().toLowerCase();

          let matched = false;
          if (user && ansNorm) {
            if (
              user.securityAnswerHash &&
              user.securityQuestion === qKey &&
              user.securityAnswerHash === hashLocalSecret(ansNorm, `sq:${qKey}`)
            ) {
              matched = true;
            } else if (qKey === 'place' && user.placeHash === hashLocalSecret(ansNorm, 'place')) {
              matched = true;
            } else if (qKey === 'color' && user.colorHash === hashLocalSecret(ansNorm, 'color')) {
              matched = true;
            } else if (qKey === 'food' && user.foodHash === hashLocalSecret(ansNorm, 'food')) {
              matched = true;
            } else if (qKey === 'school' && user.schoolHash === hashLocalSecret(ansNorm, 'school')) {
              matched = true;
            }
          }

          if (!matched) {
            throw new Error('Username or security answer does not match');
          }
          if (!cleanNewPw || cleanNewPw.length < 6) {
            throw new Error('New password must be at least 6 characters');
          }
          user.passwordHash = hashLocalSecret(cleanNewPw, 'pwd');
          await pushCloudMultiStore(store, user.id);
          return { ok: true, message: 'Password reset successful. You can now sign in.' };
        }
      ),

    changePassword: ({ currentPassword, newPassword }) =>
      withFallback(
        () =>
          request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
          }),
        async () => {
          const store = await pullCloudMultiStore();
          const uid = getLocalUserId();
          const user = store.users.find((u) => u.id === uid);
          const curHash = hashLocalSecret(String(currentPassword || '').trim(), 'pwd');
          if (!user || user.passwordHash !== curHash) {
            throw new Error('Current password is incorrect');
          }
          if (!newPassword || String(newPassword).length < 6) {
            throw new Error('New password must be at least 6 characters');
          }
          user.passwordHash = hashLocalSecret(String(newPassword).trim(), 'pwd');
          await pushCloudMultiStore(store, uid);
          return { ok: true, message: 'Password updated successfully' };
        }
      ),

    me: () =>
      withFallback(
        () => request('/auth/me'),
        () => {
          const session = getSession();
          if (!session?.user) {
            const err = new Error('Not signed in');
            err.status = 401;
            throw err;
          }
          return { user: session.user };
        }
      ),
  },

  getBudget: () =>
    withFallback(
      () => request('/budget'),
      async () => {
        await pullCloudMultiStore();
        return readLocalUserBudget();
      }
    ),

  updateSettings: (payload) =>
    withFallback(
      () => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalUserBudget();
        const parsed = parseCoupleNames(
          payload.coupleNames,
          payload.groomName ?? state.settings.groomName,
          payload.brideName ?? state.settings.brideName
        );
        state.settings = {
          ...state.settings,
          ...payload,
          coupleNames: parsed.coupleNames,
          groomName: parsed.groomName,
          brideName: parsed.brideName,
        };
        return writeLocalUserBudget(state);
      }
    ),

  addCategory: (payload) =>
    withFallback(
      () => request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalUserBudget();
        const category = {
          id: makeLocalId('cat'),
          name: String(payload.name || '').trim(),
          icon: payload.icon || 'Tag',
          color: payload.color || '#5D2EC2',
          budgetCap: Math.max(0, Number(payload.budgetCap) || 0),
          payerMode: payload.payerMode || 'both',
          notes: String(payload.notes || '').trim(),
        };
        state.categories.push(category);
        return { category, data: writeLocalUserBudget(state) };
      }
    ),

  updateCategory: (id, payload) =>
    withFallback(
      () => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalUserBudget();
        const idx = state.categories.findIndex((c) => c.id === id);
        if (idx !== -1) {
          state.categories[idx] = { ...state.categories[idx], ...payload };
        }
        return { category: state.categories[idx], data: writeLocalUserBudget(state) };
      }
    ),

  deleteCategory: (id) =>
    withFallback(
      () => request(`/categories/${id}`, { method: 'DELETE' }),
      () => {
        const state = readLocalUserBudget();
        state.categories = state.categories.filter((c) => c.id !== id);
        state.expenses = state.expenses.filter((e) => e.categoryId !== id);
        return { data: writeLocalUserBudget(state) };
      }
    ),

  addExpense: (payload) =>
    withFallback(
      () => request('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalUserBudget();
        const h = Math.max(0, Number(payload.harshaPaid) || 0);
        const d = Math.max(0, Number(payload.divyaPaid) || 0);
        const paid = h + d;
        const actual = Math.max(0, Number(payload.actual) || 0);
        const expense = {
          id: makeLocalId('exp'),
          categoryId: payload.categoryId,
          title: String(payload.title || '').trim(),
          vendor: '',
          estimated: actual,
          actual,
          paid,
          harshaPaid: h,
          divyaPaid: d,
          paidBy: h > 0 && d > 0 ? 'Shared' : h > 0 ? 'Harsha' : d > 0 ? 'Divya' : 'Shared',
          status: deriveLocalStatus(actual, paid, payload.status),
          dueDate: String(payload.dueDate || '').trim(),
          notes: String(payload.notes || '').trim(),
        };
        state.expenses.unshift(expense);
        return { expense, data: writeLocalUserBudget(state) };
      }
    ),

  updateExpense: (id, payload) =>
    withFallback(
      () => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalUserBudget();
        const idx = state.expenses.findIndex((e) => e.id === id);
        if (idx !== -1) {
          const existing = state.expenses[idx];
          const h =
            payload.harshaPaid !== undefined
              ? Math.max(0, Number(payload.harshaPaid) || 0)
              : Number(existing.harshaPaid || 0);
          const d =
            payload.divyaPaid !== undefined
              ? Math.max(0, Number(payload.divyaPaid) || 0)
              : Number(existing.divyaPaid || 0);
          const paid =
            payload.harshaPaid !== undefined || payload.divyaPaid !== undefined
              ? h + d
              : payload.paid !== undefined
                ? Math.max(0, Number(payload.paid) || 0)
                : Number(existing.paid || 0);
          const actual =
            payload.actual !== undefined
              ? Math.max(0, Number(payload.actual) || 0)
              : Number(existing.actual || 0);
          state.expenses[idx] = {
            ...existing,
            ...payload,
            actual,
            estimated: actual,
            paid,
            harshaPaid: h,
            divyaPaid: d,
            status: deriveLocalStatus(actual, paid, payload.status),
          };
        }
        return { expense: state.expenses[idx], data: writeLocalUserBudget(state) };
      }
    ),

  deleteExpense: (id) =>
    withFallback(
      () => request(`/expenses/${id}`, { method: 'DELETE' }),
      () => {
        const state = readLocalUserBudget();
        state.expenses = state.expenses.filter((e) => e.id !== id);
        return { data: writeLocalUserBudget(state) };
      }
    ),

  resetBudget: (mode) =>
    withFallback(
      () => request('/reset', { method: 'POST', body: JSON.stringify({ mode }) }),
      () => {
        if (mode === 'restore-sample') {
          const current = readLocalUserBudget();
          const fresh = JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
          if (current?.settings && getLocalUserId() !== 'user-admin') {
            fresh.settings = {
              ...fresh.settings,
              coupleNames: current.settings.coupleNames,
              groomName: current.settings.groomName,
              brideName: current.settings.brideName,
            };
          }
          return { data: writeLocalUserBudget(fresh) };
        }
        const state = readLocalUserBudget();
        state.expenses = [];
        return { data: writeLocalUserBudget(state) };
      }
    ),

  exportLocalCsv: () => {
    const state = readLocalUserBudget();
    const groomName = state.settings?.groomName || 'Groom';
    const brideName = state.settings?.brideName || 'Bride';
    const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
    const rows = [
      [
        'Category',
        'Expense / Item',
        'Total Cost (INR)',
        `${groomName} Paid (INR)`,
        `${brideName} Paid (INR)`,
        'Total Paid (INR)',
        'Balance Due (INR)',
        'Status',
        'Due Date',
        'Comments / Notes',
      ],
      ...state.expenses.map((e) => {
        const actual = Number(e.actual || 0);
        const paid = Number(e.paid || 0);
        return [
          catMap.get(e.categoryId) || e.categoryId,
          e.title || '',
          actual,
          Number(e.harshaPaid || 0),
          Number(e.divyaPaid || 0),
          paid,
          Math.max(0, actual - paid),
          e.status || 'Pending',
          e.dueDate || '',
          e.notes || '',
        ];
      }),
    ];
    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  },

  syncExcel: () => request('/sync-excel', { method: 'POST' }),
  exportExcelUrl: `${API_BASE}/export-excel`,
};
