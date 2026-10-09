import React, { useState } from 'react';
import { X, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { DEFAULT_PARTNERS } from '../services/storage';

export function LoginModal({ isOpen, onClose, onLoginSuccess, partners = DEFAULT_PARTNERS }) {
  if (!isOpen) return null;

  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = async (targetEmail) => {
    const emailToSend = (targetEmail || email).trim().toLowerCase();
    if (!emailToSend) {
      setErrorMsg('Please enter your registered Gmail address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    const res = await authService.sendOtp(emailToSend);
    setIsLoading(false);

    if (res.success) {
      setEmail(emailToSend);
      setStep('otp');
      setStatusMsg(`Verification code sent to ${emailToSend}. Please check your inbox.`);
    } else {
      setErrorMsg(res.error || 'Failed to send verification code. Please check email address.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    const res = await authService.verifyOtp(email, otp.trim());
    setIsLoading(false);

    if (res.success && res.partner) {
      setStatusMsg('Sign-in verified successfully!');
      setTimeout(() => {
        onLoginSuccess(res.partner);
        onClose();
        // Reset state
        setStep('email');
        setOtp('');
        setStatusMsg('');
      }, 500);
    } else {
      setErrorMsg(res.error || 'Invalid or expired verification code.');
    }
  };

  // Quick select partner helper for instant local convenience
  const handleQuickSelect = (partner) => {
    if (partner.email) {
      setEmail(partner.email);
      handleSendOtp(partner.email);
    }
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
              className="w-7 h-7 rounded-lg object-contain shrink-0"
            />
            <div>
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                Delizoo OS Partner Sign-In
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Secure 6-digit OTP verification via Gmail
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

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Status Message */}
          {statusMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Enter Your Registered Gmail Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
                    placeholder="e.g. ncharantejaa@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Quick Partner Selection Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 block">
                  Or select your partner account:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {partners.map(p => (
                    <button
                      key={p.id || p.name}
                      type="button"
                      onClick={() => handleQuickSelect(p)}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-left transition-colors cursor-pointer group"
                    >
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate font-mono-num">
                        {p.email}
                      </div>
                    </button>
                  ))}
                </div>
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
                    <span>Sending Code to Gmail...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtp(''); }}
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
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-center text-sm font-mono-num font-bold tracking-widest bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Check <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong> for the 6-digit code.
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
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Sign In to Portal</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Resend Code"
                >
                  Resend
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span>Role-Based Access Enforcement</span>
          <span>Lead & Partners</span>
        </div>

      </div>
    </div>
  );
}
