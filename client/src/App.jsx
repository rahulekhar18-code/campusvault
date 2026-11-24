import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppSettingsProvider } from './context/AppSettingsContext';
import { AcademicProvider } from './context/AcademicContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import ReadFilesPage from './pages/ReadFilesPage';
import UploadFilesPage from './pages/UploadFilesPage';
import AdminPanel from './components/AdminPanel';
import { apiRequest } from './api/client';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('read'); // 'read' | 'upload' | 'admin'
  const [pendingCount, setPendingCount] = useState(0);

  // Poll or fetch pending count for admin badge
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      apiRequest('/admin/pending')
        .then(data => {
          if (Array.isArray(data)) setPendingCount(data.length);
        })
        .catch(() => { });
    }
  }, [user, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
          <p className="text-xs text-gray-500">Loading CampusVault...</p>
        </div>
      </div>
    );
  }

  // Page 1: Login / Signup if unauthenticated
  if (!user) {
    return <AuthPage />;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pendingCount={pendingCount}
      />

      <main className="flex-1">
        {/* Page 2: Read Files */}
        {currentPage === 'read' && <ReadFilesPage />}

        {/* Page 3: Upload Files */}
        {currentPage === 'upload' && <UploadFilesPage />}

        {/* Embedded Admin Approval & Customization Panel */}
        {currentPage === 'admin' && isAdmin && (
          <AdminPanel onPendingCountChange={setPendingCount} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        CampusVault • Lightweight College Notes & Resources • Verified @ycce.in
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <AcademicProvider>
          <AppContent />
        </AcademicProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}
