import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapSettings } from '../types';

interface SettingsContextType {
  mapSettings: MapSettings;
  updateMapSettings: (settings: Partial<MapSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultMapSettings: MapSettings = {
  selectedStyle: 'osm-standard'
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [mapSettings, setMapSettings] = useState<MapSettings>(() => {
    const saved = localStorage.getItem('mapSettings');
    return saved ? JSON.parse(saved) : defaultMapSettings;
  });

  useEffect(() => {
    localStorage.setItem('mapSettings', JSON.stringify(mapSettings));
  }, [mapSettings]);

  const updateMapSettings = (settings: Partial<MapSettings>) => {
    setMapSettings(prev => ({ ...prev, ...settings }));
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