// Ye login page aur OTP verification handle karta hai (Handles login and OTP verification)
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter a username or phone number');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    try {
      // Just check if credentials are valid before moving to OTP step
      await api.login(identifier.trim(), password);
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (uname: string) => {
    setIsLoading(true);
    try {
      await login(uname, 'password123');
      toast.success(`Welcome back!`);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') {
      toast.error('Invalid OTP Code');
      return;
    }
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      toast.success(`Welcome back!`);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">ChatNest</h1>
          <p className="text-sm text-[var(--text-secondary)]">ChatNest — Privacy First Messaging</p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Phone Number or Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Enter Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
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
            </div>

            {/* Seeded Quick Select */}
            <div className="pt-2">
              <span className="block text-xs text-[var(--text-secondary)] mb-2">Or select pre-seeded demo user:</span>
              <div className="flex flex-wrap gap-2">
                {['priya', 'rahul', 'ananya'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-blue-600 hover:text-white rounded-lg border border-[var(--border-color)] transition-colors"
                  >
                    @{u}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                onClick={() => setStep('credentials')}
                className="w-1/3 py-3 bg-[var(--bg-tertiary)] hover:bg-zinc-700 text-[var(--text-primary)] font-medium rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-4 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-500 hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
