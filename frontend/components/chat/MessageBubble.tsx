// Ye ek single message bubble display karta hai (Displays a single message bubble)
'use client';

import React, { useState } from 'react';
import { Message } from '@/types';
import { formatMessageTime, getInitials, getAvatarColor } from '@/lib/utils';
import { StatusTick } from './StatusTick';
import { Smile, Reply } from 'lucide-react';
import { api } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
  currentUserId: number;
  onReply?: (msg: Message) => void;
}

export function MessageBubble({ message, currentUserId, onReply }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isSender = message.sender_id === currentUserId;
  const isSystem = message.type === 'system';

  const handleAddEmoji = async (emoji: string) => {
    try {
      await api.toggleReaction(message.id, emoji);
      setShowReactions(false);
    } catch {}
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs rounded-full shadow-sm text-center border border-[var(--border-color)]">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex gap-2 my-1 max-w-[85%] ${
        isSender ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
      }`}
    >
      {/* Avatar for receiver in group/chat */}
      {!isSender && (
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-auto ${getAvatarColor(
            message.sender?.display_name || 'User'
          )}`}
        >
          {message.sender?.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt={message.sender.display_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(message.sender?.display_name || 'User')
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div className="relative">
        <div
          className={`p-3 text-sm rounded-2xl shadow-sm relative ${
            isSender ? 'chat-bubble-sent' : 'chat-bubble-received'
          }`}
        >
          {/* Sender name for received messages */}
          {!isSender && (
            <p className="text-[11px] font-semibold text-blue-500 mb-1">
              {message.sender?.display_name || 'User'}
            </p>
          )}

          {/* Quoted Message Preview */}
          {message.reply_to_message_id && (
            <div className="mb-2 p-2 rounded-lg bg-black/10 dark:bg-white/10 border-l-2 border-blue-400 text-xs">
              <p className="font-medium text-blue-400">Replying to message</p>
            </div>
          )}

          {/* Content */}
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>

          {/* Footer: Time & Status Ticks */}
          <div
            className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
              isSender ? 'text-blue-100' : 'text-[var(--text-secondary)]'
            }`}
          >
            <span>{formatMessageTime(message.created_at)}</span>
            {isSender && <StatusTick statuses={message.statuses} currentUserId={currentUserId} />}
          </div>
        </div>

        {/* Display Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${
              isSender ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.reactions.map((r) => (
              <span
                key={r.id}
                className="px-1.5 py-0.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full shadow-sm"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Hover Action Bar */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 py-1 rounded-full shadow-md z-10 ${
            isSender ? '-left-16' : '-right-16'
          }`}
        >
          <button
            onClick={() => onReply && onReply(message)}
            title="Reply"
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowReactions(!showReactions)}
            title="React"
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Emoji Reaction Popup */}
        {showReactions && (
          <div
            className={`absolute z-20 top-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1.5 rounded-full shadow-xl flex gap-1 ${
              isSender ? 'right-0' : 'left-0'
            }`}
          >
            {['❤️', '👍', '🔥', '😂', '😮', '🙏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="hover:scale-125 transition-transform text-base p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
