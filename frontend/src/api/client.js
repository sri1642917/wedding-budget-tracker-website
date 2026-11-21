const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getBudget: () => request('/budget'),
  updateSettings: (payload) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  addCategory: (payload) =>
    request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  addExpense: (payload) =>
    request('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  updateExpense: (id, payload) =>
    request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  resetBudget: (mode) =>
    request('/reset', { method: 'POST', body: JSON.stringify({ mode }) }),
  syncExcel: () => request('/sync-excel', { method: 'POST' }),
  exportExcelUrl: `${API_BASE}/export-excel`,
};
