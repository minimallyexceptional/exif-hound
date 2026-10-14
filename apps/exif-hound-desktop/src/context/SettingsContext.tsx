import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapSettings, PrivacySettings } from '../types';
import { readJsonStorage, writeJsonStorage } from '../utils/settingsStorage';

interface SettingsContextType {
  mapSettings: MapSettings;
  updateMapSettings: (settings: Partial<MapSettings>) => void;
  privacySettings: PrivacySettings;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultMapSettings: MapSettings = {
  selectedStyle: 'osm-standard',
  customTiles: {
    enabled: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }
};

const defaultPrivacySettings: PrivacySettings = {
  reverseGeocoding: false,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [mapSettings, setMapSettings] = useState<MapSettings>(() => {
    const savedSettings = readJsonStorage<Partial<MapSettings>>('mapSettings', {});
    return {
      ...defaultMapSettings,
      ...savedSettings,
      customTiles: {
        ...defaultMapSettings.customTiles,
        ...(savedSettings.customTiles || {}),
      },
    };
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() =>
    readJsonStorage<PrivacySettings>('privacySettings', defaultPrivacySettings)
  );

  useEffect(() => {
    writeJsonStorage('mapSettings', mapSettings);
  }, [mapSettings]);

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

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <SettingsContext.Provider
      value={{
        mapSettings,
        updateMapSettings,
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