'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { ChatInput } from '@/components/ChatInput';
import { DocumentDrawer } from '@/components/DocumentDrawer';
import { getStoredUser } from '@/lib/auth';
import { apiClient, streamChatResponse } from '@/lib/api';
import { Conversation, Message, User } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeModel, setActiveModel] = useState('qwen-2.5-0.5b-local');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load user session on mount
  useEffect(() => {
    initUserSession();
  }, []);

  const initUserSession = async () => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setActiveModel(storedUser.preferred_model || 'qwen-2.5-0.5b-local');
      fetchConversations();
    } else {
      // Auto-authenticate as guest for instant zero-friction chat access
      try {
        const res = await apiClient.post('/auth/guest');
        if (res.data && res.data.access_token && res.data.user) {
          const { setStoredAuth } = await import('@/lib/auth');
          setStoredAuth(res.data.access_token, res.data.user);
          setUser(res.data.user);
        } else {
          // Local guest user fallback
          const localGuest: User = {
            id: 'guest_local',
            email: 'guest@platform.local',
            full_name: 'Guest User',
            preferred_model: 'qwen-2.5-0.5b-local',
            auth_provider: 'guest',
          };
          setUser(localGuest);
        }
        fetchConversations();
      } catch {
        const localGuest: User = {
          id: 'guest_local',
          email: 'guest@platform.local',
          full_name: 'Guest User',
          preferred_model: 'qwen-2.5-0.5b-local',
          auth_provider: 'guest',
        };
        setUser(localGuest);
        fetchConversations();
      }
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get('/chat/conversations');
      if (Array.isArray(res.data)) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConvId) {
          selectConversation(res.data[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    try {
      const res = await apiClient.get(`/chat/conversations/${id}`);
      if (res.data && Array.isArray(res.data.messages)) {
        setActiveMessages(res.data.messages);
        if (res.data.model) {
          setActiveModel(res.data.model);
        }
      } else {
        setActiveMessages([]);
      }
    } catch {
      setActiveMessages([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await apiClient.post('/chat/conversations', {
        title: 'New Chat',
        model: activeModel,
      });
      const newConv = res.data;
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setActiveMessages([]);
    } catch {
      // Fallback local new chat state
      const localId = `local_${Date.now()}`;
      const localConv: Conversation = {
        id: localId,
        title: 'New Chat',
        model: activeModel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      };
      setConversations([localConv, ...conversations]);
      setActiveConvId(localId);
      setActiveMessages([]);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      await apiClient.patch(`/chat/conversations/${id}`, { title: newTitle });
      setConversations(conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    } catch {
      setConversations(conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/chat/conversations/${id}`);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConvId(null);
          setActiveMessages([]);
        }
      }
    } catch {
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
    }
  };

  const handleSendMessage = async (text: string) => {
    let currentId = activeConvId;

    // Create new conversation if none active
    if (!currentId) {
      try {
        const res = await apiClient.post('/chat/conversations', {
          title: text.slice(0, 24) + '...',
          model: activeModel,
        });
        currentId = res.data.id;
        setActiveConvId(currentId);
        setConversations([res.data, ...conversations]);
      } catch {
        currentId = `conv_${Date.now()}`;
        setActiveConvId(currentId);
      }
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...activeMessages, userMessage];
    setActiveMessages(updatedMessages);
    setIsStreaming(true);

    // Placeholder assistant message for streaming
    const assistantMessageId = `asst_${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setActiveMessages([...updatedMessages, assistantMessage]);

    let accumulatedContent = '';

    await streamChatResponse(
      {
        conversation_id: currentId,
        message: text,
        model: activeModel,
      },
      (chunk) => {
        accumulatedContent += chunk;
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m))
        );
      },
      (err) => {
        setIsStreaming(false);
        setActiveMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: `Error: ${err}` } : m
          )
        );
      },
      () => {
        setIsStreaming(false);
        fetchConversations();
      }
    );
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...activeMessages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleEditUserMessage = (idx: number, newText: string) => {
    const trimmedMessages = activeMessages.slice(0, idx);
    setActiveMessages(trimmedMessages);
    handleSendMessage(newText);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121]">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        isOpen={isSidebarOpen}
        onSelect={selectConversation}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        onOpenDocuments={() => setIsDocDrawerOpen(true)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          user={user}
          activeModel={activeModel}
          onModelChange={setActiveModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onOpenSettings={() => (window.location.href = '/settings')}
        />

        <ChatWindow
          messages={activeMessages}
          isStreaming={isStreaming}
          onRegenerate={handleRegenerate}
          onEditUserMessage={handleEditUserMessage}
          onSelectStarterCard={handleSendMessage}
        />

        <ChatInput
          onSend={handleSendMessage}
          onOpenUpload={() => setIsDocDrawerOpen(true)}
          isStreaming={isStreaming}
        />

        <DocumentDrawer
          isOpen={isDocDrawerOpen}
          onClose={() => setIsDocDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
