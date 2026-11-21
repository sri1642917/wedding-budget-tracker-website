import React from 'react';
import { Plus, Pencil, Trash2, Tag, MessageSquare } from 'lucide-react';
import { formatINR, ICON_MAP } from '../utils/format';

export default function CategoryGrid({
  categoryStats,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  return (
    <section className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            Wedding Categories
          </h2>
          <p className="text-xs text-ink-subtle">
            Click a category to filter expenses, or customize and add new ones anytime
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-xs font-semibold text-royal-800 hover:text-royal-900 bg-royal-100 px-3 py-1.5 rounded-full border border-royal-200 transition-colors"
            >
              Show All Categories ×
            </button>
          )}
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-royal-800 border border-royal-200/90 shadow-sm hover:bg-royal-50 hover:border-royal-300 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {categoryStats.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || Tag;
          const isSelected = selectedCategoryId === cat.id;
          const cap = Number(cat.budgetCap || 0);
          const usagePct =
            cap > 0
              ? Math.min(100, Math.round((cat.actual / cap) * 100))
              : cat.actual > 0
                ? 100
                : 0;
          const isOverCap = cap > 0 && cat.actual > cap;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`group relative cursor-pointer flex flex-col justify-between rounded-2xl bg-white/95 p-4 shadow-card border transition-all duration-200 ${
                isSelected
                  ? 'border-royal-700 ring-2 ring-royal-600/15 shadow-card-hover'
                  : 'border-royal-200/80 hover:border-royal-400 hover:shadow-card-hover'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: cat.color || '#5D2EC2' }}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      title={cat.name}
                      className="font-semibold text-ink leading-snug line-clamp-2 text-sm"
                    >
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-ink-subtle mt-0.5">
                      {cat.count} {cat.count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onEditCategory(cat)}
                    className="rounded-lg p-1 text-ink-subtle hover:bg-royal-50 hover:text-royal-700 transition-colors"
                    title="Edit category"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(cat)}
                    className="rounded-lg p-1 text-ink-subtle hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Delete category"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3.5">
                {cat.notes && (
                  <p
                    title={cat.notes}
                    className="mb-2.5 flex items-center gap-1.5 rounded-lg bg-royal-50/70 px-2.5 py-1 text-[11px] text-ink-muted border border-royal-100"
                  >
                    <MessageSquare className="h-3 w-3 shrink-0 text-royal-500" />
                    <span className="truncate">{cat.notes}</span>
                  </p>
                )}
                <div className="flex items-baseline justify-between gap-2 tabular-nums">
                  <p className="text-base font-bold text-ink">{formatINR(cat.actual)}</p>
                  <p className="text-[11px] text-ink-subtle">
                    {cap > 0 ? `of ${formatINR(cap)}` : `Paid ${formatINR(cat.paid)}`}
                  </p>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-royal-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usagePct}%`,
                        backgroundColor: isOverCap ? '#E11D48' : cat.color || '#5D2EC2',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] tabular-nums">
                    <span className="text-emerald-700 font-medium">
                      Paid {formatINR(cat.paid)}
                    </span>
                    <span className={isOverCap ? 'text-rose-600 font-semibold' : 'text-ink-subtle'}>
                      {cap > 0
                        ? isOverCap
                          ? `Over ${formatINR(cat.actual - cap)}`
                          : `Left ${formatINR(cap - cat.actual)}`
                        : `Due ${formatINR(cat.balance)}`}
                    </span>
                  </div>
                </div>

                {/* Harsha & Divya Paid Breakdown */}
                <div className="mt-2.5 pt-2 border-t border-royal-100/90 flex flex-wrap items-center justify-between gap-1.5 text-[11px] tabular-nums">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 font-medium text-[#4C1D95] border border-[#C4B5FD]/80">
                    <span>Harsha</span>
                    <strong className="font-semibold">{formatINR(cat.harshaPaid || 0)}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5D0FE]/65 px-2 py-0.5 font-medium text-[#86198F] border border-[#E879F9]/60">
                    <span>Divya</span>
                    <strong className="font-semibold">{formatINR(cat.divyaPaid || 0)}</strong>
                  </span>
                  {cat.sharedPaid > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E5E7EB]/85 px-2 py-0.5 font-medium text-[#374151] border border-[#D1D5DB]">
                      <span>Shared</span>
                      <strong className="font-semibold">{formatINR(cat.sharedPaid)}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Category Card */}
        <button
          type="button"
          onClick={onAddCategory}
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-royal-300/90 bg-white/55 p-5 text-center hover:border-royal-700 hover:bg-royal-50/70 transition-all min-h-[144px]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-royal-700 shadow-sm border border-royal-200 group-hover:scale-105 group-hover:bg-royal-800 group-hover:text-white transition-all">
            <Plus className="h-5 w-5" />
          </div>
          <p className="mt-2.5 font-semibold text-royal-900 text-sm">
            Add Category
          </p>
          <p className="mt-0.5 text-[11px] text-ink-subtle max-w-[180px]">
            Decoration, Makeup, Jewellery, Gifts...
          </p>
        </button>
      </div>
    </section>
  );
}
