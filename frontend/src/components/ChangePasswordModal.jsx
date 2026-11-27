import React, { useEffect, useState } from 'react';
import { X, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose, onSubmit, username }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
  }, [isOpen]);

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
    e?.preventDefault?.();
    setError('');
    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ currentPassword, newPassword });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password');
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-royal-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5 text-royal-200" />
            <div>
              <h3 className="font-serif text-xl font-semibold">Change Password</h3>
              <p className="text-xs text-royal-100/85">Account: @{username}</p>
            </div>
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

        <div
          role="form"
          aria-label="Change Password"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="p-6 space-y-4"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="cp-current"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              Current Password *
            </label>
            <div className="relative">
              <input
                id="cp-current"
                name="wb_cp_current"
                type="text"
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                style={!showPassword ? { WebkitTextSecurity: 'disc' } : undefined}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-royal-200 bg-pearl pl-3.5 pr-10 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="cp-new"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              New Password *
            </label>
            <div className="relative">
              <input
                id="cp-new"
                name="wb_cp_new"
                type="text"
                required
                minLength={6}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                style={!showPassword ? { WebkitTextSecurity: 'disc' } : undefined}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-royal-200 bg-pearl pl-3.5 pr-10 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="cp-confirm"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
            >
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                id="cp-confirm"
                name="wb_cp_confirm"
                type="text"
                required
                minLength={6}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                style={!showPassword ? { WebkitTextSecurity: 'disc' } : undefined}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-royal-200 bg-pearl pl-3.5 pr-10 py-2.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-royal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-royal-900 shadow-sm disabled:opacity-60"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
