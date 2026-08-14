// Ye landing page hai jahan se users login/register karte hain (Landing page for login/register)
'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse [animation-delay:4s]"></div>
      </div>

      {/* Header Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">
              ChatNest
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:text-blue-500 transition-colors"
            >
              Log In
            </Link>

            <Link
              href="/register"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Centered in Viewport */}
      <main className="relative z-10 px-6 max-w-4xl mx-auto text-center space-y-6 flex-1 flex flex-col items-center justify-center py-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          Next-Gen Real-Time Messaging. <br />
          <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Fast, Secure & Intelligently Connected.
          </span>
        </h1>

        <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
          Experience sub-second real-time messaging, accurate read receipts, group administration, and end-to-end privacy aesthetics built for modern web standards.
        </p>

        {/* CTA Button Group - Prominently Visible */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-blue-600/30 hover:scale-105 flex items-center justify-center gap-3"
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold rounded-2xl text-base transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            Log In
          </Link>
        </div>
      </main>

      {/* Empty bottom spacer for perfect balance */}
      <div className="h-6"></div>
    </div>
  );
}
