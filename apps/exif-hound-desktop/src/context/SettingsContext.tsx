import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapSettings } from '../types';

interface SettingsContextType {
  mapSettings: MapSettings;
  updateMapSettings: (settings: Partial<MapSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultMapSettings: MapSettings = {
  selectedStyle: 'osm-standard',
  customTiles: {
    enabled: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <SettingsContext.Provider value={{ mapSettings, updateMapSettings }}>
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