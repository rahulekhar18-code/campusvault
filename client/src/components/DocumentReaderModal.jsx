import React, { useState, useEffect, useRef } from 'react';
import { fetchResourceBlob, askDocumentAssist } from '../api/client';
import { useAuth } from '../context/AuthContext';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { renderAsync } from 'docx-preview';
import mammoth from 'mammoth';
import { 
  X, Maximize2, Minimize2, ZoomIn, ZoomOut, BookOpen, 
  Lock, AlertCircle, FileText, Loader2, Sparkles, Send, 
  Copy, Check, MessageSquare, Award, ShieldCheck, ExternalLink 
} from 'lucide-react';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function DocumentReaderModal({ resource, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState(null); // 'pdf' | 'docx' | 'image' | 'text' | 'unsupported'
  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // PDF Rendering State
  const [pdfRendering, setPdfRendering] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);

  // AI Assistant State
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState('summary');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const docxContainerRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const rawBlobRef = useRef(null);

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    async function loadDocument() {
      if (!resource) return;
      setLoading(true);
      setError('');
      setFileType(null);
      setTextContent('');
      setPdfPageCount(0);

      try {
        const { blob, mimeType } = await fetchResourceBlob(resource.id);
        if (!active) return;

        rawBlobRef.current = blob;
        const name = (resource.originalName || resource.title || '').toLowerCase();
        const ext = name.split('.').pop();

        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);

        if (mimeType.includes('pdf') || ext === 'pdf') {
          setFileType('pdf');
        } else if (
          mimeType.includes('word') || 
          mimeType.includes('officedocument.wordprocessingml') || 
          ext === 'docx' || 
          ext === 'doc'
        ) {
          setFileType('docx');
        } else if (
          mimeType.startsWith('image/') || 
          ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)
        ) {
          setFileType('image');
        } else if (
          mimeType.startsWith('text/') || 
          ['txt', 'csv', 'md', 'json', 'py', 'c', 'cpp', 'java'].includes(ext)
        ) {
          setFileType('text');
          const text = await blob.text();
          if (active) setTextContent(text);
        } else {
          setFileType('unsupported');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load document for reading');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [resource?.id]);

  // Render PDF using Canvas (Works 100% on Mobile Android, iOS Safari, and Desktop)
  useEffect(() => {
    if (fileType !== 'pdf' || !rawBlobRef.current || !pdfContainerRef.current) return;

    let cancelled = false;

    async function renderPdfCanvas() {
      setPdfRendering(true);
      try {
        const arrayBuffer = await rawBlobRef.current.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        if (cancelled || !pdfContainerRef.current) return;

        setPdfPageCount(pdf.numPages);
        pdfContainerRef.current.innerHTML = '';

        // Render up to 50 pages onto HTML5 canvas
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.4 });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = 'w-full max-w-2xl mx-auto rounded-lg shadow-md mb-4 bg-white block select-none';
          canvas.style.height = 'auto';

          pdfContainerRef.current.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (err) {
        console.warn('PDF.js canvas rendering notice:', err);
      } finally {
        if (!cancelled) setPdfRendering(false);
      }
    }

    renderPdfCanvas();

    return () => {
      cancelled = true;
    };
  }, [fileType, loading]);

  // Render DOCX using Mammoth (Clean responsive HTML for mobile) with docx-preview fallback
  useEffect(() => {
    if (fileType !== 'docx' || !rawBlobRef.current || !docxContainerRef.current) return;

    let cancelled = false;

    async function renderDocx() {
      try {
        const arrayBuffer = await rawBlobRef.current.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled && docxContainerRef.current) {
          docxContainerRef.current.innerHTML = `
            <div class="prose prose-invert max-w-3xl mx-auto p-4 sm:p-8 bg-gray-900 rounded-xl leading-relaxed text-gray-200">
              ${result.value || '<p class="text-gray-400 italic">No text content found in document.</p>'}
            </div>
          `;
        }
      } catch (mammothErr) {
        console.warn('Mammoth failed, falling back to docx-preview:', mammothErr);
        try {
          if (!cancelled && docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            await renderAsync(rawBlobRef.current, docxContainerRef.current, null, {
              inWrapper: false,
              ignoreWidth: true,
              ignoreHeight: true,
              breakPages: false
            });
          }
        } catch (docxErr) {
          if (!cancelled) {
            setError('Unable to render this Word document inline on mobile. Please open in tab or ask admin.');
          }
        }
      }
    }

    renderDocx();

    return () => {
      cancelled = true;
    };
  }, [fileType, loading]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !aiOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, aiOpen]);

  // AI Assistant trigger
  const handleAiAction = async (mode, customPrompt = '') => {
    setAiLoading(true);
    setAiMode(mode);
    setAiOpen(true);
    setCopied(false);
    try {
      const data = await askDocumentAssist(resource.id, customPrompt, mode);
      setAiResponse(data.reply || 'No output generated.');
    } catch (err) {
      setAiResponse(`⚠️ Error: ${err.message || 'Failed to contact AI Assistant'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAi = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resource) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className={`bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? 'fixed inset-1 sm:inset-2 z-50 rounded-xl' 
            : 'w-full max-w-6xl h-[94vh] sm:h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-gray-800/95 border-b border-gray-700 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between text-white flex-shrink-0 z-40">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h2 className="text-xs sm:text-base font-bold truncate max-w-[130px] xs:max-w-[200px] sm:max-w-md" title={resource.title}>
                  {resource.title}
                </h2>
                {resource.isTopperVerified && (
                  <span className="hidden xs:inline-flex items-center space-x-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                    <Award className="w-2.5 h-2.5" />
                    <span>Topper</span>
                  </span>
                )}
                {resource.isProfVerified && (
                  <span className="hidden xs:inline-flex items-center space-x-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Prof</span>
                  </span>
                )}
                {resource.isLocked && (
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Read-Only</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {resource.subject} • {resource.branch} • Sem {resource.semester} • {resource.category}
                {pdfPageCount > 0 && ` • ${pdfPageCount} Pages`}
              </p>
            </div>
          </div>

          {/* Controls: Open Tab, AI Assistant, Zoom, Fullscreen, Close */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* Open in Tab Button (Only for unlocked PDFs, never for locked resources or formats that force download) */}
            {objectUrl && !resource.isLocked && fileType === 'pdf' && (
              <a
                href={objectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-blue-300 hover:text-white bg-blue-600/30 hover:bg-blue-600/50 rounded-md border border-blue-500/40 transition"
                title="Open in browser tab for full native mobile viewing"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden xs:inline">Open Tab</span>
              </a>
            )}

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={() => {
                if (!aiOpen && !aiResponse) {
                  handleAiAction('summary');
                } else {
                  setAiOpen(!aiOpen);
                }
              }}
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                aiOpen 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                  : 'bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="sm:hidden text-[10px]">AI</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 sm:p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition"
              title="Close Reader (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Reader Workspace (Split Layout on desktop, overlay on mobile) */}
        <div className="flex-1 bg-gray-950 overflow-hidden relative flex flex-row">
          {/* Main Document Viewport */}
          <div className="flex-1 relative overflow-hidden flex flex-col justify-center">
            {/* Dynamic Anti-Leak Security Watermark Overlay */}
            <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden flex flex-col justify-around opacity-[0.05] sm:opacity-[0.06] rotate-[-22deg] scale-125">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex justify-around whitespace-nowrap text-xs font-mono font-bold tracking-widest text-white uppercase">
                  <span>CampusVault • {user?.email || 'YCCE Student'}</span>
                  <span>CampusVault • {user?.email || 'YCCE Student'}</span>
                  <span>CampusVault • {user?.email || 'YCCE Student'}</span>
                </div>
              ))}
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-semibold text-gray-300">Loading document securely into reader...</p>
                <p className="text-xs text-gray-500">Preparing inline preview without local disk download</p>
              </div>
            )}

            {error && !loading && (
              <div className="max-w-md mx-auto p-6 bg-red-950/50 border border-red-700/60 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h3 className="text-sm font-bold text-red-200">Failed to Display Document</h3>
                <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                <div className="flex items-center justify-center space-x-2 pt-2">
                  {objectUrl && !resource.isLocked && fileType === 'pdf' && (
                    <a
                      href={objectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                    >
                      Open in New Tab
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* PDF Viewer: Canvas rendering (100% works on Android Chrome, iOS Safari, and Desktop) */}
                {fileType === 'pdf' && (
                  <div className="w-full h-full overflow-y-auto p-2 sm:p-6 bg-gray-950 flex flex-col items-center">
                    {pdfRendering && (
                      <div className="py-6 text-center text-gray-400 text-xs flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Rendering PDF pages on mobile canvas...</span>
                      </div>
                    )}
                    <div ref={pdfContainerRef} className="w-full max-w-3xl flex flex-col items-center" />
                  </div>
                )}

                {/* DOCX Viewer: Pure responsive HTML (Wraps cleanly on mobile) */}
                {fileType === 'docx' && (
                  <div className="w-full h-full overflow-y-auto p-3 sm:p-8 bg-gray-950 docx-viewer-container">
                    <div 
                      ref={docxContainerRef}
                      className="mx-auto max-w-3xl text-gray-200"
                    />
                  </div>
                )}

                {/* Image Viewer */}
                {fileType === 'image' && objectUrl && (
                  <div className="w-full h-full overflow-auto flex items-center justify-center p-3 sm:p-4 bg-gray-950">
                    <img
                      src={objectUrl}
                      alt={resource.title}
                      className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-lg select-none"
                    />
                  </div>
                )}

                {/* Text / Code Viewer */}
                {fileType === 'text' && (
                  <div className="w-full h-full overflow-auto p-4 sm:p-6 bg-gray-900">
                    <pre className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-950 rounded-xl border border-gray-800 text-gray-200 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-none">
                      {textContent}
                    </pre>
                  </div>
                )}

                {/* Unsupported Format Notice */}
                {fileType === 'unsupported' && (
                  <div className="max-w-md mx-auto p-8 bg-gray-900 border border-gray-800 rounded-2xl text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">Direct Inline Preview Not Available</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This file format cannot be rendered as a document directly in web browsers.
                    </p>
                    <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      If this file is unlocked or you are an administrator, you can download it using the Download button.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* AI Study Assistant Side Drawer (Overlay on mobile, Split-view on desktop) */}
          {aiOpen && (
            <div className="w-full sm:w-96 absolute inset-0 sm:static z-40 bg-gray-900 border-l border-gray-700/80 flex flex-col shadow-2xl animate-fadeIn">
              {/* AI Drawer Header */}
              <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-850">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">CampusVault AI Mentor</h3>
                    <p className="text-[10px] text-gray-400">Exam preparation & doubt solver</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Action Pills */}
              <div className="p-3 border-b border-gray-800 bg-gray-900/80 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAiAction('summary')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    aiMode === 'summary' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ⚡ 2-Min Summary
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAiAction('questions')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    aiMode === 'questions' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🎯 Exam Questions
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAiAction('definitions')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    aiMode === 'definitions' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  💡 Key Terms
                </button>
              </div>

              {/* AI Content Area */}
              <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed text-gray-200">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    <p className="text-xs font-semibold text-gray-300">Generating exam-focused response...</p>
                    <p className="text-[11px] text-gray-500">Analyzing syllabus standards for {resource.subject}</p>
                  </div>
                ) : aiResponse ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                      <span>Generated Study Notes</span>
                      <button
                        type="button"
                        onClick={handleCopyAi}
                        className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-xs text-gray-200 leading-relaxed">
                      {aiResponse}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-gray-600" />
                    <p className="text-xs">Click a quick button above or ask any doubt below!</p>
                  </div>
                )}
              </div>

              {/* Ask Input Bar */}
              <div className="p-3 border-t border-gray-800 bg-gray-850">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!aiPrompt.trim() || aiLoading) return;
                    handleAiAction('chat', aiPrompt.trim());
                    setAiPrompt('');
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask a doubt from this note..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || aiLoading}
                    className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status / Protection Notice */}
        <div className="bg-gray-800/80 border-t border-gray-700/80 px-3 sm:px-4 py-2 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-400 z-40">
          <div className="flex items-center space-x-1.5 truncate">
            <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="truncate">CampusVault In-App Reader</span>
          </div>
          <span className="hidden sm:inline text-gray-500 font-mono text-[10px]">
            User: {user?.email || 'Logged In'} • Watermarked for Security
          </span>
        </div>
      </div>
    </div>
  );
}
