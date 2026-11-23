import React, { useState } from 'react';
import {
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Heart,
  HelpCircle,
  ShieldQuestion,
} from 'lucide-react';
import { api } from '../api/client';
import HelpModal from './HelpModal';

const SECURITY_QUESTIONS = [
  { key: 'place', label: 'What is your favourite place?', placeholder: 'e.g., Goa / Hyderabad' },
  { key: 'color', label: 'What is your favourite colour?', placeholder: 'e.g., Purple / Blue' },
  { key: 'food', label: 'What is your favourite food?', placeholder: 'e.g., Biryani / Dosa' },
  { key: 'school', label: 'What was your first school?', placeholder: "e.g., St. Mary's / DPS" },
  { key: 'pet', label: "What is your first pet's name?", placeholder: 'e.g., Bruno' },
  { key: 'city', label: 'What city were you born in?', placeholder: 'e.g., Vijayawada' },
];

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    groomName: '',
    brideName: '',
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestion: 'place',
    securityAnswer: '',
  });
  const [forgotForm, setForgotForm] = useState({
    username: '',
    securityQuestion: 'place',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: '',
  });

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setUsernameSuggestions([]);
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
    setUsernameSuggestions([]);
    setSuccessMsg('');
    if (registerForm.password.trim() !== registerForm.confirmPassword.trim()) {
      setError('Passwords do not match');
      return;
    }
    const cleanGroom = registerForm.groomName.trim();
    const cleanBride = registerForm.brideName.trim();
    if (!cleanGroom || !cleanBride) {
      setError('Please enter both Groom Name and Bride Name');
      return;
    }
    if (!registerForm.securityAnswer.trim()) {
      setError('Please select a security question and enter your answer');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register({
        groomName: cleanGroom,
        brideName: cleanBride,
        displayName: `${cleanGroom} & ${cleanBride}`,
        username: registerForm.username,
        password: registerForm.password,
        securityQuestion: registerForm.securityQuestion,
        securityAnswer: registerForm.securityAnswer,
      });
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Registration failed');
      if (Array.isArray(err?.suggestions) && err.suggestions.length > 0) {
        setUsernameSuggestions(err.suggestions);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (forgotForm.newPassword.trim() !== forgotForm.confirmPassword.trim()) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword({
        username: forgotForm.username,
        securityQuestion: forgotForm.securityQuestion,
        securityAnswer: forgotForm.securityAnswer,
        newPassword: forgotForm.newPassword,
      });
      setSuccessMsg(res.message || 'Password reset! You can now sign in.');
      setLoginForm({ username: forgotForm.username, password: '' });
      setForgotForm({
        username: '',
        securityQuestion: 'place',
        securityAnswer: '',
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

  const selectedRegQ =
    SECURITY_QUESTIONS.find((q) => q.key === registerForm.securityQuestion) ||
    SECURITY_QUESTIONS[0];
  const selectedForgotQ =
    SECURITY_QUESTIONS.find((q) => q.key === forgotForm.securityQuestion) ||
    SECURITY_QUESTIONS[0];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top 3D Lavender Lotus Banner */}
      <div className="header-lotus-bg border-b border-royal-200/75">
        <div className="header-lotus-sides">
          <div className="header-lotus-watermark py-6 text-center px-4">
            <div className="inline-flex items-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-2 rounded-full btn-3d-white px-4 py-1.5 text-xs font-semibold text-royal-800 border border-royal-200">
                <Sparkles className="h-3.5 w-3.5 text-royal-600" />
                <span>Wedding Budget Tracker</span>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-1 rounded-full btn-3d-white px-3 py-1.5 text-xs font-semibold text-royal-800 border border-royal-200"
                title="View complete user guide & help"
              >
                <HelpCircle className="h-3.5 w-3.5 text-royal-600" />
                <span>Help</span>
              </button>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A132B] drop-shadow-sm">
              Plan Together, Save Privately
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Sign in or create your own wedding budget account — every account&apos;s credentials &amp; data are encrypted and saved separately.
            </p>
          </div>
        </div>
      </div>

      {/* 3D Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl card-3d-static modal-3d border border-royal-200/90 overflow-hidden">
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 bg-royal-50/90 p-1.5 border-b border-royal-100">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-2xl py-2.5 text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'btn-3d-primary text-white'
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
                    ? 'btn-3d-primary text-white'
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
                    Select your security question &amp; answer to set a new password
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
              <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 border border-rose-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {usernameSuggestions.length > 0 && mode === 'register' && (
                  <div className="pt-1 border-t border-rose-200/80">
                    <p className="text-[11px] font-semibold text-rose-800 mb-1.5">
                      Click an available username below to use it:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {usernameSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setRegisterForm({ ...registerForm, username: sug });
                            setError('');
                            setUsernameSuggestions([]);
                          }}
                          className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-royal-800 border border-royal-300 shadow-sm hover:bg-royal-50"
                        >
                          @{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    Username (Capital or Small Letters)
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
                      placeholder="Enter your username (e.g., Rama or rama)"
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
                  className="w-full rounded-xl btn-3d-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reg-groom"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4C1D95] mb-1"
                    >
                      Groom Name *
                    </label>
                    <input
                      id="reg-groom"
                      name="groomName"
                      type="text"
                      required
                      value={registerForm.groomName}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, groomName: e.target.value })
                      }
                      placeholder="e.g., Arjun"
                      className="w-full rounded-xl border border-[#C4B5FD] bg-[#F6F3FE] px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-bride"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#86198F] mb-1"
                    >
                      Bride Name *
                    </label>
                    <input
                      id="reg-bride"
                      name="brideName"
                      type="text"
                      required
                      value={registerForm.brideName}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, brideName: e.target.value })
                      }
                      placeholder="e.g., Sneha"
                      className="w-full rounded-xl border border-[#E879F9]/70 bg-[#FDF4FF] px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/15"
                    />
                  </div>
                </div>

                {(registerForm.groomName.trim() || registerForm.brideName.trim()) && (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-royal-700 bg-royal-50/80 px-3 py-1.5 rounded-xl border border-royal-200/70">
                    <Heart className="h-3 w-3 text-royal-600 fill-royal-600 shrink-0" />
                    <span>
                      Dashboard &amp; Split Options will use{' '}
                      <strong>
                        {registerForm.groomName.trim() &&
                        registerForm.brideName.trim() &&
                        registerForm.groomName.trim().toLowerCase() ===
                          registerForm.brideName.trim().toLowerCase()
                          ? `${registerForm.groomName.trim()} (Groom)`
                          : registerForm.groomName.trim() || 'Groom'}
                      </strong>{' '}
                      &amp;{' '}
                      <strong>
                        {registerForm.groomName.trim() &&
                        registerForm.brideName.trim() &&
                        registerForm.groomName.trim().toLowerCase() ===
                          registerForm.brideName.trim().toLowerCase()
                          ? `${registerForm.brideName.trim()} (Bride)`
                          : registerForm.brideName.trim() || 'Bride'}
                      </strong>
                    </span>
                  </p>
                )}

                <div>
                  <label
                    htmlFor="reg-username"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                  >
                    Username * (Capital or Small Letters)
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
                    placeholder="e.g., Rama (3–32 chars)"
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

                {/* Single Security Question Dropdown */}
                <div className="rounded-2xl bg-royal-50/80 p-3.5 border border-royal-200/80 space-y-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-royal-800">
                    <ShieldQuestion className="h-3.5 w-3.5 text-royal-600" />
                    <span>Security Question (For Forgot Password)</span>
                  </p>
                  <div>
                    <label
                      htmlFor="reg-sec-question"
                      className="block text-xs font-medium text-ink-muted mb-1"
                    >
                      Choose a Question *
                    </label>
                    <select
                      id="reg-sec-question"
                      name="securityQuestion"
                      value={registerForm.securityQuestion}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          securityQuestion: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm text-ink focus:border-royal-700 focus:outline-none"
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q.key} value={q.key}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="reg-sec-answer"
                      className="block text-xs font-medium text-ink-muted mb-1"
                    >
                      Your Answer *
                    </label>
                    <input
                      id="reg-sec-answer"
                      name="securityAnswer"
                      type="text"
                      required
                      value={registerForm.securityAnswer}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          securityAnswer: e.target.value,
                        })
                      }
                      placeholder={selectedRegQ.placeholder}
                      className="w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm text-ink focus:border-royal-700 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl btn-3d-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
                    placeholder="Enter your username (e.g., Rama or rama)"
                    className="w-full rounded-xl border border-royal-200 bg-pearl px-3.5 py-2 text-sm text-ink focus:border-royal-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl bg-royal-50/80 p-3.5 border border-royal-200/80 space-y-2.5">
                  <div>
                    <label
                      htmlFor="forgot-sec-question"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Select Your Security Question *
                    </label>
                    <select
                      id="forgot-sec-question"
                      name="securityQuestion"
                      value={forgotForm.securityQuestion}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          securityQuestion: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm text-ink focus:border-royal-700 focus:outline-none"
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q.key} value={q.key}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-sec-answer"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
                    >
                      Your Answer *
                    </label>
                    <input
                      id="forgot-sec-answer"
                      name="securityAnswer"
                      type="text"
                      required
                      value={forgotForm.securityAnswer}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          securityAnswer: e.target.value,
                        })
                      }
                      placeholder={selectedForgotQ.placeholder}
                      className="w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm text-ink focus:border-royal-700 focus:outline-none"
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
                  className="w-full rounded-xl btn-3d-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-subtle">
        Wedding Budget Tracker • Encrypted Multi-User Accounts
      </footer>

      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        groomName={registerForm.groomName.trim() || 'Groom'}
        brideName={registerForm.brideName.trim() || 'Bride'}
      />
    </div>
  );
}
