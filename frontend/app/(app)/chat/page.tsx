// Ye main chat interface hai (This is the main chat interface)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Conversation, Message, User } from '@/types';
import { ConversationList } from '@/components/conversations/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { NewChatModal } from '@/components/modals/NewChatModal';
import { NewGroupModal } from '@/components/modals/NewGroupModal';
import { GroupInfoModal } from '@/components/modals/GroupInfoModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Lock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  // Modals state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, startTyping, stopTyping, markRead, typingState } = useSocket();

  // Fetch Conversations List
  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
    enabled: !!user,
  });

  // Fetch Active Conversation Messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => (selectedConversationId ? api.getMessages(selectedConversationId) : Promise.resolve([])),
    enabled: !!selectedConversationId,
  });

  // Auto-select first conversation if available
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  // Mark Read when entering conversation or when new messages arrive
  useEffect(() => {
    if (selectedConversationId) {
      // Instantly zero out unread_count badge for active conversation in query cache
      queryClient.setQueryData<Conversation[]>(['conversations'], (oldConvs = []) => {
        if (!oldConvs) return [];
        return oldConvs.map((c) => (c.id === selectedConversationId ? { ...c, unread_count: 0 } : c));
      });

      if (lastMessageId) {
        markRead(selectedConversationId, lastMessageId);
        api.markRead(selectedConversationId, lastMessageId).catch(() => {});
      }
    }
  }, [selectedConversationId, lastMessageId]);

  // Always force unread_count = 0 for currently selected active conversation
  const displayConversations = conversations.map((c) =>
    c.id === selectedConversationId ? { ...c, unread_count: 0 } : c
  );

  const activeConversation = conversations.find((c) => c.id === selectedConversationId);

  const handleSelectDirectUser = async (targetUser: User) => {
    try {
      const conv = await api.createDirectChat(targetUser.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversationId(conv.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start chat');
    }
  };

  const handleSendMessage = async (content: string, replyToId?: number) => {
    if (!selectedConversationId || !user) return;

    try {
      // Send via REST for guaranteed DB persistence & synchronous response
      const newMsg = await api.sendMessageRest(selectedConversationId, content, 'text', replyToId);

      // Update local messages query cache for immediate UI render
      queryClient.setQueryData<Message[]>(['messages', selectedConversationId], (oldMsgs = []) => {
        if (!oldMsgs) return [newMsg];
        if (oldMsgs.some((m) => m.id === newMsg.id)) return oldMsgs;
        return [...oldMsgs, newMsg];
      });

      // Update conversations query cache for immediate sidebar preview & zero unread
      queryClient.setQueryData<Conversation[]>(['conversations'], (oldConvs = []) => {
        if (!oldConvs) return [];
        return oldConvs.map((c) =>
          c.id === selectedConversationId
            ? { ...c, last_message: newMsg, last_message_at: newMsg.created_at, unread_count: 0 }
            : c
        );
      });

      // Message sent successfully via REST & pushed to WS room participants by backend
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    }
  };


  const handleClearChat = async () => {
    if (!selectedConversationId) return;
    try {
      await api.clearConversation(selectedConversationId);
      // Immediately clear messages locally
      queryClient.setQueryData(['messages', selectedConversationId], []);
      // Nullify last_message in conversations preview
      queryClient.setQueryData<Conversation[]>(['conversations'], (oldConvs = []) => {
        if (!oldConvs) return [];
        return oldConvs.map(c => 
          c.id === selectedConversationId ? { ...c, last_message: undefined } : c
        );
      });
      toast.success('Chat history cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear chat');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversationId) return;
    const isGroup = activeConversation?.type === 'group';
    try {
      await api.deleteConversation(selectedConversationId);
      // Immediately remove from conversation list
      queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) => 
        old.filter(c => c.id !== selectedConversationId)
      );
      setSelectedConversationId(null);
      toast.success(isGroup ? 'Left group' : 'Chat deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete chat');
    }
  };

  const currentTypingStatus = selectedConversationId ? typingState[selectedConversationId] : null;

  if (!user) return null;

  return (
    <div className="h-screen w-screen flex bg-[var(--bg-primary)] overflow-hidden">
      {/* Left Conversation List Pane */}
      <div
        className={`${
          selectedConversationId ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full shrink-0`}
      >
        <ConversationList
          conversations={displayConversations}
          selectedId={selectedConversationId}
          onSelect={(id) => setSelectedConversationId(id)}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenNewGroup={() => setShowNewGroupModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          currentUserId={user.id}
        />
      </div>

      {/* Right Active Chat Pane */}
      <div
        className={`${
          !selectedConversationId ? 'hidden md:flex' : 'flex'
        } flex-1 h-full flex-col bg-[var(--bg-primary)]`}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <ChatHeader
              conversation={activeConversation}
              currentUserId={user.id}
              onBack={() => setSelectedConversationId(null)}
              onOpenInfo={() => setShowGroupInfoModal(true)}
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
            />

            {/* Messages Scroll View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Encryption Verification Banner */}
              <div className="flex justify-center my-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs text-[var(--text-secondary)] shadow-sm max-w-md text-center">
                  <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
                  </span>
                </div>
              </div>

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={user.id}
                  onReply={(m) => setReplyMessage(m)}
                />
              ))}

              {/* Typing indicator */}
              {currentTypingStatus?.is_typing && currentTypingStatus.user_id !== user.id && (
                <div className="my-2">
                  <TypingIndicator />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              onTyping={() => selectedConversationId && startTyping(selectedConversationId)}
              onStopTyping={() => selectedConversationId && stopTyping(selectedConversationId)}
              replyMessage={replyMessage}
              onCancelReply={() => setReplyMessage(null)}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-primary)]">
            <div className="w-20 h-20 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">ChatNest Desktop</h2>

            <p className="text-sm text-[var(--text-secondary)] max-w-sm">
              Send and receive messages with end-to-end encryption. Select a conversation to begin chatting.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleSelectDirectUser}
      />
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onGroupCreated={(newGroup) => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          setSelectedConversationId(newGroup.id);
        }}
      />
      {activeConversation && (
        <GroupInfoModal
          isOpen={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          conversation={activeConversation}
          currentUserId={user.id}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            refetchConversations();
          }}
        />
      )}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
}
