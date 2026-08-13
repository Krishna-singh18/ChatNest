// Ye left sidebar me sabhi chats ki list dikhata hai (Shows list of all chats in left sidebar)
'use client';

import React, { useState } from 'react';
import { Conversation, User } from '@/types';
import { ConversationRow } from './ConversationRow';
import { Search, Plus, Users, Settings, Sun, Moon, LogOut, UserCheck } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
  currentUserId: number;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
  currentUserId,
}: ConversationListProps) {
  const [query, setQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const filtered = conversations.filter((c) =>
    (c.name || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenSettings}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs cursor-pointer ${getAvatarColor(
              user?.display_name || 'Me'
            )}`}
            title="Profile & Settings"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.display_name || 'Me')
            )}
          </div>
          <h1 className="font-bold text-lg text-[var(--text-primary)]">ChatNest</h1>

        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenNewChat}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
            title="All Contacts"
          >
            <UserCheck className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewGroup}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
            title="New Group"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewChat}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-sm"
            title="New Direct Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3">
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3 py-2 rounded-xl">
          <Search className="w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-[var(--text-secondary)]">
            No conversations found. Click <strong className="text-blue-500">+</strong> to start a chat.
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationRow
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onSelect={() => onSelect(conv.id)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {/* Footer Profile Strip */}
      <div className="p-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div className="truncate">
          <span className="font-semibold text-[var(--text-primary)] block truncate">
            {user?.display_name}
          </span>
          <span className="text-[10px] text-emerald-500 font-medium">● Connected</span>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
