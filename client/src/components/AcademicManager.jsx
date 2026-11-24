import React, { useState, useMemo } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { useAppSettings } from '../context/AppSettingsContext';
import {
  GraduationCap,
  BookOpen,
  Layers,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  RotateCcw
} from 'lucide-react';

export default function AcademicManager({ onSuccess, onError }) {
  const { settings } = useAppSettings();
  const {
    branches,
    semesters,
    categories,
    subjects,
    createBranch,
    updateBranch,
    deleteBranch,
    createSemester,
    updateSemester,
    deleteSemester,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubject,
    updateSubject,
    deleteSubject,
    loadingAcademic
  } = useAcademic();

  const [subTab, setSubTab] = useState('branches'); // 'branches' | 'semesters' | 'categories' | 'subjects'

  // Subject filtering and search
  const [subjectBranchFilter, setSubjectBranchFilter] = useState('All');
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState('All');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('branch'); // 'branch' | 'semester' | 'category' | 'subject'
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formBranch, setFormBranch] = useState('IT');
  const [formSemester, setFormSemester] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Counts map for subjects
  const subjectsByBranch = useMemo(() => {
    const map = {};
    for (const s of subjects) {
      const b = (s.branch || '').toUpperCase();
      map[b] = (map[b] || 0) + 1;
    }
    return map;
  }, [subjects]);

  const subjectsBySemester = useMemo(() => {
    const map = {};
    for (const s of subjects) {
      const sem = String(s.semester || '');
      map[sem] = (map[sem] || 0) + 1;
    }
    return map;
  }, [subjects]);

  // Filtered subjects list
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesBranch =
        subjectBranchFilter === 'All' ||
        s.branch.toUpperCase() === subjectBranchFilter.toUpperCase();
      const matchesSemester =
        subjectSemesterFilter === 'All' ||
        String(s.semester) === String(subjectSemesterFilter);
      const matchesSearch =
        !subjectSearch.trim() ||
        s.name.toLowerCase().includes(subjectSearch.toLowerCase().trim());
      return matchesBranch && matchesSemester && matchesSearch;
    });
  }, [subjects, subjectBranchFilter, subjectSemesterFilter, subjectSearch]);

  // Open Add Modal
  const openAddModal = (type) => {
    setModalType(type);
    setModalMode('create');
    setEditingItem(null);
    setFormError('');

    if (type === 'branch') {
      setFormName('');
      setFormCode('');
    } else if (type === 'semester') {
      setFormName('');
      setFormNumber(String(semesters.length + 1));
    } else if (type === 'category') {
      setFormName('');
    } else if (type === 'subject') {
      setFormName('');
      setFormBranch(branches[0]?.code || 'IT');
      setFormSemester(semesters[0]?.number || '1');
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setEditingItem(item);
    setFormError('');

    if (type === 'branch') {
      setFormName(item.name || '');
      setFormCode(item.code || '');
    } else if (type === 'semester') {
      setFormName(item.name || '');
      setFormNumber(item.number || '');
    } else if (type === 'category') {
      setFormName(item.name || '');
    } else if (type === 'subject') {
      setFormName(item.name || '');
      setFormBranch(item.branch || 'IT');
      setFormSemester(String(item.semester || '1'));
    }

    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (modalType === 'branch') {
        if (!formName.trim() || !formCode.trim()) {
          throw new Error('Branch name and code are required');
        }
        if (modalMode === 'create') {
          await createBranch({ name: formName.trim(), code: formCode.trim() });
          onSuccess && onSuccess(`Branch "${formCode.trim()}" created successfully!`);
        } else {
          await updateBranch(editingItem.id, { name: formName.trim(), code: formCode.trim() });
          onSuccess && onSuccess(`Branch "${formCode.trim()}" updated successfully!`);
        }
      } else if (modalType === 'semester') {
        if (!formName.trim() || !formNumber.trim()) {
          throw new Error('Semester name and number are required');
        }
        if (modalMode === 'create') {
          await createSemester({ name: formName.trim(), number: formNumber.trim() });
          onSuccess && onSuccess(`Semester "${formNumber.trim()}" created successfully!`);
        } else {
          await updateSemester(editingItem.id, { name: formName.trim(), number: formNumber.trim() });
          onSuccess && onSuccess(`Semester "${formNumber.trim()}" updated successfully!`);
        }
      } else if (modalType === 'category') {
        if (!formName.trim()) {
          throw new Error('Category name is required');
        }
        if (modalMode === 'create') {
          await createCategory({ name: formName.trim() });
          onSuccess && onSuccess(`Category "${formName.trim()}" created successfully!`);
        } else {
          await updateCategory(editingItem.id, { name: formName.trim() });
          onSuccess && onSuccess(`Category "${formName.trim()}" updated successfully!`);
        }
      } else if (modalType === 'subject') {
        if (!formName.trim() || !formBranch.trim() || !formSemester.trim()) {
          throw new Error('Subject name, branch, and semester are required');
        }
        if (modalMode === 'create') {
          await createSubject({
            name: formName.trim(),
            branch: formBranch.trim(),
            semester: formSemester.trim()
          });
          onSuccess && onSuccess(`Subject "${formName.trim()}" added to ${formBranch} Sem ${formSemester}!`);
        } else {
          await updateSubject(editingItem.id, {
            name: formName.trim(),
            branch: formBranch.trim(),
            semester: formSemester.trim()
          });
          onSuccess && onSuccess(`Subject "${formName.trim()}" updated successfully!`);
        }
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDeleteItem = async (type, item) => {
    const label = item.name || item.code || item.number;
    if (!window.confirm(`Are you sure you want to permanently delete ${type} "${label}"?`)) {
      return;
    }

    try {
      if (type === 'branch') {
        await deleteBranch(item.id);
        onSuccess && onSuccess(`Branch "${label}" deleted successfully`);
      } else if (type === 'semester') {
        await deleteSemester(item.id);
        onSuccess && onSuccess(`Semester "${label}" deleted successfully`);
      } else if (type === 'category') {
        await deleteCategory(item.id);
        onSuccess && onSuccess(`Category "${label}" deleted successfully`);
      } else if (type === 'subject') {
        await deleteSubject(item.id);
        onSuccess && onSuccess(`Subject "${label}" deleted successfully`);
      }
    } catch (err) {
      onError && onError(err.message || `Failed to delete ${type}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Academic Metadata Management</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage branches, semesters, categories, and subjects with full CRUD control. Changes instantly update across Upload, Read, and Search.
          </p>
        </div>

        {/* Add Button for active subtab */}
        <button
          onClick={() => {
            if (subTab === 'branches') openAddModal('branch');
            else if (subTab === 'semesters') openAddModal('semester');
            else if (subTab === 'categories') openAddModal('category');
            else if (subTab === 'subjects') openAddModal('subject');
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>
            {subTab === 'branches' && 'Add Branch'}
            {subTab === 'semesters' && 'Add Semester'}
            {subTab === 'categories' && 'Add Category'}
            {subTab === 'subjects' && 'Add Subject'}
          </span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50/70 px-6 pt-3 space-x-3 overflow-x-auto">
        <button
          onClick={() => setSubTab('branches')}
          className={`pb-3 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
            subTab === 'branches'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Branches</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700">
            {branches.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('semesters')}
          className={`pb-3 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
            subTab === 'semesters'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Semesters</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700">
            {semesters.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`pb-3 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
            subTab === 'categories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Categories</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('subjects')}
          className={`pb-3 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
            subTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
            {subjects.length}
          </span>
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6">
        {/* SUBTAB 1: BRANCHES */}
        {subTab === 'branches' && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Branch Code</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Full Branch Name</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Subjects Registered</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {branches.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md">
                          {b.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {b.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="font-bold text-gray-900">{subjectsByBranch[b.code] || 0}</span> subjects
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEditModal('branch', b)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Branch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('branch', b)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400">
                        No branches configured. Click "Add Branch" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: SEMESTERS */}
        {subTab === 'semesters' && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Semester Number</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Display Label</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Subjects Registered</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {semesters.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md">
                          Sem {s.number}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="font-bold text-gray-900">{subjectsBySemester[s.number] || 0}</span> subjects
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEditModal('semester', s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Semester"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('semester', s)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Semester"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {semesters.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400">
                        No semesters configured. Click "Add Semester" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: CATEGORIES */}
        {subTab === 'categories' && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Category Name</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900 flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-indigo-500" />
                        <span>{c.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEditModal('category', c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('category', c)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="2" className="text-center py-8 text-gray-400">
                        No categories configured. Click "Add Category" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: SUBJECTS */}
        {subTab === 'subjects' && (
          <div>
            {/* Subject Filters and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Filter by Branch</label>
                <select
                  value={subjectBranchFilter}
                  onChange={(e) => setSubjectBranchFilter(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Branches</option>
                  {branches.map(b => (
                    <option key={b.code} value={b.code}>{b.code} ({b.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Filter by Semester</label>
                <select
                  value={subjectSemesterFilter}
                  onChange={(e) => setSubjectSemesterFilter(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Semesters</option>
                  {semesters.map(s => (
                    <option key={s.number} value={s.number}>Semester {s.number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Search Subject Name</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Search subjects..."
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-2 text-xs text-gray-500 flex justify-between items-center">
              <span>Showing <strong>{filteredSubjects.length}</strong> of {subjects.length} subjects</span>
              {(subjectBranchFilter !== 'All' || subjectSemesterFilter !== 'All' || subjectSearch) && (
                <button
                  onClick={() => {
                    setSubjectBranchFilter('All');
                    setSubjectSemesterFilter('All');
                    setSubjectSearch('');
                  }}
                  className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>

            {/* Subjects Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Subject Name</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Branch</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">Semester</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {sub.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {sub.branch}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
                          Sem {sub.semester}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal('subject', sub)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('subject', sub)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400">
                        No subjects match your filter. Click "Add Subject" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <span>
                  {modalMode === 'create' ? 'Add New' : 'Edit'}{' '}
                  {modalType === 'branch' && 'Branch'}
                  {modalType === 'semester' && 'Semester'}
                  {modalType === 'category' && 'Category'}
                  {modalType === 'subject' && 'Subject'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* BRANCH FORM */}
              {modalType === 'branch' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Branch Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IT, CSE, AIDS"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      className="w-full text-sm font-mono p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Full Branch Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Information Technology"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* SEMESTER FORM */}
              {modalType === 'semester' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Semester Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1, 2, 3"
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      className="w-full text-sm font-mono p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Semester Display Label
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Semester 1"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* CATEGORY FORM */}
              {modalType === 'category' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Notes, PYQ, Lab Manuals"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* SUBJECT FORM */}
              {modalType === 'subject' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Database and Information System"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                        Branch
                      </label>
                      <select
                        value={formBranch}
                        onChange={(e) => setFormBranch(e.target.value)}
                        className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {branches.map(b => (
                          <option key={b.code} value={b.code}>{b.code}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                        Semester
                      </label>
                      <select
                        value={formSemester}
                        onChange={(e) => setFormSemester(e.target.value)}
                        className="w-full text-sm p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {semesters.map(s => (
                          <option key={s.number} value={s.number}>Sem {s.number}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
