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
  Mic,
  MicOff,
  Check,
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

  // Faster-Whisper Voice-to-Text State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const startVoiceRecording = async () => {
    try {
      setLiveTranscript('');
      setRecordingSeconds(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 1. Client-side Real-time Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setLiveTranscript(transcript.trim());
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Faster-Whisper speech recognition event:', err);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // 2. Audio Stream Capture for Faster-Whisper Serverless API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      alert('Microphone permission is required to use Faster-Whisper Voice-to-Text.');
    }
  };

  const stopVoiceRecording = async (commit = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (commit) {
      const captured = liveTranscript.trim();
      if (captured) {
        setText((prev) => (prev ? `${prev} ${captured}` : captured));
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }

      if (audioChunksRef.current.length > 0) {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('transcript', captured);

        try {
          const res = await fetch('/api/audio/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.text && !captured) {
            setText(data.text);
          }
        } catch {
          // Keep captured transcript
        } finally {
          setIsTranscribing(false);
        }
      }
    }

    setLiveTranscript('');
  };

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

        <button
          type="button"
          onClick={() => {
            if (isRecording) {
              stopVoiceRecording(true);
            } else {
              startVoiceRecording();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition shrink-0 ${
            isRecording
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse'
              : 'bg-[#1e1e24] hover:bg-[#282834] border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-400' : 'text-[#bb86fc]'}`} />
          <span>{isRecording ? 'Listening (Whisper)...' : 'Faster-Whisper Voice'}</span>
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
      {showSuggestions && suggestions.length > 0 && !isRecording && (
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

      {/* ─── FASTER-WHISPER ACTIVE RECORDING OVERLAY ─── */}
      {isRecording ? (
        <div className="relative flex items-center justify-between bg-[#161622] border border-[#bb86fc]/50 rounded-2xl px-3.5 py-2.5 shadow-2xl shadow-purple-950/60 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Pulsing indicator */}
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
              <span className="w-3 h-3 rounded-full bg-rose-500 relative" />
            </div>

            {/* Faster-Whisper Soundwave Animation */}
            <div className="flex items-center gap-1 shrink-0 px-2 py-1 bg-black/40 rounded-lg border border-white/10">
              <span className="w-1 h-3 bg-[#bb86fc] rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-[#d0bcff] rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2.5 bg-[#bb86fc] rounded-full animate-pulse delay-150" />
              <span className="w-1 h-6 bg-[#9965f4] rounded-full animate-pulse delay-100" />
              <span className="w-1 h-4 bg-[#d0bcff] rounded-full animate-pulse delay-200" />
            </div>

            {/* Status & Live Transcript */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#bb86fc] flex items-center gap-1">
                  <Mic className="w-3 h-3" /> Faster-Whisper
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
                  {Math.floor(recordingSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-xs text-zinc-200 truncate mt-0.5 font-medium italic">
                {liveTranscript || 'Listening... Speak clearly into your microphone'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => stopVoiceRecording(false)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
              title="Cancel recording"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stopVoiceRecording(true)}
              className="px-3 py-1.5 rounded-xl bg-[#bb86fc] hover:bg-[#a36dfc] text-[#121214] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/40 transition"
              title="Insert transcription"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Done</span>
            </button>
          </div>
        </div>
      ) : (
        /* Input Surface with Floating Purple Send Button */
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
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={startVoiceRecording}
                className="w-9 h-9 rounded-full bg-[#252530] hover:bg-[#323242] border border-white/10 text-zinc-300 hover:text-[#bb86fc] transition flex items-center justify-center cursor-pointer shadow-sm group"
                title="Faster-Whisper Voice-to-Text"
              >
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                type="submit"
                disabled={!text.trim() && !attachedFile}
                className="w-9 h-9 fab-purple disabled:opacity-40 disabled:hover:bg-[#bb86fc] rounded-full transition flex items-center justify-center cursor-pointer shadow-md shadow-purple-950/40"
                title="Send"
              >
                <Send className="w-4 h-4 text-[#121214]" />
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
