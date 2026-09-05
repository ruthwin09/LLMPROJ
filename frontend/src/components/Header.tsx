'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Menu,
  Bell,
  Share2,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  Sparkles,
  Brain,
  PanelLeftOpen,
  PanelLeftClose,
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
  memoriesCount?: number;
  onOpenMemory?: () => void;
  isSidebarOpen?: boolean;
}

const MODELS = [
  { id: 'qwen-2.5-0.5b-local', name: '⚡ Qwen 2.5 0.5B (100% Free & Keyless)' },
  { id: 'qwen-2.5-1.5b-local', name: '🧠 Qwen 2.5 1.5B (Keyless Deep Reasoning)' },
  { id: 'llama-3.3-70b-versatile', name: '☁️ Llama 3.3 70B (Groq Cloud)' },
  { id: 'gemini-1.5-flash', name: '☁️ Google Gemini 1.5 Flash' },
  { id: 'gpt-4o-mini', name: '☁️ OpenAI GPT-4o Mini' },
  { id: 'deepseek-r1', name: '☁️ DeepSeek R1' },
];

export const Header: React.FC<HeaderProps> = ({
  user,
  activeModel,
  onModelChange,
  onToggleSidebar,
  onNewChat,
  onOpenSettings,
  memoriesCount,
  onOpenMemory,
  isSidebarOpen = true,
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Sidebar Button — only shows PanelLeftOpen when minimized on desktop, avoids duplicate [<] */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95 ${
            isSidebarOpen
              ? 'text-zinc-400 hover:text-white hover:bg-white/10 md:hidden'
              : 'text-[#bb86fc] bg-[#bb86fc]/15 hover:bg-[#bb86fc]/25 ring-1 ring-[#bb86fc]/40 shadow-md shadow-purple-950/40'
          }`}
          title={isSidebarOpen ? 'Minimize Sidebar (touch to collapse)' : 'Maximize Sidebar (touch to expand)'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>


        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onNewChat}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#7c4dff]/25 blur-[6px] group-hover:bg-[#bb86fc]/40 transition" />
            <Image
              src="/genie-logo.png"
              alt="Genie AI"
              width={32}
              height={32}
              className="relative object-contain w-8 h-8 drop-shadow-[0_0_8px_rgba(187,134,252,0.45)] group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            Genie <span className="text-[#bb86fc] font-light">AI</span>
          </span>
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
            alert('Genie AI link copied to clipboard!');
          }}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition hidden sm:flex items-center justify-center"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Memory Button */}
        {onOpenMemory && (
          <button
            onClick={onOpenMemory}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#24242d] hover:bg-[#2e2e3a] border border-white/10 hover:border-[#bb86fc]/50 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
            title="Manage Memory (ChatGPT remembers details you tell it)"
          >
            <Brain className="w-3.5 h-3.5 text-[#bb86fc]" />
            <span className="hidden sm:inline font-medium">Memory</span>
            {memoriesCount !== undefined && memoriesCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-[#bb86fc]/20 text-[#d0bcff] text-[10px] font-bold flex items-center justify-center">
                {memoriesCount}
              </span>
            )}
          </button>
        )}

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
            className="flex items-center gap-2 text-xs bg-white text-zinc-900 hover:bg-zinc-100 font-medium px-3 py-1.5 rounded-full transition shadow-md shadow-black/40 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="font-semibold text-xs text-zinc-900">Sign in with Google</span>
          </a>
        )}
      </div>
    </header>
  );
};
