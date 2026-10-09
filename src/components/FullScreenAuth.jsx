import React, { useState, useEffect } from 'react';
import { Sun, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { DEFAULT_PARTNERS } from '../services/storage';

export const FullScreenSignup = ({
  initialMode = 'signin',
  onLoginSuccess,
  onBackToApp,
  partners = DEFAULT_PARTNERS,
  currentUser = null
}) => {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'create'
  const [step, setStep] = useState('email'); // 'email' | 'otp'

  // Sync mode whenever initialMode prop updates
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setStatusMsg('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Pre-flight check: match with founders mail
    const cleanEmail = email.trim().toLowerCase();
    const isFounder = authService.isFounderEmail(cleanEmail, partners);
    if (!isFounder) {
      setIsLoading(false);
      setGeneralError('This is a private OS, not eligible for login.');
      return;
    }

    // Send OTP directly from Supabase
    const res = await authService.sendOtp(cleanEmail, partners);
    setIsLoading(false);

    if (res.success) {
      setStep('otp');
      setResendCooldown(30);
      setStatusMsg(`Confirmation code sent directly from Supabase to ${cleanEmail}.`);
    } else {
      if (res.notEligible) {
        setGeneralError('This is a private OS, not eligible for login.');
      } else {
        setGeneralError(res.error || 'Failed to dispatch confirmation code.');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setStatusMsg('');

    if (!otp || otp.trim().length < 6) {
      setPasswordError('Please enter the 6-digit confirmation code.');
      return;
    }

    setIsLoading(true);
    const res = await authService.verifyOtp(email, otp.trim(), partners);
    setIsLoading(false);

    if (res.success && res.partner) {
      setStatusMsg(`Account confirmed! Welcome, ${res.partner.name}.`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.partner);
      }, 500);
    } else {
      if (res.notEligible) {
        setGeneralError('This is a private OS, not eligible for login.');
      } else {
        setGeneralError(res.error || 'Invalid or expired confirmation code.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-zinc-950/80 backdrop-blur-xs select-none overflow-y-auto">
      
      {/* Centered Split Card Container */}
      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-2xl rounded-2xl sm:rounded-3xl border border-zinc-800 bg-white my-auto">
        
        {/* Left Artistic Dark Panel (Desktop only) */}
        <div className="hidden md:flex bg-black text-white p-8 md:p-12 md:w-1/2 relative overflow-hidden flex-col justify-between min-h-[520px] lg:min-h-[580px] shrink-0">
          {/* Top Gradient Overlay */}
          <div className="w-full h-full z-2 absolute inset-0 bg-gradient-to-t from-transparent via-black/40 to-black pointer-events-none"></div>
          
          {/* Fluted Vertical Glass Pillars */}
          <div className="flex absolute inset-0 z-2 overflow-hidden backdrop-blur-2xl pointer-events-none">
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
          </div>

          {/* Luminous Glowing Orbs at Bottom */}
          <div className="w-[16rem] h-[16rem] bg-orange-500 absolute z-1 rounded-full -bottom-10 -left-10 blur-xl opacity-90"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-8 blur-xl opacity-70"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-20 blur-xl opacity-70"></div>

          {/* Top Logo / Navigation link */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Delizoo Logo" className="w-7 h-7 rounded-lg object-contain" />
              <span className="text-sm font-bold tracking-tight text-white">Delizoo OS</span>
            </div>
            {onBackToApp && currentUser && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer backdrop-blur-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to OS</span>
              </button>
            )}
          </div>

          {/* Hero Headline */}
          <div className="relative z-10 my-auto py-10">
            <h1 className="text-2xl md:text-3xl font-medium leading-tight tracking-tight text-white max-w-sm">
              Internal operations, capital & launch command for Delizoo.
            </h1>
          </div>

          {/* Bottom Founder Tag */}
          <div className="relative z-10 text-xs text-zinc-400 font-mono-num">
            Kakinada Launch Operations • Private OS
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-6 sm:p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-white text-zinc-900 z-10 relative">
          
          {/* Mobile Top Brand & Optional Back Button */}
          <div className="md:hidden flex items-center justify-between pb-3.5 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Delizoo Logo" className="w-6 h-6 rounded-md object-contain" />
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-900 block leading-tight">Delizoo OS</span>
                <span className="text-[10px] text-zinc-400 font-mono leading-none">Private Operations</span>
              </div>
            </div>
            {onBackToApp && currentUser && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[11px] font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to OS</span>
              </button>
            )}
          </div>

          {/* Header with Sunburst Icon */}
          <div className="flex flex-col items-start mb-6 sm:mb-8">
            <div className="text-orange-500 mb-3 sm:mb-4">
              <Sun className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium mb-1.5 sm:mb-2 tracking-tight text-zinc-950">
              {step === 'otp' ? 'Confirm Code' : (mode === 'create' ? 'Get Started' : 'Sign In')}
            </h2>
            <p className="text-left text-sm text-zinc-500">
              {step === 'otp'
                ? `Enter the 6-digit code sent directly from Supabase to ${email}`
                : (mode === 'create'
                    ? "Welcome to Delizoo OS — Let's get started"
                    : 'Welcome back to Delizoo OS — Sign in with your founder email')}
            </p>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Rejection Alert: Enforces "This is a private OS, not eligible for login." */}
          {generalError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2 animate-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form */}
          {step === 'email' ? (
            <form className="flex flex-col gap-4" onSubmit={handleSendOtp} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm mb-2 font-medium text-zinc-800">
                  Your email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="ncharantejaa@gmail.com"
                  className={`text-sm w-full py-2.5 px-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (generalError) setGeneralError('');
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby="email-error"
                />
                {emailError && (
                  <p id="email-error" className="text-red-500 text-xs mt-1">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password-placeholder" className="block text-sm mb-2 font-medium text-zinc-800">
                  {mode === 'create' ? 'Create new password' : 'Password / 6-digit code'}
                </label>
                <input
                  type="password"
                  id="password-placeholder"
                  placeholder="••••••••••••"
                  className="text-sm w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Private OS: Instant 6-digit verification code will be sent to confirm founder account.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Founder Eligibility...</span>
                  </>
                ) : (
                  <span>{mode === 'create' ? 'Create a new account' : 'Sign in to account'}</span>
                )}
              </button>

              <div className="text-center text-gray-600 text-sm mt-2">
                {mode === 'create' ? (
                  <>
                    Already have account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setGeneralError('');
                        setEmailError('');
                      }}
                      className="text-zinc-950 font-medium underline cursor-pointer"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Need to create account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('create');
                        setGeneralError('');
                        setEmailError('');
                      }}
                      className="text-zinc-950 font-medium underline cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp} noValidate>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="otp" className="block text-sm font-medium text-zinc-800">
                    6-Digit Confirmation Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setPasswordError('');
                      setGeneralError('');
                    }}
                    className="text-xs text-orange-600 hover:underline cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
                <input
                  type="text"
                  id="otp"
                  maxLength={6}
                  placeholder="123456"
                  autoFocus
                  className={`text-sm w-full py-2.5 px-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black font-mono font-bold text-center tracking-widest ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (passwordError) setPasswordError('');
                    if (generalError) setGeneralError('');
                  }}
                />
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                )}
                <p className="text-[11px] text-zinc-400 mt-1">
                  Sent from Supabase to <strong>{email}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming Account...</span>
                    </>
                  ) : (
                    <span>Confirm & Enter OS</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || resendCooldown > 0}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};

export const FullScreenAuth = FullScreenSignup;
