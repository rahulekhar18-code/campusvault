import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAcademic } from '../context/AcademicContext';
import EditResourceModal from '../components/EditResourceModal';
import { getSubjectsForSemester } from '../data/subjects';
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  Info
} from 'lucide-react';

const DEFAULT_BRANCHES = ['IT', 'CSE', 'AIDS', 'ECE', 'MECH', 'CIVIL', 'EE'];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function UploadFilesPage() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { branchCodes, semesterNumbers, categoryNames, getSubjects } = useAcademic();

  // Upload Form State
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState('IT');
  const [semester, setSemester] = useState('1');
  const [subject, setSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [category, setCategory] = useState('Notes');
  const [file, setFile] = useState(null);

  // Available subjects for current branch & semester from database, fallback to static IT if empty
  const academicSubjects = getSubjects(branch, semester);
  const availableSubjects = academicSubjects.length > 0 ? academicSubjects : getSubjectsForSemester(semester);

  useEffect(() => {
    // When semester or branch changes, set default subject from the list if not custom
    const subs = getSubjects(branch, semester);
    const finalSubs = subs.length > 0 ? subs : getSubjectsForSemester(semester);
    if (finalSubs && finalSubs.length > 0) {
      setSubject(finalSubs[0]);
      setIsCustomSubject(false);
    }
  }, [branch, semester, getSubjects]);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Submissions State
  const [myUploads, setMyUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  // Edit Modal State
  const [editingResource, setEditingResource] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchMyUploads = async () => {
    setLoadingUploads(true);
    try {
      const data = await apiRequest('/resources/my-uploads');
      setMyUploads(data || []);
    } catch (err) {
      console.error('Failed to load personal uploads:', err);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchMyUploads();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        setUploadError('File exceeds 25 MB limit.');
        setFile(null);
        return;
      }
      setFile(selected);
      setUploadError('');
      // Auto fill title if empty
      if (!title) {
        const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    const finalSubject = isCustomSubject ? customSubject.trim() : subject.trim();

    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }
    if (!title.trim() || !finalSubject) {
      setUploadError('Title and Subject are required');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('branch', branch);
    formData.append('semester', semester);
    formData.append('subject', finalSubject);
    formData.append('category', category);
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await apiRequest('/resources/upload', {
        method: 'POST',
        body: formData
      });

      setUploadSuccess(
        user?.role === 'ADMIN'
          ? 'File uploaded and automatically approved!'
          : 'File uploaded successfully! Status is PENDING admin approval.'
      );

      // Reset form
      setTitle('');
      setSubject('');
      setFile(null);
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';

      fetchMyUploads();
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }
    try {
      await apiRequest(`/resources/${resourceId}`, {
        method: 'DELETE'
      });
      setMyUploads(prev => prev.filter(r => r.id !== resourceId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDownload = async (resource) => {
    try {
      await downloadFile(resource.id, resource.originalName || `${resource.title}.pdf`);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Upload className="w-6 h-6" style={{ color: settings.themeColor || '#2563eb' }} />
          <span>Upload Files</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit notes, past question papers, practicals, or assignments for student access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Form Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>File Details</span>
              <span className="text-[11px] font-normal text-gray-500">Max size: 25MB</span>
            </h2>

            {uploadError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  File Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBMS Unit 1 Handwritten Notes"
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
                    onChange={(e) => setBranch(e.target.value)}
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
                    onChange={(e) => setSemester(e.target.value)}
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
                      placeholder="Enter custom subject name"
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

              {/* File Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Choose File (PDF, DOCX, PPT, Images)
                </label>
                <input
                  id="file-upload-input"
                  type="file"
                  required
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg"
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-1 bg-gray-50"
                />
                {file && (
                  <p className="mt-1 text-[11px] text-gray-500 font-mono">
                    Selected: {file.name} ({formatFileSize(file.size)})
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
                style={{ backgroundColor: settings.themeColor || '#2563eb' }}
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading to Storage...' : 'Upload File'}</span>
              </button>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start space-x-2 text-[11px] text-blue-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {user?.role === 'ADMIN'
                    ? 'Admin uploads are automatically approved and made available immediately.'
                    : 'Your file will be reviewed by administrators before being published on the Read Files page.'}
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Student Submissions List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">My Submissions</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-semibold">
                {myUploads.length} total
              </span>
            </div>

            {loadingUploads ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading your submissions...
              </div>
            ) : myUploads.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">You haven't uploaded any files yet.</p>
                <p className="text-xs text-gray-400 mt-1">Use the upload form to submit your first notes or assignment.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 mt-2">
                {myUploads.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 break-words">{item.title}</h4>
                          {/* Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>PENDING APPROVAL</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              <span>APPROVED</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              <span>REJECTED</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{item.subject}</span>
                          <span>•</span>
                          <span>{item.branch}</span>
                          <span>•</span>
                          <span>Sem {item.semester}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>

                        {isRejected && item.rejectionReason && (
                          <p className="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                            Reason: {item.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <button
                          onClick={() => handleDownload(item)}
                          title="Preview / Download"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Student can only edit and delete pending files */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                setEditingResource(item);
                                setIsEditOpen(true);
                              }}
                              title="Edit Submission"
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Delete Submission"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditResourceModal
        isOpen={isEditOpen}
        resource={editingResource}
        onClose={() => {
          setIsEditOpen(false);
          setEditingResource(null);
        }}
        onUpdated={(updated) => {
          setMyUploads(prev => prev.map(item => item.id === updated.id ? updated : item));
        }}
      />
    </div>
  );
}
