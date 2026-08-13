// Ye chote helper functions aur utilities hain (These are small helper functions and utilities)
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name: string): string {
  if (!name) return 'bg-blue-600';
  const colors = [
    'bg-blue-600',
    'bg-indigo-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-amber-600',
    'bg-rose-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function formatChatTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

export function formatMessageTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}
