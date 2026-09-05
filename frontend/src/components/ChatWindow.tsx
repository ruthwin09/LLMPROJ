'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import {
  Bot,
  User as UserIcon,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  FileText,
  Sparkles,
  Edit3,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  Brain,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { Message } from '@/types';
import { CodeBlock } from './CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate: () => void;
  onEditUserMessage: (index: number, newText: string) => void;
  onSelectStarterCard: (prompt: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  onRegenerate,
  onEditUserMessage,
  onSelectStarterCard,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMsgIndex, setEditingMsgIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [feedbackState, setFeedbackState] = useState<Record<string, 'upvote' | 'downvote'>>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'upvote' | 'downvote') => {
    setFeedbackState((prev) => ({ ...prev, [id]: type }));
  };

  // Welcoming State when no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 text-center max-w-3xl mx-auto w-full select-none animate-fade-in">
        {/* Genie AI Logo — borderless on dark bg */}
        <div className="relative mb-4 sm:mb-5 shrink-0">
          {/* Ambient radial glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7c4dff]/30 to-[#bb86fc]/20 blur-[32px] scale-125 pointer-events-none" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <Image
              src="/genie-logo.png"
              alt="Genie AI"
              width={112}
              height={112}
              className="object-contain w-full h-full drop-shadow-[0_0_24px_rgba(187,134,252,0.45)] hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-0.5 shrink-0">
          Hi, I&apos;m <span className="text-[#bb86fc]">Genie AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6 max-w-lg leading-relaxed shrink-0">
          Chat with local &amp; cloud models, summarize documents with RAG, and write clean code with instant streaming responses.
        </p>

        {/* Status Chips */}
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 flex-wrap shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#282834] text-xs font-semibold text-zinc-200 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Local &amp; Cloud LLMs</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bb86fc]/20 text-xs font-semibold text-[#d0bcff] border border-[#bb86fc]/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#bb86fc]" />
            <span>RAG Document Analysis</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#282834] text-xs font-semibold text-zinc-200 border border-white/10">
            <Brain className="w-3.5 h-3.5 text-[#bb86fc]" />
            <span>🧠 Long-Term Memory</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bb86fc]/20 text-xs font-semibold text-[#d0bcff] border border-[#bb86fc]/40">
            <Palette className="w-3.5 h-3.5 text-[#bb86fc]" />
            <span>🎨 SANA 1.6B Image Gen</span>
          </span>
        </div>

        {/* Material 3 Starter Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full pb-2">
          <button
            onClick={() =>
              onSelectStarterCard('Remember that my name is Bharath and I prefer Python for writing clean code.')
            }
            className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">Teach Memory</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tell Genie AI your name and preferences to remember across all chats.
            </p>
          </button>

          <button
            onClick={() =>
              onSelectStarterCard('What do you remember about me?')
            }
            className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">Recall My Memories</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Ask Genie AI to list everything currently stored in your profile memory.
            </p>
          </button>

          <button
            onClick={() =>
              onSelectStarterCard(
                'Write a Python script to parse CSV datasets, calculate rolling averages, and plot a chart.'
              )
            }
            className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">Python Data Script</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Generate Pandas functions with data cleaning and statistical metrics.
            </p>
          </button>

          <button
            onClick={() =>
              onSelectStarterCard(
                'Generate an image of a majestic cybernetic dragon soaring above a neon-lit futuristic skyline, 8k resolution'
              )
            }
            className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">🎨 SANA 1.6B Image Gen</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Generate 1024×1024 high-res AI images using NVIDIA SANA linear diffusion.
            </p>
          </button>
        </div>
      </div>
    );
  }

  const renderMessageContent = (content: string) => {
    return (
      <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-3">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold text-white mt-3.5 mb-1.5 flex items-center gap-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-[#d0bcff] mt-3 mb-1 flex items-center gap-1.5">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-xs font-semibold text-zinc-200 mt-2.5 mb-1">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="text-sm text-zinc-200 leading-relaxed mb-2.5 last:mb-0">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 my-2 text-zinc-200 text-sm">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-200 text-sm">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-zinc-200 text-sm leading-relaxed">
                {children}
              </li>
            ),
            hr: () => <hr className="my-3 border-white/10" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-white">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="text-zinc-400 italic">
                {children}
              </em>
            ),
            code: ({ inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');

              if (!inline && (match || codeString.includes('\n'))) {
                return (
                  <CodeBlock
                    language={match ? match[1] : 'code'}
                    code={codeString}
                  />
                );
              }
              return (
                <code
                  className="bg-[#2a2a35] text-[#bb86fc] px-1.5 py-0.5 rounded text-xs font-mono border border-white/5"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-[#bb86fc] pl-3 py-1 my-2 text-zinc-400 text-xs italic bg-white/5 rounded-r">
                {children}
              </blockquote>
            ),
            img: ({ src, alt, ...props }: any) => {
              return (
                <div className="my-3 rounded-2xl overflow-hidden border border-white/15 bg-[#18181e] shadow-2xl group max-w-lg">
                  <div className="relative overflow-hidden bg-black/50">
                    <img
                      src={src}
                      alt={alt || 'SANA 1.6B Generated Image'}
                      loading="lazy"
                      className="w-full h-auto object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                      {...props}
                    />
                  </div>
                  <div className="p-3 bg-[#1e1e24] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300 truncate font-medium">
                      <Palette className="w-3.5 h-3.5 text-[#bb86fc] shrink-0" />
                      <span className="truncate">{alt || 'SANA 1.6B Synthesis'}</span>
                    </div>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#bb86fc]/20 hover:bg-[#bb86fc]/30 text-[#d0bcff] font-semibold flex items-center gap-1 transition shrink-0 active:scale-95"
                      title="Open full resolution in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Full HD</span>
                    </a>
                  </div>
                </div>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isEditing = editingMsgIndex === idx;

        return (
          <div
            key={msg.id || idx}
            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {!isUser && (
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0 mt-1">
                <div className="absolute inset-0 rounded-full bg-[#7c4dff]/20 blur-[4px]" />
                <Image
                  src="/genie-logo.png"
                  alt="Genie AI"
                  width={28}
                  height={28}
                  className="relative object-contain w-7 h-7 drop-shadow-[0_0_6px_rgba(187,134,252,0.4)]"
                />
              </div>
            )}

            <div className={`space-y-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-3xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#2b2b36] text-white rounded-tr-sm border border-white/10 shadow-lg'
                    : 'bg-[#1e1e24] text-zinc-100 rounded-tl-sm border border-white/10 shadow-md'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#18181e] text-white p-2.5 rounded-xl text-xs outline-none border border-[#bb86fc]"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        onClick={() => setEditingMsgIndex(null)}
                        className="px-3 py-1 bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onEditUserMessage(idx, editText);
                          setEditingMsgIndex(null);
                        }}
                        className="px-3 py-1 bg-[#7c4dff] rounded-lg text-white font-medium hover:bg-[#9266ff] transition"
                      >
                        Save & Send
                      </button>
                    </div>
                  </div>
                ) : (
                  renderMessageContent(msg.content)
                )}

                {/* Citations Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#bb86fc]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Document Citations:</span>
                    </div>
                    {msg.citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-[#282834] p-2.5 rounded-xl border border-[#bb86fc]/30 text-[11px] text-zinc-300"
                      >
                        <span className="font-semibold text-[#d0bcff]">
                          [{c.filename}, Page {c.page}]
                        </span>{' '}
                        — <i>"{c.text}"</i>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 text-zinc-400 text-xs px-2 pt-0.5">
                <button
                  onClick={() => handleCopy(msg.id || `${idx}`, msg.content)}
                  className="hover:text-white p-1 rounded hover:bg-white/5 transition flex items-center gap-1"
                  title="Copy text"
                >
                  {copiedId === (msg.id || `${idx}`) ? (
                    <Check className="w-3.5 h-3.5 text-[#bb86fc]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {isUser && !isEditing && (
                  <button
                    onClick={() => {
                      setEditingMsgIndex(idx);
                      setEditText(msg.content);
                    }}
                    className="hover:text-white p-1 rounded hover:bg-white/5 transition"
                    title="Edit message"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {!isUser && idx === messages.length - 1 && !isStreaming && (
                  <button
                    onClick={onRegenerate}
                    className="hover:text-white p-1 rounded hover:bg-white/5 transition flex items-center gap-1"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {!isUser && (
                  <>
                    <button
                      onClick={() => handleFeedback(msg.id || `${idx}`, 'upvote')}
                      className={`p-1 rounded hover:bg-white/5 transition ${
                        feedbackState[msg.id || `${idx}`] === 'upvote'
                          ? 'text-[#bb86fc]'
                          : 'hover:text-[#bb86fc]'
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id || `${idx}`, 'downvote')}
                      className={`p-1 rounded hover:bg-white/5 transition ${
                        feedbackState[msg.id || `${idx}`] === 'downvote'
                          ? 'text-rose-400'
                          : 'hover:text-rose-400'
                      }`}
                      title="Bad response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-[#2b2b36] border border-white/20 flex items-center justify-center shrink-0 mt-1 shadow-md">
                <UserIcon className="w-4 h-4 text-[#bb86fc]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
