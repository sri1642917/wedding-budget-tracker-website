const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? rawBase.endsWith('/api')
    ? rawBase
    : `${rawBase}/api`
  : '/api';

const LOCAL_STORAGE_KEY = 'wedding_budget_tracker_state_v1';

const DEFAULT_FALLBACK_DATA = {
  settings: {
    coupleNames: 'Harsha & Divya',
    subtitle: 'Hyderabad Wedding Budget',
    location: 'Hyderabad, Telangana',
    weddingDate: '2027-02-14',
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
    { id: 'pandit', name: 'Pandit', icon: 'Sparkles', color: '#8B4CB8', budgetCap: 35000, notes: '' },
    { id: 'dhol', name: 'Dhol', icon: 'Music', color: '#D8C7FC', budgetCap: 40000, notes: '' },
  ],
  expenses: [
    {
      id: 'exp-1',
      categoryId: 'convention-venue',
      title: 'Convention Hall & Mandapam Booking',
      vendor: '',
      estimated: 580000,
      actual: 580000,
      paid: 250000,
      harshaPaid: 125000,
      divyaPaid: 125000,
      status: 'Advance Paid',
      paidBy: 'Shared',
      dueDate: '2027-01-15',
      notes: 'Includes AC banquet hall, dining area, bridal suite, and valet parking',
    },
    {
      id: 'exp-2',
      categoryId: 'food',
      title: 'Traditional Telugu Wedding Feast & Reception Catering',
      vendor: '',
      estimated: 540000,
      actual: 540000,
      paid: 150000,
      harshaPaid: 75000,
      divyaPaid: 75000,
      status: 'Advance Paid',
      paidBy: 'Shared',
      dueDate: '2027-02-05',
      notes: '600 guests — breakfast, muhurtham banana-leaf lunch & evening snacks',
    },
    {
      id: 'exp-3',
      categoryId: 'photography',
      title: 'Candid Photo, Cinematic Film & Drone Coverage',
      vendor: '',
      estimated: 240000,
      actual: 240000,
      paid: 100000,
      harshaPaid: 100000,
      divyaPaid: 0,
      status: 'Advance Paid',
      paidBy: 'Harsha',
      dueDate: '2027-02-10',
      notes: 'Pre-wedding shoot + Haldi, Sangeet & Wedding day albums',
    },
    {
      id: 'exp-4',
      categoryId: 'staying',
      title: 'Guest Hotel Rooms Block (20 AC Rooms × 2 Nights)',
      vendor: '',
      estimated: 225000,
      actual: 225000,
      paid: 100000,
      harshaPaid: 0,
      divyaPaid: 100000,
      status: 'Advance Paid',
      paidBy: 'Divya',
      dueDate: '2027-02-01',
      notes: 'Includes complimentary breakfast for outstation relatives',
    },
    {
      id: 'exp-5',
      categoryId: 'transport',
      title: 'AC Volvo Coaches & Family Innova Shuttles',
      vendor: '',
      estimated: 78000,
      actual: 78000,
      paid: 25000,
      harshaPaid: 25000,
      divyaPaid: 0,
      status: 'Advance Paid',
      paidBy: 'Harsha',
      dueDate: '2027-02-12',
      notes: 'Continuous hotel-to-venue shuttle + airport pickup/drop',
    },
    {
      id: 'exp-6',
      categoryId: 'pooja',
      title: 'Pooja Samagri, Kalasham & Flower Garlands',
      vendor: '',
      estimated: 45000,
      actual: 45000,
      paid: 45000,
      harshaPaid: 0,
      divyaPaid: 45000,
      status: 'Paid',
      paidBy: 'Divya',
      dueDate: '2027-02-12',
      notes: 'Pelli Kuthuru, Pelli Koduku, and Mandapam ritual items',
    },
    {
      id: 'exp-7',
      categoryId: 'pandit',
      title: 'Vedic Panditji & Muhurtham Rituals',
      vendor: '',
      estimated: 35000,
      actual: 35000,
      paid: 10000,
      harshaPaid: 5000,
      divyaPaid: 5000,
      status: 'Advance Paid',
      paidBy: 'Shared',
      dueDate: '2027-02-14',
      notes: 'Main wedding muhurtham + Satyanarayana Vratham',
    },
    {
      id: 'exp-8',
      categoryId: 'dhol',
      title: 'Baraat Punjabi Dhol & Nadaswaram Ensemble',
      vendor: '',
      estimated: 38000,
      actual: 38000,
      paid: 0,
      harshaPaid: 0,
      divyaPaid: 0,
      status: 'Pending',
      paidBy: 'Harsha',
      dueDate: '2027-02-14',
      notes: '6 dhol artists for Baraat + traditional Nadaswaram for morning rituals',
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

function readLocalState() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        _meta: { mode: 'browser-storage', label: 'Browser DB', persistent: true },
      };
    }
  } catch {
    // Ignore storage read errors
  }
  const initial = JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
  writeLocalState(initial);
  return {
    ...initial,
    _meta: { mode: 'browser-storage', label: 'Browser DB', persistent: true },
  };
}

function writeLocalState(data) {
  const clean = {
    settings: data.settings,
    categories: data.categories,
    expenses: data.expenses,
  };
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage quota errors
  }
  return {
    ...clean,
    _meta: { mode: 'browser-storage', label: 'Browser DB', persistent: true },
  };
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
    err.isApiUnavailable = res.status === 404 || res.status === 502 || res.status === 503 || !contentType.includes('application/json');
    throw err;
  }
  return res.json();
}

async function withFallback(apiCall, fallbackFn) {
  try {
    return await apiCall();
  } catch (err) {
    if (err?.isApiUnavailable || err?.name === 'TypeError') {
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  getBudget: () =>
    withFallback(
      () => request('/budget'),
      () => readLocalState()
    ),

  updateSettings: (payload) =>
    withFallback(
      () => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalState();
        state.settings = { ...state.settings, ...payload };
        return writeLocalState(state);
      }
    ),

  addCategory: (payload) =>
    withFallback(
      () => request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalState();
        const category = {
          id: makeLocalId('cat'),
          name: String(payload.name || '').trim(),
          icon: payload.icon || 'Tag',
          color: payload.color || '#5D2EC2',
          budgetCap: Math.max(0, Number(payload.budgetCap) || 0),
          notes: String(payload.notes || '').trim(),
        };
        state.categories.push(category);
        return { category, data: writeLocalState(state) };
      }
    ),

  updateCategory: (id, payload) =>
    withFallback(
      () => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalState();
        const idx = state.categories.findIndex((c) => c.id === id);
        if (idx !== -1) {
          state.categories[idx] = { ...state.categories[idx], ...payload };
        }
        return { category: state.categories[idx], data: writeLocalState(state) };
      }
    ),

  deleteCategory: (id) =>
    withFallback(
      () => request(`/categories/${id}`, { method: 'DELETE' }),
      () => {
        const state = readLocalState();
        state.categories = state.categories.filter((c) => c.id !== id);
        state.expenses = state.expenses.filter((e) => e.categoryId !== id);
        return { data: writeLocalState(state) };
      }
    ),

  addExpense: (payload) =>
    withFallback(
      () => request('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalState();
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
        return { expense, data: writeLocalState(state) };
      }
    ),

  updateExpense: (id, payload) =>
    withFallback(
      () => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      () => {
        const state = readLocalState();
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
        return { expense: state.expenses[idx], data: writeLocalState(state) };
      }
    ),

  deleteExpense: (id) =>
    withFallback(
      () => request(`/expenses/${id}`, { method: 'DELETE' }),
      () => {
        const state = readLocalState();
        state.expenses = state.expenses.filter((e) => e.id !== id);
        return { data: writeLocalState(state) };
      }
    ),

  resetBudget: (mode) =>
    withFallback(
      () => request('/reset', { method: 'POST', body: JSON.stringify({ mode }) }),
      () => {
        if (mode === 'restore-sample') {
          const fresh = JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DATA));
          return { data: writeLocalState(fresh) };
        }
        const state = readLocalState();
        state.expenses = [];
        return { data: writeLocalState(state) };
      }
    ),

  exportLocalCsv: () => {
    const state = readLocalState();
    const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
    const rows = [
      ['Category', 'Expense / Item', 'Total Cost (INR)', 'Harsha Paid (INR)', 'Divya Paid (INR)', 'Total Paid (INR)', 'Balance Due (INR)', 'Status', 'Due Date', 'Comments / Notes'],
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
