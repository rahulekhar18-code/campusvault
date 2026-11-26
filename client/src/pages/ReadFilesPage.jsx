import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile, toggleBookmark } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAcademic } from '../context/AcademicContext';
import { getSubjectsForSemester } from '../data/subjects';
import DocumentReaderModal from '../components/DocumentReaderModal';
import { 
  Search, Download, FileText, Filter, Calendar, BookOpen, Layers, 
  Lock, Unlock, Eye, AlertCircle, X, ShieldAlert, Award, ShieldCheck, Briefcase, Bookmark 
} from 'lucide-react';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ReadFilesPage({ isBookmarksOnly = false }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { settings } = useAppSettings();
  const { branchCodes, semesterNumbers, categoryNames, getSubjects } = useAcademic();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [topperOnly, setTopperOnly] = useState(false);
  
  const [downloadingId, setDownloadingId] = useState(null);
  const [readingResource, setReadingResource] = useState(null);
  const [lockedNoticeResource, setLockedNoticeResource] = useState(null);

  // Available subjects based on branch & semester
  const academicSubjects = getSubjects(
    selectedBranch === 'All' ? null : selectedBranch,
    selectedSemester === 'All' ? null : selectedSemester
  );
  const filterSubjects = academicSubjects.length > 0
    ? academicSubjects
    : (selectedSemester === 'All' ? [] : getSubjectsForSemester(selectedSemester));

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedBranch !== 'All') params.append('branch', selectedBranch);
      if (selectedSemester !== 'All') params.append('semester', selectedSemester);
      if (selectedSubject !== 'All') params.append('subject', selectedSubject);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (topperOnly) params.append('topperOnly', 'true');
      if (isBookmarksOnly) params.append('bookmarksOnly', 'true');

      const data = await apiRequest(`/resources?${params.toString()}`);
      setResources(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load approved files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedBranch, selectedSemester, selectedSubject, selectedCategory, topperOnly, isBookmarksOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleToggleBookmark = async (resourceId) => {
    // Optimistic UI update
    setResources(prev =>
      isBookmarksOnly
        ? prev.filter(r => r.id !== resourceId)
        : prev.map(r => r.id === resourceId ? { ...r, isBookmarked: !r.isBookmarked } : r)
    );

    try {
      await toggleBookmark(resourceId);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      fetchResources();
    }
  };

  const handlePreview = (resource) => {
    setReadingResource(resource);
  };

  const handleDownload = async (resource) => {
    // If resource is locked and user is not an Admin, show polite restriction modal
    if (resource.isLocked && !isAdmin) {
      setLockedNoticeResource(resource);
      return;
    }

    try {
      setDownloadingId(resource.id);
      await downloadFile(resource.id, resource.originalName || `${resource.title}.pdf`);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Subtitle */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            {isBookmarksOnly ? (
              <>
                <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-400" />
                <span>My Bookmarks (Exam Pocket)</span>
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: settings.themeColor || '#2563eb' }} />
                <span>Read Files</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isBookmarksOnly 
              ? 'Your quick-access saved notes, formula sheets, and study materials pinned for exams.'
              : 'Browse and read verified academic resources approved by faculty and administrators.'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            Showing <span className="font-semibold text-gray-800">{resources.length}</span> {isBookmarksOnly ? 'saved' : 'approved'} files
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 sm:left-3.5 top-2.5 sm:top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, subject, filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:pl-11 pr-20 sm:pr-24 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 sm:right-1.5 sm:top-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white rounded-md transition shadow-sm"
              style={{ backgroundColor: settings.themeColor || '#2563eb' }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span>Branch</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full text-sm bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Branches</option>
              {branchCodes.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span>Semester</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubject('All');
              }}
              className="w-full text-sm bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Semesters</option>
              {semesterNumbers.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              <span>Subject</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-sm bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Subjects</option>
              {filterSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {categoryNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Discovery Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
          <span className="text-gray-400 font-semibold text-[11px] mr-1">Quick Filters:</span>
          <button
            type="button"
            onClick={() => { setTopperOnly(false); setSelectedCategory('All'); }}
            className={`px-3 py-1 rounded-full font-semibold transition ${
              !topperOnly && selectedCategory === 'All' 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Resources
          </button>
          <button
            type="button"
            onClick={() => setTopperOnly(!topperOnly)}
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full font-semibold transition ${
              topperOnly 
                ? 'bg-yellow-500 text-white shadow-sm ring-2 ring-yellow-300' 
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>🥇 Topper Verified Only</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === 'Placement' ? 'All' : 'Placement')}
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full font-semibold transition ${
              selectedCategory === 'Placement' 
                ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300' 
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>💼 Placements & Interviews</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === 'PYQ' ? 'All' : 'PYQ')}
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full font-semibold transition ${
              selectedCategory === 'PYQ' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span>📄 PYQs</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resource Cards / List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-sm text-gray-500">Loading approved resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
            isBookmarksOnly ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-400'
          }`}>
            {isBookmarksOnly ? <Bookmark className="w-6 h-6 fill-amber-400" /> : <BookOpen className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {isBookmarksOnly ? 'No notes saved to your Exam Pocket yet' : 'No approved resources found'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {isBookmarksOnly 
              ? 'Tap the bookmark star icon on any document in Read Files to keep it saved here for fast revision before exams.'
              : 'Try adjusting your search criteria or filter options to discover other study materials.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Category, Verification Badges, Bookmark & Lock Status */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                      {item.category}
                    </span>
                    {item.isTopperVerified && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-2xs">
                        <Award className="w-2.5 h-2.5 text-yellow-700" />
                        <span>Topper Verified</span>
                      </span>
                    )}
                    {item.isProfVerified && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                        <span>Prof. Verified</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Bookmark / Exam Pocket Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(item.id)}
                      className={`p-1 rounded-md border transition ${
                        item.isBookmarked
                          ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100'
                          : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={item.isBookmarked ? 'Remove from Exam Pocket' : 'Save to Exam Pocket'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${item.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    {item.isLocked ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Read-Only</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Unlock className="w-2.5 h-2.5" />
                        <span>Free</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Subject */}
                <div className="flex items-start space-x-2.5 mb-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 flex-shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 truncate mt-0.5">{item.subject}</p>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 pt-2.5 border-t border-gray-100">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {item.branch}
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                    Sem {item.semester}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 font-mono text-[11px]">
                    {formatFileSize(item.fileSize)}
                  </span>
                </div>
              </div>

              {/* Actions: Dual Buttons (Read Online & Download) */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Read Online Button: Always available for in-app reading without downloading */}
                  <button
                    onClick={() => handlePreview(item)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                    title="Read & study document in-app"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-600" />
                    <span>Read Online</span>
                  </button>

                  {/* Download Button */}
                  {item.isLocked && !isAdmin ? (
                    <button
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                      title="Locked file (Click to read notice)"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Locked</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.id}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition disabled:opacity-50"
                      style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === item.id ? 'Saving...' : 'Download'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Locked Notice Popup Modal */}
      {lockedNoticeResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setLockedNoticeResource(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Read-Only Resource
            </h3>
            <p className="text-xs font-semibold text-blue-600 mb-3 truncate">
              {lockedNoticeResource.title} ({lockedNoticeResource.subject})
            </p>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed mb-5 space-y-2">
              <p>
                <strong>Offline downloads are locked by Admin</strong> for this resource to protect academic notes and verified materials.
              </p>
              <p className="text-amber-800">
                You can freely <strong>Read & Study the complete file online</strong> right now using our in-app reader!
              </p>
              <p className="text-[11px] text-amber-700 italic border-t border-amber-200/60 pt-1.5">
                💡 Tip: Offline downloads will be unlockable via student contributions & credits in a future update.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setLockedNoticeResource(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = lockedNoticeResource;
                  setLockedNoticeResource(null);
                  handlePreview(res);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm hover:opacity-90 transition"
                style={{ backgroundColor: settings.themeColor || '#2563eb' }}
              >
                <Eye className="w-4 h-4" />
                <span>Read Online Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Reader Modal */}
      {readingResource && (
        <DocumentReaderModal
          resource={readingResource}
          onClose={() => setReadingResource(null)}
        />
      )}
    </div>
  );
}
