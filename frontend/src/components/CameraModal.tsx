'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Sparkles,
  Upload,
  Check,
  Eye,
  Scan,
  FileText,
  HelpCircle,
  FlipHorizontal,
  AlertCircle,
} from 'lucide-react';

import { extractTextLocally } from '@/lib/ocr_client';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, prompt: string, task: string, extractedText?: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>('<MORE_DETAILED_CAPTION>');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reconfigure camera when open or facingMode changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    if (!capturedImage) {
      startCamera(facingMode);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      // Fallback try basic video without facingMode constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr: any) {
        setCameraError(
          'Unable to access camera. Please allow camera permissions, or upload a photo from your device.'
        );
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror front-facing camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCapturedImage(reader.result);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage || isProcessing) return;

    setIsProcessing(true);

    let finalPrompt = customPrompt.trim();
    if (!finalPrompt) {
      if (selectedTask === '<OD>') finalPrompt = 'Detect and identify all objects in this picture.';
      else if (selectedTask === '<OCR>') finalPrompt = 'Read and extract all visible text in this picture.';
      else if (selectedTask === '<VQA>') finalPrompt = 'Explain and answer what is in this picture.';
      else finalPrompt = 'Analyze this picture in detail with Florence-2.';
    }

    let ocrText = '';
    try {
      ocrText = await extractTextLocally(capturedImage);
    } catch (err) {
      console.warn('OCR extraction error:', err);
    }

    setIsProcessing(false);
    onCapture(capturedImage, finalPrompt, selectedTask, ocrText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#14141c] border border-[#bb86fc]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1a1a24]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#bb86fc]/20 border border-[#bb86fc]/40 flex items-center justify-center text-[#bb86fc]">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Florence-2 Camera Vision</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#bb86fc]/20 text-[#d0bcff] border border-[#bb86fc]/30">
                  Vision AI
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {capturedImage
                  ? 'Review picture and select vision analysis task'
                  : 'Click a picture with your camera for instant visual analysis'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Surface */}
        <div className="relative flex-1 bg-black min-h-[300px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Snapshot Review Screen */
            <div className="relative w-full h-full flex items-center justify-center p-3">
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="max-h-[50vh] sm:max-h-[55vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs text-white">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Picture Captured</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Permission / Error Screen */
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">Camera Unavailable</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{cameraError}</p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#bb86fc] text-[#121214] text-xs font-semibold hover:bg-[#a36dfc] transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Picture Instead</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Viewfinder */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full max-h-[55vh] object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder HUD Overlays */}
              <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
                {/* Top HUD */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] text-white">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>LIVE CAMERA</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="pointer-events-auto p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Center Reticle Brackets */}
                <div className="self-center w-48 h-48 sm:w-64 sm:h-64 relative border border-white/20 rounded-2xl flex items-center justify-center">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#bb86fc] rounded-tl" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#bb86fc] rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#bb86fc] rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#bb86fc] rounded-br" />
                  {/* Center Dot */}
                  <div className="w-2 h-2 rounded-full bg-[#bb86fc]/80" />
                </div>

                {/* Bottom HUD Hint */}
                <div className="text-center text-[11px] text-zinc-300 bg-black/50 backdrop-blur-sm py-1 px-3 rounded-full self-center border border-white/10">
                  Position subject inside the box and click picture
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Footer & Controls */}
        <div className="p-4 sm:p-5 bg-[#181822] border-t border-white/10 space-y-3">
          {capturedImage ? (
            /* Post-capture Options */
            <div className="space-y-3">
              {/* Task Selection Pills */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 mb-1.5 block">
                  Florence-2 Vision Task:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTask('<MORE_DETAILED_CAPTION>')}
                    className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                      selectedTask === '<MORE_DETAILED_CAPTION>'
                        ? 'bg-[#bb86fc]/20 border-[#bb86fc] text-white'
                        : 'bg-[#20202c] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#bb86fc] shrink-0" />
                    <span className="text-[11px] font-medium truncate">Scene Analysis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTask('<OD>')}
                    className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                      selectedTask === '<OD>'
                        ? 'bg-[#bb86fc]/20 border-[#bb86fc] text-white'
                        : 'bg-[#20202c] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Scan className="w-3.5 h-3.5 text-[#bb86fc] shrink-0" />
                    <span className="text-[11px] font-medium truncate">Detect Objects</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTask('<OCR>')}
                    className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                      selectedTask === '<OCR>'
                        ? 'bg-[#bb86fc]/20 border-[#bb86fc] text-white'
                        : 'bg-[#20202c] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#bb86fc] shrink-0" />
                    <span className="text-[11px] font-medium truncate">Extract Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTask('<VQA>')}
                    className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                      selectedTask === '<VQA>'
                        ? 'bg-[#bb86fc]/20 border-[#bb86fc] text-white'
                        : 'bg-[#20202c] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#bb86fc] shrink-0" />
                    <span className="text-[11px] font-medium truncate">Visual Q&amp;A</span>
                  </button>
                </div>
              </div>

              {/* Optional Custom Question Input */}
              <div>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Optional question (e.g., 'What is this object?', 'What does this label say?')"
                  className="w-full bg-[#20202c] text-white placeholder-zinc-500 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[#bb86fc]/60"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl bg-[#242432] hover:bg-[#2e2e40] border border-white/10 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Picture</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-[#bb86fc] hover:bg-[#a36dfc] disabled:opacity-50 text-[#121214] text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Reading image...' : 'Analyze with Florence-2'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-[#20202c] hover:bg-[#2a2a38] border border-white/10 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5"
                title="Upload image from device"
              >
                <Upload className="w-3.5 h-3.5 text-[#bb86fc]" />
                <span className="hidden sm:inline">Upload Photo</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={Boolean(cameraError)}
                className="relative group flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
                title="Click Picture"
              >
                <div className="w-16 h-16 rounded-full border-4 border-white/30 group-hover:border-[#bb86fc] flex items-center justify-center transition p-1">
                  <div className="w-full h-full rounded-full bg-[#bb86fc] group-hover:bg-[#d0bcff] shadow-lg shadow-purple-900/50 flex items-center justify-center transition active:scale-95">
                    <Camera className="w-6 h-6 text-[#121214]" />
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-[#20202c] hover:bg-[#2a2a38] border border-white/10 text-zinc-400 hover:text-white text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
