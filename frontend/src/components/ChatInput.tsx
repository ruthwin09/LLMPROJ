'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Square,
  X,
  FileText,
  Loader2,
  Sparkles,
  BarChart2,
  RotateCcw,
  Image as ImageIcon,
  CornerDownLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getPromptSuggestions, PromptSuggestion } from '@/lib/suggestions';

interface ChatInputProps {
  onSend: (message: string, attachedDocId?: string, attachedDocText?: string, attachedDocName?: string) => void;
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // Compute suggestions when typing
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed.length >= 2 && !manuallyDismissed) {
      const matches = getPromptSuggestions(trimmed, 4);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [text, manuallyDismissed]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (!text.trim()) {
        setText(`Summarize and analyze the key findings in ${file.name}`);
      }
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applySuggestion = (promptText: string) => {
    setText(promptText);
    setShowSuggestions(false);
    setManuallyDismissed(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = promptText.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !attachedFile) || isStreaming || uploadingFile) return;

    setShowSuggestions(false);
    let docId: string | undefined = undefined;
    let docText: string | undefined = undefined;
    let docName: string | undefined = undefined;

    if (attachedFile) {
      setUploadingFile(true);
      docName = attachedFile.name;
      const formData = new FormData();
      formData.append('file', attachedFile);
      try {
        const res = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        docId = res.data.id;
        docText = res.data.text;
      } catch (err: any) {
        console.error('File upload error:', err);
      } finally {
        setUploadingFile(false);
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }

    const messageText = text.trim() || (attachedFile ? `Analyze ${attachedFile.name}` : '');
    onSend(messageText, docId, docText, docName);
    setText('');
    setManuallyDismissed(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If suggestions are visible, handle arrow navigation and tab selection
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const pickIndex = selectedIndex >= 0 ? selectedIndex : 0;
        if (suggestions[pickIndex]) {
          applySuggestion(suggestions[pickIndex].prompt);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setManuallyDismissed(true);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && selectedIndex >= 0) {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          applySuggestion(suggestions[selectedIndex].prompt);
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto w-full px-3 sm:px-4 mb-3 sm:mb-4 select-none shrink-0 z-20 relative">
      {/* Action Chips */}
      <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e24] hover:bg-[#282834] border border-white/10 text-zinc-300 hover:text-white transition shrink-0"
        >
          <Paperclip className="w-3.5 h-3.5 text-[#bb86fc]" />
          <span>Attach File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setText('Analyze this dataset and generate a structured executive summary.');
            textareaRef.current?.focus();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e24] hover:bg-[#282834] border border-white/10 text-zinc-300 hover:text-white transition shrink-0"
        >
          <BarChart2 className="w-3.5 h-3.5 text-[#bb86fc]" />
          <span>Analyze Data</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setText('Write a Python function with documentation and error handling.');
            textareaRef.current?.focus();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e24] hover:bg-[#282834] border border-white/10 text-zinc-300 hover:text-white transition shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#bb86fc]" />
          <span>Code Helper</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setText('Generate an image of ');
            textareaRef.current?.focus();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e24] hover:bg-[#282834] border border-white/10 text-zinc-300 hover:text-white transition shrink-0"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#bb86fc]" />
          <span>Generate Image</span>
        </button>
      </div>

      {/* Attached File Pill */}
      {attachedFile && (
        <div className="mb-2 inline-flex items-center gap-2 bg-[#282834] border border-[#bb86fc]/40 rounded-xl px-3 py-1.5 text-xs text-white shadow-md">
          <FileText className="w-4 h-4 text-[#bb86fc] shrink-0" />
          <span className="font-medium truncate max-w-[200px]">{attachedFile.name}</span>
          <span className="text-[10px] text-zinc-400">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
          <button
            type="button"
            onClick={removeAttachedFile}
            className="p-0.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-rose-400 transition"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── LIVE PROMPT SUGGESTIONS FLYOUT ─── */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-3 left-3 right-3 sm:left-4 sm:right-4 z-50 bg-[#16161e]/95 backdrop-blur-xl border border-[#bb86fc]/30 rounded-2xl shadow-2xl shadow-purple-950/50 p-2 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5 text-[11px] font-semibold text-zinc-400">
            <div className="flex items-center gap-1.5 text-[#bb86fc]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Prompt Suggestions</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-normal">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[9px]">Tab</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[9px]">↑↓</kbd></span>
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  setManuallyDismissed(true);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition"
                title="Dismiss suggestions"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="mt-1.5 space-y-1 max-h-60 overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => applySuggestion(item.prompt)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-[#282838] border border-[#bb86fc]/40 text-white'
                      : 'hover:bg-[#20202c] text-zinc-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#bb86fc]/15 text-[#bb86fc] shrink-0 border border-[#bb86fc]/20">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                        {item.prompt}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1 shrink-0 text-[10px] text-[#bb86fc] font-medium bg-[#bb86fc]/10 px-2 py-1 rounded-lg transition ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <span>Use</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Surface with Floating Purple Send Button */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-[#1e1e24] border border-white/10 focus-within:border-[#bb86fc]/60 rounded-2xl px-3 py-2 shadow-2xl transition duration-150"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.csv,.json,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setManuallyDismissed(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message Genie AI..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-zinc-500 text-xs sm:text-sm px-2 py-1 outline-none resize-none max-h-36"
        />

        {uploadingFile ? (
          <div className="p-2 text-[#bb86fc] animate-spin shrink-0">
            <Loader2 className="w-4 h-4" />
          </div>
        ) : isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shrink-0"
            title="Stop generating"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() && !attachedFile}
            className="w-9 h-9 fab-purple disabled:opacity-40 disabled:hover:bg-[#bb86fc] rounded-full transition shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-purple-950/40"
            title="Send"
          >
            <Send className="w-4 h-4 text-[#121214]" />
          </button>
        )}
      </form>
    </div>
  );
};
