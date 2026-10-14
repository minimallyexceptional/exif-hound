import { defaultMapSettings, normalizeMapSettings } from '../normalizeMapSettings';

describe('normalizeMapSettings', () => {
  it('keeps custom tiles disabled by default', () => {
    expect(normalizeMapSettings(undefined)).toEqual(defaultMapSettings);
    expect(normalizeMapSettings({})).toEqual(defaultMapSettings);
  });

  it('does not enable custom tiles for truthy non-boolean values', () => {
    expect(normalizeMapSettings({
      customTiles: { enabled: 'true' as unknown as boolean, url: 'https://tiles.example/{z}/{x}/{y}.png' },
    }).customTiles.enabled).toBe(false);
  });

  it('preserves an explicit custom tile configuration', () => {
    const normalized = normalizeMapSettings({
      selectedStyle: 'terrain',
      customTiles: { enabled: true, url: 'https://{s}.tiles.example.org/{z}/{x}/{y}.png' },
    });
    expect(normalized.selectedStyle).toBe('terrain');
    expect(normalized.customTiles.enabled).toBe(true);
    expect(normalized.customTiles.url).toContain('tiles.example.org');
  });
});
