import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Genie AI — Your Intelligent Assistant',
  description: 'Genie AI — Chat with local & cloud LLMs, analyze documents with RAG, and store long-term memories.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Sign-In for Web (GSI) — loads the real Google OAuth SDK */}
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className="bg-[#121214] text-[#f3f3f6] min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
