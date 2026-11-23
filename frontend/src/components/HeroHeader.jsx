import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Download,
  CalendarHeart,
  ChevronDown,
  FolderPlus,
  Settings,
  KeyRound,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { getDaysUntil, formatDateReadable } from '../utils/format';

export default function HeroHeader({
  settings,
  user,
  groomName = 'Groom',
  brideName = 'Bride',
  onAddExpense,
  onAddCategory,
  onEditSettings,
  onChangePassword,
  onOpenHelp,
  onLogout,
  onExportExcel,
  exporting,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const daysLeft = getDaysUntil(settings?.weddingDate);
  const coupleNames =
    settings?.coupleNames ||
    (groomName && brideName ? `${groomName} & ${brideName}` : user?.displayName || 'My Wedding');
  const titleSuffix =
    settings?.subtitle &&
    settings.subtitle !== 'Hyderabad Wedding Budget Tracker' &&
    settings.subtitle !== 'Hyderabad Wedding Budget'
      ? settings.subtitle
      : 'Wedding Budget Tracker';

  const initials =
    `${groomName.charAt(0).toUpperCase()}&${brideName.charAt(0).toUpperCase()}` || 'WB';

  return (
    <header className="header-lotus-bg border-b border-royal-200/80">
      <div className="header-lotus-sides">
        <div className="header-lotus-watermark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: Top Title + 3D Floating Countdown Pill */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <h1 className="font-serif text-[1.6rem] sm:text-[1.95rem] font-semibold tracking-[-0.015em] text-[#1A132B] leading-tight drop-shadow-sm">
                  {coupleNames} <span className="text-royal-500 font-normal">—</span>{' '}
                  {titleSuffix}
                </h1>

                <button
                  type="button"
                  onClick={onEditSettings}
                  title={`Wedding Date: ${formatDateReadable(settings?.weddingDate)} — Click to edit`}
                  className="inline-flex items-center gap-1.5 rounded-full btn-3d-white px-3.5 py-1.5 text-xs font-semibold text-ink border border-royal-200/90"
                >
                  <CalendarHeart className="h-3.5 w-3.5 text-royal-600" />
                  <span>
                    {daysLeft !== null && daysLeft > 0
                      ? `${daysLeft} Days to Go`
                      : daysLeft === 0
                        ? 'Wedding Day!'
                        : settings?.weddingDate
                          ? formatDateReadable(settings.weddingDate)
                          : 'Set Wedding Date'}
                  </span>
                </button>
              </div>

              {/* Right: 3D Tactile Controls + Account Menu */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onAddExpense}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl btn-3d-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  Add Expense
                </button>

                <button
                  type="button"
                  onClick={onAddCategory}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl btn-3d-white px-3.5 py-2 text-sm font-medium text-ink border border-royal-200/90"
                  title="Add a new wedding category"
                >
                  <FolderPlus className="h-4 w-4 text-royal-600" />
                  <span className="hidden sm:inline">Add Category</span>
                </button>

                <button
                  type="button"
                  onClick={onExportExcel}
                  disabled={exporting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl btn-3d-white px-3.5 py-2 text-sm font-medium text-ink border border-royal-200/90 disabled:opacity-60"
                  title="Download formatted Excel budget report (.xlsx)"
                >
                  <Download className="h-4 w-4 text-royal-700" />
                  <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
                </button>

                {onOpenHelp && (
                  <button
                    type="button"
                    onClick={onOpenHelp}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl btn-3d-white px-3 py-2 text-sm font-semibold text-royal-800 border border-royal-200/90"
                    title="View complete user guide & help"
                  >
                    <HelpCircle className="h-4 w-4 text-royal-600" />
                    <span>Help</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl btn-3d-white px-3 py-2 text-sm font-semibold text-rose-600 border border-rose-200/90 hover:bg-rose-50"
                  title="Sign out of your account"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>

                {/* Account Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="inline-flex items-center gap-2 rounded-full btn-3d-white pl-1.5 pr-3 py-1 text-sm font-medium text-ink border border-royal-200/90"
                    title="Account, Settings & Password"
                    aria-expanded={menuOpen}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-royal-700 to-royal-400 text-[11px] font-bold text-white icon-tile-3d">
                      {initials}
                    </span>
                    <span className="hidden xl:inline">@{user?.username || 'account'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-ink-subtle" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white modal-3d border border-royal-200 py-1.5 z-40">
                      <div className="px-4 py-2 border-b border-royal-100">
                        <p className="text-xs font-semibold text-ink truncate">{coupleNames}</p>
                        <p className="text-[11px] text-ink-subtle truncate">
                          Signed in as @{user?.username}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEditSettings();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-medium text-ink hover:bg-royal-50"
                      >
                        <Settings className="h-3.5 w-3.5 text-royal-600" />
                        Wedding Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onChangePassword();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-medium text-ink hover:bg-royal-50"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-royal-600" />
                        Change Password
                      </button>
                      <div className="my-1 border-t border-royal-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
