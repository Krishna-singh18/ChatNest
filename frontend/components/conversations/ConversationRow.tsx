// Ye list me ek single chat row display karta hai (Displays a single chat row in the list)
'use client';

import React from 'react';
import { Conversation } from '@/types';
import { getInitials, getAvatarColor, formatChatTimestamp } from '@/lib/utils';
import { Users, Lock } from 'lucide-react';

interface ConversationRowProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  currentUserId: number;
}

export function ConversationRow({
  conversation,
  isSelected,
  onSelect,
  currentUserId,
}: ConversationRowProps) {
  const isGroup = conversation.type === 'group';
  const lastMsg = conversation.last_message;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-400'
          : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
      }`}
    >
      <div className="relative shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white text-base ${getAvatarColor(
            conversation.name || 'Chat'
          )}`}
        >
          {conversation.avatar_url ? (
            <img
              src={conversation.avatar_url}
              alt={conversation.name || 'Avatar'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : isGroup ? (
            <Users className="w-5 h-5" />
          ) : (
            getInitials(conversation.name || 'Chat')
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm truncate text-[var(--text-primary)]">
            {conversation.name || 'Chat'}
          </h3>
          <span className="text-[11px] text-[var(--text-secondary)] shrink-0">
            {formatChatTimestamp(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {lastMsg?.content ? lastMsg.content : 'No messages yet'}
          </p>

          {conversation.unread_count > 0 && (
            <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
