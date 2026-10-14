import {
  configureReverseGeocodingProvider,
  formatLocation,
  formatShortLocation,
  getLocationFromCoordinates,
  LocationData,
  __setIsTauriEnvironmentForTests,
} from 'exif-hound-core';

const mockTauriFetch = jest.fn();

jest.mock('@tauri-apps/plugin-http', () => ({
  fetch: (...args: unknown[]) => mockTauriFetch(...args),
}));

describe('geocoding utility', () => {
  afterEach(() => {
    __setIsTauriEnvironmentForTests(null);
  });

  describe('formatLocation', () => {
    it('should format location data into a full address string', () => {
      const locationData: LocationData = {
        country: 'USA',
        state: 'CA',
        county: 'San Francisco County',
        city: 'San Francisco',
        suburb: 'Haight-Ashbury',
        road: 'Haight St',
        loading: false
      };
      
      const result = formatLocation(locationData);
      expect(result).toBe('Haight St, Haight-Ashbury, San Francisco, San Francisco County, CA, USA');
    });
  });

  describe('formatShortLocation', () => {
    it('should format location data into a short address string', () => {
      const locationData: LocationData = {
        country: 'USA',
        state: 'CA',
        city: 'San Francisco',
        loading: false
      };
      
      const result = formatShortLocation(locationData);
      expect(result).toBe('San Francisco, CA, USA');
    });
  });

  describe('getLocationFromCoordinates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('requests Nominatim with coordinates only and does not set User-Agent (WebKit forbids it)', async () => {
      __setIsTauriEnvironmentForTests(() => false);
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ address: { country: 'Testland' }, display_name: 'Test' }),
      });
      global.fetch = fetchMock as typeof fetch;

      const resultPromise = getLocationFromCoordinates(12.3456, 98.7654);
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.country).toBe('Testland');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit?];
      expect(url).toContain('lat=12.3456');
      expect(url).toContain('lon=98.7654');
      expect(url).not.toContain('email=');
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.['User-Agent']).toBeUndefined();
    });

    it.skip('uses the Tauri HTTP plugin in a desktop webview without setting User-Agent', async () => {
      __setIsTauriEnvironmentForTests(() => true);
      mockTauriFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ address: { country: 'TauriLand' }, display_name: 'Tauri' }),
      });
      global.fetch = jest.fn() as typeof fetch;

      const resultPromise = getLocationFromCoordinates(51.5074, -0.1278);
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.country).toBe('TauriLand');
      expect(mockTauriFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockTauriFetch.mock.calls[0] as [string, RequestInit?];
      expect(url).toContain('nominatim.openstreetmap.org/reverse');
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.['User-Agent']).toBeUndefined();
    });
  });

  describe('configureReverseGeocodingProvider', () => {
    afterEach(() => {
      configureReverseGeocodingProvider(null);
    });

    it('uses a configured provider instead of Nominatim', async () => {
      configureReverseGeocodingProvider({
        reverse: async () => ({ formatted: 'Configured stub', loading: false }),
      });
      await expect(getLocationFromCoordinates(88.123, -177.456)).resolves.toMatchObject({
        formatted: 'Configured stub',
      });
    });
  });
});
