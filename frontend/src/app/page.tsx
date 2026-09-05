'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { ChatInput } from '@/components/ChatInput';
import { DocumentDrawer } from '@/components/DocumentDrawer';
import { MemoryModal } from '@/components/MemoryModal';
import { SplashScreen } from '@/components/SplashScreen';
import { getStoredUser } from '@/lib/auth';
import { apiClient, streamChatResponse } from '@/lib/api';
import { Conversation, Message, User, UserMemory } from '@/types';
import {
  getStoredMemories,
  addMemory,
  removeMemoryByText,
  clearAllMemories,
  detectMemoryIntent,
} from '@/lib/memory';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeModel, setActiveModel] = useState('qwen-2.5-0.5b-local');
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    initUserSession();
    setMemories(getStoredMemories());

    // Auto-adjust layout according to user device screen width (phones/tablets start minimized)
    const handleDeviceAutoAdjust = () => {
      const isNarrowDevice = window.innerWidth < 1024;
      setIsSidebarOpen(!isNarrowDevice);
    };

    handleDeviceAutoAdjust();
    window.addEventListener('resize', handleDeviceAutoAdjust);
    return () => window.removeEventListener('resize', handleDeviceAutoAdjust);
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
        setConversations((prev) => {
          if (prev.length > 0) return prev;
          const defaultConv: Conversation = {
            id: `conv_${Date.now()}`,
            title: 'New Chat',
            model: activeModel,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [],
          };
          setActiveConvId(defaultConv.id);
          return [defaultConv];
        });
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

  const handleSendMessage = async (
    text: string,
    attachedDocId?: string,
    attachedDocText?: string,
    attachedDocName?: string,
    attachedImage?: string,
    visionTask?: string
  ) => {
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
      image_url: attachedImage,
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

    // Process user memory directives (remember, recall, forget, clear)
    let currentMemories = getStoredMemories();
    const intent = detectMemoryIntent(text);

    if (intent.type === 'remember' && intent.fact) {
      const newMem = addMemory(intent.fact, intent.category);
      currentMemories = [newMem, ...currentMemories.filter((m) => m.id !== newMem.id)];
      setMemories(currentMemories);
    } else if (intent.type === 'forget' && intent.target) {
      const res = removeMemoryByText(intent.target);
      currentMemories = res.remaining;
      setMemories(currentMemories);
    } else if (intent.type === 'clear') {
      clearAllMemories();
      currentMemories = [];
      setMemories([]);
    }

    let accumulatedContent = '';

    await streamChatResponse(
      {
        conversation_id: currentId,
        message: text,
        model: attachedImage ? 'florence-2' : activeModel,
        document_ids: attachedDocId ? [attachedDocId] : undefined,
        document_text: attachedDocText,
        document_name: attachedDocName,
        image_url: attachedImage,
        vision_task: visionTask,
        memories: currentMemories,
      },
      (chunk) => {
        accumulatedContent += chunk;
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m))
        );
      },
      (err) => {
        setIsStreaming(false);
        // If backend is sleeping or unreachable, provide instant helpful local response
        const fallbackReply = `Hello! I received your message: "${text}". The backend container is currently initializing in the cloud. You can continue chatting, uploading documents, and exploring the interface.`;
        setActiveMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fallbackReply } : m
          )
        );
      },
      () => {
        setIsStreaming(false);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentId) {
              const currentMsgs: Message[] = [
                ...activeMessages,
                userMessage,
                {
                  id: assistantMessageId,
                  role: 'assistant' as const,
                  content: accumulatedContent,
                  created_at: new Date().toISOString(),
                },
              ];
              return { ...c, messages: currentMsgs };
            }
            return c;
          })
        );
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

  const [edgeTouchStartX, setEdgeTouchStartX] = useState<number | null>(null);

  const handleEdgeTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0].clientX < 50) {
      setEdgeTouchStartX(e.touches[0].clientX);
    }
  };

  const handleEdgeTouchEnd = (e: React.TouchEvent) => {
    if (edgeTouchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - edgeTouchStartX;
    if (deltaX > 40 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
    setEdgeTouchStartX(null);
  };

  return (
    <React.Fragment>
      {/* Splash Screen — shown on first load */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className={`flex h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#121214] ${!showSplash ? 'animate-app-reveal' : 'opacity-0'}`}>
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
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Workspace */}
      <div
        onTouchStart={handleEdgeTouchStart}
        onTouchEnd={handleEdgeTouchEnd}
        className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#121214]"
      >
        <Header
          user={user}
          activeModel={activeModel}
          onModelChange={setActiveModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onOpenSettings={() => (window.location.href = '/settings')}
          memoriesCount={memories.length}
          onOpenMemory={() => setIsMemoryModalOpen(true)}
          isSidebarOpen={isSidebarOpen}
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

        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          memories={memories}
          onMemoriesChange={setMemories}
        />
      </div>
    </div>
    </React.Fragment>
  );
}
