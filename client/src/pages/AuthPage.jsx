import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import {
  Mail,
  Lock,
  KeyRound,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  X,
  RotateCcw,
  ShieldCheck,
  User
} from 'lucide-react';

const SAVED_ACCOUNTS_KEY = 'campusvault_saved_accounts';
const REMEMBER_ME_KEY = 'campusvault_remember_me';
const REMEMBERED_EMAIL_KEY = 'campusvault_saved_email';

export default function AuthPage() {
  const { login, register, sendOtp, forgotPasswordSendOtp, resetPassword } = useAuth();
  const { settings } = useAppSettings();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');

  // Remember credentials state
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load saved accounts & remembered email on mount
  useEffect(() => {
    try {
      const storedRemember = localStorage.getItem(REMEMBER_ME_KEY);
      if (storedRemember !== null) {
        setRememberMe(storedRemember === 'true');
      }

      const storedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (storedEmail) {
        setEmail(storedEmail);
      }

      const rawAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (rawAccounts) {
        const parsed = JSON.parse(rawAccounts);
        if (Array.isArray(parsed)) {
          setSavedAccounts(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read remembered accounts from localStorage', e);
    }
  }, []);

  const saveAccountToStorage = (loggedEmail, role) => {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem(REMEMBERED_EMAIL_KEY, loggedEmail);

        // Update list of all saved accounts
        const existing = savedAccounts.filter(a => a.email !== loggedEmail);
        const updated = [
          { email: loggedEmail, role: role || (loggedEmail === '24071279@ycce.in' ? 'ADMIN' : 'STUDENT'), lastUsed: new Date().toISOString() },
          ...existing
        ].slice(0, 5); // Keep up to 5 recent accounts

        setSavedAccounts(updated);
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      } else {
        localStorage.setItem(REMEMBER_ME_KEY, 'false');
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch (e) {
      console.warn('Could not save account to localStorage', e);
    }
  };

  const removeSavedAccount = (e, targetEmail) => {
    e.stopPropagation();
    try {
      const updated = savedAccounts.filter(a => a.email !== targetEmail);
      setSavedAccounts(updated);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      if (email === targetEmail) {
        setEmail(updated[0]?.email || '');
      }
    } catch (e) {
      console.warn('Could not remove account', e);
    }
  };

  const resetForm = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setOtp('');
    setOtpSent(false);
    setDevOtpCode('');
    setPassword('');
    setConfirmPassword('');
  };

  // SEND OTP FOR NEW SIGNUP
  const handleSendSignupOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ycce.in')) {
      setError('Registration is restricted: Only @ycce.in college emails are allowed');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(cleanEmail);
      setOtpSent(true);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
        setOtp(res.devOtp);
        setSuccess(`Verification code generated and auto-filled! (Also dispatched to ${cleanEmail})`);
      } else {
        setSuccess(`Verification code sent to ${cleanEmail}. Please check your Inbox and Spam/Junk folder!`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setSendingOtp(false);
    }
  };

  // COMPLETE NEW REGISTRATION
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ycce.in')) {
      setError('Only verified @ycce.in emails can register');
      return;
    }
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await register(cleanEmail, password, otp.trim());
      saveAccountToStorage(cleanEmail, res.user?.role);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // LOGIN (STUDENT OR ADMIN)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ycce.in')) {
      setError('Please use your college email ending in @ycce.in');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanEmail, password);
      saveAccountToStorage(cleanEmail, res.user?.role);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // SEND OTP FOR FORGOT PASSWORD
  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ycce.in')) {
      setError('Please enter your official college email ending in @ycce.in');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await forgotPasswordSendOtp(cleanEmail);
      setOtpSent(true);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
        setOtp(res.devOtp);
        setSuccess(`Password reset code generated and auto-filled! (Also dispatched to ${cleanEmail})`);
      } else {
        setSuccess(`Password reset code sent to ${cleanEmail}. Please check your Inbox and Spam/Junk folder!`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password reset code');
    } finally {
      setSendingOtp(false);
    }
  };

  // VERIFY OTP AND RESET PASSWORD
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ycce.in')) {
      setError('Only verified @ycce.in emails are allowed');
      return;
    }
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-type identical passwords.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(cleanEmail, otp.trim(), password);
      saveAccountToStorage(cleanEmail, res.user?.role);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-gray-50">
      {/* Brand Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center space-x-3 mb-2">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.appName}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: settings.themeColor || '#2563eb' }}
            >
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {settings.appName || 'CampusVault'}
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-medium text-gray-500">
          College Notes • Trusted Resources
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Card Header & Domain Tag */}
        <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Student Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <div className="mt-1.5 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Only @ycce.in Verified Emails</span>
          </div>
        </div>

        {/* Status Alerts */}
        <div className="px-5 sm:px-6 pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2.5 text-emerald-800 text-xs sm:text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{success}</p>
                {devOtpCode && (
                  <div className="mt-2 p-2 bg-white rounded-lg border border-emerald-300 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Fast-Track Code:</span>
                      <span className="text-base font-mono font-bold text-emerald-700 tracking-widest">{devOtpCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtpCode)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm"
                    >
                      Fill Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 pt-2">
          {/* ==================== 1. LOGIN MODE ==================== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Saved accounts chip selector */}
              {savedAccounts.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 flex items-center justify-between">
                    <span>Quick Select Saved Account:</span>
                    <span className="text-[10px] text-gray-400 font-normal">Tap to autofill</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {savedAccounts.map((acc) => (
                      <div
                        key={acc.email}
                        onClick={() => setEmail(acc.email)}
                        className={`group cursor-pointer inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${email === acc.email
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <User className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                        <span className="truncate max-w-[170px]">{acc.email}</span>
                        {acc.role === 'ADMIN' && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-purple-100 text-purple-700 font-bold uppercase">
                            Admin
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => removeSavedAccount(e, acc.email)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded transition"
                          title="Remove saved account"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* College Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="student@ycce.in or 24071279@ycce.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password & Forgot Password Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => resetForm('forgot')}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>Remember my login on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
                style={{ backgroundColor: settings.themeColor || '#2563eb' }}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">New student? </span>
                <button
                  type="button"
                  onClick={() => resetForm('register')}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: settings.themeColor || '#2563eb' }}
                >
                  Register Here
                </button>
              </div>
            </form>
          )}

          {/* ==================== 2. REGISTER MODE ==================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  College Email
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      disabled={otpSent}
                      placeholder="username@ycce.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100"
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      disabled={sendingOtp || !email}
                      onClick={handleSendSignupOtp}
                      className="px-4 py-2.5 text-xs font-semibold text-white rounded-lg shadow-sm whitespace-nowrap disabled:opacity-50 min-h-[44px] flex items-center justify-center"
                      style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                    >
                      {sendingOtp ? 'Sending...' : 'Get OTP Code'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Email Verification OTP
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit OTP code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between items-center text-[11px] text-gray-500">
                      <span>Expires in 10 minutes</span>
                      <button
                        type="button"
                        onClick={handleSendSignupOtp}
                        className="font-semibold hover:underline text-blue-600 flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
                    style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                  >
                    {loading ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <span>Verify & Complete Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              <div className="text-center pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => resetForm('login')}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: settings.themeColor || '#2563eb' }}
                >
                  Login Here
                </button>
              </div>
            </form>
          )}

          {/* ==================== 3. FORGOT PASSWORD MODE ==================== */}
          {mode === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter your registered college email. We will send you an OTP to verify and reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Registered College Email
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      disabled={otpSent}
                      placeholder="student@ycce.in or admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100"
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      disabled={sendingOtp || !email}
                      onClick={handleSendForgotOtp}
                      className="px-4 py-2.5 text-xs font-semibold text-white rounded-lg shadow-sm whitespace-nowrap disabled:opacity-50 min-h-[44px] flex items-center justify-center"
                      style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                    >
                      {sendingOtp ? 'Sending...' : 'Send Reset Code'}
                    </button>
                  )}
                </div>
                {otpSent && (
                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                    <span>Sent to: <strong className="text-gray-700">{email}</strong></span>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                )}
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Enter 6-Digit Reset Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit OTP code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between items-center text-[11px] text-gray-500">
                      <span>Expires in 10 minutes</span>
                      <button
                        type="button"
                        disabled={sendingOtp}
                        onClick={handleSendForgotOtp}
                        className="font-semibold hover:underline text-blue-600 flex items-center space-x-1 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{sendingOtp ? 'Resending...' : 'Resend Code'}</span>
                      </button>
                    </div>
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-1.5">
                      <span className="flex-shrink-0">📬</span>
                      <span>College email alert: Agar OTP Primary Inbox me na mile, toh <strong>Spam / Junk</strong> folder ya <strong>Updates</strong> tab zaroor check karein.</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="Enter new password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
                    style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                  >
                    {loading ? (
                      <span>Updating Password...</span>
                    ) : (
                      <>
                        <span>Reset Password & Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              <div className="text-center pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => resetForm('login')}
                  className="text-xs font-semibold hover:underline text-gray-600"
                >
                  ← Remember your password? Back to Login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security & College Notice Footer */}
        <div className="bg-gray-50 px-5 sm:px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            Secure login for students & admin • YCCE Verified Accounts
          </p>
        </div>
      </div>
    </div>
  );
}
