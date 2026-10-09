import React, { useState, useEffect } from 'react';
import { X, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, ShieldAlert, UserCheck, Lock } from 'lucide-react';
import { authService, AUTHORIZED_FOUNDERS } from '../services/authService';
import { DEFAULT_PARTNERS } from '../services/storage';

export function LoginModal({ isOpen, onClose, onLoginSuccess, partners = DEFAULT_PARTNERS }) {
  if (!isOpen) return null;

  // Login flow starts with 'create' (Create Account) as requested
  const [mode, setMode] = useState('create'); // 'create' | 'signin'
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (targetEmail) => {
    const emailToSend = (targetEmail || email).trim().toLowerCase();
    if (!emailToSend) {
      setErrorMsg('Please enter your founder email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    // Pre-flight check: match with founders mail
    const isFounder = authService.isFounderEmail(emailToSend, partners);
    if (!isFounder) {
      setIsLoading(false);
      setErrorMsg('This is a private OS, not eligible for login.');
      return;
    }

    // Send OTP directly from Supabase
    const res = await authService.sendOtp(emailToSend, partners);
    setIsLoading(false);

    if (res.success) {
      setEmail(emailToSend);
      setStep('otp');
      setResendCooldown(30);
      setStatusMsg(`Confirmation code sent directly from Supabase to ${emailToSend}. Please check your inbox.`);
    } else {
      if (res.notEligible) {
        setErrorMsg('This is a private OS, not eligible for login.');
      } else {
        setErrorMsg(res.error || 'Failed to send confirmation code from Supabase.');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit confirmation code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    const res = await authService.verifyOtp(email, otp.trim(), partners);
    setIsLoading(false);

    if (res.success && res.partner) {
      setStatusMsg(`Account confirmed! Welcome, ${res.partner.name}.`);
      setTimeout(() => {
        onLoginSuccess(res.partner);
        onClose();
        // Reset state
        setStep('email');
        setOtp('');
        setStatusMsg('');
        setErrorMsg('');
      }, 600);
    } else {
      if (res.notEligible) {
        setErrorMsg('This is a private OS, not eligible for login.');
      } else {
        setErrorMsg(res.error || 'Invalid or expired confirmation code.');
      }
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setStatusMsg('');
    setStep('email');
    setOtp('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in">

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Delizoo Logo"
              className="w-8 h-8 rounded-lg object-contain shrink-0"
            />
            <div>
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <span>{mode === 'create' ? 'Create Founder Account' : 'Founder Sign-In'}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Private OS
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Direct Secured OTP verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs: Starts with 'Create Account' as requested */}
        {step === 'email' && (
          <div className="grid grid-cols-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleModeChange('create')}
              className={`py-2.5 px-4 text-center transition-colors cursor-pointer border-b-2 ${mode === 'create'
                  ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`py-2.5 px-4 text-center transition-colors cursor-pointer border-b-2 ${mode === 'signin'
                  ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">

          {/* Status Message */}
          {statusMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Error Message: Specifically enforces 'This is a private OS, not eligible for login.' */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {mode === 'create' ? 'Founder Email for Account Creation' : 'Registered Founder Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
                    placeholder="e.g. ncharantejaa@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Only the 6 verified Delizoo co-founders are eligible to create accounts and sign in.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading || !email.trim()}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking Founder Eligibility...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'create' ? 'Send Confirmation Code' : 'Send Sign-In Code'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Helper Toggle */}
              <div className="text-center pt-1">
                {mode === 'create' ? (
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Already confirmed your account? <span className="underline font-semibold">Sign In</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleModeChange('create')}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Need to set up founder account? <span className="underline font-semibold">Create Account</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    6-Digit Confirmation Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtp(''); setErrorMsg(''); }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-center text-sm font-mono-num font-bold tracking-widest bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Sent from Supabase to <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>. Valid for 10 minutes.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="flex-1 py-2 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming Account...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Confirm Account & Enter</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading || resendCooldown > 0}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Resend Code"
                >
                  {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Delizoo Founder Private OS</span>
          </span>
          <span className="font-mono-num">Secured</span>
        </div>

      </div>
    </div>
  );
}
