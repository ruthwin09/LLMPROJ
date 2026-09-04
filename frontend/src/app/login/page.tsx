'use client';

import React, { useState } from 'react';
import { Bot, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, Zap, FileText, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { setStoredAuth } from '@/lib/auth';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStoredAuth(res.data.access_token, res.data.user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setGuestLoading(true);
    try {
      const res = await apiClient.post('/auth/guest');
      if (res.data && res.data.access_token && res.data.user) {
        setStoredAuth(res.data.access_token, res.data.user);
        window.location.href = '/';
        return;
      }
      throw new Error('Fallback to local guest');
    } catch {
      // Seamless fallback: Create instant guest session locally so user is never blocked
      const localGuest: any = {
        id: `guest_${Date.now()}`,
        email: 'guest@chatgpt.platform',
        full_name: 'Guest User',
        preferred_model: 'qwen-2.5-0.5b-local',
        auth_provider: 'guest',
      };
      setStoredAuth(`mock_token_${Date.now()}`, localGuest);
      window.location.href = '/';
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] text-[#f3f3f6] flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden">
      {/* Ambient Purple Glow */}
      <div className="ambient-glow-purple w-[600px] h-[600px] -top-32 -left-32 opacity-40" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-auto">
        {/* Left Side: Brand Highlights */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bb86fc]/15 border border-[#bb86fc]/30 text-[#d0bcff] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen AI Platform</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Intelligence at your fingertips.
            </h1>

            <p className="text-zinc-400 text-sm leading-relaxed">
              Experience fast local models, document RAG knowledge QA, and deep multi-turn chat with Google single sign-on.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <span>Zero-latency streaming generation</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span>Upload PDF, Word & text for grounded Q&A</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Isolated private sessions & data privacy</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-zinc-500">
            <CheckCircle2 className="w-4 h-4 text-[#bb86fc]" />
            <span>Google Single Sign-On Ready</span>
          </div>
        </div>

        {/* Right Side: Material Dark Card */}
        <div className="lg:col-span-7 w-full max-w-md mx-auto">
          <div className="bg-[#1e1e24] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top Emblem & Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] mb-1 shadow-lg shadow-purple-950/50">
                <Bot className="w-7 h-7 text-[#121214]" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to ChatGPT</h2>
              <p className="text-xs text-zinc-400">Sign in with your Google account or email</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center animate-fade-in">
                {error}
              </div>
            )}

            {/* Google Authentication */}
            <GoogleAuthButton
              buttonText="Continue with Google"
              onError={(err) => setError(err)}
            />

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#1e1e24] px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider shrink-0">
                Or sign in with email
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#18181e] text-white text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc] transition placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#18181e] text-white text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc] transition placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-[#bb86fc] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#bb86fc] hover:bg-[#d0bcff] active:scale-[0.99] text-[#121214] font-bold text-xs sm:text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Guest / Register */}
            <div className="pt-2 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="text-xs text-zinc-400 hover:text-[#bb86fc] transition underline underline-offset-4"
              >
                {guestLoading ? 'Starting session...' : '⚡ Try Instant Guest Mode'}
              </button>

              <div className="text-center text-xs text-zinc-400">
                Don't have an account?{' '}
                <a href="/register" className="text-[#bb86fc] hover:underline font-semibold">
                  Create account
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
