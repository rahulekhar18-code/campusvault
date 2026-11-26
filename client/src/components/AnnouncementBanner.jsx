import React, { useState, useEffect } from 'react';
import { useAppSettings } from '../context/AppSettingsContext';
import { Megaphone, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function AnnouncementBanner() {
  const { settings } = useAppSettings();
  const [dismissed, setDismissed] = useState(false);

  const text = (settings?.announcementText || '').trim();
  const isEnabled = Boolean(settings?.announcementEnabled) && text.length > 0;
  const type = settings?.announcementType || 'info';

  useEffect(() => {
    // Reset dismiss state if the announcement text changes
    if (text) {
      const stored = sessionStorage.getItem('campusvault_dismissed_announcement');
      if (stored === text) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    }
  }, [text]);

  const handleDismiss = () => {
    setDismissed(true);
    if (text) {
      sessionStorage.setItem('campusvault_dismissed_announcement', text);
    }
  };

  if (!isEnabled || dismissed) return null;

  const styleConfig = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      badge: 'bg-blue-200 text-blue-900',
      icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      badge: 'bg-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badge: 'bg-emerald-200 text-emerald-900',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
    }
  }[type] || {
    bg: 'bg-blue-50 border-blue-200 text-blue-900',
    badge: 'bg-blue-200 text-blue-900',
    icon: <Megaphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
  };

  return (
    <div className={`border-b px-3 sm:px-6 py-2 transition-all ${styleConfig.bg}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {styleConfig.icon}
          <span className="font-semibold leading-snug truncate sm:whitespace-normal">
            {text}
          </span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss Notice"
          className="p-1 hover:bg-black/5 rounded-md transition flex-shrink-0 text-current opacity-70 hover:opacity-100"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
