import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile, toggleResourceLock, previewFile } from '../api/client';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAcademic } from '../context/AcademicContext';
import EditResourceModal from './EditResourceModal';
import DocumentReaderModal from './DocumentReaderModal';
import AcademicManager from './AcademicManager';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Edit2,
  Trash2,
  Settings,
  Palette,
  FolderTree,
  Save,
  AlertCircle,
  Files,
  Search,
  Filter,
  Layers,
  FolderSync,
  ExternalLink,
  Users,
  UserCheck,
  Mail,
  User,
  GraduationCap,
  Lock,
  Unlock,
  Eye
} from 'lucide-react';

const PRESET_THEMES = [
  { name: 'Default Blue', color: '#2563eb' },
  { name: 'Royal Purple', color: '#7c3aed' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Amber Orange', color: '#ea580c' },
  { name: 'Rose Red', color: '#e11d48' },
  { name: 'Indigo Deep', color: '#4f46e5' },
];

const BRANCHES = ['All', 'IT', 'CSE', 'AIDS', 'ECE', 'MECH', 'CIVIL', 'EE'];
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const STATUS_OPTIONS = ['all', 'APPROVED', 'PENDING', 'REJECTED'];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminPanel({ onPendingCountChange }) {
  const { settings, updateSettings } = useAppSettings();
  const { branchCodes, semesterNumbers, branches, semesters, categories, subjects } = useAcademic();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all' | 'users' | 'academics' | 'settings'

  // Pending Tab State
  const [pendingList, setPendingList] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);

  // All Files Tab State
  const [allResources, setAllResources] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingResource, setReadingResource] = useState(null);

  // Users Tab State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Settings form state
  const [appName, setAppName] = useState(settings.appName || 'CampusVault');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [themeColor, setThemeColor] = useState(settings.themeColor || '#2563eb');
  const [storageRoot, setStorageRoot] = useState(settings.storageRoot || 'vault');
  const [folderFormat, setFolderFormat] = useState(settings.folderFormat || '{branch}/{semester}/{subject}/{category}');
  const [savingSettings, setSavingSettings] = useState(false);

  // Edit modal state
  const [editingResource, setEditingResource] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Rejection state
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Does not meet college submission standards');

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const data = await apiRequest('/admin/pending');
      setPendingList(data || []);
      if (onPendingCountChange) onPendingCountChange(data ? data.length : 0);
    } catch (err) {
      console.error('Failed to load pending resources:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchAllResources = async () => {
    setLoadingAll(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBranch !== 'All') params.append('branch', filterBranch);
      if (filterSemester !== 'All') params.append('semester', filterSemester);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const data = await apiRequest(`/admin/all-resources?${params.toString()}`);
      setAllResources(data || []);
    } catch (err) {
      console.error('Failed to load all resources:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append('search', userSearch.trim());
      const data = await apiRequest(`/admin/users?${params.toString()}`);
      setUsersList(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllResources();
    }
  }, [activeTab, filterStatus, filterBranch, filterSemester]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName || 'CampusVault');
      setLogoUrl(settings.logoUrl || '');
      setThemeColor(settings.themeColor || '#2563eb');
      setStorageRoot(settings.storageRoot || 'vault');
      setFolderFormat(settings.folderFormat || '{branch}/{semester}/{subject}/{category}');
    }
  }, [settings]);

  const handleApprove = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      await apiRequest(`/admin/resources/${id}/approve`, { method: 'PATCH' });
      setActionSuccess('Resource approved and published to Read Files');
      setPendingList(prev => {
        const next = prev.filter(r => r.id !== id);
        if (onPendingCountChange) onPendingCountChange(next.length);
        return next;
      });
      setAllResources(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED', rejectionReason: null } : r));
    } catch (err) {
      setActionError(err.message || 'Failed to approve resource');
    }
  };

  const handleReject = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      await apiRequest(`/admin/resources/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectionReason })
      });
      setActionSuccess('Resource marked as rejected');
      setRejectingId(null);
      setPendingList(prev => {
        const next = prev.filter(r => r.id !== id);
        if (onPendingCountChange) onPendingCountChange(next.length);
        return next;
      });
      setAllResources(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED', rejectionReason } : r));
    } catch (err) {
      setActionError(err.message || 'Failed to reject resource');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resource from the database and private storage?')) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      await apiRequest(`/resources/${id}`, { method: 'DELETE' });
      setActionSuccess('Resource permanently deleted from database and storage');
      setPendingList(prev => {
        const next = prev.filter(r => r.id !== id);
        if (onPendingCountChange) onPendingCountChange(next.length);
        return next;
      });
      setAllResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setActionError(err.message || 'Failed to delete resource');
    }
  };

  const handleDownload = async (resource) => {
    try {
      await downloadFile(resource.id, resource.originalName || `${resource.title}.pdf`);
    } catch (err) {
      alert(`Download preview failed: ${err.message}`);
    }
  };

  const handleToggleLock = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await toggleResourceLock(id);
      setActionSuccess(res.message);
      setAllResources(prev =>
        prev.map(r => r.id === id ? { ...r, isLocked: !r.isLocked } : r)
      );
    } catch (err) {
      setActionError(err.message || 'Failed to toggle lock status');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setSavingSettings(true);
    try {
      await updateSettings({
        appName: appName.trim(),
        logoUrl: logoUrl.trim(),
        themeColor,
        storageRoot: storageRoot.trim(),
        folderFormat: folderFormat.trim()
      });
      setActionSuccess('Application settings saved! Updated globally across all pages.');
    } catch (err) {
      setActionError(err.message || 'Failed to save application settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Panel Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-700" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete CRUD and file moving control, pending approvals, and global branding customization.
          </p>
        </div>

        {/* Admin Tabs Navigation (responsive horizontal scroll) */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto border border-gray-200 scrollbar-none space-x-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition flex-shrink-0 whitespace-nowrap ${activeTab === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pending</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition flex-shrink-0 whitespace-nowrap ${activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Files className="w-4 h-4 text-blue-600" />
            <span>All Files (CRUD)</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition flex-shrink-0 whitespace-nowrap ${activeTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Users</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('academics')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition flex-shrink-0 whitespace-nowrap ${activeTab === 'academics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Academics</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
              {branches.length + semesters.length + categories.length + subjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition flex-shrink-0 whitespace-nowrap ${activeTab === 'settings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Settings className="w-4 h-4 text-purple-600" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Student-Submitted Pending Files</h2>
              <p className="text-xs text-gray-500">Only approved files will be visible on the public Read Files page.</p>
            </div>
            <button
              onClick={fetchPending}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Refresh Queue
            </button>
          </div>

          {loadingPending ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading pending files...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">All caught up!</h3>
              <p className="text-xs text-gray-500 mt-1">There are no pending submissions awaiting approval.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingList.map((item) => (
                <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">{item.subject}</span>
                      <span>•</span>
                      <span>{item.branch}</span>
                      <span>•</span>
                      <span>Sem {item.semester}</span>
                      <span>•</span>
                      <span>{formatFileSize(item.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded by: <span className="font-medium text-gray-800">{item.uploader?.email}</span></span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    {rejectingId === item.id && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <label className="block text-xs font-bold text-red-800 mb-1">
                          Reason for Rejection:
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection"
                            className="flex-1 text-xs p-2 bg-white border border-red-300 rounded focus:outline-none"
                          />
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 self-start md:self-auto">
                    <button
                      onClick={() => handleDownload(item)}
                      title="Secure Preview / Download"
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingResource(item);
                        setIsEditOpen(true);
                      }}
                      title="Edit & Move"
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-gray-200 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => setRejectingId(item.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete permanently"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL FILES & MOVE (CRUD) */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="pb-4 border-b border-gray-100 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Files className="w-5 h-5 text-blue-600" />
                <span>All Uploaded Files Manager (CRUD & Move)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage, edit, change status, and move files across branch/semester/subject storage folders.
              </p>
            </div>
            <button
              onClick={fetchAllResources}
              className="text-xs font-semibold text-blue-600 hover:underline self-start md:self-auto"
            >
              Refresh Files
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="APPROVED">Approved Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="REJECTED">Rejected Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Branch</label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded focus:outline-none"
              >
                <option value="All">All Branches</option>
                {
                    branchCodes.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))
                  }
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Semester</label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded focus:outline-none"
              >
                <option value="All">All Semesters</option>
                {
                    semesterNumbers.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))
                  }
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Search</label>
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder="Title or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchAllResources(); }}
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded focus:outline-none"
                />
                <button
                  onClick={fetchAllResources}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold"
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          {/* Resources Table / List */}
          {loadingAll ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading all uploaded files...
            </div>
          ) : allResources.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No files found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-bold text-gray-600">File Details</th>
                    <th className="px-3 py-2.5 text-left font-bold text-gray-600">Branch & Sem</th>
                    <th className="px-3 py-2.5 text-left font-bold text-gray-600">Subject & Category</th>
                    <th className="px-3 py-2.5 text-left font-bold text-gray-600">Storage Location (Path)</th>
                    <th className="px-3 py-2.5 text-left font-bold text-gray-600">Access Mode</th>
                    <th className="px-3 py-2.5 text-left font-bold text-gray-600">Status</th>
                    <th className="px-3 py-2.5 text-right font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {allResources.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-3">
                        <div className="font-bold text-gray-900">{item.title}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{formatFileSize(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-500">By: {item.uploader?.email}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{item.branch}</span>
                        <span className="ml-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">Sem {item.semester}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-gray-800">{item.subject}</div>
                        <div className="text-[10px] font-medium text-gray-500">{item.category}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded block max-w-xs truncate" title={item.storageKey}>
                          {item.storageKey}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleLock(item.id)}
                          title={item.isLocked ? "File is Locked for in-app reading only. Click to Unlock for downloads" : "File is Free to download. Click to Lock as Read-Only"}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                            item.isLocked
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {item.isLocked ? (
                            <>
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>LOCKED (Read-Only)</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span>FREE (Download)</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {item.status === 'APPROVED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            APPROVED
                          </span>
                        )}
                        {item.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            PENDING
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800" title={item.rejectionReason}>
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* In-App Reader */}
                          <button
                            onClick={() => setReadingResource(item)}
                            title="Read Online In-App"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Download */}
                          <button
                            onClick={() => handleDownload(item)}
                            title="Download File"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit & Move */}
                          <button
                            onClick={() => {
                              setEditingResource(item);
                              setIsEditOpen(true);
                            }}
                            title="Edit & Move File"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded font-semibold flex items-center space-x-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Edit/Move</span>
                          </button>

                          {/* Approve if not approved */}
                          {item.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              title="Approve File"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete permanently */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete Permanently"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="pb-4 border-b border-gray-100 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Registered College Users (@ycce.in)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All students and administrators who have registered and verified their college email accounts.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="text-xs font-semibold text-blue-600 hover:underline self-start md:self-auto"
            >
              Refresh Users
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Total Users</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">{usersList.length}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Students</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {usersList.filter(u => u.role === 'STUDENT').length}
              </span>
            </div>
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Administrators</span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">
                {usersList.filter(u => u.role === 'ADMIN').length}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search user by college email (e.g. 24071279@ycce.in)..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(); }}
                className="w-full pl-9 pr-20 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={fetchUsers}
                className="absolute right-1 top-1 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
              >
                Search
              </button>
            </div>
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading registered users...
            </div>
          ) : usersList.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No registered users found matching the query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">College Email</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Role</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Account Status</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Files Uploaded</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-600">Joined On</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${usr.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{usr.email}</span>
                            <span className="text-[10px] text-gray-400">YCCE Verified Domain</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${usr.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Email Verified</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-gray-800">
                          {usr._count?.resources || 0}
                        </span>
                        <span className="text-gray-500 ml-1">files</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACADEMIC METADATA CRUD */}
      {activeTab === 'academics' && (
        <AcademicManager
          onSuccess={(msg) => {
            setActionSuccess(msg);
            setActionError('');
          }}
          onError={(msg) => {
            setActionError(msg);
            setActionSuccess('');
          }}
        />
      )}

      {/* TAB 5: CUSTOMIZE APP (ADMIN SETTINGS) */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
          <div className="pb-4 border-b border-gray-100 mb-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <span>Branding & Theme Customization</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Changes are saved to the database and immediately update across all pages and student accounts without redeployment.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Application Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Application Name
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="CampusVault"
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Shown on navbar, document header, and title bar.
              </p>
            </div>

            {/* Application Logo URL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Application Logo URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/college-logo.png"
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Leave empty to use the default college graduation cap logo.
              </p>
            </div>

            {/* Theme & Primary Color Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Global Theme & Accent Color
              </label>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_THEMES.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setThemeColor(preset.color)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${themeColor.toLowerCase() === preset.color.toLowerCase()
                        ? 'border-gray-900 bg-gray-50 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom hex input & color picker */}
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 p-1 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#2563eb"
                  className="w-32 text-sm font-mono p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-500">Pick any custom hex accent color</span>
              </div>
            </div>

            {/* Storage Configuration */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center space-x-1.5">
                <FolderTree className="w-4 h-4 text-gray-500" />
                <span>Storage Folder Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Root Folder
                  </label>
                  <input
                    type="text"
                    value={storageRoot}
                    onChange={(e) => setStorageRoot(e.target.value)}
                    placeholder="vault"
                    className="w-full text-sm p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Folder Template Convention
                  </label>
                  <input
                    type="text"
                    value={folderFormat}
                    onChange={(e) => setFolderFormat(e.target.value)}
                    placeholder="{branch}/{semester}/{subject}/{category}"
                    className="w-full text-sm font-mono p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Note: Changing conventions applies to future uploads; existing files remain fully accessible through their recorded storage keys.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit & Move Resource Modal */}
      <EditResourceModal
        isOpen={isEditOpen}
        resource={editingResource}
        onClose={() => {
          setIsEditOpen(false);
          setEditingResource(null);
        }}
        onUpdated={(updated) => {
          setPendingList(prev => prev.map(item => item.id === updated.id ? updated : item));
          setAllResources(prev => prev.map(item => item.id === updated.id ? updated : item));
          setActionSuccess(`File "${updated.title}" updated and moved to ${updated.storageKey || 'new location'}`);
        }}
      />
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
