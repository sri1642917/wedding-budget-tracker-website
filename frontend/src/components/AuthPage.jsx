import React, { useState } from 'react';
import {
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  MapPin,
  Palette,
  Utensils,
  GraduationCap,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
    favouritePlace: '',
    favouriteColor: '',
    favouriteFood: '',
    firstSchool: '',
  });
  const [forgotForm, setForgotForm] = useState({
    username: '',
    favouritePlace: '',
    favouriteColor: '',
    favouriteFood: '',
    firstSchool: '',
    newPassword: '',
    confirmPassword: '',
  });

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.auth.login(loginForm);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register({
        displayName: registerForm.displayName,
        username: registerForm.username,
        password: registerForm.password,
        favouritePlace: registerForm.favouritePlace,
        favouriteColor: registerForm.favouriteColor,
        favouriteFood: registerForm.favouriteFood,
        firstSchool: registerForm.firstSchool,
      });
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword({
        username: forgotForm.username,
        favouritePlace: forgotForm.favouritePlace,
        favouriteColor: forgotForm.favouriteColor,
        favouriteFood: forgotForm.favouriteFood,
        firstSchool: forgotForm.firstSchool,
        newPassword: forgotForm.newPassword,
      });
      setSuccessMsg(res.message || 'Password reset! You can now sign in.');
      setLoginForm({ username: forgotForm.username, password: '' });
      setForgotForm({
        username: '',
        favouritePlace: '',
        favouriteColor: '',
        favouriteFood: '',
        firstSchool: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMode('login');
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Lavender Lotus Banner */}
      <div className="header-lotus-bg border-b border-royal-200/75">
        <div className="header-lotus-sides">
          <div className="header-lotus-watermark py-6 text-center px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-royal-800 border border-royal-200 shadow-pill mb-2">
              <Sparkles className="h-3.5 w-3.5 text-royal-600" />
              <span>Wedding Budget Tracker</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A132B]">
              Plan Together, Save Privately
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Sign in or create your own wedding budget account — every account&apos;s data is saved separately.
            </p>
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-2xl border border-royal-200 overflow-hidden">
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 bg-royal-50/80 p-1.5 border-b border-royal-100">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-2xl py-2.5 text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-royal-800 text-white shadow-sm'
                    : 'text-ink-muted hover:text-royal-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-2xl py-2.5 text-sm font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-royal-800 text-white shadow-sm'
                    : 'text-ink-muted hover:text-royal-900'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gradient-to-r from-royal-900 to-royal-700 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-5 w-5 text-royal-200" />
                <div>
                  <h2 className="font-serif text-lg font-semibold">Reset Password</h2>
                  <p className="text-[11px] text-royal-100/85">
                    Answer your security questions to set a new password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/25"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          )}

          <div className="p-6 sm:p-7 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-subtle" />
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      required
                      autoComplete="username"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, username: e.target.value })
                      }
                      placeholder="Enter your username (e.g., admin)"
                      className="w-full rounded-xl border border-royal-200 bg-pearl py-2.5 pl-10 pr-3.5 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-semibold text-royal-700 hover:text-royal-900"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-subtle" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-royal-200 bg-pearl py-2.5 pl-10 pr-10 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-royal-800 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-royal-900 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="reg-display"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                  >
                    Couple / Account Name *
                  </label>
                  <input
                    id="reg-display"
                    name="displayName"
                    type="text"
                    required
                    value={registerForm.displayName}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, displayName: e.target.value })
                    }
                    placeholder="e.g., Arjun & Sneha"
                    className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-username"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                  >
                    Username *
                  </label>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={registerForm.username}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, username: e.target.value })
                    }
                    placeholder="3–32 chars (letters, numbers, ., _, -)"
                    className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Password *
                    </label>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      placeholder="Min 6 chars"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Confirm *
                    </label>
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={registerForm.confirmPassword}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Re-enter"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-royal-50/80 p-3.5 border border-royal-200/80 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-royal-800">
                    Security Questions (For Forgot Password)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="reg-place"
                        className="flex items-center gap-1 text-xs font-medium text-ink-muted mb-1"
                      >
                        <MapPin className="h-3.5 w-3.5 text-royal-600" />
                        Favourite Place *
                      </label>
                      <input
                        id="reg-place"
                        name="favouritePlace"
                        type="text"
                        required
                        value={registerForm.favouritePlace}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            favouritePlace: e.target.value,
                          })
                        }
                        placeholder="e.g., Goa"
                        className="w-full rounded-xl border border-royal-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-royal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-color"
                        className="flex items-center gap-1 text-xs font-medium text-ink-muted mb-1"
                      >
                        <Palette className="h-3.5 w-3.5 text-royal-600" />
                        Favourite Colour *
                      </label>
                      <input
                        id="reg-color"
                        name="favouriteColor"
                        type="text"
                        required
                        value={registerForm.favouriteColor}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            favouriteColor: e.target.value,
                          })
                        }
                        placeholder="e.g., Purple"
                        className="w-full rounded-xl border border-royal-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-royal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-food"
                        className="flex items-center gap-1 text-xs font-medium text-ink-muted mb-1"
                      >
                        <Utensils className="h-3.5 w-3.5 text-royal-600" />
                        Favourite Food *
                      </label>
                      <input
                        id="reg-food"
                        name="favouriteFood"
                        type="text"
                        required
                        value={registerForm.favouriteFood}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            favouriteFood: e.target.value,
                          })
                        }
                        placeholder="e.g., Biryani"
                        className="w-full rounded-xl border border-royal-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-royal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-school"
                        className="flex items-center gap-1 text-xs font-medium text-ink-muted mb-1"
                      >
                        <GraduationCap className="h-3.5 w-3.5 text-royal-600" />
                        First School *
                      </label>
                      <input
                        id="reg-school"
                        name="firstSchool"
                        type="text"
                        required
                        value={registerForm.firstSchool}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            firstSchool: e.target.value,
                          })
                        }
                        placeholder="e.g., St. Mary's"
                        className="w-full rounded-xl border border-royal-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-royal-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-royal-800 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-royal-900 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="forgot-username"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                  >
                    Username *
                  </label>
                  <input
                    id="forgot-username"
                    name="username"
                    type="text"
                    required
                    value={forgotForm.username}
                    onChange={(e) =>
                      setForgotForm({ ...forgotForm, username: e.target.value })
                    }
                    placeholder="Enter your username"
                    className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="forgot-place"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Favourite Place *
                    </label>
                    <input
                      id="forgot-place"
                      name="favouritePlace"
                      type="text"
                      required
                      value={forgotForm.favouritePlace}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          favouritePlace: e.target.value,
                        })
                      }
                      placeholder="Your answer"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="forgot-color"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Favourite Colour *
                    </label>
                    <input
                      id="forgot-color"
                      name="favouriteColor"
                      type="text"
                      required
                      value={forgotForm.favouriteColor}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          favouriteColor: e.target.value,
                        })
                      }
                      placeholder="Your answer"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="forgot-food"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Favourite Food *
                    </label>
                    <input
                      id="forgot-food"
                      name="favouriteFood"
                      type="text"
                      required
                      value={forgotForm.favouriteFood}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          favouriteFood: e.target.value,
                        })
                      }
                      placeholder="Your answer"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="forgot-school"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      First School *
                    </label>
                    <input
                      id="forgot-school"
                      name="firstSchool"
                      type="text"
                      required
                      value={forgotForm.firstSchool}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          firstSchool: e.target.value,
                        })
                      }
                      placeholder="Your answer"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="forgot-new-pw"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      New Password *
                    </label>
                    <input
                      id="forgot-new-pw"
                      name="newPassword"
                      type="password"
                      required
                      minLength={6}
                      value={forgotForm.newPassword}
                      onChange={(e) =>
                        setForgotForm({ ...forgotForm, newPassword: e.target.value })
                      }
                      placeholder="Min 6 chars"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="forgot-confirm-pw"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Confirm Password *
                    </label>
                    <input
                      id="forgot-confirm-pw"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={forgotForm.confirmPassword}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Re-enter"
                      className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-royal-800 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-royal-900 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-subtle">
        Wedding Budget Tracker • Private Multi-User Accounts
      </footer>
    </div>
  );
}
