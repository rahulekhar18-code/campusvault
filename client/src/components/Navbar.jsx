import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { BookOpen, Upload, Shield, LogOut, GraduationCap, Bookmark, Unlock, Coins } from 'lucide-react';

export default function Navbar({ currentPage, setCurrentPage, pendingCount = 0, onOpenRewards }) {
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo & Name */}
            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0" 
              onClick={() => setCurrentPage('read')}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.appName}
                  className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: settings.themeColor || '#2563eb' }}
                >
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-base sm:text-xl font-bold tracking-tight text-gray-900 block leading-tight">
                  {settings.appName || 'CampusVault'}
                </span>
                <span className="text-xs text-gray-500 font-medium hidden sm:block">
                  College Notes • Trusted Resources
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links (Hidden on mobile) */}
            <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-2">
              <button
                onClick={() => setCurrentPage('read')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
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
                onClick={() => setCurrentPage('bookmarks')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentPage === 'bookmarks'
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={currentPage === 'bookmarks' ? { backgroundColor: settings.themeColor || '#2563eb' } : {}}
              >
                <Bookmark className="w-4 h-4" />
                <span>Bookmarks</span>
              </button>

              <button
                onClick={() => setCurrentPage('unlock-hub')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentPage === 'unlock-hub'
                    ? 'text-white shadow-sm'
                    : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
                style={currentPage === 'unlock-hub' ? { backgroundColor: '#059669' } : {}}
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Hub</span>
              </button>

              <button
                onClick={() => setCurrentPage('upload')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
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
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    currentPage === 'admin'
                      ? 'text-white shadow-sm'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                  style={currentPage === 'admin' ? { backgroundColor: '#7c3aed' } : {}}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                  {pendingCount > 0 && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500 text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
            </nav>

            {/* User Status, Wallet & Sign Out */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Study Credits Wallet Badge (Opens Rewards & WhatsApp Invite Modal) */}
              {onOpenRewards && (
                <button
                  type="button"
                  onClick={onOpenRewards}
                  title="Your Study Credits Wallet (Click to Earn More)"
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200/90 text-amber-800 rounded-full text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>{user?.credits ?? 50} 🪙</span>
                </button>
              )}

              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-medium text-gray-800">{user?.email}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                  isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdmin ? 'Admin' : 'Student'}
                </span>
              </div>

              {/* Mobile role badge */}
              <span className={`md:hidden text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                isAdmin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {isAdmin ? 'Admin' : 'Student'}
              </span>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 sm:border-transparent"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Mobile Bottom Navigation Bar (Thumb-friendly, Native App Feel) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => setCurrentPage('read')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'read'
              ? 'text-blue-600 font-bold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
          style={currentPage === 'read' ? { color: settings.themeColor || '#2563eb' } : {}}
        >
          <div className={`p-1 rounded-lg ${currentPage === 'read' ? 'bg-blue-50' : ''}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">Read</span>
        </button>

        <button
          onClick={() => setCurrentPage('bookmarks')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'bookmarks'
              ? 'text-blue-600 font-bold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
          style={currentPage === 'bookmarks' ? { color: settings.themeColor || '#2563eb' } : {}}
        >
          <div className={`p-1 rounded-lg ${currentPage === 'bookmarks' ? 'bg-blue-50' : ''}`}>
            <Bookmark className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">Saved</span>
        </button>

        <button
          onClick={() => setCurrentPage('unlock-hub')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'unlock-hub'
              ? 'text-emerald-600 font-bold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentPage === 'unlock-hub' ? 'bg-emerald-50' : ''}`}>
            <Unlock className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">Unlock</span>
        </button>

        <button
          onClick={() => setCurrentPage('upload')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'upload'
              ? 'text-blue-600 font-bold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
          style={currentPage === 'upload' ? { color: settings.themeColor || '#2563eb' } : {}}
        >
          <div className={`p-1 rounded-lg ${currentPage === 'upload' ? 'bg-blue-50' : ''}`}>
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">Upload</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setCurrentPage('admin')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
              currentPage === 'admin'
                ? 'text-purple-700 font-bold'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentPage === 'admin' ? 'bg-purple-50' : ''}`}>
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] mt-0.5">Admin</span>
            {pendingCount > 0 && (
              <span className="absolute top-0 right-1/4 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </nav>
    </>
  );
}
