import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

const AppSettingsContext = createContext();

// Helper to calculate hex color opacity / shades
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    appName: 'CampusVault',
    logoUrl: '',
    themeColor: '#2563eb',
    storageRoot: 'vault',
    folderFormat: '{branch}/{semester}/{subject}/{category}'
  });
  const [loading, setLoading] = useState(true);

  const applyThemeColor = (color) => {
    if (!color) return;
    const root = document.documentElement;
    root.style.setProperty('--brand-600', color);
    root.style.setProperty('--brand-500', color);
    root.style.setProperty('--brand-700', hexToRgba(color, 0.9));
    root.style.setProperty('--brand-800', hexToRgba(color, 0.8));
    root.style.setProperty('--brand-50', hexToRgba(color, 0.08));
    root.style.setProperty('--brand-100', hexToRgba(color, 0.15));
  };

  const fetchSettings = async () => {
    try {
      const data = await apiRequest('/settings');
      if (data) {
        setSettings(data);
        applyThemeColor(data.themeColor || '#2563eb');
        if (data.appName) {
          document.title = `${data.appName} - College Notes & Resources`;
        }
      }
    } catch (err) {
      console.warn('Could not load custom app settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    const res = await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings)
    });
    if (res && res.settings) {
      setSettings(res.settings);
      applyThemeColor(res.settings.themeColor);
      if (res.settings.appName) {
        document.title = `${res.settings.appName} - College Notes & Resources`;
      }
    }
    return res;
  };

  return (
    <AppSettingsContext.Provider value={{ settings, loading, fetchSettings, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
