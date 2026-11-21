import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatINR } from '../utils/format';

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  categories,
  initialExpense,
  defaultCategoryId,
}) {
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    vendor: '',
    actual: '',
    paid: '',
    status: 'Pending',
    paidBy: 'Shared',
    dueDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialExpense) {
      setForm({
        title: initialExpense.title || '',
        categoryId: initialExpense.categoryId || categories[0]?.id || '',
        vendor: initialExpense.vendor || '',
        actual: String(initialExpense.actual ?? ''),
        paid: String(initialExpense.paid ?? ''),
        status: initialExpense.status || 'Pending',
        paidBy: initialExpense.paidBy || 'Shared',
        dueDate: initialExpense.dueDate || '',
        notes: initialExpense.notes || '',
      });
    } else {
      setForm({
        title: '',
        categoryId: defaultCategoryId || categories[0]?.id || '',
        vendor: '',
        actual: '',
        paid: '0',
        status: 'Pending',
        paidBy: 'Shared',
        dueDate: '',
        notes: '',
      });
    }
  }, [isOpen, initialExpense, defaultCategoryId, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalCostNum = Number(form.actual || 0);
  const paidNum = Number(form.paid || 0);
  const balanceNum = Math.max(0, totalCostNum - paidNum);

  const handleAmountChange = (field, value) => {
    const updated = { ...form, [field]: value };
    const act = Number(updated.actual || 0);
    const pd = Number(updated.paid || 0);
    if (act > 0 && pd >= act) {
      updated.status = 'Paid';
    } else if (pd > 0) {
      updated.status = 'Advance Paid';
    } else {
      updated.status = 'Pending';
    }
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.categoryId) return;
    setSaving(true);
    try {
      const exactCost = Number(form.actual) || 0;
      await onSave({
        title: form.title.trim(),
        categoryId: form.categoryId,
        vendor: form.vendor.trim(),
        estimated: exactCost,
        actual: exactCost,
        paid: Number(form.paid) || 0,
        status: form.status,
        paidBy: form.paidBy,
        dueDate: form.dueDate,
        notes: form.notes.trim(),
      });
      onClose();
    } catch {
      // Error toast is handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-royal-900/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-royal-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {initialExpense ? 'Edit Wedding Expense' : 'Add Wedding Expense'}
            </h3>
            <p className="text-xs text-royal-100/85">
              Enter exact amounts in Indian Rupees (₹)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="exp-title"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Expense / Item Name *
              </label>
              <input
                id="exp-title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Main Convention Hall Booking"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="exp-category"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Category *
              </label>
              <select
                id="exp-category"
                name="categoryId"
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-vendor"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Vendor / Contact Name
              </label>
              <input
                id="exp-vendor"
                name="vendor"
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g., Deccan Royal Caterers"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="exp-actual"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Total Cost (₹) *
              </label>
              <input
                id="exp-actual"
                name="actual"
                type="number"
                min="0"
                step="100"
                required
                value={form.actual}
                onChange={(e) => handleAmountChange('actual', e.target.value)}
                placeholder="e.g., 580000"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm tabular-nums font-semibold text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>
            <div>
              <label
                htmlFor="exp-paid"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Paid So Far (₹)
              </label>
              <input
                id="exp-paid"
                name="paid"
                type="number"
                min="0"
                step="100"
                value={form.paid}
                onChange={(e) => handleAmountChange('paid', e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm tabular-nums text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-royal-50 px-4 py-2.5 text-xs border border-royal-200/80">
            <span className="text-ink-muted font-medium">Auto-calculated Balance Due:</span>
            <span className="font-bold tabular-nums text-royal-900 text-sm">
              {formatINR(balanceNum)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="exp-status"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Payment Status
              </label>
              <select
                id="exp-status"
                name="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Advance Paid">Advance Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-paid-by"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Paid By
              </label>
              <select
                id="exp-paid-by"
                name="paidBy"
                value={form.paidBy}
                onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              >
                <option value="Shared">Shared</option>
                <option value="Harsha">Harsha</option>
                <option value="Divya">Divya</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-due-date"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Payment Due Date
              </label>
              <input
                id="exp-due-date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="exp-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              Comments / Notes (Vendor Phone, Package Details)
            </label>
            <textarea
              id="exp-notes"
              name="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Package inclusions, phone number, advance receipt details..."
              className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-royal-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-royal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-royal-900 shadow-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : initialExpense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
