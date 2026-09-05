'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';

interface SanaImageCardProps {
  src: string;
  alt?: string;
}

const GENERATION_STEPS = [
  'Initializing SANA 1.6B Linear Diffusion Transformer...',
  'Encoding prompt via DeepSeek-VL multi-scale encoder...',
  'Denoising 1024×1024 high-resolution latent space...',
  'Applying linear attention cross-conditioning...',
  'Upscaling and rendering final photorealistic details...',
];

export const SanaImageCard: React.FC<SanaImageCardProps> = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(12);
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  // Smoothly increment progress and cycle steps while waiting for image bytes
  useEffect(() => {
    if (!loading) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const inc = Math.max(1, Math.floor((95 - prev) / 8));
        return Math.min(95, prev + inc);
      });
    }, 800);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
    }, 2800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [loading]);

  const handleImageLoaded = () => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
    }, 250);
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setProgress(15);
    // Add or update timestamp to bypass browser cache
    const separator = src.includes('?') ? '&' : '?';
    setImgSrc(`${src}${separator}_t=${Date.now()}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(imgSrc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promptText = alt || 'SANA 1.6B Synthesis';

  return (
    <div className="my-4 rounded-3xl overflow-hidden border border-white/15 bg-[#16161b] shadow-2xl group max-w-lg w-full relative">
      {/* ─── 1. LOADING SCREEN ─── */}
      {loading && (
        <div className="w-full min-h-[340px] sm:min-h-[380px] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-[#1b1b24] to-[#121216] select-none">
          {/* Ambient Purple Glow */}
          <div className="absolute w-64 h-64 rounded-full bg-[#7c4dff]/25 blur-[70px] pointer-events-none" />
          <div className="absolute w-44 h-44 rounded-full bg-[#bb86fc]/20 blur-[50px] pointer-events-none" />

          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-sana-shimmer pointer-events-none" />

          {/* Glowing Animated Icon */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] blur-[18px] opacity-60 animate-pulse-ring" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#20202a] border border-[#bb86fc]/40 flex items-center justify-center shadow-xl">
              <Palette className="w-8 h-8 text-[#d0bcff] animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#bb86fc] flex items-center justify-center text-[#121214] shadow-md">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          {/* Model Title */}
          <div className="space-y-1 mb-4 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#bb86fc]/15 border border-[#bb86fc]/30 text-[#d0bcff] text-[11px] font-bold tracking-wider uppercase">
              <Zap className="w-3 h-3 text-[#bb86fc]" />
              <span>SANA 1.6B Diffusion</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Synthesizing 1024×1024 Artwork
            </h4>
          </div>

          {/* Live Progress Bar */}
          <div className="w-full max-w-xs space-y-1.5 mb-4 z-10">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span className="text-zinc-300">Diffusion Progress</span>
              <span className="text-[#bb86fc] font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-[#22222d] rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7c4dff] via-[#bb86fc] to-[#d0bcff] transition-all duration-500 shadow-md shadow-purple-900/50"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Step Status */}
          <div className="min-h-[32px] flex items-center justify-center text-xs text-[#d0bcff] px-4 font-medium z-10">
            <span className="w-2 h-2 rounded-full bg-[#bb86fc] animate-ping mr-2 shrink-0" />
            <span className="animate-fade-in">{GENERATION_STEPS[stepIndex]}</span>
          </div>

          {/* Prompt Preview */}
          {promptText && (
            <div className="mt-4 px-4 py-2 rounded-xl bg-black/40 border border-white/10 max-w-xs text-[11px] text-zinc-400 italic truncate z-10">
              &quot;{promptText}&quot;
            </div>
          )}
        </div>
      )}

      {/* ─── 2. ERROR STATE ─── */}
      {error && !loading && (
        <div className="w-full min-h-[260px] p-6 flex flex-col items-center justify-center text-center space-y-3 bg-[#18181e]">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-white">Image Generation Timed Out</h5>
            <p className="text-xs text-zinc-400 max-w-xs">
              The high-res diffusion server is busy. Click retry to regenerate your image with a fresh seed.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7c4dff] hover:bg-[#9266ff] text-white text-xs font-semibold transition active:scale-95 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry SANA 1.6B</span>
          </button>
        </div>
      )}

      {/* ─── 3. THE ACTUAL IMAGE (Preloaded in background, revealed when loaded) ─── */}
      <div className={`relative overflow-hidden bg-black/50 ${loading || error ? 'hidden' : 'block'}`}>
        <img
          src={imgSrc}
          alt={promptText}
          onLoad={handleImageLoaded}
          onError={handleImageError}
          className="w-full h-auto object-cover rounded-t-3xl transition-transform duration-500 group-hover:scale-[1.01]"
        />
      </div>

      {/* ─── 4. BOTTOM ACTION TOOLBAR (Visible after completion) ─── */}
      {!loading && !error && (
        <div className="p-3.5 bg-[#18181e]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-zinc-300 truncate font-medium">
            <Palette className="w-3.5 h-3.5 text-[#bb86fc] shrink-0" />
            <span className="truncate max-w-[220px] text-white">{promptText}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
              title="Copy image URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#bb86fc]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={imgSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#bb86fc]/20 hover:bg-[#bb86fc]/30 text-[#d0bcff] hover:text-white font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Open full resolution in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full HD</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
