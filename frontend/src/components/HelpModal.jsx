import React, { useEffect, useState } from 'react';
import {
  X,
  HelpCircle,
  UserPlus,
  FolderPlus,
  PlusCircle,
  CalendarHeart,
  Download,
  ShieldCheck,
  Users,
  User,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ListChecks,
} from 'lucide-react';

export default function HelpModal({
  isOpen,
  onClose,
  groomName = 'Groom',
  brideName = 'Bride',
  username = '',
  onQuickAddCategory,
  onQuickAddExpense,
}) {
  const [activeTab, setActiveTab] = useState('workflow');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'workflow', label: '1. Step-by-Step Sequence' },
    { key: 'categories', label: '2. Categories & Split Mode' },
    { key: 'expenses', label: '3. Adding Expenses' },
    { key: 'accounts', label: '4. Accounts, Countdown & Excel' },
  ];

  const workflowSteps = [
    {
      step: 'Step 1',
      title: 'Check Wedding Categories First',
      desc: 'Before adding any expense, scroll to the "Wedding Categories" section and check if your category (e.g., Photography, Decoration, Gold Jewellery, Convention Venue, Food) is already listed.',
      badge: 'Check First',
    },
    {
      step: 'Step 2',
      title: 'Create Missing Category & Choose "Who Pays?"',
      desc: `If a category is not there, click "+ Add Category" first! Give it a name, budget cap, and choose whether it is "Split Between Both (${groomName} & ${brideName})", "Only ${groomName}", or "Only ${brideName}".`,
      badge: 'Create Category',
    },
    {
      step: 'Step 3',
      title: 'Add Expenses Under That Category',
      desc: `Once the category exists, click "+ Add Expense", select that category from the dropdown, enter the Total Cost (₹), and enter how much ${groomName} or ${brideName} paid (or click "50/50 Split").`,
      badge: 'Add Expense',
    },
    {
      step: 'Step 4',
      title: 'Track Charts, Mark Paid & Export Excel',
      desc: 'Watch the Donut & Bar charts update automatically, use 1-click "Mark Paid" or inline comments as payments are settled, and click "Export Excel" anytime.',
      badge: 'Track & Export',
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-royal-900/45 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white modal-3d border border-royal-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/25">
              <HelpCircle className="h-5 w-5 text-royal-100" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold">
                Wedding Budget Tracker — Complete User Guide
              </h3>
              <p className="text-xs text-royal-100/85">
                Follow the recommended sequence: Check/Create Category First → Add Expenses → Track
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help modal"
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-royal-50/90 px-6 py-3 border-b border-royal-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === t.key
                  ? 'btn-3d-primary text-white'
                  : 'bg-white text-ink-muted border border-royal-200/80 hover:text-royal-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-sm text-ink">
          {activeTab === 'workflow' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-gradient-to-r from-royal-50 to-[#FDF4FF] p-3.5 border border-royal-200/90 flex items-start gap-2.5">
                <ListChecks className="h-5 w-5 text-royal-700 shrink-0 mt-0.5" />
                <div className="text-xs text-ink leading-relaxed">
                  <strong className="text-royal-900">Golden Rule of the Tracker:</strong> Always{' '}
                  <strong>check if your category exists first</strong> (like <em>Photography</em>,{' '}
                  <em>Decoration</em>, or <em>Gold Jewellery</em>). If it is not there,{' '}
                  <strong>create the category first</strong>, and then add your expense items inside
                  it!
                </div>
              </div>

              <div className="space-y-2.5">
                {workflowSteps.map((item, idx) => (
                  <div
                    key={item.step}
                    className="rounded-2xl card-3d p-3.5 border border-royal-200/80 flex items-start gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-royal-800 text-white text-xs font-bold icon-tile-3d">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-royal-900 text-xs sm:text-sm">
                          {item.step}: {item.title}
                        </p>
                        <span className="rounded-full bg-royal-50 px-2.5 py-0.5 text-[10px] font-semibold text-royal-800 border border-royal-200">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {(onQuickAddCategory || onQuickAddExpense) && (
                <div className="rounded-2xl bg-royal-50/80 p-3.5 border border-royal-200/80 flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-xs font-semibold text-royal-900">
                    Try the Sequence Right Now:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {onQuickAddCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onQuickAddCategory();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl btn-3d-white px-3 py-1.5 text-xs font-semibold text-royal-800 border border-royal-200"
                      >
                        <FolderPlus className="h-3.5 w-3.5 text-royal-600" />
                        1. + Add Category First
                      </button>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-royal-400 hidden sm:inline" />
                    {onQuickAddExpense && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onQuickAddExpense();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl btn-3d-primary px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        2. + Add Expense
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <FolderPlus className="h-4 w-4 text-royal-600" />
                  <span>Why Check or Create Categories First?</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Every expense belongs to a category (such as <em>Convention Venue, Food,
                  Photography &amp; Videography, Decoration, Gold Jewellery</em>). If you want to
                  record an item for a category that isn&apos;t on your dashboard yet, click{' '}
                  <strong>Add Category</strong> in the top header (or <strong>+ New Category</strong>{' '}
                  in the categories grid) to create it first.
                </p>
              </div>

              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <Users className="h-4 w-4 text-royal-600" />
                  <span>Choosing &ldquo;Who Pays for This Category?&rdquo; (Split vs. 1 Person)</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Inside Add/Edit Category, choose one of 3 payment modes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-royal-50 p-2.5 border border-royal-200">
                    <p className="font-semibold text-royal-900 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Split Between Both
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Both <strong>{groomName}</strong> &amp; <strong>{brideName}</strong> contribute
                      to expenses in this category.
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#EDE9FE] p-2.5 border border-[#C4B5FD]">
                    <p className="font-semibold text-[#4C1D95] flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Only {groomName}
                    </p>
                    <p className="text-[11px] text-[#4C1D95]/85 mt-0.5">
                      100% paid by <strong>{groomName}</strong> (hides {brideName}&apos;s input by
                      default).
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#FDF4FF] p-2.5 border border-[#E879F9]/70">
                    <p className="font-semibold text-[#86198F] flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Only {brideName}
                    </p>
                    <p className="text-[11px] text-[#86198F]/85 mt-0.5">
                      100% paid by <strong>{brideName}</strong> (hides {groomName}&apos;s input by
                      default).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <PlusCircle className="h-4 w-4 text-royal-600" />
                  <span>Adding Expenses After Your Category Is Ready</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Once your category exists, click <strong>+ Add Expense</strong> in the top header,
                  choose the category, and enter the <strong>Total Cost (₹)</strong>:
                </p>
                <ul className="text-xs text-ink-muted space-y-1 list-disc pl-4">
                  <li>
                    If the category is <strong>Split: Both</strong>, enter how much{' '}
                    <strong>{groomName} Paid (₹)</strong> and <strong>{brideName} Paid (₹)</strong>,
                    or click the <strong>50/50 Split</strong> button to divide the cost evenly in one
                    click.
                  </li>
                  <li>
                    If the category is set to <strong>Only {groomName}</strong> or{' '}
                    <strong>Only {brideName}</strong>, only that person&apos;s Paid field is shown
                    (you can still switch the toggle on any individual expense if needed).
                  </li>
                  <li>
                    <strong>Total Paid</strong>, <strong>Balance Due</strong>, and payment status (
                    <em>Pending / Advance Paid / Paid</em>) are calculated automatically.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Quick Actions: 1-Click Mark Paid, Inline Comments &amp; Filters</span>
                </div>
                <ul className="text-xs text-ink-muted space-y-1.5 list-disc pl-4">
                  <li>
                    <strong className="text-ink">Filter by Category:</strong> Click any slice on the
                    Donut Chart or any Category Card to filter the Expense Table to that category.
                  </li>
                  <li>
                    <strong className="text-ink">Inline Comments:</strong> Click the{' '}
                    <MessageSquare className="inline h-3.5 w-3.5 text-royal-600" /> icon on any row
                    to add or edit vendor notes without opening the full modal.
                  </li>
                  <li>
                    <strong className="text-ink">Quick Mark Paid:</strong> Click the green{' '}
                    <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600" /> icon on any
                    pending item to settle its remaining balance immediately.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <UserPlus className="h-4 w-4 text-royal-600" />
                  <span>Couple Accounts, Same-Name Handling &amp; Encrypted Security</span>
                </div>
                <ul className="text-xs text-ink-muted space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Dynamic Groom &amp; Bride Names:</strong> Each account displays its own
                    Groom &amp; Bride names (currently{' '}
                    <strong className="text-royal-800">
                      {groomName} &amp; {brideName}
                    </strong>
                    {username ? ` • @${username}` : ''}) across the entire website.
                  </li>
                  <li>
                    <strong>Same-Name Couples:</strong> Two different couples with the same names can
                    register with unique usernames (with 1-click username suggestions). If both
                    partners share the same first name, the app auto-labels them{' '}
                    <strong>(Groom)</strong> and <strong>(Bride)</strong>.
                  </li>
                  <li>
                    <strong>Encrypted DB &amp; Forgot Password:</strong> Usernames, passwords, and 4
                    security answers are encrypted/hashed in the database.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <CalendarHeart className="h-4 w-4 text-royal-600" />
                  <span>Wedding Date Countdown &amp; Excel Export</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Click the <strong>Days to Go</strong> pill in the top header to edit your Wedding
                  Date or couple names anytime, and click <strong>Export Excel</strong> to download
                  your formatted 3-sheet wedding budget spreadsheet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-royal-50/70 px-6 py-3.5 border-t border-royal-100">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-800">
            <Sparkles className="h-3.5 w-3.5 text-royal-600" />
            <span>Sequence: 1. Check Category → 2. Create Category → 3. Add Expense</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl btn-3d-primary px-5 py-2 text-xs font-semibold text-white"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
