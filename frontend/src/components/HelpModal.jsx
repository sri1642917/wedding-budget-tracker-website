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
} from 'lucide-react';

export default function HelpModal({
  isOpen,
  onClose,
  groomName = 'Groom',
  brideName = 'Bride',
  username = '',
}) {
  const [activeTab, setActiveTab] = useState('quickstart');

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
    { key: 'quickstart', label: '1. Quick Start & Accounts' },
    { key: 'categories', label: '2. Categories & Split Mode' },
    { key: 'expenses', label: '3. Tracking Expenses' },
    { key: 'export', label: '4. Countdown & Excel' },
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
                Step-by-step guidance for planning &amp; tracking your wedding budget
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
          {activeTab === 'quickstart' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <UserPlus className="h-4 w-4 text-royal-600" />
                  <span>Creating Your Couple Account &amp; Dynamic Names</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  On the <strong>Create Account</strong> tab, enter the <strong>Groom Name</strong> and{' '}
                  <strong>Bride Name</strong> (currently{' '}
                  <strong className="text-royal-800">
                    {groomName} &amp; {brideName}
                  </strong>
                  ). Those two names automatically appear across the entire website — in the Top
                  Header, Paid So Far summary card, Category split badges, Expense table filters, and
                  Excel export!
                </p>
              </div>

              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <Users className="h-4 w-4 text-royal-600" />
                  <span>What If Two Couples (or Both Partners) Have the Same Names?</span>
                </div>
                <ul className="text-xs text-ink-muted space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Two Different Couples with the Same Names:</strong> Every account is
                    uniquely identified by its unique <strong>@username</strong>
                    {username ? ` (yours is @${username})` : ''}, so unlimited couples with the same
                    Groom &amp; Bride names can register without any conflict. If a username is
                    already taken, 1-click available username suggestions appear automatically.
                  </li>
                  <li>
                    <strong>Groom &amp; Bride Share the Same First Name:</strong> If both partners
                    have the exact same name (e.g., <em>Kiran &amp; Kiran</em>), the app
                    automatically labels them <strong>Kiran (Groom)</strong> and{' '}
                    <strong>Kiran (Bride)</strong> in all payment split fields so there is zero
                    confusion.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Encrypted Credentials &amp; Forgot Password</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Your username, password, and 4 security answers (<em>Favourite Place, Colour, Food,
                  and First School</em>) are encrypted and hashed in the database — nobody can view
                  your username or password in plain text. If you ever forget your password, click{' '}
                  <strong>Forgot password?</strong> on the Sign In page and answer your 4 questions
                  to reset it immediately.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <FolderPlus className="h-4 w-4 text-royal-600" />
                  <span>Adding &amp; Customizing Wedding Categories</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Click <strong>Add Category</strong> in the top header (or <strong>+ New
                  Category</strong> in the categories grid) to create categories like{' '}
                  <em>Convention Venue, Food, Decoration, Gold Jewellery, Bridal Attire</em>, etc.
                  You can set an optional <strong>Category Budget Cap (₹)</strong>, pick an icon and
                  accent color, and add vendor notes.
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
                  <span>Adding Expenses &amp; Smart 50/50 Split</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Click <strong>+ Add Expense</strong> in the top header. Select a category and enter
                  the <strong>Total Cost (₹)</strong>:
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

          {activeTab === 'export' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <CalendarHeart className="h-4 w-4 text-royal-600" />
                  <span>Wedding Date Countdown &amp; Couple Settings</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Click the <strong>Days to Go</strong> pill in the top header (or open your{' '}
                  <strong>Account Menu → Wedding Settings</strong>) to update the{' '}
                  <strong>Groom Name</strong>, <strong>Bride Name</strong>,{' '}
                  <strong>Wedding Date</strong>, <strong>City / Location</strong>, or overall budget
                  reminder notes anytime.
                </p>
              </div>

              <div className="rounded-2xl card-3d p-4 border border-royal-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-royal-900">
                  <Download className="h-4 w-4 text-royal-600" />
                  <span>Downloading Your Excel Report</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Click <strong>Export Excel</strong> in the top header anytime to download a
                  formatted spreadsheet containing your complete wedding summary, category breakdown
                  (including who pays for each category), and all itemized expenses with{' '}
                  <strong>{groomName}</strong> &amp; <strong>{brideName}</strong> payment totals.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-royal-50/70 px-6 py-3.5 border-t border-royal-100">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-800">
            <Sparkles className="h-3.5 w-3.5 text-royal-600" />
            <span>Tip: Press Esc or click outside any dialog to close it quickly.</span>
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
