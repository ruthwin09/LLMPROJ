'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Square, X, FileText, Loader2, Sparkles, BarChart2, RotateCcw } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ChatInputProps {
  onSend: (message: string, attachedDocId?: string) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !attachedFile) || isStreaming || uploadingFile) return;

    let docId: string | undefined = undefined;

    if (attachedFile) {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', attachedFile);
      try {
        const res = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        docId = res.data.id;
      } catch (err: any) {
        console.error('File upload error:', err);
      } finally {
        setUploadingFile(false);
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }

    const messageText = text.trim() || (attachedFile ? `Analyze ${attachedFile.name}` : '');
    onSend(messageText, docId);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 mb-4 select-none">
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT..."
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
