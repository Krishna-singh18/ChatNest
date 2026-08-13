// Ye naya group banane ka modal hai (Modal to create a new group)
'use client';

import React, { useState, useEffect } from 'react';
import { Contact, User } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { X, Users, Check } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { toast } from 'sonner';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

export function NewGroupModal({ isOpen, onClose, onGroupCreated }: NewGroupModalProps) {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedUserIds([]);

      // Fetch both saved contacts and all available users
      Promise.all([api.getContacts().catch(() => []), api.searchUsers('').catch(() => [])])
        .then(([saved, searchUsers]) => {
          const userMap = new Map<number, User>();
          saved.forEach((c) => {
            if (c.contact_user && c.contact_user.id !== currentUser?.id) {
              userMap.set(c.contact_user.id, c.contact_user);
            }
          });
          searchUsers.forEach((u) => {
            if (u.id !== currentUser?.id) {
              userMap.set(u.id, u);
            }
          });

          const formattedContacts: Contact[] = Array.from(userMap.values()).map((u) => ({
            id: u.id,
            owner_id: currentUser?.id || 0,
            contact_user_id: u.id,
            contact_user: u,
            created_at: new Date().toISOString(),
          }));
          setContacts(formattedContacts);
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error('Select at least one member for the group');
      return;
    }

    setIsLoading(true);
    try {
      const group = await api.createGroupChat(name.trim(), selectedUserIds);
      toast.success(`Group "${group.name}" created!`);
      setName('');
      setSelectedUserIds([]);
      onGroupCreated(group);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ChatNest Devs"
              className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Select Members ({selectedUserIds.length})
            </label>

            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[var(--border-color)] rounded-xl p-2 bg-[var(--bg-tertiary)]">
              {contacts.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  No member contacts found.
                </p>
              ) : (
                contacts.map((c) => {
                  const isSelected = selectedUserIds.includes(c.contact_user_id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleUser(c.contact_user_id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs ${getAvatarColor(
                            c.contact_user.display_name
                          )}`}
                        >
                          {c.contact_user.avatar_url ? (
                            <img
                              src={c.contact_user.avatar_url}
                              alt={c.contact_user.display_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(c.contact_user.display_name)
                          )}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {c.contact_user.display_name}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-[var(--border-color)]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || selectedUserIds.length === 0 || !name.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-blue-600/20"
          >
            {isLoading ? 'Creating Group...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
