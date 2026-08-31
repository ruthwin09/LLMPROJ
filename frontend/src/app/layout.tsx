import './globals.css';
import React from 'react';

export const metadata = {
  title: 'ChatGPT — AI Platform',
  description: 'ChatGPT AI web platform with local LLMs, document RAG analysis, and multi-turn conversations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#121214] text-[#f3f3f6] min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
