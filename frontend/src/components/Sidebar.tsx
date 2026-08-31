'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Heart,
  MoreHorizontal,
  Bot,
  Settings,
  Shield,
} from 'lucide-react';
import { Conversation, User } from '@/types';
import { getUserInitials } from '@/lib/auth';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  user: User | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onOpenDocuments: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  isOpen,
  user,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  onOpenDocuments,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filteredConversations = safeConversations.filter((c) =>
    c && c.title ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : false
  );

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#18181e] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header + New Chat FAB */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-[#121214]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">ChatGPT</h2>
                <p className="text-[10px] text-zinc-400">AI Platform</p>
              </div>
            </div>

            {/* Floating Action Button (FAB) from Reference Image */}
            <button
              onClick={onNewChat}
              className="w-9 h-9 rounded-full fab-purple flex items-center justify-center text-xl font-bold cursor-pointer"
              title="New Chat"
            >
              +
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#24242d] text-xs text-white placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc]/60 transition"
            />
          </div>
        </div>

        {/* Conversations List with Subtitles & Hearts */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-zinc-500">{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-xs text-zinc-500 text-center py-8">No chats found</div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = conv.id === editingId;
              const isFav = favorites[conv.id];

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`group flex items-center justify-between p-3 rounded-2xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-[#282834] text-white font-medium border border-[#bb86fc]/40 shadow-lg shadow-black/40'
                      : 'text-zinc-300 hover:bg-[#202028] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="truncate flex-1 min-w-0 pr-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#18181e] text-white text-xs px-2 py-1 rounded-lg border border-[#bb86fc] outline-none w-full"
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-zinc-100">{conv.title}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {conv.messages && conv.messages.length > 0
                            ? conv.messages[conv.messages.length - 1].content.slice(0, 30) + '...'
                            : 'AI consultation thread'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions & Heart Icon */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleFavorite(conv.id, e)}
                      className={`p-1 rounded-full transition ${
                        isFav
                          ? 'text-[#bb86fc] fill-[#bb86fc]'
                          : 'text-zinc-600 hover:text-[#bb86fc]'
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#bb86fc]' : ''}`} />
                    </button>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                      {isEditing ? (
                        <>
                          <button
                            onClick={(e) => saveRename(conv.id, e)}
                            className="p-1 hover:text-[#bb86fc] text-zinc-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="p-1 hover:text-rose-400 text-zinc-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => startRename(conv, e)}
                            className="p-1 hover:text-[#bb86fc] text-zinc-500"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(conv.id);
                            }}
                            className="p-1 hover:text-rose-400 text-zinc-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="p-3 border-t border-white/10 space-y-2 bg-[#141418]">
        <button
          onClick={onOpenDocuments}
          className="flex items-center justify-between w-full p-2.5 bg-[#202028] hover:bg-[#282834] border border-white/10 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#bb86fc]" />
            <span>Document Manager</span>
          </div>
          <span className="text-[10px] bg-[#bb86fc]/20 text-[#d0bcff] font-semibold px-2 py-0.5 rounded-full">
            RAG
          </span>
        </button>

        {/* User Card */}
        <div
          onClick={onOpenSettings}
          className="flex items-center justify-between p-2 rounded-xl bg-[#202028] hover:bg-[#282834] border border-white/10 cursor-pointer transition"
        >
          <div className="flex items-center gap-2.5 truncate">
            {user && user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="User"
                className="w-7 h-7 rounded-full object-cover border border-[#bb86fc]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#7c4dff] text-white flex items-center justify-center text-[10px] font-bold">
                {getUserInitials(user?.full_name, user?.email)}
              </div>
            )}
            <span className="text-xs font-semibold text-white truncate max-w-[130px]">
              {user?.full_name || 'ChatGPT User'}
            </span>
          </div>
          <Settings className="w-4 h-4 text-zinc-400 hover:text-[#bb86fc] transition" />
        </div>
      </div>
    </aside>
  );
};
