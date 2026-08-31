'use client';

import React, { useState } from 'react';
import { Bot, LogIn, Lock, Mail, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { setStoredAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Simulated Google OAuth login flow
    const googleUser = {
      credential: 'google_token_simulated',
      email: email || 'user@google.com',
      name: 'Google User',
    };
    apiClient
      .post('/auth/google', googleUser)
      .then((res) => {
        setStoredAuth(res.data.access_token, res.data.user);
        window.location.href = '/';
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Google sign-in failed.');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171717] p-4">
      <div className="w-full max-w-md bg-[#212121] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-2">
            <Bot className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-xs text-zinc-400">Sign in to your ChatGPT AI Platform account</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/10 w-full"></div>
          <span className="bg-[#212121] px-3 text-[11px] text-zinc-500 uppercase font-semibold">Or continue with</span>
          <div className="border-t border-white/10 w-full"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white font-medium text-xs py-2.5 rounded-xl border border-white/10 transition flex items-center justify-center gap-2"
        >
          <span className="font-bold text-emerald-400">G</span>
          <span>Sign in with Google</span>
        </button>

        <div className="text-center text-xs text-zinc-400 pt-2">
          Don't have an account?{' '}
          <a href="/register" className="text-emerald-400 hover:underline font-semibold">
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}
