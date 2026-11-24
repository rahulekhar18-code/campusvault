import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { BookOpen, Upload, Shield, LogOut, GraduationCap } from 'lucide-react';

export default function Navbar({ currentPage, setCurrentPage, pendingCount = 0 }) {
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('read')}>
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.appName}
                className="w-9 h-9 object-contain rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: settings.themeColor || '#2563eb' }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900 block leading-tight">
                {settings.appName || 'CampusVault'}
              </span>
              <span className="text-xs text-gray-500 font-medium hidden sm:block">
                College Notes • Trusted Resources
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentPage('read')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'read'
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              style={currentPage === 'read' ? { backgroundColor: settings.themeColor || '#2563eb' } : {}}
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Files</span>
            </button>

            <button
              onClick={() => setCurrentPage('upload')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'upload'
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              style={currentPage === 'upload' ? { backgroundColor: settings.themeColor || '#2563eb' } : {}}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentPage('admin')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'admin'
                    ? 'text-white shadow-sm'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
                style={currentPage === 'admin' ? { backgroundColor: '#7c3aed' } : {}}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
                {pendingCount > 0 && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* User Status & Sign Out */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-medium text-gray-800">{user?.email}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isAdmin ? 'Admin' : 'Student'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
