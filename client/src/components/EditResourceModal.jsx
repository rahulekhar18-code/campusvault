import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { X, Save, AlertCircle, FolderSync } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/AcademicContext';
import { getSubjectsForSemester } from '../data/subjects';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export default function EditResourceModal({ resource, isOpen, onClose, onUpdated }) {
  const { settings } = useAppSettings();
  const { user } = useAuth();
  const { branchCodes, semesterNumbers, categoryNames, getSubjects } = useAcademic();
  const isAdmin = user?.role === 'ADMIN';

  if (!isOpen || !resource) return null;

  const [title, setTitle] = useState(resource.title || '');
  const [branch, setBranch] = useState(resource.branch || 'IT');
  const [semester, setSemester] = useState(resource.semester || '1');
  const [subject, setSubject] = useState(resource.subject || '');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [category, setCategory] = useState(resource.category || 'Notes');
  const [status, setStatus] = useState(resource.status || 'PENDING');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check available subjects for selected branch & semester
  const academicSubjects = getSubjects(branch, semester);
  const availableSubjects = academicSubjects.length > 0
    ? academicSubjects
    : getSubjectsForSemester(semester);

  useEffect(() => {
    if (resource) {
      setTitle(resource.title || '');
      setBranch(resource.branch || 'IT');
      setSemester(resource.semester || '1');
      setCategory(resource.category || 'Notes');
      setStatus(resource.status || 'PENDING');

      const subs = getSubjects(resource.branch || 'IT', resource.semester || '1');
      const finalSubs = subs.length > 0 ? subs : getSubjectsForSemester(resource.semester || '1');
      if (finalSubs.includes(resource.subject)) {
        setSubject(resource.subject);
        setIsCustomSubject(false);
        setCustomSubject('');
      } else {
        setIsCustomSubject(true);
        setCustomSubject(resource.subject || '');
        setSubject('_custom');
      }
    }
  }, [resource, getSubjects]);

  const handleSemesterChange = (newSem) => {
    setSemester(newSem);
    const subs = getSubjects(branch, newSem);
    const finalSubs = subs.length > 0 ? subs : getSubjectsForSemester(newSem);
    if (finalSubs && finalSubs.length > 0 && !isCustomSubject) {
      setSubject(finalSubs[0]);
    }
  };

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    const subs = getSubjects(newBranch, semester);
    const finalSubs = subs.length > 0 ? subs : getSubjectsForSemester(semester);
    if (finalSubs && finalSubs.length > 0 && !isCustomSubject) {
      setSubject(finalSubs[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalSubject = isCustomSubject ? customSubject.trim() : subject.trim();

    if (!title.trim() || !finalSubject) {
      setError('Title and Subject are required');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(`/resources/${resource.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          branch,
          semester,
          subject: finalSubject,
          category,
          ...(isAdmin ? { status } : {})
        })
      });

      onUpdated(res.resource || {
        ...resource,
        title,
        branch,
        semester,
        subject: finalSubject,
        category,
        status
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isAdmin ? 'Edit & Move Resource' : 'Edit Submission Details'}
            </h3>
            <p className="text-xs text-gray-500 font-mono truncate max-w-sm mt-0.5" title={resource.storageKey}>
              Path: {resource.storageKey || 'Storage path'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              File Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {branchCodes.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {semesterNumbers.map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Subject ({branch} - Sem {semester})
              </label>
              <select
                value={isCustomSubject ? '_custom' : subject}
                onChange={(e) => {
                  if (e.target.value === '_custom') {
                    setIsCustomSubject(true);
                  } else {
                    setIsCustomSubject(false);
                    setSubject(e.target.value);
                  }
                }}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                <option value="_custom">+ Custom Subject...</option>
              </select>

              {isCustomSubject && (
                <input
                  type="text"
                  required
                  placeholder="Enter custom subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2 w-full text-sm p-2 bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryNames.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Admin status selection */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Approval Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          )}

          {/* Move Notice for Admin */}
          {isAdmin && (
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start space-x-2 text-xs text-purple-900">
              <FolderSync className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Storage Move Enabled:</strong> Changing Branch, Semester, Subject, or Category will automatically reorganize and move the file in private storage to match the folder hierarchy.
              </span>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              style={{ backgroundColor: settings.themeColor || '#2563eb' }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving & Moving...' : 'Save & Move'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
