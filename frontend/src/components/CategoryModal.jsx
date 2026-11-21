import React, { useEffect, useState } from 'react';
import { X, Tag } from 'lucide-react';
import { ICON_MAP, ICON_OPTIONS, COLOR_PALETTE } from '../utils/format';

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
}) {
  const [name, setName] = useState('');
  const [budgetCap, setBudgetCap] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState('Flower2');
  const [color, setColor] = useState('#5D2EC2');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialCategory) {
      setName(initialCategory.name || '');
      setBudgetCap(String(initialCategory.budgetCap ?? ''));
      setNotes(initialCategory.notes || '');
      setIcon(initialCategory.icon || 'Tag');
      setColor(initialCategory.color || '#5D2EC2');
    } else {
      setName('');
      setBudgetCap('');
      setNotes('');
      setIcon('Flower2');
      setColor('#5D2EC2');
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        budgetCap: Number(budgetCap) || 0,
        notes: notes.trim(),
        icon,
        color,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-royal-900/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-royal-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {initialCategory ? 'Edit Category' : 'Add New Wedding Category'}
            </h3>
            <p className="text-xs text-royal-100/85">
              Customize name, budget cap, icon, and accent color
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cat-name"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Category Name *
              </label>
              <input
                id="cat-name"
                name="categoryName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Stage Decoration"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="cat-budget-cap"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Category Budget Cap (₹)
              </label>
              <input
                id="cat-budget-cap"
                name="budgetCap"
                type="number"
                min="0"
                step="1"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
                placeholder="e.g., 150000"
                className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2.5 text-sm tabular-nums text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <p className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              Accent Color
            </p>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  aria-label={`Select color ${hex}`}
                  style={{ backgroundColor: hex }}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === hex
                      ? 'ring-2 ring-offset-2 ring-royal-900 scale-110'
                      : 'hover:scale-105 opacity-85'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <p className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              Icon
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((opt) => {
                const IconComp = ICON_MAP[opt.key] || Tag;
                const active = icon === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIcon(opt.key)}
                    title={opt.label}
                    className={`flex flex-col items-center justify-center rounded-xl py-2 px-1.5 border transition-all ${
                      active
                        ? 'border-royal-700 bg-royal-50 text-royal-800 shadow-sm'
                        : 'border-royal-200/80 bg-pearl text-ink-muted hover:border-royal-400 hover:text-ink'
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                    <span className="mt-1 text-[11px] font-medium text-center">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="cat-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              Comments / Notes
            </label>
            <textarea
              id="cat-notes"
              name="categoryNotes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shortlisted vendors, checklist items, negotiation notes..."
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
              className="rounded-xl bg-royal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-royal-900 shadow-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : initialCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
