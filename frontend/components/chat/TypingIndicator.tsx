// Ye typing animation dikhata hai jab koi type kar raha ho (Shows typing animation)
'use client';

import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] rounded-full w-max text-xs text-[var(--text-secondary)] shadow-sm">
      <span className="font-medium text-[var(--text-primary)]">typing</span>
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
      </div>
    </div>
  );
}
