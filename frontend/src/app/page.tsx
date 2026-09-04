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
  const [isStreaming, setIsStreaming] = useState(false);

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
      try {
        const res = await apiClient.post('/auth/guest');
        if (res.data && res.data.access_token && res.data.user) {
          const { setStoredAuth } = await import('@/lib/auth');
          setStoredAuth(res.data.access_token, res.data.user);
          setUser(res.data.user);
        } else {
          const localGuest: User = {
            id: 'guest_local',
            email: 'guest@chatgpt.platform',
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
          email: 'guest@chatgpt.platform',
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
      if (Array.isArray(res.data) && res.data.length > 0) {
        setConversations(res.data);
        if (!activeConvId) {
          selectConversation(res.data[0].id);
        }
      } else {
        const defaultConv: Conversation = {
          id: `conv_${Date.now()}`,
          title: 'Welcome to ChatGPT',
          model: 'qwen-2.5-0.5b-local',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [],
        };
        setConversations([defaultConv]);
        setActiveConvId(defaultConv.id);
        setActiveMessages([]);
      }
    } catch {
      // Fallback
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    const existing = conversations.find((c) => c.id === id);
    if (existing && existing.messages && existing.messages.length > 0) {
      setActiveMessages(existing.messages);
      return;
    }

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
    } catch {}
    setConversations(conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/chat/conversations/${id}`);
    } catch {}
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
  };

  const handleSendMessage = async (text: string, attachedDocId?: string) => {
    let currentId = activeConvId;

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
        document_ids: attachedDocId ? [attachedDocId] : undefined,
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
    <div className="flex h-screen overflow-hidden bg-[#121214]">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        isOpen={isSidebarOpen}
        user={user}
        onSelect={selectConversation}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        onOpenDocuments={() => setIsDocDrawerOpen(true)}
        onOpenSettings={() => (window.location.href = '/settings')}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#121214]">
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
