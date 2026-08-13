// Ye user profile aur settings ka modal hai (Modal for user profile and settings)
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { X, User, Sun, Moon, Shield, Bell, Smartphone, Check } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'devices'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      updateUser(updated);
      toast.success('Profile updated!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-48 bg-[var(--bg-tertiary)] border-b md:border-b-0 md:border-r border-[var(--border-color)] p-4 space-y-1">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Settings</h2>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'devices'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Linked Devices
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Profile</h3>

              <div className="flex flex-col items-center justify-center my-3">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg ${getAvatarColor(
                    displayName || 'Me'
                  )}`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(displayName || 'Me')
                  )}
                </div>
                <p className="text-sm font-semibold text-blue-400 mt-2">@{user?.username}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex justify-between">
                  <span>Display Name</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-blue-400 font-medium">(Verified)</span>
                </label>
                <input
                  type="text"
                  value={user?.phone_number || ''}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-secondary)] cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-primary)]"
                />
              </div>

              {/* Theme Selector */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Appearance Theme
                </label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-primary)]"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    {theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                  </span>
                  <span className="text-blue-500 font-bold">Toggle</span>
                </button>
              </div>


              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-md shadow-blue-600/20"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab !== 'profile' && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-full">
                {activeTab === 'privacy' && <Shield className="w-8 h-8" />}
                {activeTab === 'notifications' && <Bell className="w-8 h-8" />}
                {activeTab === 'devices' && <Smartphone className="w-8 h-8" />}
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] capitalize">
                {activeTab} Settings
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                Coming Soon
              </p>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
