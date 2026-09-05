'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Bot, User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { setStoredAuth } from '@/lib/auth';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      });
      setStoredAuth(res.data.access_token, res.data.user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] text-[#f3f3f6] flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden">
      <div className="ambient-glow-purple w-[600px] h-[600px] -top-32 -right-32 opacity-40" />

      <div className="w-full max-w-md relative z-10 my-auto">
        <div className="bg-[#1e1e24] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-1">
              <div className="absolute inset-0 rounded-full bg-[#7c4dff]/30 blur-[14px]" />
              <Image
                src="/genie-logo.png"
                alt="Genie AI"
                width={56}
                height={56}
                className="relative object-contain w-14 h-14 drop-shadow-[0_0_12px_rgba(187,134,252,0.5)]"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Genie <span className="text-[#bb86fc] font-light">AI</span> Account</h1>
            <p className="text-xs text-zinc-400">Get started with your AI assistant in seconds</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Google Sign Up */}
          <GoogleAuthButton
            buttonText="Sign up with Google"
            onError={(err) => setError(err)}
          />

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#1e1e24] px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider shrink-0">
              Or register with email
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full bg-[#18181e] text-white text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc] transition placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <a href="/login" className="text-[#bb86fc] hover:underline font-semibold">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
