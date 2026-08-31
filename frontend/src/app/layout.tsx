import './globals.css';
import React from 'react';

export const metadata = {
  title: 'ChatGPT AI Platform',
  description: 'Deployable multi-user ChatGPT AI web platform with hosted LLM endpoints, RAG document QA, and persistent chats.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#212121] text-slate-100 min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
