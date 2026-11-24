import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';

const AcademicContext = createContext(null);

const DEFAULT_BRANCHES = ['IT', 'CSE', 'AIDS', 'ECE', 'MECH', 'CIVIL', 'EE'];
const DEFAULT_SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const DEFAULT_CATEGORIES = ['Notes', 'PYQ', 'Practicals', 'Assignments'];

export function AcademicProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAcademicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/academic');
      if (data) {
        setBranches(data.branches || []);
        setSemesters(data.semesters || []);
        setCategories(data.categories || []);
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
      setError(err.message || 'Failed to load academic data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Derived option arrays for dropdowns
  const branchCodes = branches.length > 0
    ? branches.map(b => b.code)
    : DEFAULT_BRANCHES;

  const semesterNumbers = semesters.length > 0
    ? semesters.map(s => s.number)
    : DEFAULT_SEMESTERS;

  const categoryNames = categories.length > 0
    ? categories.map(c => c.name)
    : DEFAULT_CATEGORIES;

  // Helper to get subjects by branch and/or semester
  const getSubjects = useCallback((branch, semester) => {
    if (!subjects || subjects.length === 0) return [];
    return subjects
      .filter(s => {
        const matchesBranch = !branch || branch === 'All' || s.branch.toUpperCase() === branch.toUpperCase();
        const matchesSemester = !semester || semester === 'All' || String(s.semester) === String(semester);
        return matchesBranch && matchesSemester;
      })
      .map(s => s.name);
  }, [subjects]);

  // Admin CRUD helper functions
  const createBranch = async ({ name, code }) => {
    const res = await apiRequest('/academic/branches', {
      method: 'POST',
      body: JSON.stringify({ name, code })
    });
    await fetchAcademicData();
    return res;
  };

  const updateBranch = async (id, { name, code }) => {
    const res = await apiRequest(`/academic/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, code })
    });
    await fetchAcademicData();
    return res;
  };

  const deleteBranch = async (id) => {
    const res = await apiRequest(`/academic/branches/${id}`, {
      method: 'DELETE'
    });
    await fetchAcademicData();
    return res;
  };

  const createSemester = async ({ name, number }) => {
    const res = await apiRequest('/academic/semesters', {
      method: 'POST',
      body: JSON.stringify({ name, number })
    });
    await fetchAcademicData();
    return res;
  };

  const updateSemester = async (id, { name, number }) => {
    const res = await apiRequest(`/academic/semesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, number })
    });
    await fetchAcademicData();
    return res;
  };

  const deleteSemester = async (id) => {
    const res = await apiRequest(`/academic/semesters/${id}`, {
      method: 'DELETE'
    });
    await fetchAcademicData();
    return res;
  };

  const createCategory = async ({ name }) => {
    const res = await apiRequest('/academic/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    await fetchAcademicData();
    return res;
  };

  const updateCategory = async (id, { name }) => {
    const res = await apiRequest(`/academic/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    await fetchAcademicData();
    return res;
  };

  const deleteCategory = async (id) => {
    const res = await apiRequest(`/academic/categories/${id}`, {
      method: 'DELETE'
    });
    await fetchAcademicData();
    return res;
  };

  const createSubject = async ({ name, branch, semester }) => {
    const res = await apiRequest('/academic/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, branch, semester })
    });
    await fetchAcademicData();
    return res;
  };

  const updateSubject = async (id, { name, branch, semester }) => {
    const res = await apiRequest(`/academic/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, branch, semester })
    });
    await fetchAcademicData();
    return res;
  };

  const deleteSubject = async (id) => {
    const res = await apiRequest(`/academic/subjects/${id}`, {
      method: 'DELETE'
    });
    await fetchAcademicData();
    return res;
  };

  return (
    <AcademicContext.Provider
      value={{
        branches,
        semesters,
        categories,
        subjects,
        branchCodes,
        semesterNumbers,
        categoryNames,
        getSubjects,
        loadingAcademic: loading,
        academicError: error,
        refreshAcademic: fetchAcademicData,
        // Admin actions
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
        deleteSubject
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
}
