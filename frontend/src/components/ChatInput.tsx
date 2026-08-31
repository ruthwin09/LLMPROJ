'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Square, X, FileText, Loader2 } from 'lucide-react';
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (!text.trim()) {
        setText(`Analyse and summarize the contents of ${file.name}`);
      }
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const messageText = text.trim() || (attachedFile ? `Analyse ${attachedFile.name}` : '');
    onSend(messageText, docId);
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
      {/* Attached File Pill */}
      {attachedFile && (
        <div className="mb-2 inline-flex items-center gap-2 bg-[#2f2f2f] border border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-zinc-200 shadow-md">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-white truncate max-w-[200px]">{attachedFile.name}</span>
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

      <form
        onSubmit={handleSubmit}
        className="relative flex items-end bg-[#2f2f2f] border border-white/15 rounded-2xl p-2 shadow-2xl focus-within:border-emerald-500/60 transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.csv,.json,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-zinc-400 hover:text-emerald-400 hover:bg-white/10 rounded-xl transition"
          title="Attach PDF, DOCX, TXT, CSV, JSON to analyse"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT or attach a file to analyse..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-zinc-400 text-sm px-3 py-2 outline-none resize-none max-h-40"
        />

        {uploadingFile ? (
          <div className="p-2.5 text-emerald-400 animate-spin shrink-0">
            <Loader2 className="w-5 h-5" />
          </div>
        ) : isStreaming ? (
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
            disabled={!text.trim() && !attachedFile}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>

      <div className="text-center text-[11px] text-zinc-500 mt-2">
        Upload PDF, DOCX, CSV, TXT to extract & analyse data with page citations.
      </div>
    </div>
  );
};
