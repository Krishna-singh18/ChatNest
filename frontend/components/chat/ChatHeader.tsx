// Ye chat window ka header hai (Header for the chat window)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Conversation, User } from '@/types';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { Lock, Phone, Video, MoreVertical, ArrowLeft, ShieldCheck, Trash2, Eraser, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: number;
  onBack?: () => void;
  onOpenInfo?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
}

export function ChatHeader({ conversation, currentUserId, onBack, onOpenInfo, onClearChat, onDeleteChat }: ChatHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isGroup = conversation.type === 'group';
  const otherParticipant = !isGroup
    ? conversation.participants.find((p) => p.user_id !== currentUserId)?.user
    : null;

  const isOnline = otherParticipant?.is_online;

  const handlePlaceholderCall = () => {
    toast.info('Voice & Video Calls — Coming Soon!');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 flex items-center justify-between shrink-0 relative">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative cursor-pointer flex items-center gap-3" onClick={onOpenInfo}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm ${getAvatarColor(
              conversation.name || 'Chat'
            )}`}
          >
            {conversation.avatar_url ? (
              <img
                src={conversation.avatar_url}
                alt={conversation.name || 'Avatar'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(conversation.name || 'Chat')
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">
                {conversation.name || 'Chat'}
              </h2>
              <span title="ChatNest Encrypted"><Lock className="w-3 h-3 text-blue-500" /></span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {isGroup
                ? `${conversation.participants.length} members`
                : isOnline
                ? 'Online'
                : 'ChatNest Security Verified'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handlePlaceholderCall}
          className="p-2.5 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
          title="Voice Call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={handlePlaceholderCall}
          className="p-2.5 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
          title="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden text-sm">
              <button
                onClick={() => { setShowDropdown(false); onOpenInfo?.(); }}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex items-center gap-3 transition-colors"
              >
                <Info className="w-4 h-4" />
                {isGroup ? 'Group Info' : 'Contact Info'}
              </button>
              <button
                onClick={() => { setShowDropdown(false); onClearChat?.(); }}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex items-center gap-3 transition-colors"
              >
                <Eraser className="w-4 h-4" />
                Clear Chat
              </button>
              <button
                onClick={() => { setShowDropdown(false); onDeleteChat?.(); }}
                className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-500 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isGroup ? 'Leave Group' : 'Delete Chat'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
