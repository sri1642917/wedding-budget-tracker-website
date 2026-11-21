import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Tag,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import {
  formatINR,
  formatDateReadable,
  getStatusStyle,
  getPayerStyle,
  ICON_MAP,
} from '../utils/format';

export default function ExpenseTable({
  expenses,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onQuickMarkPaid,
  onQuickUpdateNote,
  onRestoreSample,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [payerFilter, setPayerFilter] = useState('All');
  const [commentingId, setCommentingId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const openCommentEditor = (exp) => {
    if (commentingId === exp.id) {
      setCommentingId(null);
      return;
    }
    setCommentingId(exp.id);
    setCommentDraft(exp.notes || '');
  };

  const handleSaveComment = async (exp) => {
    if (!onQuickUpdateNote) return;
    setSavingComment(true);
    try {
      await onQuickUpdateNote(exp, commentDraft.trim());
      setCommentingId(null);
    } finally {
      setSavingComment(false);
    }
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((exp) => {
      if (selectedCategoryId && exp.categoryId !== selectedCategoryId) return false;
      if (statusFilter !== 'All' && exp.status !== statusFilter) return false;
      if (payerFilter !== 'All' && (exp.paidBy || 'Shared') !== payerFilter) return false;
      if (q) {
        const catName = categoryMap.get(exp.categoryId)?.name || '';
        const haystack = `${exp.title} ${exp.vendor || ''} ${exp.notes || ''} ${catName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, selectedCategoryId, statusFilter, payerFilter, search, categoryMap]);

  const filteredTotals = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, e) => {
        const act = Number(e.actual || 0);
        const paid = Number(e.paid || 0);
        acc.actual += act;
        acc.paid += paid;
        acc.balance += Math.max(0, act - paid);
        return acc;
      },
      { actual: 0, paid: 0, balance: 0 }
    );
  }, [filteredExpenses]);

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategoryId) ||
    statusFilter !== 'All' ||
    payerFilter !== 'All';

  return (
    <section className="rounded-2xl bg-white/95 shadow-card border border-royal-200/85 overflow-hidden">
      {/* Clean Single-Bar Header + Compact Filters */}
      <div className="px-6 py-4 border-b border-royal-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            Vendor Expense Tracker
          </h2>
          <span className="rounded-full bg-royal-50 px-2.5 py-0.5 text-xs font-semibold text-royal-700 border border-royal-200/80">
            {filteredExpenses.length}
            {filteredExpenses.length !== expenses.length ? ` / ${expenses.length}` : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-subtle" />
            <input
              id="expense-search"
              name="expenseSearch"
              aria-label="Search wedding expenses"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor or item..."
              className="w-full rounded-xl border border-royal-200/90 bg-pearl py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle focus:border-royal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
            />
          </div>

          <select
            id="expense-category-filter"
            name="categoryFilter"
            aria-label="Filter by category"
            value={selectedCategoryId || ''}
            onChange={(e) => onSelectCategory(e.target.value || null)}
            className="flex-1 sm:flex-none rounded-xl border border-royal-200/90 bg-pearl px-2.5 py-1.5 text-xs text-ink focus:border-royal-600 focus:bg-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            id="expense-status-filter"
            name="statusFilter"
            aria-label="Filter by payment status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-xl border border-royal-200/90 bg-pearl px-2.5 py-1.5 text-xs text-ink focus:border-royal-600 focus:bg-white focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Advance Paid">Advance Paid</option>
            <option value="Pending">Pending</option>
          </select>

          <select
            id="expense-payer-filter"
            name="payerFilter"
            aria-label="Filter by payer"
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-xl border border-royal-200/90 bg-pearl px-2.5 py-1.5 text-xs text-ink focus:border-royal-600 focus:bg-white focus:outline-none"
          >
            <option value="All">All Payers</option>
            <option value="Harsha">Harsha</option>
            <option value="Divya">Divya</option>
            <option value="Shared">Shared</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setPayerFilter('All');
                onSelectCategory(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-royal-100 px-2.5 py-1.5 text-xs font-semibold text-royal-800 hover:bg-royal-200/80 transition-colors"
            >
              Reset Filters ×
            </button>
          )}

          {expenses.length === 0 && (
            <button
              type="button"
              onClick={onRestoreSample}
              className="inline-flex items-center gap-1 rounded-xl bg-royal-50 px-2.5 py-1.5 text-xs font-medium text-royal-800 border border-royal-200 hover:bg-royal-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Load Sample
            </button>
          )}
        </div>
      </div>

      {/* Table Body */}
      {filteredExpenses.length === 0 ? (
        <div className="py-14 px-6 text-center">
          <p className="font-serif text-lg text-ink">No matching wedding expenses found</p>
          <p className="text-xs text-ink-subtle mt-1">
            Add your first vendor quote or adjust the filters above.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setPayerFilter('All');
                  onSelectCategory(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-royal-50 px-4 py-2 text-xs font-semibold text-royal-800 border border-royal-200 hover:bg-royal-100"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center gap-1.5 rounded-xl bg-royal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-royal-900"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pearl/90 text-xs font-semibold text-ink-muted border-b border-royal-100">
                <th className="py-3 pl-6 pr-3">Vendor Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-right">Total Cost</th>
                <th className="px-3 py-3 text-right">Paid</th>
                <th className="px-3 py-3 text-center">Paid By</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="py-3 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-royal-100/80 text-sm">
              {filteredExpenses.map((exp) => {
                const cat = categoryMap.get(exp.categoryId);
                const IconComp = ICON_MAP[cat?.icon] || Tag;
                const actual = Number(exp.actual || 0);
                const estimated = Number(exp.estimated || 0);
                const paid = Number(exp.paid || 0);
                const balance = Math.max(0, actual - paid);
                const isSettled = exp.status === 'Paid' && balance === 0;
                const primaryName = exp.vendor || exp.title;
                const secondaryText = exp.vendor ? exp.title : exp.notes;

                const isCommenting = commentingId === exp.id;

                return (
                  <React.Fragment key={exp.id}>
                    <tr className="hover:bg-royal-50/45 transition-colors group">
                      <td className="py-3.5 pl-6 pr-3 max-w-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-royal-50 text-royal-600 border border-royal-100">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate leading-snug">
                              {primaryName}
                            </p>
                            {(secondaryText || exp.dueDate) && (
                              <div className="flex items-center gap-1.5 text-xs text-ink-subtle mt-0.5 min-w-0">
                                {secondaryText && (
                                  <span className="truncate">{secondaryText}</span>
                                )}
                                {secondaryText && exp.dueDate && (
                                  <span className="shrink-0">•</span>
                                )}
                                {exp.dueDate && (
                                  <span className="shrink-0 whitespace-nowrap">
                                    Due {formatDateReadable(exp.dueDate)}
                                  </span>
                                )}
                              </div>
                            )}
                            {exp.notes && exp.vendor && (
                              <p
                                title={exp.notes}
                                className="mt-1 flex items-center gap-1 text-[11px] text-royal-700/85 min-w-0"
                              >
                                <MessageSquare className="h-3 w-3 shrink-0 text-royal-400" />
                                <span className="truncate italic">{exp.notes}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-sm text-ink">
                          <IconComp
                            className="h-4 w-4 shrink-0"
                            style={{ color: cat?.color || '#5D2EC2' }}
                          />
                          <span>{cat?.name || 'Uncategorized'}</span>
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">
                        <p className="font-semibold text-ink">{formatINR(actual)}</p>
                        {estimated > 0 && estimated !== actual && (
                          <p className="text-[11px] text-ink-subtle">
                            Est. {formatINR(estimated)}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">
                        <p className="font-medium text-ink">{formatINR(paid)}</p>
                        {balance > 0 && (
                          <p className="text-[11px] text-ink-subtle">
                            Bal. {formatINR(balance)}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium ${getPayerStyle(
                            exp.paidBy || 'Shared'
                          )}`}
                        >
                          {exp.paidBy || 'Shared'}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${getStatusStyle(
                            exp.status
                          )}`}
                        >
                          {exp.status}
                        </span>
                      </td>

                      <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openCommentEditor(exp)}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isCommenting || exp.notes
                                ? 'text-royal-700 bg-royal-50 hover:bg-royal-100'
                                : 'text-ink-subtle hover:bg-royal-50 hover:text-royal-700'
                            }`}
                            title={exp.notes ? `Comment: ${exp.notes}` : 'Add comment'}
                            aria-label={`Comment on ${primaryName}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          {!isSettled && (
                            <button
                              type="button"
                              onClick={() => onQuickMarkPaid(exp)}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Mark as fully paid"
                              aria-label={`Mark ${primaryName} as paid`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditExpense(exp)}
                            className="rounded-lg p-1.5 text-ink-subtle hover:bg-royal-50 hover:text-royal-700 transition-colors"
                            title="Edit expense"
                            aria-label={`Edit ${primaryName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp)}
                            className="rounded-lg p-1.5 text-ink-subtle hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete expense"
                            aria-label={`Delete ${primaryName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isCommenting && (
                      <tr className="bg-royal-50/70">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <MessageSquare className="h-4 w-4 text-royal-600 shrink-0" />
                              <input
                                id={`comment-input-${exp.id}`}
                                name="quickComment"
                                aria-label={`Comment for ${primaryName}`}
                                type="text"
                                autoFocus
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveComment(exp);
                                  if (e.key === 'Escape') setCommentingId(null);
                                }}
                                placeholder="Add a comment, vendor phone number, or package note..."
                                className="w-full rounded-xl border border-royal-300 bg-white px-3 py-1.5 text-xs text-ink focus:border-royal-700 focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={savingComment}
                                onClick={() => handleSaveComment(exp)}
                                className="inline-flex items-center gap-1 rounded-lg bg-royal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-royal-900 disabled:opacity-60"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {savingComment ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCommentingId(null)}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-ink-muted border border-royal-200 hover:bg-royal-50"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-royal-50/70 font-semibold text-sm border-t border-royal-200/80">
                <td colSpan={2} className="py-3 pl-6 pr-3 text-royal-900">
                  Total ({filteredExpenses.length}{' '}
                  {filteredExpenses.length === 1 ? 'item' : 'items'})
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-ink">
                  {formatINR(filteredTotals.actual)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-royal-800">
                  {formatINR(filteredTotals.paid)}
                </td>
                <td colSpan={3} className="py-3 pl-3 pr-6 text-right text-xs font-medium text-ink-muted tabular-nums">
                  Balance Due: <span className="font-semibold text-ink">{formatINR(filteredTotals.balance)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
