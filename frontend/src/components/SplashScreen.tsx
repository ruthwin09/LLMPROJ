'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'show' | 'fadeout'>('show');

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 2200);
    const doneTimer = setTimeout(() => onFinish(), 2900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0c10] select-none transition-opacity duration-700 ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#7c4dff]/20 blur-[100px] pointer-events-none" />
      <div className="absolute w-48 h-48 rounded-full bg-[#bb86fc]/15 blur-[60px] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 splash-logo-enter">
        {/* Borderless Logo in glowing ambient field */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] blur-[36px] opacity-60 animate-pulse-ring scale-125 pointer-events-none" />
          <div className="relative w-28 h-28 flex items-center justify-center">
            <Image
              src="/genie-logo.png"
              alt="Genie AI"
              width={112}
              height={112}
              className="object-contain w-full h-full drop-shadow-[0_0_28px_rgba(187,134,252,0.6)]"
              priority
            />
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-white">GENIE</span>
            <span className="text-4xl font-light tracking-widest text-[#bb86fc]">AI</span>
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-zinc-400 font-medium">
            Your Intelligent Assistant
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#bb86fc] splash-dot" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#bb86fc] splash-dot" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#bb86fc] splash-dot" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
};
