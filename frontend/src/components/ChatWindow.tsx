'use client';

import React, { useState } from 'react';
import { Bot, User as UserIcon, Copy, RotateCcw, ThumbsUp, ThumbsDown, Check, FileText, Sparkles, Edit3 } from 'lucide-react';
import { Message } from '@/types';
import { CodeBlock } from './CodeBlock';

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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-xl">
          <Bot className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">How can I help you today?</h1>
        <p className="text-sm text-zinc-400 mb-8 max-w-md">
          Chat with hosted LLM endpoints, upload PDF/DOCX files for RAG document QA, and write clean code with instant streaming responses.
        </p>

        {/* Starter Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            onClick={() => onSelectStarterCard('Explain Machine Learning algorithms and Deep Neural Networks in simple terms.')}
            className="p-4 bg-[#212121] hover:bg-[#2f2f2f] border border-white/10 rounded-xl text-left transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Explain Concepts</span>
            </div>
            <p className="text-[11px] text-zinc-400">Explain Machine Learning and Neural Networks simply.</p>
          </button>

          <button
            onClick={() => onSelectStarterCard('Write a Python function to read a CSV file, parse columns, and generate summary statistics.')}
            className="p-4 bg-[#212121] hover:bg-[#2f2f2f] border border-white/10 rounded-xl text-left transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Python Code Generator</span>
            </div>
            <p className="text-[11px] text-zinc-400">Write Python CSV parser with summary stats.</p>
          </button>

          <button
            onClick={() => onSelectStarterCard('What are the key differences between Supervised, Unsupervised, and Reinforcement Learning?')}
            className="p-4 bg-[#212121] hover:bg-[#2f2f2f] border border-white/10 rounded-xl text-left transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>AI & ML Comparison</span>
            </div>
            <p className="text-[11px] text-zinc-400">Compare Supervised vs Unsupervised vs RL.</p>
          </button>

          <button
            onClick={() => onSelectStarterCard('Summarize the attached document and highlight top 3 key takeaways with page references.')}
            className="p-4 bg-[#212121] hover:bg-[#2f2f2f] border border-white/10 rounded-xl text-left transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>RAG Document Analysis</span>
            </div>
            <p className="text-[11px] text-zinc-400">Summarize uploaded document with page citations.</p>
          </button>
        </div>
      </div>
    );
  }

  // Render text blocks and code blocks safely
  const renderMessageContent = (content: string) => {
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.slice(3, firstLineEnd).trim() || 'code';
          const codeText = part.slice(firstLineEnd + 1, -3);
          return <CodeBlock key={idx} language={lang} code={codeText} />;
        }
        return (
          <p key={idx} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </p>
        );
      });
    }
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isEditing = editingMsgIndex === idx;

        return (
          <div
            key={msg.id || idx}
            className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isUser && (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            <div className={`space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
              {/* Message Box */}
              <div
                className={`p-4 rounded-2xl text-sm ${
                  isUser
                    ? 'bg-[#2f2f2f] text-white rounded-br-none border border-white/10'
                    : 'bg-[#1e1e1e]/60 text-zinc-100 rounded-bl-none border border-white/10'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#212121] text-white p-2 rounded-lg text-xs outline-none border border-emerald-500"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        onClick={() => setEditingMsgIndex(null)}
                        className="px-2.5 py-1 bg-zinc-700 rounded text-zinc-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onEditUserMessage(idx, editText);
                          setEditingMsgIndex(null);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 rounded text-white font-medium"
                      >
                        Save & Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  renderMessageContent(msg.content)
                )}

                {/* Citations Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Document Citations & Page References:</span>
                    </div>
                    {msg.citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-[#2f2f2f] p-2 rounded border border-emerald-500/30 text-[11px] text-zinc-300"
                      >
                        <span className="font-semibold text-white">
                          [{c.filename}, Page {c.page}]
                        </span>{' '}
                        — <i>"{c.text}"</i>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 text-zinc-400 text-xs px-1">
                <button
                  onClick={() => handleCopy(msg.id || `${idx}`, msg.content)}
                  className="hover:text-white transition flex items-center gap-1"
                  title="Copy message"
                >
                  {copiedId === (msg.id || `${idx}`) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                    className="hover:text-white transition"
                    title="Edit message"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {!isUser && idx === messages.length - 1 && !isStreaming && (
                  <button
                    onClick={onRegenerate}
                    className="hover:text-white transition flex items-center gap-1"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {!isUser && (
                  <>
                    <button
                      onClick={() => handleFeedback(msg.id || `${idx}`, 'upvote')}
                      className={`hover:text-emerald-400 transition ${
                        feedbackState[msg.id || `${idx}`] === 'upvote' ? 'text-emerald-400' : ''
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id || `${idx}`, 'downvote')}
                      className={`hover:text-rose-400 transition ${
                        feedbackState[msg.id || `${idx}`] === 'downvote' ? 'text-rose-400' : ''
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
              <div className="w-8 h-8 rounded-full bg-[#2f2f2f] border border-white/20 flex items-center justify-center shrink-0 mt-1">
                <UserIcon className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
