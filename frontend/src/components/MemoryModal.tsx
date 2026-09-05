'use client';

import React, { useState } from 'react';
import { Brain, X, Trash2, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { UserMemory } from '@/types';
import { addMemory, removeMemory, clearAllMemories } from '@/lib/memory';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: UserMemory[];
  onMemoriesChange: (memories: UserMemory[]) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onMemoriesChange,
}) => {
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newCategory, setNewCategory] = useState<'preference' | 'identity' | 'instruction' | 'general'>('general');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    const created = addMemory(newMemoryText.trim(), newCategory);
    onMemoriesChange([created, ...memories.filter((m) => m.id !== created.id)]);
    setNewMemoryText('');
  };

  const handleDelete = (id: string) => {
    const updated = removeMemory(id);
    onMemoriesChange(updated);
  };

  const handleClearAll = () => {
    clearAllMemories();
    onMemoriesChange([]);
    setConfirmClear(false);
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'identity':
        return <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">👤 Identity</span>;
      case 'preference':
        return <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">⭐ Preference</span>;
      case 'instruction':
        return <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">⚙️ Custom Rule</span>;
      default:
        return <span className="text-[10px] bg-zinc-500/20 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-500/30">📌 Note</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e1e24] border border-white/15 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#25252e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] flex items-center justify-center shadow-md">
              <Brain className="w-4 h-4 text-[#121214]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Memory</span>
                <span className="text-[11px] font-semibold text-[#d0bcff] bg-[#bb86fc]/20 px-2 py-0.5 rounded-full">
                  {memories.length} saved
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                ChatGPT remembers details you tell it across all conversations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Add New Memory Form */}
          <form onSubmit={handleAdd} className="space-y-2.5 bg-[#18181e] p-3.5 rounded-2xl border border-white/10">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#bb86fc]" />
              <span>Add something for ChatGPT to remember</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                placeholder="e.g. My name is Bharath, I prefer Python..."
                className="flex-1 bg-[#24242d] text-white text-xs px-3 py-2 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc] placeholder:text-zinc-500"
              />

              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="bg-[#24242d] text-zinc-300 text-xs px-2.5 py-2 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc]"
              >
                <option value="general">General</option>
                <option value="identity">Identity</option>
                <option value="preference">Preference</option>
                <option value="instruction">Instruction</option>
              </select>

              <button
                type="submit"
                disabled={!newMemoryText.trim()}
                className="px-3 py-2 bg-[#7c4dff] hover:bg-[#9266ff] disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer shadow"
              >
                Add
              </button>
            </div>
          </form>

          {/* Stored Memories List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Saved Details
            </h3>

            {memories.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-2xl bg-[#18181e]/50 space-y-2">
                <Brain className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No memories saved yet.</p>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  Say <code className="text-[#bb86fc] bg-white/5 px-1 rounded">&quot;Remember that my name is...&quot;</code> in any chat to teach ChatGPT!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="flex items-start justify-between gap-3 p-3 bg-[#18181e] hover:bg-[#22222a] border border-white/10 rounded-2xl transition group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(mem.category)}
                        <span className="text-[10px] text-zinc-500">
                          {new Date(mem.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 break-words leading-relaxed">
                        {mem.content}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 opacity-70 group-hover:opacity-100"
                      title="Delete this memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#18181e] flex items-center justify-between">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400">Clear all memories?</span>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded-lg transition"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={memories.length === 0}
              className="text-xs text-zinc-400 hover:text-rose-400 disabled:opacity-30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all memories</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2b2b36] hover:bg-[#383846] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
