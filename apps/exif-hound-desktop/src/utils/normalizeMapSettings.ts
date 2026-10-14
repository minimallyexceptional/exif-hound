import type { MapSettings } from '../types';

export const defaultMapSettings: MapSettings = {
  selectedStyle: 'osm-standard',
  customTiles: {
    enabled: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
};

/** Merge persisted map settings; custom tiles stay off unless explicitly enabled. */
export function normalizeMapSettings(saved: Partial<MapSettings> | undefined): MapSettings {
  const custom = saved?.customTiles;
  const selectedStyle = typeof saved?.selectedStyle === 'string' && saved.selectedStyle.trim()
    ? saved.selectedStyle
    : defaultMapSettings.selectedStyle;
  const url = typeof custom?.url === 'string' && custom.url.trim()
    ? custom.url
    : defaultMapSettings.customTiles.url;

  return {
    selectedStyle,
    customTiles: {
      url,
      enabled: custom?.enabled === true,
    },
  };
}
