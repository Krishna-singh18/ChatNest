// Ye WebSocket connection aur real-time events handle karta hai (Handles WebSocket connection and events)
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Message, Conversation, MessageStatus } from '@/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export function useSocket() {
  const { token, user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingState, setTypingState] = useState<Record<number, { user_id: number; is_typing: boolean }>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !user) return;

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        if (type === 'message:new') {
          const newMsg: Message = payload;
          const convId = Number(newMsg.conversation_id);

          // Clear typing state for sender in this conversation
          setTypingState((prev) => ({
            ...prev,
            [convId]: { user_id: newMsg.sender_id, is_typing: false },
          }));

          // Update messages query data for this conversation
          queryClient.setQueryData<Message[]>(['messages', convId], (oldMsgs = []) => {
            if (!oldMsgs) return [newMsg];
            if (oldMsgs.some((m) => m.id === newMsg.id)) return oldMsgs;
            return [...oldMsgs, newMsg];
          });

          // Update conversations query data for instant sidebar update and avoid race conditions
          queryClient.setQueryData<Conversation[]>(['conversations'], (oldConvs = []) => {
            if (!oldConvs) return [];
            return oldConvs.map((c) => {
              if (c.id === convId) {
                const isSelf = user && newMsg.sender_id === user.id;
                return {
                  ...c,
                  last_message: newMsg,
                  last_message_at: newMsg.created_at,
                  unread_count: isSelf ? c.unread_count : c.unread_count + 1,
                };
              }
              return c;
            }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          });
        } else if (type === 'message:status') {

          const { conversation_id, message_id, user_id, status } = payload;
          queryClient.setQueryData<Message[]>(['messages', conversation_id], (oldMsgs = []) => {
            if (!oldMsgs) return [];
            return oldMsgs.map((msg) => {
              if (msg.id <= message_id) {
                const existingStatusIndex = msg.statuses.findIndex((s) => s.user_id === user_id);
                let updatedStatuses = [...msg.statuses];
                if (existingStatusIndex >= 0) {
                  updatedStatuses[existingStatusIndex] = {
                    ...updatedStatuses[existingStatusIndex],
                    status: status as any,
                  };
                } else {
                  updatedStatuses.push({
                    id: Date.now(),
                    message_id: msg.id,
                    user_id,
                    status: status as any,
                    updated_at: new Date().toISOString(),
                  });
                }
                return { ...msg, statuses: updatedStatuses };
              }
              return msg;
            });
          });
        } else if (type === 'typing:update') {
          const { conversation_id, user_id, is_typing } = payload;
          setTypingState((prev) => ({
            ...prev,
            [conversation_id]: { user_id, is_typing },
          }));
        } else if (type === 'presence:update') {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
      } catch (err) {
        console.error('Error handling WS event:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [token, user, queryClient]);

  const sendMessage = useCallback(
    (conversation_id: number, content: string, reply_to_message_id?: number, attachment_url?: string): boolean => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'message:send',
            payload: {
              conversation_id,
              content,
              reply_to_message_id,
              attachment_url,
            },
          })
        );
        return true;
      }
      return false;
    },
    []
  );


  const startTyping = useCallback((conversation_id: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'typing:start',
          payload: { conversation_id },
        })
      );
    }
  }, []);

  const stopTyping = useCallback((conversation_id: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'typing:stop',
          payload: { conversation_id },
        })
      );
    }
  }, []);

  const markRead = useCallback(
    (conversation_id: number, message_id: number) => {
      // Instantly clear unread count for this conversation in query cache
      queryClient.setQueryData<Conversation[]>(['conversations'], (oldConvs = []) => {
        if (!oldConvs) return [];
        return oldConvs.map((conv) => {
          if (conv.id === conversation_id) {
            return { ...conv, unread_count: 0 };
          }
          return conv;
        });
      });

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'message:read',
            payload: { conversation_id, message_id },
          })
        );
      }
    },
    [queryClient]
  );


  return {
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    typingState,
  };
}
