// Ye naya direct message shuru karne ka modal hai (Modal to start a new direct message)
'use client';

import React, { useState, useEffect } from 'react';
import { User, Contact, Conversation } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Search, X, MessageSquare, UserPlus } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { toast } from 'sonner';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export function NewChatModal({ isOpen, onClose, onSelectUser }: NewChatModalProps) {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [contactsList, setContactsList] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    let isMounted = true;
    const loadContactsAndChats = async () => {
      setIsLoading(true);
      try {
        const [savedContacts, convs] = await Promise.all([
          api.getContacts().catch(() => []),
          api.getConversations().catch(() => []),
        ]);

        const userMap = new Map<number, User>();

        // 1. Add users from saved contacts
        savedContacts.forEach((c) => {
          if (c.contact_user && c.contact_user.id !== currentUser.id) {
            userMap.set(c.contact_user.id, c.contact_user);
          }
        });

        // 2. Add users from active conversations
        convs.forEach((conv) => {
          if (conv.participants) {
            conv.participants.forEach((p) => {
              if (p.user && p.user.id !== currentUser.id) {
                userMap.set(p.user.id, p.user);
              }
            });
          }
        });

        if (isMounted) {
          setContactsList(Array.from(userMap.values()));
        }
      } catch (err: any) {
        if (isMounted) toast.error(err.message || 'Failed to load contacts');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadContactsAndChats();
  }, [isOpen, currentUser]);

  // When search query is entered, search database for additional users
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    const searchMore = async () => {
      try {
        const users = await api.searchUsers(query.trim());
        if (isMounted) {
          setSearchResults(users.filter((u) => u.id !== currentUser?.id));
        }
      } catch (err: any) {}
    };

    const timer = setTimeout(searchMore, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, currentUser]);

  if (!isOpen) return null;

  // Filter existing contacts list
  const filteredContacts = contactsList.filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.phone_number || '').includes(q)
    );
  });

  // Additional search results not in contacts list
  const extraSearchResults = searchResults.filter(
    (u) => !contactsList.some((c) => c.id === u.id)
  );

  const displayUsers = query.trim() ? [...filteredContacts, ...extraSearchResults] : filteredContacts;

  const handleAddContact = async (user: User) => {
    try {
      await api.addContact(user.id);
      toast.success(`Added ${user.display_name} to contacts!`);
    } catch (err: any) {
      toast.info(err.message || 'Contact already added');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Contacts</h2>
            <p className="text-xs text-[var(--text-secondary)]">People in your contacts & active chats</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3 py-2 rounded-xl">
          <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts by name or phone..."
            className="w-full bg-transparent text-sm focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
        </div>

        {/* Contacts List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pt-1 pr-1">
          {isLoading ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-8">Loading contacts...</p>
          ) : displayUsers.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-8">No contacts found.</p>
          ) : (
            displayUsers.map((u) => {
              const isSavedContact = contactsList.some((c) => c.id === u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white text-xs ${getAvatarColor(
                        u.display_name
                      )}`}
                    >
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(u.display_name)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight flex items-center gap-1.5">
                        {u.display_name}
                        {u.is_online && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">@{u.username} • {u.phone_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isSavedContact && (
                      <button
                        onClick={() => handleAddContact(u)}
                        className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                        title="Add to Contacts"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectUser(u);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" /> Chat
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
