import React, { useState } from 'react';
import { Sun, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import { DEFAULT_PARTNERS } from '../services/storage';

export const FullScreenSignup = ({
  initialMode = 'signin',
  onLoginSuccess,
  onBackToApp,
  partners = DEFAULT_PARTNERS,
  currentUser = null
}) => {
  // Authentication views: 'signin' | 'forgot' (No create account)
  const [view, setView] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error & Status feedback
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // Sign In with email & password credentials
  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setStatusMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Please enter your founder email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // Pre-flight check: match with authorized founders
    const isFounder = authService.isFounderEmail(cleanEmail, partners);
    if (!isFounder) {
      setIsLoading(false);
      setGeneralError('This is a private OS, not eligible for login.');
      return;
    }

    // Direct password verification
    const res = await authService.loginWithPassword(cleanEmail, password, partners);
    setIsLoading(false);

    if (res.success && res.partner) {
      setStatusMsg(`Welcome back, ${res.partner.name}!`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.partner);
      }, 400);
    } else {
      if (res.notEligible) {
        setGeneralError('This is a private OS, not eligible for login.');
      } else {
        setGeneralError(res.error || 'Invalid credentials. Please try again.');
      }
    }
  };

  // Direct In-App Password Reset / Change
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setStatusMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Please enter your founder email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const res = await authService.resetPassword(cleanEmail, newPassword, confirmPassword, partners);
    setIsLoading(false);

    if (res.success) {
      setStatusMsg(res.message || 'Password updated successfully! You can now sign in.');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      // Return to sign in view with email prefilled
      setTimeout(() => {
        setView('signin');
      }, 1000);
    } else {
      if (res.notEligible) {
        setGeneralError('This is a private OS, not eligible for login.');
      } else {
        setGeneralError(res.error || 'Failed to update password.');
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
          <div className="relative z-10 text-xs text-zinc-400 font-mono-num flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kakinada Launch Operations • Private Founder OS</span>
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
              {view === 'forgot' ? 'Forgot / Change Password' : 'Sign In'}
            </h2>
            <p className="text-left text-sm text-zinc-500">
              {view === 'forgot'
                ? 'Enter your founder email and choose a new password.'
                : 'Welcome back to Delizoo OS — Sign in with your founder credentials.'}
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
          {view === 'signin' ? (
            <form className="flex flex-col gap-4" onSubmit={handleSignIn} noValidate>
              <div>
                <label htmlFor="signin-email" className="block text-sm mb-2 font-medium text-zinc-800">
                  Founder Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="signin-email"
                    autoFocus
                    placeholder="e.g. ncharantejaa@gmail.com"
                    className={`text-sm w-full py-2.5 pl-9 pr-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                      if (generalError) setGeneralError('');
                    }}
                    aria-invalid={!!emailError}
                    aria-describedby="signin-email-error"
                  />
                </div>
                {emailError && (
                  <p id="signin-email-error" className="text-red-500 text-xs mt-1">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="signin-password" className="block text-sm font-medium text-zinc-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setGeneralError('');
                      setEmailError('');
                      setPasswordError('');
                      setStatusMsg('');
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline cursor-pointer"
                  >
                    Forgot / Change Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signin-password"
                    placeholder="Enter your password"
                    className={`text-sm w-full py-2.5 pl-9 pr-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                      if (generalError) setGeneralError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Delizoo OS</span>
                )}
              </button>
            </form>
          ) : (
            /* Forgot / Change Password Form */
            <form className="flex flex-col gap-4" onSubmit={handleResetPassword} noValidate>
              <div>
                <label htmlFor="reset-email" className="block text-sm mb-2 font-medium text-zinc-800">
                  Founder Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="reset-email"
                    autoFocus
                    placeholder="e.g. ncharantejaa@gmail.com"
                    className={`text-sm w-full py-2.5 pl-9 pr-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                      if (generalError) setGeneralError('');
                    }}
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm mb-2 font-medium text-zinc-800">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    placeholder="At least 6 characters"
                    className={`text-sm w-full py-2.5 pl-9 pr-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                      if (generalError) setGeneralError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm mb-2 font-medium text-zinc-800">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    placeholder="Re-enter your new password"
                    className={`text-sm w-full py-2.5 pl-9 pr-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-black transition-colors ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                      if (generalError) setGeneralError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !newPassword || !confirmPassword}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('signin');
                    setGeneralError('');
                    setEmailError('');
                    setPasswordError('');
                  }}
                  className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Back to Sign In
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
