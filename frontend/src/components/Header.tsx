'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bot,
  Bell,
  Share2,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User } from '@/types';
import { clearStoredAuth, getUserInitials } from '@/lib/auth';

interface HeaderProps {
  user: User | null;
  activeModel: string;
  onModelChange: (model: string) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const MODELS = [
  { id: 'qwen-2.5-0.5b-local', name: '⚡ Qwen 2.5 0.5B (Fast & Local)' },
  { id: 'qwen-2.5-1.5b-local', name: '🧠 Qwen 2.5 1.5B (Deep Reasoning)' },
  { id: 'llama-3.3-70b-versatile', name: '☁️ Llama 3.3 70B (Groq Cloud)' },
  { id: 'gpt-4o-mini', name: '☁️ OpenAI GPT-4o Mini' },
  { id: 'gemini-1.5-flash', name: '☁️ Google Gemini 1.5 Flash' },
  { id: 'deepseek-r1', name: '☁️ DeepSeek R1' },
];

export const Header: React.FC<HeaderProps> = ({
  user,
  activeModel,
  onModelChange,
  onToggleSidebar,
  onNewChat,
  onOpenSettings,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    window.location.href = '/login';
  };

  const isGuest = !user || user.auth_provider === 'guest' || user.email.startsWith('guest');

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-[#18181e]/95 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-30 select-none">
      {/* Left: Menu Toggle + ChatGPT Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={onNewChat}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] flex items-center justify-center shadow-md shadow-purple-950/60">
            <Bot className="w-4 h-4 text-[#121214]" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">ChatGPT</span>
        </div>

        {/* Model Selector Pill */}
        <div className="relative hidden sm:block">
          <select
            value={activeModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-[#24242d] text-xs font-semibold pl-3 pr-7 py-1.5 rounded-full border border-white/10 text-[#d0bcff] outline-none cursor-pointer hover:border-[#bb86fc]/50 transition appearance-none"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#18181e] text-white">
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-[#bb86fc] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Right: Icons from Reference Image (Search, Notification, Share, Profile) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {}}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition hidden md:flex items-center justify-center"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={() => {}}
          className="p-2 rounded-full text-zinc-400 hover:text-[#bb86fc] hover:bg-white/10 transition flex items-center justify-center relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#bb86fc] absolute top-1.5 right-1.5 ring-2 ring-[#18181e]" />
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('ChatGPT link copied to clipboard!');
          }}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition hidden sm:flex items-center justify-center"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {user && !isGuest ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-[#24242d] hover:bg-[#2e2e3a] px-2.5 py-1 rounded-full border border-white/10 hover:border-[#bb86fc]/40 transition cursor-pointer"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-[#bb86fc]"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#7c4dff] text-[10px] font-bold text-white flex items-center justify-center">
                  {getUserInitials(user.full_name, user.email)}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-200 truncate max-w-[100px] hidden md:inline">
                {user.full_name || user.email}
              </span>
              <ChevronDown className="w-3 h-3 text-[#bb86fc]" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#202028] border border-white/15 rounded-2xl p-3 shadow-2xl space-y-3 z-50 animate-fade-in">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-[#bb86fc]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#7c4dff] text-sm font-bold text-white flex items-center justify-center">
                      {getUserInitials(user.full_name, user.email)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.full_name || 'User'}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#bb86fc] bg-[#bb86fc]/10 px-2 py-0.5 rounded-full border border-[#bb86fc]/20 mt-1">
                      Google Account
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Settings & API Keys</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/login"
            className="flex items-center gap-1.5 text-xs bg-[#7c4dff] hover:bg-[#9266ff] text-white font-semibold px-3 py-1.5 rounded-full transition shadow-md shadow-purple-950/50"
          >
            <span>Sign In</span>
          </a>
        )}
      </div>
    </header>
  );
};
