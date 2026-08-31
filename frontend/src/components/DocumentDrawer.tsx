'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DocumentFile } from '@/types';

interface DocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocumentForChat?: (docId: string) => void;
}

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({ isOpen, onClose }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await apiClient.get('/upload/documents');
      if (Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Processing document and indexing text chunks...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage('Document uploaded and ingested successfully!');
      fetchDocuments();
    } catch (err: any) {
      setUploadMessage(err.response?.data?.detail || 'Document upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/upload/documents/${id}`);
      fetchDocuments();
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#171717] h-full border-l border-white/10 p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">Document Manager (RAG)</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-zinc-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Upload PDF, DOCX, TXT, CSV, or JSON documents. The AI platform automatically extracts and indexes text chunks for contextual question answering with page citations.
          </p>

          {/* Upload Area */}
          <label className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 bg-[#212121] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center">
            <Upload className="w-8 h-8 text-emerald-400 mb-2" />
            <span className="text-xs font-semibold text-white">Click to Upload Document</span>
            <span className="text-[10px] text-zinc-400 mt-1">Supports PDF, DOCX, TXT, CSV, JSON (max 50MB)</span>
            <input type="file" onChange={handleFileUpload} accept=".pdf,.docx,.txt,.csv,.json,.md" className="hidden" />
          </label>

          {uploadMessage && (
            <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {/* Document List */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Uploaded Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-6">No documents uploaded yet</div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-[#212121] border border-white/10 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-medium text-white truncate">{doc.filename}</div>
                      <div className="text-[10px] text-zinc-400">
                        {doc.page_count} pages • {doc.chunk_count} chunks • {(doc.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white text-xs font-semibold py-2.5 rounded-lg border border-white/10 transition"
        >
          Close Manager
        </button>
      </div>
    </div>
  );
};
