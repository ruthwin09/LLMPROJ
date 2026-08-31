'use client';

import React from 'react';
import { Menu, Bot, User as UserIcon, LogOut, Settings, Plus } from 'lucide-react';
import { User } from '@/types';
import { clearStoredAuth } from '@/lib/auth';

interface HeaderProps {
  user: User | null;
  activeModel: string;
  onModelChange: (model: string) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const MODELS = [
  { id: 'qwen-2.5-0.5b-local', name: '⚡ Qwen 2.5 0.5B — Local (No API Key)' },
  { id: 'qwen-2.5-1.5b-local', name: '🧠 Qwen 2.5 1.5B — Local (No API Key)' },
  { id: 'llama-3.3-70b-versatile', name: '☁️ Llama 3.3 70B (Groq API Key)' },
  { id: 'gpt-4o-mini', name: '☁️ OpenAI GPT-4o Mini (API Key)' },
  { id: 'gemini-1.5-flash', name: '☁️ Gemini 1.5 Flash (API Key)' },
  { id: 'deepseek-r1', name: '☁️ DeepSeek R1 (OpenRouter API Key)' },
];

export const Header: React.FC<HeaderProps> = ({
  user,
  activeModel,
  onModelChange,
  onToggleSidebar,
  onNewChat,
  onOpenSettings,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#171717]/80 backdrop-blur border-b border-white/10 text-white sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition text-zinc-300 md:hidden"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 font-bold text-lg">
          <Bot className="w-6 h-6 text-emerald-400" />
          <span>ChatGPT Platform</span>
        </div>

        {/* Model Selector Dropdown */}
        <select
          value={activeModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-[#2f2f2f] text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 text-emerald-400 outline-none cursor-pointer hover:border-emerald-500/50 transition"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-[#171717] text-white">
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-white/10 text-zinc-300 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-[#2f2f2f] px-2.5 py-1 rounded-full border border-white/10">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200 truncate max-w-[100px]">
                {user.full_name || user.email}
              </span>
            </div>

            <button
              onClick={() => {
                clearStoredAuth();
                window.location.reload();
              }}
              className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="text-xs bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-white/10 text-white font-medium px-3 py-1.5 rounded-lg transition"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );
};
