'use client';

import React, { useState } from 'react';
import { Bot, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { setStoredAuth } from '@/lib/auth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      setStoredAuth(res.data.access_token, res.data.user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171717] p-4">
      <div className="w-full max-w-md bg-[#212121] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-2">
            <Bot className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-xs text-zinc-400">Get started with ChatGPT AI Platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#2f2f2f] text-white text-sm pl-9 pr-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-[#2f2f2f] text-white text-sm pl-9 pr-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#2f2f2f] text-white text-sm pl-9 pr-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 pt-2">
          Already have an account?{' '}
          <a href="/login" className="text-emerald-400 hover:underline font-semibold">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
