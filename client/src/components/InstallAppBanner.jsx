import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, Check } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';

export default function InstallAppBanner() {
  const { settings } = useAppSettings();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed & running as app)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('campusvault_pwa_dismissed');
    if (isDismissed) {
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setShowBanner(true);
    }

    // Android / Chrome / Edge PWA install prompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('campusvault_pwa_dismissed', 'true');
  };

  if (!showBanner || installed) return null;

  return (
    <>
      {/* Install App Promotion Strip */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-3 sm:px-6 py-2 shadow-md relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-white/10 text-white flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-bold mr-1.5">Install CampusVault App:</span>
              <span className="text-white/80 hidden sm:inline">Add to Home Screen for fast, full-screen offline access</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss"
              className="p-1 text-white/70 hover:text-white rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Install CampusVault on iPhone / iPad</h3>
            <div className="text-xs text-gray-600 space-y-2.5 text-left bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed">
              <div className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Safari ke bottom bar me <strong>Share button</strong> (<Share2 className="w-3.5 h-3.5 inline text-blue-600" />) par tap karein.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Menu me scroll karke <strong>'Add to Home Screen'</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-blue-600" />) select karein.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Top right me <strong>'Add'</strong> dabayein — CampusVault aapke phone me install ho jayega!</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
