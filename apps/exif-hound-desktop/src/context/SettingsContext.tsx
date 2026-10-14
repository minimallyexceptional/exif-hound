import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapSettings } from '../types';

export interface AppPreferences {
  automaticUpdateChecks: boolean;
}

interface SettingsContextType {
  mapSettings: MapSettings;
  updateMapSettings: (settings: Partial<MapSettings>) => void;
  appPreferences: AppPreferences;
  updateAppPreferences: (prefs: Partial<AppPreferences>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const APP_PREFERENCES_KEY = 'appPreferences';

const defaultAppPreferences: AppPreferences = {
  automaticUpdateChecks: true,
};

const defaultMapSettings: MapSettings = {
  selectedStyle: 'osm-standard',
  customTiles: {
    enabled: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(() => {
    try {
      const saved = localStorage.getItem(APP_PREFERENCES_KEY);
      return saved ? { ...defaultAppPreferences, ...JSON.parse(saved) } : defaultAppPreferences;
    } catch {
      return defaultAppPreferences;
    }
  });

  const [mapSettings, setMapSettings] = useState<MapSettings>(() => {
    const saved = localStorage.getItem('mapSettings');
    const savedSettings = saved ? JSON.parse(saved) : {};
    return {
      ...defaultMapSettings,
      ...savedSettings,
      customTiles: {
        ...defaultMapSettings.customTiles,
        ...(savedSettings.customTiles || {})
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('mapSettings', JSON.stringify(mapSettings));
  }, [mapSettings]);

  useEffect(() => {
    localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(appPreferences));
  }, [appPreferences]);

  const updateMapSettings = (settings: Partial<MapSettings>) => {
    setMapSettings(prev => ({
      ...prev,
      ...settings,
      customTiles: {
        ...prev.customTiles,
        ...(settings.customTiles || {})
      }
    }));
  };

  const updateAppPreferences = (prefs: Partial<AppPreferences>) => {
    setAppPreferences(prev => ({ ...prev, ...prefs }));
  };

  return (
    <SettingsContext.Provider value={{ mapSettings, updateMapSettings, appPreferences, updateAppPreferences }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}