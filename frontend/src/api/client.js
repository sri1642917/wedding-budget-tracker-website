const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? rawBase.endsWith('/api')
    ? rawBase
    : `${rawBase}/api`
  : '/api';

const SESSION_KEY = 'wedding_auth_session_v1';
const LOCAL_MULTI_KEY = 'wedding_budget_multiuser_v3';
const LEGACY_LOCAL_KEY = 'wedding_budget_tracker_state_v1';

const DEFAULT_FALLBACK_DATA = {
  settings: {
    coupleNames: 'Harsha & Divya',
    subtitle: 'Hyderabad Wedding Budget',
    location: 'Hyderabad, Telangana',
    weddingDate: '2027-03-24',
    targetBudget: 2000000,
    notes: '',
  },
  categories: [
    { id: 'convention-venue', name: 'Convention Venue', icon: 'Building2', color: '#3B1786', budgetCap: 600000, notes: '' },
    { id: 'food', name: 'Food', icon: 'UtensilsCrossed', color: '#5D2EC2', budgetCap: 550000, notes: '' },
    { id: 'photography', name: 'Photography & Videography', icon: 'Camera', color: '#7C51DA', budgetCap: 250000, notes: '' },
    { id: 'staying', name: 'Staying (Hotels)', icon: 'Hotel', color: '#9A72EC', budgetCap: 250000, notes: '' },
    { id: 'transport', name: 'Transport (Hotel to Venue)', icon: 'Bus', color: '#B695F5', budgetCap: 85000, notes: '' },
    { id: 'pooja', name: 'Pooja', icon: 'Flame', color: '#C8B0FA', budgetCap: 50000, notes: '' },
    { id: 'pandit', name: 'Pandit', icon: 'Sparkles', color: '#8B4CB8', budgetCap: 50000, notes: '' },
    { id: 'dhol', name: 'Dhol', icon: 'Music', color: '#D8C7FC', budgetCap: 40000, notes: '' },
    { id: 'cat-f04dd894', name: 'Decoration', icon: 'Flower2', color: '#5D2EC2', budgetCap: 400000, notes: '' },
    { id: 'cat-gold-jewellery', name: 'Gold Jewellery', icon: 'Gem', color: '#5D2EC2', budgetCap: 1600000, notes: '' },
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
// Session Helpers
// ============================================================================
function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(session) {
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
    } else {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Multi-User Browser Fallback Store (when backend API is unreachable)
// ============================================================================
function readLocalMultiStore() {
  try {
    const raw = window.localStorage.getItem(LOCAL_MULTI_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.budgets?.['user-admin']?.settings?.weddingDate === '2027-02-14') {
        parsed.budgets['user-admin'].settings.weddingDate = '2027-03-24';
        writeLocalMultiStore(parsed);
      }
      return parsed;
    }
  } catch {
    // Ignore
  }
  let legacyBudget = null;
  try {
    const leg = window.localStorage.getItem(LEGACY_LOCAL_KEY);
    if (leg) legacyBudget = JSON.parse(leg);
  } catch {
    // Ignore
  }

  const adminId = 'user-admin';
  if (legacyBudget?.settings?.weddingDate === '2027-02-14') {
    legacyBudget.settings.weddingDate = '2027-03-24';
  }
  const initial = {
    users: [
      {
        id: adminId,
        username: 'admin',
        displayName: 'Harsha & Divya',
        password: 'admin@123',
        favouritePlace: 'hyderabad',
        favouriteColor: 'purple',
        favouriteFood: 'biryani',
        firstSchool: 'delhi public school',
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

function getLocalUserId() {
  const session = getSession();
  return session?.user?.id || 'user-admin';
}

function readLocalUserBudget() {
  const store = readLocalMultiStore();
  const uid = getLocalUserId();
  const data = store.budgets[uid] || JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
  return {
    ...data,
    _meta: { mode: 'browser-storage', label: 'Browser DB', persistent: true },
  };
}

function writeLocalUserBudget(data) {
  const store = readLocalMultiStore();
  const uid = getLocalUserId();
  const clean = {
    settings: data.settings,
    categories: data.categories,
    expenses: data.expenses,
  };
  store.budgets[uid] = clean;
  writeLocalMultiStore(store);
  return {
    ...clean,
    _meta: { mode: 'browser-storage', label: 'Browser DB', persistent: true },
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
      const res = await withFallback(
        () =>
          request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
          }),
        () => {
          const store = readLocalMultiStore();
          const clean = String(username || '').trim().toLowerCase();
          const user = store.users.find(
            (u) => u.username === clean && u.password === String(password || '')
          );
          if (!user) {
            const err = new Error('Invalid username or password');
            err.status = 401;
            throw err;
          }
          return {
            token: `local-${user.id}`,
            user: { id: user.id, username: user.username, displayName: user.displayName },
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
      favouritePlace,
      favouriteColor,
      favouriteFood,
      firstSchool,
    }) => {
      const res = await withFallback(
        () =>
          request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              username,
              password,
              displayName,
              favouritePlace,
              favouriteColor,
              favouriteFood,
              firstSchool,
            }),
          }),
        () => {
          const store = readLocalMultiStore();
          const clean = String(username || '').trim().toLowerCase();
          if (!/^[a-z0-9._-]{3,32}$/.test(clean)) {
            throw new Error('Username must be 3–32 characters (letters, numbers, ., _, or -)');
          }
          if (!password || String(password).length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          if (
            !String(favouritePlace || '').trim() ||
            !String(favouriteColor || '').trim() ||
            !String(favouriteFood || '').trim() ||
            !String(firstSchool || '').trim()
          ) {
            throw new Error('Please answer all 4 security questions');
          }
          if (store.users.some((u) => u.username === clean)) {
            throw new Error('Username is already taken');
          }
          const user = {
            id: makeLocalId('user'),
            username: clean,
            displayName: String(displayName || '').trim() || clean,
            password: String(password),
            favouritePlace: String(favouritePlace).trim().toLowerCase(),
            favouriteColor: String(favouriteColor).trim().toLowerCase(),
            favouriteFood: String(favouriteFood).trim().toLowerCase(),
            firstSchool: String(firstSchool).trim().toLowerCase(),
          };
          store.users.push(user);
          const fresh = JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
          fresh.settings = {
            coupleNames: user.displayName,
            subtitle: 'Wedding Budget',
            location: '',
            weddingDate: '',
            targetBudget: 0,
            notes: '',
          };
          fresh.categories = fresh.categories.map((c) => ({ ...c, id: makeLocalId('cat') }));
          store.budgets[user.id] = fresh;
          writeLocalMultiStore(store);
          return {
            token: `local-${user.id}`,
            user: { id: user.id, username: user.username, displayName: user.displayName },
          };
        }
      );
      setSession({ token: res.token, user: res.user });
      return res;
    },

    forgotPassword: ({
      username,
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
              username,
              favouritePlace,
              favouriteColor,
              favouriteFood,
              firstSchool,
              newPassword,
            }),
          }),
        () => {
          const store = readLocalMultiStore();
          const clean = String(username || '').trim().toLowerCase();
          const user = store.users.find((u) => u.username === clean);
          const foodOk =
            !user?.favouriteFood ||
            user.favouriteFood === String(favouriteFood || '').trim().toLowerCase();
          const schoolOk =
            !user?.firstSchool ||
            user.firstSchool === String(firstSchool || '').trim().toLowerCase();
          if (
            !user ||
            user.favouritePlace !== String(favouritePlace || '').trim().toLowerCase() ||
            user.favouriteColor !== String(favouriteColor || '').trim().toLowerCase() ||
            !foodOk ||
            !schoolOk
          ) {
            throw new Error('Username or security answers do not match');
          }
          if (!newPassword || String(newPassword).length < 6) {
            throw new Error('New password must be at least 6 characters');
          }
          user.password = String(newPassword);
          writeLocalMultiStore(store);
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
        () => {
          const store = readLocalMultiStore();
          const uid = getLocalUserId();
          const user = store.users.find((u) => u.id === uid);
          if (!user || user.password !== String(currentPassword || '')) {
            throw new Error('Current password is incorrect');
          }
          if (!newPassword || String(newPassword).length < 6) {
            throw new Error('New password must be at least 6 characters');
          }
          user.password = String(newPassword);
          writeLocalMultiStore(store);
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
      () => readLocalUserBudget()
    ),

  updateSettings: (payload) =>
    withFallback(
      () => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalUserBudget();
        state.settings = { ...state.settings, ...payload };
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
          const fresh = JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
          return { data: writeLocalUserBudget(fresh) };
        }
        const state = readLocalUserBudget();
        state.expenses = [];
        return { data: writeLocalUserBudget(state) };
      }
    ),

  exportLocalCsv: () => {
    const state = readLocalUserBudget();
    const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
    const rows = [
      [
        'Category',
        'Expense / Item',
        'Total Cost (INR)',
        'Harsha Paid (INR)',
        'Divya Paid (INR)',
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
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  },

  exportExcelUrl: `${API_BASE}/export-excel`,
};
