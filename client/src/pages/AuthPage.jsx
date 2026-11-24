import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { Mail, Lock, KeyRound, GraduationCap, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const { login, register, sendOtp } = useAuth();
  const { settings } = useAppSettings();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setOtp('');
    setOtpSent(false);
    setDevOtpCode('');
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ycce.in')) {
      setError('Registration is restricted: Only @ycce.in college emails are allowed');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanEmail);
      setOtpSent(true);
      setSuccess(`Verification OTP sent to ${cleanEmail}. Check your inbox!`);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim().toLowerCase().endsWith('@ycce.in')) {
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
      await register(email.trim().toLowerCase(), password, otp.trim());
      // Auth context sets user and redirects automatically
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim().toLowerCase().endsWith('@ycce.in')) {
      setError('Please use your college email ending in @ycce.in');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Logged in successfully
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gray-50">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center space-x-3 mb-2">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.appName}
              className="w-12 h-12 object-contain rounded"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: settings.themeColor || '#2563eb' }}
            >
              <GraduationCap className="w-7 h-7" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {settings.appName || 'CampusVault'}
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500">
          College Notes • Trusted Resources
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Card Header & Domain Tag */}
        <div className="p-6 pb-4 border-b border-gray-100 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Student Account'}
          </h2>
          <div className="mt-1.5 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span>Only @ycce.in Emails</span>
          </div>
        </div>

        {/* Status Alerts */}
        <div className="px-6 pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>{success}</p>
                {devOtpCode && (
                  <p className="mt-1 font-mono text-xs font-bold text-emerald-800">
                    Verification Code: <span className="underline">{devOtpCode}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 pt-2">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@ycce.in or 24071279@ycce.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
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
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  College Email
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      required
                      disabled={otpSent}
                      placeholder="username@ycce.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100"
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      disabled={loading || !email}
                      onClick={handleSendOtp}
                      className="px-3.5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm whitespace-nowrap disabled:opacity-50"
                      style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                    >
                      {loading ? 'Sending...' : 'Get OTP'}
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
                      <KeyRound className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit OTP code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div className="mt-1 flex justify-between items-center text-[11px] text-gray-500">
                      <span>Expires in 10 minutes</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="font-medium hover:underline text-blue-600"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Create a strong password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
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
        </div>

        {/* Security & Admin Notice */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            Secure login for students & admin • YCCE Verified Accounts
          </p>
        </div>
      </div>
    </div>
  );
}
