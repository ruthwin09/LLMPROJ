'use client';

import React, { useState } from 'react';
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto w-full select-none animate-fade-in">
        {/* Soft Purple Avatar Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] p-0.5 shadow-2xl shadow-purple-950/50 mb-5">
          <div className="w-full h-full bg-[#18181e] rounded-[22px] flex items-center justify-center border border-[#bb86fc]/40">
            <Bot className="w-8 h-8 text-[#d0bcff]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          How can I help you today?
        </h1>
        <p className="text-sm text-zinc-400 mb-8 max-w-lg leading-relaxed">
          Chat with local & cloud models, summarize documents with RAG, and write clean code with instant streaming responses.
        </p>

        {/* Status Chips from Reference Image (Enabled, Pressed, Selected) */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#282834] text-xs font-semibold text-zinc-200 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Local & Cloud LLMs</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bb86fc]/20 text-xs font-semibold text-[#d0bcff] border border-[#bb86fc]/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#bb86fc]" />
            <span>RAG Document Analysis</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#282834] text-xs font-semibold text-zinc-200 border border-white/10">
            <Brain className="w-3.5 h-3.5 text-[#bb86fc]" />
            <span>🧠 Long-Term Memory</span>
          </span>
        </div>

        {/* Material 3 Starter Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          <button
            onClick={() =>
              onSelectStarterCard('Remember that my name is Bharath and I prefer Python for writing clean code.')
            }
            className="p-5 rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-4 h-4" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">Teach Memory</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tell ChatGPT your name and preferences to remember across all chats.
            </p>
          </button>

          <button
            onClick={() =>
              onSelectStarterCard('What do you remember about me?')
            }
            className="p-5 rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">Recall My Memories</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Ask ChatGPT to list everything currently stored in your profile memory.
            </p>
          </button>

          <button
            onClick={() =>
              onSelectStarterCard(
                'Write a Python script to parse CSV datasets, calculate rolling averages, and plot a chart.'
              )
            }
            className="p-5 rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 className="w-4 h-4" />
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
                'What are the key differences between Supervised, Unsupervised, and Reinforcement Learning?'
              )
            }
            className="p-5 rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">AI Paradigms Comparison</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Compare Supervised vs Unsupervised vs Reinforcement learning models.
            </p>
          </button>

          <button
            onClick={() =>
              onSelectStarterCard(
                'Summarize the uploaded document and extract top 3 key takeaways with exact page citations.'
              )
            }
            className="p-5 rounded-3xl bg-[#1e1e24] hover:bg-[#25252e] border border-white/10 hover:border-[#bb86fc]/50 text-left transition duration-200 group shadow-lg"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-[#bb86fc]/20 text-[#bb86fc] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="group-hover:text-[#bb86fc] transition">Document RAG Analysis</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Extract insights with exact page references and document quotes.
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
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isEditing = editingMsgIndex === idx;

        return (
          <div
            key={msg.id || idx}
            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c4dff] to-[#bb86fc] flex items-center justify-center shrink-0 mt-1 shadow-md">
                <Bot className="w-4 h-4 text-[#121214]" />
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
