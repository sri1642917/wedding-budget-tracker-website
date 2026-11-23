import React, { useEffect, useState } from 'react';
import { X, Users, User, SplitSquareHorizontal } from 'lucide-react';
import { formatINR } from '../utils/format';

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  categories,
  categoryStats = [],
  initialExpense,
  defaultCategoryId,
  groomName = 'Groom',
  brideName = 'Bride',
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
  const [payerModeOverride, setPayerModeOverride] = useState(null); // null uses category's payerMode | 'both' | 'groom' | 'bride'
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPayerModeOverride(null);
    setFormError('');
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
      const initialCatId = defaultCategoryId || categories[0]?.id || '';
      const initialCat = categories.find((c) => c.id === initialCatId);
      const capDefault =
        initialCat && Number(initialCat.budgetCap || 0) > 0
          ? String(initialCat.budgetCap)
          : '';
      setForm({
        title: '',
        categoryId: initialCatId,
        actual: capDefault,
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

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const effectivePayerMode = payerModeOverride || selectedCategory?.payerMode || 'both';

  const totalCostNum = Number(form.actual || 0);
  const harshaNum =
    effectivePayerMode === 'bride' ? 0 : Math.max(0, Number(form.harshaPaid || 0));
  const divyaNum =
    effectivePayerMode === 'groom' ? 0 : Math.max(0, Number(form.divyaPaid || 0));
  const totalPaidNum = harshaNum + divyaNum;
  const balanceNum = Math.max(0, totalCostNum - totalPaidNum);
  const overpaidBy = Math.max(0, totalPaidNum - totalCostNum);
  const hasBalance = balanceNum > 0;
  const isFullyPaid = totalCostNum > 0 && balanceNum === 0;
  const effectiveStatus =
    totalCostNum > 0 && totalPaidNum >= totalCostNum
      ? 'Paid'
      : totalPaidNum > 0
        ? 'Advance Paid'
        : 'Pending';

  // Live category budget cap calculation
  const selectedCatStat = categoryStats.find((c) => c.id === form.categoryId);
  const catCap = Number(selectedCategory?.budgetCap || 0);
  const existingCatSpent = Number(selectedCatStat?.actual || 0);
  const prevItemCost =
    initialExpense && initialExpense.categoryId === form.categoryId
      ? Number(initialExpense.actual || 0)
      : 0;
  const projectedCatSpent = Math.max(0, existingCatSpent - prevItemCost + totalCostNum);
  const projectedCapDiff = catCap > 0 ? catCap - projectedCatSpent : null;

  const computeStatus = (act, pd) => {
    if (act > 0 && pd >= act) return 'Paid';
    if (pd > 0) return 'Advance Paid';
    return 'Pending';
  };

  const handleModeSwitch = (nextMode) => {
    setPayerModeOverride(nextMode);
    const curTotalPaid =
      Math.max(0, Number(form.harshaPaid || 0)) + Math.max(0, Number(form.divyaPaid || 0));
    const act = Math.max(0, Number(form.actual || 0));
    if (nextMode === 'groom') {
      setForm({
        ...form,
        harshaPaid: String(curTotalPaid),
        divyaPaid: '0',
        status: computeStatus(act, curTotalPaid),
      });
    } else if (nextMode === 'bride') {
      setForm({
        ...form,
        harshaPaid: '0',
        divyaPaid: String(curTotalPaid),
        status: computeStatus(act, curTotalPaid),
      });
    }
  };

  const handleSplit5050 = () => {
    const act = Math.max(0, Number(form.actual || 0));
    const half = Math.floor(act / 2);
    const other = act - half;
    setPayerModeOverride('both');
    setForm({
      ...form,
      harshaPaid: String(half),
      divyaPaid: String(other),
      status: act > 0 ? 'Paid' : 'Pending',
    });
  };

  const handlePayFull = () => {
    const act = Math.max(0, Number(form.actual || 0));
    if (act <= 0) return;
    if (effectivePayerMode === 'groom') {
      setForm({ ...form, harshaPaid: String(act), divyaPaid: '0', status: 'Paid' });
    } else if (effectivePayerMode === 'bride') {
      setForm({ ...form, harshaPaid: '0', divyaPaid: String(act), status: 'Paid' });
    }
  };

  const handleAmountChange = (field, value) => {
    const updated = { ...form, [field]: value };
    if (effectivePayerMode === 'groom') {
      updated.divyaPaid = '0';
    } else if (effectivePayerMode === 'bride') {
      updated.harshaPaid = '0';
    }
    const act = Math.max(0, Number(updated.actual || 0));
    const h = effectivePayerMode === 'bride' ? 0 : Math.max(0, Number(updated.harshaPaid || 0));
    const d = effectivePayerMode === 'groom' ? 0 : Math.max(0, Number(updated.divyaPaid || 0));
    updated.status = computeStatus(act, h + d);
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || !form.categoryId) return;
    const exactCost = Math.max(0, Number(form.actual) || 0);
    if (exactCost <= 0) {
      setFormError('Please enter a Total Cost greater than ₹0.');
      return;
    }
    setSaving(true);
    try {
      const h = effectivePayerMode === 'bride' ? 0 : Math.max(0, Number(form.harshaPaid) || 0);
      const d = effectivePayerMode === 'groom' ? 0 : Math.max(0, Number(form.divyaPaid) || 0);
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
        status: effectiveStatus,
        dueDate: isFullyPaid ? '' : form.dueDate,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-royal-900/45 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white modal-3d border border-royal-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {initialExpense ? 'Edit Wedding Expense' : 'Add Wedding Expense'}
            </h3>
            <p className="text-xs text-royal-100/85">
              Enter exact amounts in Indian Rupees (₹) for {groomName} &amp; {brideName}
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
          {formError && (
            <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}
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
                placeholder={
                  selectedCategory
                    ? `e.g., ${selectedCategory.name} Booking`
                    : 'e.g., Convention Hall Booking'
                }
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
                onChange={(e) => {
                  const nextCatId = e.target.value;
                  const nextCat = categories.find((c) => c.id === nextCatId);
                  setPayerModeOverride(null);
                  setFormError('');
                  setForm((prev) => {
                    const nextCap =
                      !initialExpense && nextCat && Number(nextCat.budgetCap || 0) > 0
                        ? Number(nextCat.budgetCap)
                        : Number(prev.actual || 0);
                    const curPaid =
                      Number(prev.harshaPaid || 0) + Number(prev.divyaPaid || 0);
                    const resetPaid = !initialExpense && curPaid > nextCap;
                    return {
                      ...prev,
                      categoryId: nextCatId,
                      ...(!initialExpense && nextCat && Number(nextCat.budgetCap || 0) > 0
                        ? { actual: String(nextCat.budgetCap) }
                        : {}),
                      ...(resetPaid ? { harshaPaid: '0', divyaPaid: '0', status: 'Pending' } : {}),
                    };
                  });
                }}
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

          {/* Payer Mode Selector Bar */}
          <div className="rounded-2xl bg-royal-50/75 p-3 border border-royal-200/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-royal-800">
                Who Is Paying for This Expense?
              </span>
              {effectivePayerMode === 'both' && totalCostNum > 0 && (
                <button
                  type="button"
                  onClick={handleSplit5050}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-royal-800 border border-royal-200 shadow-sm hover:bg-royal-100"
                >
                  <SplitSquareHorizontal className="h-3 w-3" />
                  50/50 Split ({formatINR(Math.floor(totalCostNum / 2))} each)
                </button>
              )}
              {effectivePayerMode !== 'both' && totalCostNum > 0 && balanceNum > 0 && (
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-50"
                >
                  Pay Full ({formatINR(totalCostNum)})
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeSwitch('both')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold border transition-all ${
                  effectivePayerMode === 'both'
                    ? 'btn-3d-primary text-white border-royal-800'
                    : 'bg-white text-ink-muted border-royal-200 hover:text-ink'
                }`}
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>Split: Both</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('groom')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold border transition-all ${
                  effectivePayerMode === 'groom'
                    ? 'bg-[#5B21B6] text-white border-[#4C1D95] shadow-sm'
                    : 'bg-white text-[#4C1D95] border-[#C4B5FD] hover:bg-[#EDE9FE]/60'
                }`}
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Only {groomName}</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('bride')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold border transition-all ${
                  effectivePayerMode === 'bride'
                    ? 'bg-[#A21CAF] text-white border-[#86198F] shadow-sm'
                    : 'bg-white text-[#86198F] border-[#E879F9]/70 hover:bg-[#FDF4FF]'
                }`}
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Only {brideName}</span>
              </button>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-3 ${
              effectivePayerMode === 'both' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            }`}
          >
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

            {effectivePayerMode !== 'bride' && (
              <div>
                <label
                  htmlFor="exp-harsha-paid"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4C1D95] mb-1.5"
                >
                  {groomName} Paid (₹)
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
            )}

            {effectivePayerMode !== 'groom' && (
              <div>
                <label
                  htmlFor="exp-divya-paid"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#86198F] mb-1.5"
                >
                  {brideName} Paid (₹)
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
            )}
          </div>

          <div className="space-y-2">
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

            {overpaidBy > 0 && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 border border-amber-200">
                Note: Total Paid exceeds Total Cost by <strong>{formatINR(overpaidBy)}</strong>.
                Please double-check the amounts.
              </p>
            )}

            {projectedCapDiff !== null && totalCostNum > 0 && (
              <p
                className={`rounded-xl px-3.5 py-1.5 text-[11px] font-medium border ${
                  projectedCapDiff < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80'
                }`}
              >
                {projectedCapDiff < 0
                  ? `Budget Cap Alert: "${selectedCategory?.name}" will exceed its ${formatINR(catCap)} cap by ${formatINR(Math.abs(projectedCapDiff))}.`
                  : `Category Budget Left in "${selectedCategory?.name}": ${formatINR(projectedCapDiff)} (Cap: ${formatINR(catCap)})`}
              </p>
            )}
          </div>

          <div className={`grid grid-cols-1 gap-4 ${isFullyPaid ? '' : 'sm:grid-cols-2'}`}>
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
                value={effectiveStatus}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              >
                <option value="Pending" disabled={totalPaidNum > 0}>
                  {totalPaidNum > 0 ? 'Pending (Payment already recorded)' : 'Pending'}
                </option>
                <option value="Advance Paid" disabled={totalPaidNum === 0 || isFullyPaid}>
                  {totalPaidNum === 0
                    ? 'Advance Paid (Enter paid amount first)'
                    : isFullyPaid
                      ? 'Advance Paid (Already fully paid)'
                      : 'Advance Paid'}
                </option>
                <option value="Paid" disabled={hasBalance || totalCostNum === 0}>
                  {hasBalance ? 'Paid (Clear balance due first)' : 'Paid'}
                </option>
              </select>
            </div>

            {!isFullyPaid && (
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
            )}
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
              className="rounded-xl btn-3d-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : initialExpense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
