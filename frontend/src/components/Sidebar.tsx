'use client';

import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Edit2, Check, X, FileText } from 'lucide-react';
import { Conversation } from '@/types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onOpenDocuments: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  isOpen,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  onOpenDocuments,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filteredConversations = safeConversations.filter((c) =>
    c && c.title ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : false
  );

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
      className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#171717] border-r border-white/10 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top New Chat Button */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <button
          onClick={onNewChat}
          className="flex items-center justify-between w-full p-2.5 bg-[#212121] hover:bg-[#2f2f2f] border border-white/15 rounded-lg text-sm font-medium text-white transition"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] text-zinc-400 border border-white/10 px-1.5 py-0.5 rounded">Ctrl+K</span>
        </button>

        {/* Search Conversations */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#212121] text-xs text-white placeholder-zinc-500 pl-8 pr-3 py-2 rounded-lg border border-white/10 outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
          Recent Conversations
        </div>

        {filteredConversations.length === 0 ? (
          <div className="text-xs text-zinc-500 text-center py-6">No conversations found</div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isEditing = conv.id === editingId;

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition ${
                  isActive ? 'bg-[#212121] text-white font-medium border border-white/10' : 'text-zinc-400 hover:bg-[#212121] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#2f2f2f] text-white text-xs px-1.5 py-0.5 rounded border border-emerald-500 outline-none w-full"
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {isEditing ? (
                    <>
                      <button onClick={(e) => saveRename(conv.id, e)} className="p-1 hover:text-emerald-400 text-zinc-400">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 hover:text-rose-400 text-zinc-400">
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => startRename(conv, e)} className="p-1 hover:text-zinc-200 text-zinc-500" title="Rename">
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
            );
          })
        )}
      </div>

      {/* RAG Documents Drawer Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onOpenDocuments}
          className="flex items-center justify-between w-full p-2 bg-[#212121] hover:bg-[#2f2f2f] border border-white/10 rounded-lg text-xs font-medium text-zinc-300 transition"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Document Manager (RAG)</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">PDF/DOCX</span>
        </button>
      </div>
    </aside>
  );
};
