'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onOpenUpload: () => void;
  isStreaming: boolean;
  onStopStreaming?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onOpenUpload,
  isStreaming,
  onStopStreaming,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 mb-3">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end bg-[#2f2f2f] border border-white/15 rounded-2xl p-2 shadow-2xl focus-within:border-emerald-500/60 transition"
      >
        <button
          type="button"
          onClick={onOpenUpload}
          className="p-2.5 text-zinc-400 hover:text-emerald-400 hover:bg-white/10 rounded-xl transition"
          title="Upload Document for RAG QA"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-zinc-400 text-sm px-3 py-2 outline-none resize-none max-h-40"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition shrink-0"
            title="Stop generating"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>

      <div className="text-center text-[11px] text-zinc-500 mt-2">
        ChatGPT Platform can make mistakes. Verify critical facts and inspect document citations.
      </div>
    </div>
  );
};
