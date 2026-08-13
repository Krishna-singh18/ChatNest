// Yahan saare TypeScript interfaces aur types define hain (All TS interfaces and types are defined here)
export interface User {
  id: number;
  phone_number?: string | null;
  username?: string | null;
  display_name: string;
  avatar_url?: string | null;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface Contact {
  id: number;
  owner_id: number;
  contact_user_id: number;
  nickname?: string | null;
  created_at: string;
  contact_user: User;
}

export interface MessageStatus {
  id: number;
  message_id: number;
  user_id: number;
  status: 'sent' | 'delivered' | 'read';
  updated_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: User;
  content?: string | null;
  type: 'text' | 'image' | 'file' | 'system';
  reply_to_message_id?: number | null;
  attachment_url?: string | null;
  expires_at?: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  statuses: MessageStatus[];
  reactions: MessageReaction[];
}

export interface ConversationParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_message_id?: number | null;
  user: User;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string | null;
  avatar_url?: string | null;
  created_by?: number | null;
  created_at: string;
  last_message_at: string;
  participants: ConversationParticipant[];
  last_message?: Message | null;
  unread_count: number;
}

export interface WSEvent {
  type: 'message:new' | 'message:status' | 'typing:update' | 'presence:update' | 'conversation:updated';
  payload: any;
}
