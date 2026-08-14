// Ye naya account banane ka page hai (Page to create a new account)
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { UserPlus, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);

  // Field validation error messages (hidden when clean/valid)
  const [displayNameError, setDisplayNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateDisplayName = (val: string) => {
    if (!val.trim()) {
      setDisplayNameError('Display Name is required');
      return false;
    }
    setDisplayNameError('');
    return true;
  };

  const validateUsername = (val: string) => {
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setUsernameError('Username is required');
      return false;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(clean)) {
      setUsernameError('Must be 3-30 letters, numbers, or underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePhone = (val: string) => {
    const clean = val.trim();
    if (!clean) {
      setPhoneError('Phone Number is required');
      return false;
    }
    if (!/^\d{10}$/.test(clean)) {
      setPhoneError('Must be exactly 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validatePassword = (val: string) => {
    if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateDisplayName(displayName);
    const isUserValid = validateUsername(username);
    const isPhoneValid = validatePhone(phoneNumber);
    const isPasswordValid = validatePassword(password);

    if (!isNameValid || !isUserValid || !isPhoneValid || !isPasswordValid) {
      return;
    }

    if (otp !== '123456') {
      toast.error('Invalid OTP Code');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        username: username.trim().toLowerCase(),
        phone_number: phoneNumber.trim(),
        display_name: displayName.trim(),
        password: password,
      });
      toast.success('Account created successfully!');
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      if (msg.toLowerCase().includes('username')) {
        setUsernameError(msg);
      } else if (msg.toLowerCase().includes('phone')) {
        setPhoneError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 mb-2">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Join ChatNest</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create your ChatNest profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (displayNameError) validateDisplayName(e.target.value);
              }}
              onBlur={(e) => validateDisplayName(e.target.value)}
              className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-sm focus:outline-none focus:ring-2 text-[var(--text-primary)] ${
                displayNameError
                  ? 'border-red-500/80 focus:ring-red-500/50'
                  : 'border-[var(--border-color)] focus:ring-blue-500'
              }`}
              required
            />
            {displayNameError && (
              <span className="text-[11px] text-red-400 font-medium mt-1 block">
                {displayNameError}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) validateUsername(e.target.value);
              }}
              onBlur={(e) => validateUsername(e.target.value)}
              className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-sm focus:outline-none focus:ring-2 text-[var(--text-primary)] ${
                usernameError
                  ? 'border-red-500/80 focus:ring-red-500/50'
                  : 'border-[var(--border-color)] focus:ring-blue-500'
              }`}
              required
            />
            {usernameError && (
              <span className="text-[11px] text-red-400 font-medium mt-1 block">
                {usernameError}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              maxLength={10}
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPhoneNumber(val);
                if (phoneError) validatePhone(val);
              }}
              onBlur={(e) => validatePhone(e.target.value)}
              className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-sm focus:outline-none focus:ring-2 text-[var(--text-primary)] ${
                phoneError
                  ? 'border-red-500/80 focus:ring-red-500/50'
                  : 'border-[var(--border-color)] focus:ring-blue-500'
              }`}
              required
            />
            {phoneError && (
              <span className="text-[11px] text-red-400 font-medium mt-1 block">
                {phoneError}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={(e) => validatePassword(e.target.value)}
                className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-sm focus:outline-none focus:ring-2 text-[var(--text-primary)] pr-12 ${
                  passwordError
                    ? 'border-red-500/80 focus:ring-red-500/50'
                    : 'border-[var(--border-color)] focus:ring-blue-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <span className="text-[11px] text-red-400 font-medium mt-1 block">
                {passwordError}
              </span>
            )}
          </div>

          {step === 'details' ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (validateDisplayName(displayName) && validateUsername(username) && validatePhone(phoneNumber) && validatePassword(password)) {
                    setStep('otp');
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3 text-xs text-blue-400">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-300">Mock Verification Code</p>
                  <p>Use fixed code <code className="bg-blue-900/40 px-1 py-0.5 rounded text-white">123456</code> to verify.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  placeholder="Write OTP"
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-center text-xl tracking-widest font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans placeholder:opacity-50"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="w-1/3 py-3 bg-[var(--bg-tertiary)] hover:bg-zinc-700 text-[var(--text-primary)] font-medium rounded-xl text-sm transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Verify & Register'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="text-center pt-4 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500 hover:underline font-medium">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
