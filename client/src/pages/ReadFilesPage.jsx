import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile } from '../api/client';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAcademic } from '../context/AcademicContext';
import { getSubjectsForSemester } from '../data/subjects';
import { Search, Download, FileText, Filter, Calendar, BookOpen, Layers, GraduationCap } from 'lucide-react';

const BRANCHES = ['All', 'IT', 'CSE', 'AIDS', 'ECE', 'MECH', 'CIVIL', 'EE'];
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const CATEGORIES = ['All', 'Notes', 'PYQ', 'Practicals', 'Assignments'];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ReadFilesPage() {
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
  const [downloadingId, setDownloadingId] = useState(null);

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
  }, [selectedBranch, selectedSemester, selectedSubject, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleDownload = async (resource) => {
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6" style={{ color: settings.themeColor || '#2563eb' }} />
            <span>Read Files</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and download verified academic resources approved by faculty and administrators.
          </p>
        </div>
        <div className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 self-start md:self-auto shadow-sm">
          Showing <span className="font-semibold text-gray-800">{resources.length}</span> approved files
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by title, subject, or filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-24 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-md transition shadow-sm"
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
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
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
          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No approved resources found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter options to discover other study materials.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-red-50 text-red-600 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600">{item.subject}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                    {item.category}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-600">
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

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </span>

                <button
                  onClick={() => handleDownload(item)}
                  disabled={downloadingId === item.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition disabled:opacity-50"
                  style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === item.id ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
