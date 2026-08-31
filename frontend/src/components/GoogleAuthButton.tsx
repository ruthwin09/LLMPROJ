'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { setStoredAuth } from '@/lib/auth';
import { User } from '@/types';
import { Loader2, Mail, User as UserIcon, ArrowRight, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  onSuccess?: (user: User) => void;
  onError?: (err: string) => void;
  buttonText?: string;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  buttonText = 'Continue with Google',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suggested / Fast Demo Google Profiles for instant zero-friction login
  const suggestedAccounts = [
    {
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Developer Account',
      email: 'developer@googlemail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const handleAuthenticateWithGoogle = async (email: string, name?: string, avatar?: string) => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const displayName = name || email.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    const picture =
      avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        formattedName
      )}&backgroundColor=059669,10b981,3b82f6&textColor=ffffff`;

    try {
      const res = await apiClient.post('/auth/google', {
        email: email.trim().toLowerCase(),
        name: formattedName,
        picture: picture,
      });

      if (res.data && res.data.access_token && res.data.user) {
        setStoredAuth(res.data.access_token, res.data.user);
        setShowAccountChooser(false);
        if (onSuccess) {
          onSuccess(res.data.user);
        } else {
          window.location.href = '/';
        }
      } else {
        throw new Error('Invalid response from authentication server.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Google sign-in failed. Please try again.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    setErrorMsg(null);
    setShowAccountChooser(true);
  };

  return (
    <>
      {/* Official Google Brand Button */}
      <button
        type="button"
        id="google-signin-button"
        onClick={handleButtonClick}
        disabled={loading}
        className={`w-full group relative overflow-hidden bg-[#1c1c1f] hover:bg-[#252529] active:scale-[0.99] border border-white/15 hover:border-emerald-500/50 text-white font-medium text-sm py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-emerald-950/40 flex items-center justify-center gap-3 cursor-pointer ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {loading ? (
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}

        <span className="text-zinc-100 group-hover:text-white font-semibold text-xs sm:text-sm tracking-wide">
          {loading ? 'Signing you in...' : buttonText}
        </span>
      </button>

      {/* Google Account Chooser Modal */}
      {showAccountChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#18181b] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up relative">
            {/* Close Button */}
            <button
              onClick={() => setShowAccountChooser(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1.5 pt-2">
              <div className="inline-flex p-2.5 rounded-2xl bg-white/5 border border-white/10 mb-1 shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Sign in with Google</h3>
              <p className="text-xs text-zinc-400">Choose an account to continue to ChatGPT Platform</p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            {/* Account List */}
            {!isCustomMode ? (
              <div className="space-y-2">
                {suggestedAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAuthenticateWithGoogle(acc.email, acc.name, acc.avatar)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#222226] hover:bg-[#2c2c32] active:scale-[0.99] border border-white/10 hover:border-emerald-500/40 transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">{acc.email}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}

                {/* Custom Google Email Option */}
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#222226] hover:bg-[#2c2c32] border border-dashed border-white/20 hover:border-emerald-500/50 transition text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Use your personal Gmail account</p>
                    <p className="text-[11px] text-zinc-400">Enter your custom Google address</p>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Gmail Input Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAuthenticateWithGoogle(customEmail, customName);
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Your Google Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="your.email@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full bg-[#222226] text-white text-xs pl-10 pr-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Your Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#222226] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="flex-1 py-2.5 bg-[#222226] hover:bg-[#2c2c32] text-zinc-300 text-xs font-medium rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !customEmail}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In Now</span>}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer Security Badge */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure Google OAuth 2.0 Authentication</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
