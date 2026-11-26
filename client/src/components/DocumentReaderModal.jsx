import React, { useState, useEffect, useRef } from 'react';
import { fetchResourceBlob } from '../api/client';
import { renderAsync } from 'docx-preview';
import mammoth from 'mammoth';
import { 
  X, Maximize2, Minimize2, ZoomIn, ZoomOut, BookOpen, 
  Lock, AlertCircle, FileText, Loader2, Sparkles 
} from 'lucide-react';

export default function DocumentReaderModal({ resource, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState(null); // 'pdf' | 'docx' | 'image' | 'text' | 'unsupported'
  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  const docxContainerRef = useRef(null);
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

      try {
        const { blob, mimeType } = await fetchResourceBlob(resource.id);
        if (!active) return;

        rawBlobRef.current = blob;
        const name = (resource.originalName || resource.title || '').toLowerCase();
        const ext = name.split('.').pop();

        if (mimeType.includes('pdf') || ext === 'pdf') {
          setFileType('pdf');
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
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
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
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

  // When docx type is set and container ref is ready, render Word document
  useEffect(() => {
    if (fileType !== 'docx' || !rawBlobRef.current || !docxContainerRef.current) return;

    let cancelled = false;

    async function renderDocx() {
      try {
        docxContainerRef.current.innerHTML = '';
        await renderAsync(rawBlobRef.current, docxContainerRef.current, null, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true
        });
      } catch (docxErr) {
        console.warn('docx-preview failed, attempting mammoth fallback:', docxErr);
        try {
          const arrayBuffer = await rawBlobRef.current.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!cancelled && docxContainerRef.current) {
            docxContainerRef.current.innerHTML = `
              <div class="p-8 max-w-3xl mx-auto bg-white rounded-xl shadow-sm text-gray-800 leading-relaxed prose">
                ${result.value}
              </div>
            `;
          }
        } catch (mammothErr) {
          console.error('Both docx renderers failed:', mammothErr);
          if (!cancelled) {
            setError('Unable to render this Word document inline. Please ask admin or try another file.');
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
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!resource) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className={`bg-gray-900 border border-gray-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? 'fixed inset-2 z-50 rounded-xl' 
            : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-gray-800/90 border-b border-gray-700 px-4 py-3 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold truncate max-w-md" title={resource.title}>
                  {resource.title}
                </h2>
                {resource.isLocked ? (
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Read-Only Mode</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span>In-App Reader</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {resource.subject} • {resource.branch} • Sem {resource.semester} • {resource.category}
              </p>
            </div>
          </div>

          {/* Controls: Zoom, Fullscreen, Close */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* Zoom Controls for docx & image */}
            {(fileType === 'docx' || fileType === 'image') && (
              <div className="hidden sm:flex items-center space-x-1 bg-gray-700/60 rounded-lg p-1 border border-gray-600 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                  className="p-1 rounded hover:bg-gray-600 text-gray-300 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] px-1.5 text-gray-300">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
                  className="p-1 rounded hover:bg-gray-600 text-gray-300 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition"
              title="Close Reader (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Body */}
        <div className="flex-1 bg-gray-950 overflow-hidden relative flex flex-col justify-center">
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
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* PDF Viewer */}
              {fileType === 'pdf' && objectUrl && (
                <div className="w-full h-full bg-gray-900">
                  <iframe
                    src={`${objectUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-0 select-none"
                    title={resource.title}
                  />
                </div>
              )}

              {/* DOCX Viewer */}
              {fileType === 'docx' && (
                <div className="w-full h-full overflow-y-auto p-4 sm:p-8 bg-gray-900/60 docx-viewer-container">
                  <div 
                    ref={docxContainerRef}
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="transition-transform duration-150 mx-auto max-w-4xl"
                  />
                </div>
              )}

              {/* Image Viewer */}
              {fileType === 'image' && objectUrl && (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4 bg-gray-950">
                  <img
                    src={objectUrl}
                    alt={resource.title}
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                    className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-lg select-none transition-transform duration-150"
                  />
                </div>
              )}

              {/* Text / Code Viewer */}
              {fileType === 'text' && (
                <div className="w-full h-full overflow-auto p-6 bg-gray-900">
                  <pre className="max-w-4xl mx-auto p-6 bg-gray-950 rounded-xl border border-gray-800 text-gray-200 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-none">
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

        {/* Bottom Status / Protection Notice */}
        <div className="bg-gray-800/80 border-t border-gray-700/80 px-4 py-2 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>CampusVault In-App Reader (Protected Academic Resource)</span>
          </div>
          <span className="hidden sm:inline text-gray-500">
            Direct downloads are restricted for locked resources
          </span>
        </div>
      </div>
    </div>
  );
}
