// Ye naya message type karne aur bhejne ke liye hai (For typing and sending new messages)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import { Message } from '@/types';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from '@/context/ThemeContext';

interface MessageComposerProps {
  onSendMessage: (content: string, replyToId?: number) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  replyMessage?: Message | null;
  onCancelReply?: () => void;
}

export function MessageComposer({
  onSendMessage,
  onTyping,
  onStopTyping,
  replyMessage,
  onCancelReply,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const { theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onStopTyping();

    onSendMessage(text.trim(), replyMessage?.id);
    setText('');
    setShowEmoji(false);
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative border-t border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-full right-4 mb-2 z-30 shadow-2xl rounded-2xl overflow-hidden">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
          />
        </div>
      )}

      {/* Quoted Reply Banner */}
      {replyMessage && (
        <div className="mb-2 p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between text-xs">
          <div className="truncate">
            <span className="font-semibold text-blue-400">
              Replying to {replyMessage.sender?.display_name || 'Message'}
            </span>
            <p className="truncate text-[var(--text-secondary)]">{replyMessage.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="flex items-end gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/50">
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 text-[var(--text-secondary)] hover:text-blue-500 rounded-full transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."

          className="flex-1 bg-transparent border-0 focus:ring-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none max-h-32 focus:outline-none p-1.5"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
