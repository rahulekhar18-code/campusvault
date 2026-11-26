import React, { useState, useEffect } from 'react';
import { fetchUnlockedResources, downloadFile, toggleBookmark } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import DocumentReaderModal from '../components/DocumentReaderModal';
import { 
  Unlock, 
  Download, 
  BookOpen, 
  Search, 
  Coins, 
  FileText, 
  Filter, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function UnlockHubPage({ onNavigate, onOpenRewards }) {
  const { user } = useAuth();
  const { settings } = useAppSettings();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);
  const [readingResource, setReadingResource] = useState(null);

  const loadUnlocked = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUnlockedResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load unlocked resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnlocked();
  }, []);

  const handleDownload = async (resource) => {
    setDownloadingId(resource.id);
    try {
      await downloadFile(resource.id, resource.originalName || `${resource.title}.pdf`);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleBookmark = async (id) => {
    try {
      const res = await toggleBookmark(id);
      setResources(prev =>
        prev.map(r => r.id === id ? { ...r, isBookmarked: res.bookmarked } : r)
      );
    } catch (err) {
      console.warn('Failed to toggle bookmark:', err.message);
    }
  };

  // Filter resources
  const filtered = resources.filter(item => {
    const matchesSearch = !search.trim() || 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.branch.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(resources.map(r => r.category).filter(Boolean))];
  const totalSpent = resources.reduce((acc, r) => acc + (r.creditsSpent || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Unlock className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/20">
              <Unlock className="w-3.5 h-3.5" />
              <span>Permanent Vault Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Unlock Hub
            </h1>
            <p className="text-sm text-emerald-50 leading-relaxed">
              Your unlocked study material. Read in-app with AI assistant or download offline anytime with zero repeat costs.
            </p>
          </div>

          {/* Wallet & Stats Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-emerald-100 uppercase font-semibold block">Unlocked Files</span>
              <span className="text-xl sm:text-2xl font-bold">{resources.length}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-emerald-100 uppercase font-semibold block">Credits Spent</span>
              <span className="text-xl sm:text-2xl font-bold">{totalSpent} 🪙</span>
            </div>

            {onOpenRewards && (
              <button
                type="button"
                onClick={onOpenRewards}
                className="flex items-center space-x-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl shadow-md transition-all flex-shrink-0"
              >
                <Coins className="w-4 h-4 text-amber-900" />
                <span>Earn More Credits</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search unlocked notes by title, subject, or branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading your unlocked vault files...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadUnlocked}
            className="font-bold underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <Unlock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-gray-900 text-base">
              {resources.length === 0 ? 'Your Unlock Hub is empty' : 'No matching unlocked files'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              {resources.length === 0
                ? 'Unlock locked premium study notes, PYQs, and practicals using your study credits to download and read them here anytime.'
                : 'Try adjusting your search query or category filters to find your unlocked notes.'}
            </p>
          </div>

          {resources.length === 0 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('read')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <span>Explore Read Files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Grid of Unlocked Resource Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white border border-gray-200/90 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Unlock className="w-3 h-3" />
                      <span>Unlocked ({item.creditsSpent || 10} 🪙)</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                      {item.unit || 'Unit 1'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(item.id)}
                    title={item.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.isBookmarked 
                        ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2" title={item.title}>
                  {item.title}
                </h3>

                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="truncate"><strong>Subject:</strong> {item.subject}</div>
                  <div className="text-[11px] text-gray-500">
                    {item.branch} • Sem {item.semester} • {formatFileSize(item.fileSize)}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReadingResource(item)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200/80 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gray-600" />
                  <span>Read In-App</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  disabled={downloadingId === item.id}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === item.id ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Reader Modal */}
      {readingResource && (
        <DocumentReaderModal
          resource={readingResource}
          onClose={() => setReadingResource(null)}
        />
      )}
    </div>
  );
}
