import React, { useEffect, useMemo, useState } from 'react';
import { Heart, CheckCircle2, AlertTriangle, Database, MessageSquare, Pencil } from 'lucide-react';
import { api, parseCoupleNames } from './api/client';
import AuthPage from './components/AuthPage';
import HeroHeader from './components/HeroHeader';
import KpiCards from './components/KpiCards';
import ChartsSection from './components/ChartsSection';
import CategoryGrid from './components/CategoryGrid';
import ExpenseTable from './components/ExpenseTable';
import ExpenseModal from './components/ExpenseModal';
import CategoryModal from './components/CategoryModal';
import SettingsModal from './components/SettingsModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import HelpModal from './components/HelpModal';

export default function App() {
  const [user, setUser] = useState(() => api.auth.getSession()?.user || null);
  const [authChecked, setAuthChecked] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [changePwModalOpen, setChangePwModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(window.__hdToastTimer);
    window.__hdToastTimer = window.setTimeout(() => setToast(null), 3200);
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setData(null);
    setSelectedCategoryId(null);
  };

  const loadBudget = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.getBudget();
      setData(res);
    } catch (err) {
      if (err?.status === 401) {
        handleLogout();
        return;
      }
      setError(
        err.message || 'Could not reach the wedding budget backend on port 5001.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const session = api.auth.getSession();
      if (!session?.token) {
        if (active) {
          setAuthChecked(true);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await api.auth.me();
        if (!active) return;
        setUser(me.user);
        setAuthChecked(true);
        await loadBudget();
      } catch {
        if (!active) return;
        api.auth.logout();
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAuthSuccess = async (loggedInUser) => {
    setUser(loggedInUser);
    setAuthChecked(true);
    await loadBudget();
    showToast(`Welcome, ${loggedInUser.displayName || loggedInUser.username}!`);
  };

  const categories = data?.categories || [];
  const expenses = data?.expenses || [];
  const storageMeta = data?._meta || null;
  const rawSettings = data?.settings || {
    coupleNames: user?.displayName || 'My Wedding',
    groomName: user?.groomName || '',
    brideName: user?.brideName || '',
    subtitle: 'Wedding Budget Tracker',
    location: '',
    weddingDate: '',
    notes: '',
  };

  const parsedNames = parseCoupleNames(
    rawSettings.coupleNames || user?.displayName,
    rawSettings.groomName || user?.groomName,
    rawSettings.brideName || user?.brideName
  );
  const groomName = parsedNames.groomName;
  const brideName = parsedNames.brideName;
  const settings = {
    ...rawSettings,
    coupleNames: parsedNames.coupleNames,
    groomName,
    brideName,
  };

  const stats = useMemo(() => {
    return expenses.reduce(
      (acc, e) => {
        const est = Number(e.estimated || 0);
        const act = Number(e.actual || 0);
        const hPaid = Number(e.harshaPaid || 0);
        const dPaid = Number(e.divyaPaid || 0);
        const paid = hPaid + dPaid > 0 ? hPaid + dPaid : Number(e.paid || 0);
        const bal = Math.max(0, act - paid);
        acc.totalEstimated += est;
        acc.totalActual += act;
        acc.totalPaid += paid;
        acc.totalBalance += bal;
        acc.harshaPaid += hPaid;
        acc.divyaPaid += dPaid;
        if (bal > 0 || e.status !== 'Paid') acc.pendingCount += 1;
        acc.expenseCount += 1;
        return acc;
      },
      {
        totalEstimated: 0,
        totalActual: 0,
        totalPaid: 0,
        totalBalance: 0,
        harshaPaid: 0,
        divyaPaid: 0,
        pendingCount: 0,
        expenseCount: 0,
      }
    );
  }, [expenses]);

  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catItems = expenses.filter((e) => e.categoryId === cat.id);
      const estimated = catItems.reduce((s, e) => s + Number(e.estimated || 0), 0);
      const actual = catItems.reduce((s, e) => s + Number(e.actual || 0), 0);
      const harshaPaid = catItems.reduce((s, e) => s + Number(e.harshaPaid || 0), 0);
      const divyaPaid = catItems.reduce((s, e) => s + Number(e.divyaPaid || 0), 0);
      const paid = catItems.reduce((s, e) => s + Number(e.paid || 0), 0);
      const balance = Math.max(0, actual - paid);
      return {
        ...cat,
        payerMode: cat.payerMode || 'both',
        count: catItems.length,
        estimated,
        actual,
        paid,
        harshaPaid,
        divyaPaid,
        balance,
      };
    });
  }, [categories, expenses]);

  // Handlers
  const handleSaveSettings = async (payload) => {
    try {
      const updated = await api.updateSettings(payload);
      setData(updated);
      showToast('Wedding settings updated');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
      throw err;
    }
  };

  const handleSaveCategory = async (payload) => {
    try {
      if (editingCategory) {
        const res = await api.updateCategory(editingCategory.id, payload);
        setData(res.data);
        showToast(`Updated "${payload.name}"`);
      } else {
        const res = await api.addCategory(payload);
        setData(res.data);
        showToast(`Added new category "${payload.name}"`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
      throw err;
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmed = window.confirm(
      `Delete "${cat.name}"${cat.count > 0 ? ` and its ${cat.count} expense(s)` : ''}?`
    );
    if (!confirmed) return;
    try {
      const res = await api.deleteCategory(cat.id);
      if (selectedCategoryId === cat.id) setSelectedCategoryId(null);
      setData(res.data);
      showToast(`Removed category "${cat.name}"`);
    } catch (err) {
      showToast(err.message || 'Failed to remove category', 'error');
    }
  };

  const handleSaveExpense = async (payload) => {
    try {
      if (editingExpense) {
        const res = await api.updateExpense(editingExpense.id, payload);
        setData(res.data);
        showToast('Expense updated');
      } else {
        const res = await api.addExpense(payload);
        setData(res.data);
        showToast('New expense added');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save expense', 'error');
      throw err;
    }
  };

  const handleDeleteExpense = async (exp) => {
    const confirmed = window.confirm(`Delete "${exp.title}"?`);
    if (!confirmed) return;
    try {
      const res = await api.deleteExpense(exp.id);
      setData(res.data);
      showToast('Expense removed');
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const handleQuickMarkPaid = async (exp) => {
    try {
      const total = Number(exp.actual || exp.estimated || 0);
      const curH = Number(exp.harshaPaid || 0);
      const curD = Number(exp.divyaPaid || 0);
      const remaining = Math.max(0, total - (curH + curD));
      const cat = categories.find((c) => c.id === exp.categoryId);
      const mode = cat?.payerMode || 'both';
      let nextH = curH;
      let nextD = curD;
      if (mode === 'groom' || (curH > 0 && curD === 0 && mode !== 'bride')) {
        nextH = curH + remaining;
      } else if (mode === 'bride' || (curD > 0 && curH === 0 && mode !== 'groom')) {
        nextD = curD + remaining;
      } else {
        const half = Math.floor(remaining / 2);
        nextH = curH + half;
        nextD = curD + (remaining - half);
      }
      const res = await api.updateExpense(exp.id, {
        paid: total,
        harshaPaid: nextH,
        divyaPaid: nextD,
        status: 'Paid',
        dueDate: '',
      });
      setData(res.data);
      showToast(`Marked "${exp.title}" as Paid`);
    } catch (err) {
      showToast(err.message || 'Failed to mark expense as paid', 'error');
    }
  };

  const handleQuickUpdateNote = async (exp, notes) => {
    try {
      const res = await api.updateExpense(exp.id, { notes });
      setData(res.data);
      showToast(notes ? 'Comment saved' : 'Comment cleared');
    } catch (err) {
      showToast(err.message || 'Failed to save comment', 'error');
    }
  };

  const handleClearAllExpenses = async () => {
    const confirmed = window.confirm(
      'Clear all expense entries? Your categories will be kept.'
    );
    if (!confirmed) return;
    try {
      const res = await api.resetBudget('clear-expenses');
      setData(res.data);
      showToast('All expenses cleared — ready for your numbers');
    } catch (err) {
      showToast(err.message || 'Failed to clear expenses', 'error');
    }
  };

  const handleRestoreSample = async () => {
    try {
      const res = await api.resetBudget('restore-sample');
      setData(res.data);
      showToast('Sample wedding data restored');
    } catch (err) {
      showToast(err.message || 'Failed to restore sample data', 'error');
    }
  };

  const handleChangePassword = async (payload) => {
    await api.auth.changePassword(payload);
    showToast('Password updated successfully');
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(api.exportExcelUrl, {
        headers: api.auth.getHeaders(),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('spreadsheetml')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wedding-budget.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast('Wedding budget Excel report downloaded!');
      } else {
        const csvBlob = api.exportLocalCsv();
        const url = window.URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wedding-budget.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast('Wedding budget spreadsheet downloaded!');
      }
    } catch {
      const csvBlob = api.exportLocalCsv();
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wedding-budget.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Wedding budget spreadsheet downloaded!');
    } finally {
      setExporting(false);
    }
  };

  if (!authChecked || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-royal-200 border-t-royal-800" />
          <p className="font-serif text-lg text-ink">
            Loading Wedding Budget...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl card-3d p-8 border border-royal-200 text-center space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />
          <h2 className="font-serif text-xl font-semibold text-ink">
            Backend Server Not Connected
          </h2>
          <p className="text-sm text-ink-muted">{error}</p>
          <button
            type="button"
            onClick={loadBudget}
            className="rounded-xl btn-3d-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-14">
      <HeroHeader
        settings={settings}
        user={user}
        groomName={groomName}
        brideName={brideName}
        onAddExpense={() => {
          setEditingExpense(null);
          setExpenseModalOpen(true);
        }}
        onAddCategory={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
        onEditSettings={() => setSettingsModalOpen(true)}
        onChangePassword={() => setChangePwModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onLogout={handleLogout}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <KpiCards
          stats={stats}
          categoryCount={categories.length}
          groomName={groomName}
          brideName={brideName}
        />

        {settings.notes && (
          <div className="flex items-start justify-between gap-3 rounded-2xl card-3d px-4 py-3 border border-royal-200/80 text-xs text-ink">
            <div className="flex items-start gap-2.5 min-w-0">
              <MessageSquare className="h-4 w-4 text-royal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed whitespace-pre-line">{settings.notes}</p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="shrink-0 rounded-lg p-1 text-ink-subtle hover:bg-royal-50 hover:text-royal-700 transition-colors"
              title="Edit wedding budget note"
              aria-label="Edit wedding budget note"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <ChartsSection
          categoryStats={categoryStats}
          totalActual={stats.totalActual}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          groomName={groomName}
          brideName={brideName}
        />

        <ExpenseTable
          expenses={expenses}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          groomName={groomName}
          brideName={brideName}
          onAddExpense={() => {
            setEditingExpense(null);
            setExpenseModalOpen(true);
          }}
          onEditExpense={(exp) => {
            setEditingExpense(exp);
            setExpenseModalOpen(true);
          }}
          onDeleteExpense={handleDeleteExpense}
          onQuickMarkPaid={handleQuickMarkPaid}
          onQuickUpdateNote={handleQuickUpdateNote}
          onRestoreSample={handleRestoreSample}
        />

        <CategoryGrid
          categoryStats={categoryStats}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          groomName={groomName}
          brideName={brideName}
          onAddCategory={() => {
            setEditingCategory(null);
            setCategoryModalOpen(true);
          }}
          onQuickAddExpenseForCategory={(cat) => {
            setSelectedCategoryId(cat.id);
            setEditingExpense(null);
            setExpenseModalOpen(true);
          }}
          onEditCategory={(cat) => {
            setEditingCategory(cat);
            setCategoryModalOpen(true);
          }}
          onDeleteCategory={handleDeleteCategory}
        />

        <footer className="pt-4 pb-4 text-center text-xs text-ink-subtle flex flex-col sm:flex-row items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1">
            Crafted with <Heart className="h-3.5 w-3.5 text-royal-600 fill-royal-600" /> for{' '}
            <strong className="text-ink">{settings.coupleNames}</strong>
          </span>
          <span className="hidden sm:inline text-royal-300">•</span>
          <span>@{user.username}</span>
          {storageMeta?.label && (
            <>
              <span className="hidden sm:inline text-royal-300">•</span>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Database
                  className={`h-3 w-3 ${
                    storageMeta.persistent ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
                {storageMeta.label}
              </span>
            </>
          )}
        </footer>
      </main>

      {/* Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        categories={categories}
        categoryStats={categoryStats}
        initialExpense={editingExpense}
        defaultCategoryId={selectedCategoryId}
        groomName={groomName}
        brideName={brideName}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
        groomName={groomName}
        brideName={brideName}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        settings={settings}
        expenseCount={expenses.length}
        onClearAllExpenses={handleClearAllExpenses}
        onRestoreSample={handleRestoreSample}
      />

      <ChangePasswordModal
        isOpen={changePwModalOpen}
        onClose={() => setChangePwModalOpen(false)}
        onSubmit={handleChangePassword}
        username={user.username}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        groomName={groomName}
        brideName={brideName}
        username={user.username}
        onQuickAddCategory={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
        onQuickAddExpense={() => {
          setEditingExpense(null);
          setExpenseModalOpen(true);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl border transition-all ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-400/40'
              : 'bg-royal-900 text-white border-royal-400/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-royal-300 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
