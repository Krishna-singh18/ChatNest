// Yahan saare backend API calls define kiye gaye hain (All backend API calls are defined here)
import { User, Contact, Conversation, Message, MessageReaction } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('chatnest_token') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API Request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Auth
  register: async (data: { phone_number?: string; username?: string; display_name: string; password?: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  verifyOtp: async (identifier: string, otp: string = '123456') => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ identifier, otp }),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  login: async (identifier: string, password?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ identifier, password }),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  getMe: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(token),
    });
    return handleResponse<User>(res);
  },

  // Users & Contacts
  searchUsers: async (query: string) => {
    const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    return handleResponse<User[]>(res);
  },

  updateProfile: async (data: { display_name?: string; avatar_url?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  getContacts: async () => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      headers: getHeaders(),
    });
    return handleResponse<Contact[]>(res);
  },

  addContact: async (contact_user_id: number, nickname?: string) => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contact_user_id, nickname }),
    });
    return handleResponse<Contact>(res);
  },

  deleteContact: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Conversations
  getConversations: async () => {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      headers: getHeaders(),
    });
    return handleResponse<Conversation[]>(res);
  },

  createDirectChat: async (target_user_id: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/direct`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ target_user_id }),
    });
    return handleResponse<Conversation>(res);
  },

  createGroupChat: async (name: string, member_ids: number[], avatar_url?: string) => {
    const res = await fetch(`${API_BASE_URL}/conversations/group`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, member_ids, avatar_url }),
    });
    return handleResponse<Conversation>(res);
  },

  getConversationDetail: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<Conversation>(res);
  },

  addGroupMember: async (conversation_id: number, user_id: number, role: string = 'member') => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversation_id}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ user_id, role }),
    });
    return handleResponse<Conversation>(res);
  },

  removeGroupMember: async (conversation_id: number, user_id: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversation_id}/members/${user_id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  markRead: async (conversation_id: number, last_read_message_id: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversation_id}/read`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ last_read_message_id }),
    });
    return handleResponse<{ message: string }>(res);
  },

  clearConversation: async (conversation_id: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversation_id}/clear`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  deleteConversation: async (conversation_id: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversation_id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Messages
  getMessages: async (conversation_id: number, before?: number, limit: number = 50) => {
    let url = `${API_BASE_URL}/conversations/${conversation_id}/messages?limit=${limit}`;
    if (before) url += `&before=${before}`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse<Message[]>(res);
  },

  sendMessageRest: async (conversation_id: number, content?: string, type: string = 'text', reply_to_message_id?: number) => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversation_id}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, type, reply_to_message_id }),
    });
    return handleResponse<Message>(res);
  },

  toggleReaction: async (message_id: number, emoji: string) => {
    const res = await fetch(`${API_BASE_URL}/messages/${message_id}/reactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ emoji }),
    });
    return handleResponse<MessageReaction>(res);
  },
};
