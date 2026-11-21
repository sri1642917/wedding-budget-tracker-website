import React, { useEffect, useMemo, useState } from 'react';
import { Heart, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { api } from './api/client';
import HeroHeader from './components/HeroHeader';
import KpiCards from './components/KpiCards';
import ChartsSection from './components/ChartsSection';
import CategoryGrid from './components/CategoryGrid';
import ExpenseTable from './components/ExpenseTable';
import ExpenseModal from './components/ExpenseModal';
import CategoryModal from './components/CategoryModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(window.__hdToastTimer);
    window.__hdToastTimer = window.setTimeout(() => setToast(null), 3200);
  };

  const loadBudget = async () => {
    try {
      setError('');
      const res = await api.getBudget();
      setData(res);
    } catch (err) {
      setError(
        err.message || 'Could not reach the wedding budget backend on port 5001.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const categories = data?.categories || [];
  const expenses = data?.expenses || [];
  const storageMeta = data?._meta || null;
  const settings = data?.settings || {
    coupleNames: 'Harsha & Divya',
    subtitle: 'Hyderabad Wedding Budget',
    location: 'Hyderabad, Telangana',
    weddingDate: '',
    targetBudget: 2000000,
  };

  const stats = useMemo(() => {
    return expenses.reduce(
      (acc, e) => {
        const est = Number(e.estimated || 0);
        const act = Number(e.actual || 0);
        const paid = Number(e.paid || 0);
        const bal = Math.max(0, act - paid);
        acc.totalEstimated += est;
        acc.totalActual += act;
        acc.totalPaid += paid;
        acc.totalBalance += bal;
        if (bal > 0 || e.status !== 'Paid') acc.pendingCount += 1;
        acc.expenseCount += 1;
        return acc;
      },
      {
        totalEstimated: 0,
        totalActual: 0,
        totalPaid: 0,
        totalBalance: 0,
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
      const paid = catItems.reduce((s, e) => s + Number(e.paid || 0), 0);
      const balance = Math.max(0, actual - paid);
      return {
        ...cat,
        count: catItems.length,
        estimated,
        actual,
        paid,
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
      const res = await api.updateExpense(exp.id, {
        paid: Number(exp.actual || exp.estimated || 0),
        status: 'Paid',
      });
      setData(res.data);
      showToast(`Marked "${exp.vendor || exp.title}" as Paid`);
    } catch (err) {
      showToast(err.message || 'Failed to mark expense as paid', 'error');
    }
  };

  const handleClearAllExpenses = async () => {
    const confirmed = window.confirm(
      'Clear all expense entries? Your categories and target budget will be kept.'
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
      showToast('Sample Hyderabad wedding data restored');
    } catch (err) {
      showToast(err.message || 'Failed to restore sample data', 'error');
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(api.exportExcelUrl);
      if (!res.ok) throw new Error('Export failed');
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
    } catch {
      showToast('Failed to export Excel workbook', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-royal-200 border-t-royal-800" />
          <p className="font-serif text-lg text-ink">
            Loading Harsha &amp; Divya&apos;s Wedding Budget...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-card border border-royal-200 text-center space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />
          <h2 className="font-serif text-xl font-semibold text-ink">
            Backend Server Not Connected
          </h2>
          <p className="text-sm text-ink-muted">{error}</p>
          <button
            type="button"
            onClick={loadBudget}
            className="rounded-xl bg-royal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-royal-900"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-14">
      {/* Full-width Royal Lavender Top Header */}
      <HeroHeader
        settings={settings}
        onAddExpense={() => {
          setEditingExpense(null);
          setExpenseModalOpen(true);
        }}
        onAddCategory={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
        onEditSettings={() => setSettingsModalOpen(true)}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />

      {/* Main Content Container matching the clean mockup hierarchy */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <KpiCards
          stats={stats}
          targetBudget={settings.targetBudget}
          onEditSettings={() => setSettingsModalOpen(true)}
        />

        <ChartsSection
          categoryStats={categoryStats}
          totalActual={stats.totalActual}
          totalEstimated={stats.totalEstimated}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <ExpenseTable
          expenses={expenses}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
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
          onClearAll={handleClearAllExpenses}
          onRestoreSample={handleRestoreSample}
        />

        <CategoryGrid
          categoryStats={categoryStats}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={() => {
            setEditingCategory(null);
            setCategoryModalOpen(true);
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
          <span>Hyderabad Wedding Budget</span>
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
        initialExpense={editingExpense}
        defaultCategoryId={selectedCategoryId}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
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
