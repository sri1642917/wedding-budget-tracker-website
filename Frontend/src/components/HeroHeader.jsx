import React from 'react';
import {
  Plus,
  Download,
  CalendarHeart,
  ChevronDown,
  FolderPlus,
} from 'lucide-react';
import { getDaysUntil, formatDateReadable } from '../utils/format';

export default function HeroHeader({
  settings,
  onAddExpense,
  onAddCategory,
  onEditSettings,
  onExportExcel,
  exporting,
}) {
  const daysLeft = getDaysUntil(settings?.weddingDate);
  const coupleNames = settings?.coupleNames || 'Harsha & Divya';
  const titleSuffix =
    settings?.subtitle && settings.subtitle !== 'Hyderabad Wedding Budget Tracker'
      ? settings.subtitle
      : 'Hyderabad Wedding Budget';

  const initials = coupleNames
    .split('&')
    .map((part) => part.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('&') || 'H&D';

  return (
    <header className="header-lotus-bg border-b border-royal-200/75">
      <div className="header-lotus-sides">
        <div className="header-lotus-watermark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: Best Top Title + Floating Countdown Pill */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <h1 className="font-serif text-[1.6rem] sm:text-[1.95rem] font-semibold tracking-[-0.015em] text-[#1A132B] leading-tight">
                  {coupleNames} <span className="text-royal-500 font-normal">—</span>{' '}
                  {titleSuffix}
                </h1>

                <button
                  type="button"
                  onClick={onEditSettings}
                  title={`Wedding Date: ${formatDateReadable(settings?.weddingDate)} — Click to edit`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-pill border border-royal-200/90 hover:border-royal-400 hover:bg-white transition-all"
                >
                  <CalendarHeart className="h-3.5 w-3.5 text-royal-600" />
                  <span>
                    {daysLeft !== null && daysLeft > 0
                      ? `${daysLeft} Days to Go`
                      : daysLeft === 0
                        ? 'Wedding Day!'
                        : formatDateReadable(settings?.weddingDate)}
                  </span>
                </button>
              </div>

              {/* Right: Clean Minimal Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onAddExpense}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-royal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-royal-900 transition-all active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  Add Expense
                </button>

                <button
                  type="button"
                  onClick={onAddCategory}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-sm font-medium text-ink border border-royal-200/90 shadow-sm hover:bg-royal-50 hover:border-royal-300 transition-all active:scale-[0.98]"
                  title="Add a new wedding category"
                >
                  <FolderPlus className="h-4 w-4 text-royal-600" />
                  <span className="hidden sm:inline">Add Category</span>
                </button>

                <button
                  type="button"
                  onClick={onExportExcel}
                  disabled={exporting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-sm font-medium text-ink border border-royal-200/90 shadow-sm hover:bg-royal-50 hover:border-royal-300 transition-all disabled:opacity-60 active:scale-[0.98]"
                  title="Sync to harsha-divya.xlsx and download Excel report"
                >
                  <Download className="h-4 w-4 text-royal-700" />
                  <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
                </button>

                <button
                  type="button"
                  onClick={onEditSettings}
                  className="inline-flex items-center gap-2 rounded-full bg-white/85 pl-1.5 pr-3 py-1 text-sm font-medium text-ink border border-royal-200/80 shadow-sm hover:bg-white hover:border-royal-300 transition-all"
                  title="Edit target budget, wedding date & settings"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-royal-700 to-royal-400 text-[11px] font-bold text-white shadow-inner">
                    {initials}
                  </span>
                  <span className="hidden xl:inline">{coupleNames}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-subtle" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
