import React, { useEffect, useState } from 'react';
import { X, Eraser, RotateCcw } from 'lucide-react';
import { parseCoupleNames } from '../api/client';

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  settings,
  expenseCount = 0,
  onClearAllExpenses,
  onRestoreSample,
}) {
  const [form, setForm] = useState({
    groomName: 'Harsha',
    brideName: 'Divya',
    coupleNames: 'Harsha & Divya',
    subtitle: 'Wedding Budget Tracker',
    location: 'Hyderabad, Telangana',
    weddingDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !settings) return;
    const parsed = parseCoupleNames(
      settings.coupleNames,
      settings.groomName,
      settings.brideName
    );
    setForm({
      groomName: parsed.groomName,
      brideName: parsed.brideName,
      coupleNames: parsed.coupleNames,
      subtitle:
        settings.subtitle &&
        settings.subtitle !== 'Hyderabad Wedding Budget' &&
        settings.subtitle !== 'Hyderabad Wedding Budget Tracker'
          ? settings.subtitle
          : 'Wedding Budget Tracker',
      location: settings.location || 'Hyderabad, Telangana',
      weddingDate: settings.weddingDate || '',
      notes: settings.notes || '',
    });
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePartnerChange = (field, val) => {
    const next = { ...form, [field]: val };
    const g = next.groomName.trim() || 'Groom';
    const b = next.brideName.trim() || 'Bride';
    next.coupleNames = `${g} & ${b}`;
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const g = form.groomName.trim() || 'Groom';
      const b = form.brideName.trim() || 'Bride';
      await onSave({
        ...form,
        groomName: g,
        brideName: b,
        coupleNames: `${g} & ${b}`,
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
      <div className="w-full max-w-md rounded-3xl bg-white modal-3d border border-royal-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
          <div>
            <h3 className="font-serif text-xl font-semibold">Wedding Settings</h3>
            <p className="text-xs text-royal-100/85">
              Update Groom &amp; Bride names, wedding date &amp; notes
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="settings-groom-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#4C1D95] mb-1.5"
              >
                Groom Name *
              </label>
              <input
                id="settings-groom-name"
                name="groomName"
                type="text"
                required
                value={form.groomName}
                onChange={(e) => handlePartnerChange('groomName', e.target.value)}
                className="w-full rounded-xl border border-[#C4B5FD] bg-[#F6F3FE] px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="settings-bride-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#86198F] mb-1.5"
              >
                Bride Name *
              </label>
              <input
                id="settings-bride-name"
                name="brideName"
                type="text"
                required
                value={form.brideName}
                onChange={(e) => handlePartnerChange('brideName', e.target.value)}
                className="w-full rounded-xl border border-[#E879F9]/70 bg-[#FDF4FF] px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="settings-wedding-date"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Wedding Date
              </label>
              <input
                id="settings-wedding-date"
                name="weddingDate"
                type="date"
                value={form.weddingDate}
                onChange={(e) => setForm({ ...form, weddingDate: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="settings-location"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                City / Location
              </label>
              <input
                id="settings-location"
                name="location"
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              Overall Budget Comments / Notes
            </label>
            <textarea
              id="settings-notes"
              name="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="General wedding budget reminders, buffer notes, family split notes..."
              className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
            />
          </div>

          <div className="pt-3 border-t border-royal-100 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
              Quick Data Reset
            </p>
            <div className="flex flex-wrap gap-2">
              {expenseCount > 0 && onClearAllExpenses && (
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAllExpenses();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Clear All Expenses
                </button>
              )}
              {onRestoreSample && (
                <button
                  type="button"
                  onClick={async () => {
                    await onRestoreSample();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-royal-50 px-3 py-1.5 text-xs font-semibold text-royal-800 border border-royal-200 hover:bg-royal-100 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Sample Data
                </button>
              )}
            </div>
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
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
