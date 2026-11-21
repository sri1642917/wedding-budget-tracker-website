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
    actual: '',
    harshaPaid: '0',
    divyaPaid: '0',
    status: 'Pending',
    dueDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialExpense) {
      const hPaid =
        initialExpense.harshaPaid !== undefined
          ? Number(initialExpense.harshaPaid || 0)
          : initialExpense.paidBy === 'Harsha'
            ? Number(initialExpense.paid || 0)
            : initialExpense.paidBy === 'Divya'
              ? 0
              : Math.floor(Number(initialExpense.paid || 0) / 2);
      const dPaid =
        initialExpense.divyaPaid !== undefined
          ? Number(initialExpense.divyaPaid || 0)
          : initialExpense.paidBy === 'Divya'
            ? Number(initialExpense.paid || 0)
            : initialExpense.paidBy === 'Harsha'
              ? 0
              : Number(initialExpense.paid || 0) - hPaid;

      setForm({
        title: initialExpense.title || '',
        categoryId: initialExpense.categoryId || categories[0]?.id || '',
        actual: String(initialExpense.actual ?? ''),
        harshaPaid: String(hPaid),
        divyaPaid: String(dPaid),
        status: initialExpense.status || 'Pending',
        dueDate: initialExpense.dueDate || '',
        notes: initialExpense.notes || '',
      });
    } else {
      setForm({
        title: '',
        categoryId: defaultCategoryId || categories[0]?.id || '',
        actual: '',
        harshaPaid: '0',
        divyaPaid: '0',
        status: 'Pending',
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
  const harshaNum = Math.max(0, Number(form.harshaPaid || 0));
  const divyaNum = Math.max(0, Number(form.divyaPaid || 0));
  const totalPaidNum = harshaNum + divyaNum;
  const balanceNum = Math.max(0, totalCostNum - totalPaidNum);

  const handleAmountChange = (field, value) => {
    const updated = { ...form, [field]: value };
    const act = Math.max(0, Number(updated.actual || 0));
    const h = Math.max(0, Number(updated.harshaPaid || 0));
    const d = Math.max(0, Number(updated.divyaPaid || 0));
    const pd = h + d;
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
      const exactCost = Math.max(0, Number(form.actual) || 0);
      const h = Math.max(0, Number(form.harshaPaid) || 0);
      const d = Math.max(0, Number(form.divyaPaid) || 0);
      const totalPaid = h + d;
      const derivedPaidBy =
        h > 0 && d > 0 ? 'Shared' : h > 0 ? 'Harsha' : d > 0 ? 'Divya' : 'Shared';

      await onSave({
        title: form.title.trim(),
        categoryId: form.categoryId,
        vendor: '',
        estimated: exactCost,
        actual: exactCost,
        paid: totalPaid,
        harshaPaid: h,
        divyaPaid: d,
        paidBy: derivedPaidBy,
        status: form.status,
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
            <div>
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
                placeholder="e.g., Convention Hall Booking"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                step="1"
                required
                value={form.actual}
                onChange={(e) => handleAmountChange('actual', e.target.value)}
                placeholder="e.g., 180000"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm tabular-nums font-semibold text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="exp-harsha-paid"
                className="block text-xs font-semibold uppercase tracking-wider text-[#4C1D95] mb-1.5"
              >
                Harsha Paid (₹)
              </label>
              <input
                id="exp-harsha-paid"
                name="harshaPaid"
                type="number"
                min="0"
                step="1"
                value={form.harshaPaid}
                onChange={(e) => handleAmountChange('harshaPaid', e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#C4B5FD] bg-[#F6F3FE] px-3.5 py-2.5 text-sm tabular-nums font-medium text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="exp-divya-paid"
                className="block text-xs font-semibold uppercase tracking-wider text-[#86198F] mb-1.5"
              >
                Divya Paid (₹)
              </label>
              <input
                id="exp-divya-paid"
                name="divyaPaid"
                type="number"
                min="0"
                step="1"
                value={form.divyaPaid}
                onChange={(e) => handleAmountChange('divyaPaid', e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#E879F9]/70 bg-[#FDF4FF] px-3.5 py-2.5 text-sm tabular-nums font-medium text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-royal-50 px-4 py-2.5 text-xs border border-royal-200/80">
            <span className="text-ink-muted font-medium">
              Total Paid:{' '}
              <strong className="tabular-nums text-emerald-700 text-sm">
                {formatINR(totalPaidNum)}
              </strong>
            </span>
            <span className="text-ink-muted font-medium">
              Balance Due:{' '}
              <strong className="tabular-nums text-royal-900 text-sm">
                {formatINR(balanceNum)}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Advance Paid">Advance Paid</option>
                <option value="Paid">Paid</option>
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
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="exp-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              Comments / Notes
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
