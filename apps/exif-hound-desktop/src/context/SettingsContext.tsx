import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapSettings, PrivacySettings } from '../types';
import { normalizeMapSettings } from '../utils/normalizeMapSettings';
import { readJsonStorage, writeJsonStorage } from '../utils/settingsStorage';

export interface AppPreferences {
  automaticUpdateChecks: boolean;
}

interface SettingsContextType {
  mapSettings: MapSettings;
  updateMapSettings: (settings: Partial<MapSettings>) => void;
  appPreferences: AppPreferences;
  updateAppPreferences: (prefs: Partial<AppPreferences>) => void;
  privacySettings: PrivacySettings;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const APP_PREFERENCES_KEY = 'appPreferences';

const defaultAppPreferences: AppPreferences = {
  automaticUpdateChecks: true,
};

const defaultPrivacySettings: PrivacySettings = {
  reverseGeocoding: false,
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
    const savedSettings = readJsonStorage<Partial<MapSettings>>('mapSettings', {});
    return normalizeMapSettings(savedSettings);
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() =>
    readJsonStorage<PrivacySettings>('privacySettings', defaultPrivacySettings)
  );

  useEffect(() => {
    writeJsonStorage('mapSettings', mapSettings);
  }, [mapSettings]);

  useEffect(() => {
    localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(appPreferences));
  }, [appPreferences]);

  useEffect(() => {
    writeJsonStorage('privacySettings', privacySettings);
  }, [privacySettings]);

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

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <SettingsContext.Provider
      value={{
        mapSettings,
        updateMapSettings,
        appPreferences,
        updateAppPreferences,
        privacySettings,
        updatePrivacySettings,
      }}
    >
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
