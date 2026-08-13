// Ye message ka read/deliver status dikhata hai (Shows message read/deliver status)
'use client';

import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { MessageStatus } from '@/types';

interface StatusTickProps {
  statuses: MessageStatus[];
  currentUserId: number;
}

export function StatusTick({ statuses, currentUserId }: StatusTickProps) {
  if (!statuses || statuses.length === 0) {
    return <Check className="w-3.5 h-3.5 text-zinc-400 opacity-70 inline-block" />;
  }

  // Filter recipient statuses (excluding self)
  const recipientStatuses = statuses.filter((s) => s.user_id !== currentUserId);

  if (recipientStatuses.length === 0) {
    return <Check className="w-3.5 h-3.5 text-zinc-400 opacity-70 inline-block" />;
  }

  const isAllRead = recipientStatuses.every((s) => s.status === 'read');
  const isAnyDelivered = recipientStatuses.some((s) => s.status === 'delivered' || s.status === 'read');

  if (isAllRead) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline-block" />;
  }

  if (isAnyDelivered) {
    return <CheckCheck className="w-3.5 h-3.5 text-zinc-400 inline-block" />;
  }

  return <Check className="w-3.5 h-3.5 text-zinc-400 inline-block" />;
}
