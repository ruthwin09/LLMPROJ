'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Key, User, Bot, CheckCircle } from 'lucide-react';
import { getStoredUser, setStoredAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [preferredModel, setPreferredModel] = useState('llama-3.3-70b-versatile');
  const [userApiKey, setUserApiKey] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setFullName(user.full_name || '');
      setPreferredModel(user.preferred_model || 'llama-3.3-70b-versatile');
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await apiClient.put('/settings/profile', {
        full_name: fullName,
        preferred_model: preferredModel,
        user_api_key: userApiKey || undefined,
      });

      const updatedUser = res.data.user;
      const currentToken = localStorage.getItem('chatgpt_access_token');
      if (currentToken) {
        setStoredAuth(currentToken, updatedUser);
      }

      setMessage('Settings updated successfully!');
    } catch {
      setMessage('Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] text-white p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <a href="/" className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-bold text-white">User Settings & Preferences</h1>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Info */}
        <div className="bg-[#212121] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <User className="w-4 h-4" />
            <span>Profile Information</span>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#2f2f2f] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* Model Preference */}
        <div className="bg-[#212121] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Bot className="w-4 h-4" />
            <span>Default Hosted LLM Model</span>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1">Model Choice</label>
            <select
              value={preferredModel}
              onChange={(e) => setPreferredModel(e.target.value)}
              className="w-full bg-[#2f2f2f] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/60"
            >
              <optgroup label="⚡ Local Models (No API Key Required)">
                <option value="qwen-2.5-0.5b-local">Qwen 2.5 0.5B — Fast, Keyless, Runs Locally</option>
                <option value="qwen-2.5-1.5b-local">Qwen 2.5 1.5B — Smarter, Keyless, Runs Locally</option>
              </optgroup>
              <optgroup label="☁️ Cloud Models (API Key Required)">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq — Free API Key)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                <option value="deepseek-r1">DeepSeek R1 (OpenRouter)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* User API Key (Optional Override) */}
        <div className="bg-[#212121] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Key className="w-4 h-4" />
            <span>Custom Provider API Key (Optional)</span>
          </div>
          <p className="text-xs text-zinc-400">
            Optionally provide your own API Key (Groq, OpenAI, or OpenRouter) to bypass default quota limits.
          </p>

          <div>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="gsk_... or sk-..."
              className="w-full bg-[#2f2f2f] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/60 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </form>
    </div>
  );
}
