// Ye group ki details aur members dikhane ka modal hai (Modal to show group details and members)
'use client';

import React, { useState } from 'react';
import { Conversation, User } from '@/types';
import { api } from '@/lib/api';
import { X, ShieldAlert, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { toast } from 'sonner';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: number;
  onUpdated: () => void;
}

export function GroupInfoModal({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onUpdated,
}: GroupInfoModalProps) {
  const [addUserId, setAddUserId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const isAdmin = conversation.participants.some(
    (p) => p.user_id === currentUserId && p.role === 'admin'
  );

  const handleRemoveMember = async (userId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this group?`)) return;
    try {
      await api.removeGroupMember(conversation.id, userId);
      toast.success(`Removed ${name} from group`);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserId.trim()) return;
    setIsAdding(true);
    try {
      // Find user by searching first
      const users = await api.searchUsers(addUserId.trim());
      if (users.length === 0) {
        toast.error('User not found');
        return;
      }
      await api.addGroupMember(conversation.id, users[0].id);
      toast.success(`Added ${users[0].display_name} to group`);
      setAddUserId('');
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {conversation.type === 'group' ? 'Group Details' : 'Contact Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Header Info */}
        <div className="flex flex-col items-center text-center space-y-2 py-2">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl ${getAvatarColor(
              conversation.name || 'Chat'
            )}`}
          >
            {getInitials(conversation.name || 'Chat')}
          </div>
          <h3 className="font-bold text-base text-[var(--text-primary)]">{conversation.name}</h3>
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Signal End-to-End Encrypted
          </p>
        </div>

        {/* Member List */}
        {conversation.type === 'group' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Members ({conversation.participants.length})
              </h4>
            </div>

            {isAdmin && (
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="text"
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  placeholder="Username/phone to add..."
                  className="flex-1 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            )}

            <div className="max-h-56 overflow-y-auto space-y-1 border border-[var(--border-color)] rounded-xl p-2 bg-[var(--bg-tertiary)]">
              {conversation.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs ${getAvatarColor(
                        p.user?.display_name || 'Member'
                      )}`}
                    >
                      {getInitials(p.user?.display_name || 'Member')}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {p.user?.display_name}{' '}
                        {p.user_id === currentUserId && <span className="text-zinc-500">(You)</span>}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">@{p.user?.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.role === 'admin' ? (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px] font-medium rounded-full">
                        Member
                      </span>
                    )}

                    {isAdmin && p.user_id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(p.user_id, p.user?.display_name || 'Member')}
                        className="p-1 hover:bg-red-500/10 text-red-400 rounded-lg"
                        title="Remove member"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
