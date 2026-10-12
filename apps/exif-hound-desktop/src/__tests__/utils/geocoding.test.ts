import * as fileSystem from '../../utils/fileSystem';
import {
  formatLocation,
  formatShortLocation,
  getLocationFromCoordinates,
  LocationData,
} from '../../utils/geocoding';

describe('geocoding utility', () => {
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
    
    it('should use formatted property if available', () => {
      const locationData: LocationData = {
        country: 'USA',
        city: 'San Francisco',
        formatted: 'Custom formatted address',
        loading: false
      };
      
      const result = formatLocation(locationData);
      expect(result).toBe('Custom formatted address');
    });
    
    it('should handle missing location data', () => {
      const result = formatLocation({ loading: false });
      expect(result).toBe('Unknown location');
    });
    
    it('should handle error in location data', () => {
      const result = formatLocation({ loading: false, error: 'Some error' });
      expect(result).toBe('Location information unavailable');
    });
  });
  
  describe('formatShortLocation', () => {
    it('should format location data into a short string', () => {
      const locationData: LocationData = {
        country: 'USA',
        state: 'CA',
        city: 'San Francisco',
        suburb: 'Haight-Ashbury',
        road: 'Haight St',
        loading: false
      };
      
      const result = formatShortLocation(locationData);
      expect(result).toBe('San Francisco, CA, USA');
    });
    
    it('should use town if city is not available', () => {
      const locationData: LocationData = {
        country: 'USA',
        state: 'CA',
        town: 'Small Town',
        loading: false
      };
      
      const result = formatShortLocation(locationData);
      expect(result).toBe('Small Town, CA, USA');
    });
    
    it('should handle missing location data', () => {
      const result = formatShortLocation({ loading: false });
      expect(result).toBe('Unknown location');
    });
    
    it('should handle error in location data', () => {
      const result = formatShortLocation({ loading: false, error: 'Some error' });
      expect(result).toBe('Unknown');
    });
  });

  describe('getLocationFromCoordinates', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('requests Nominatim with coordinates only and identifies the app via User-Agent', async () => {
      jest.spyOn(fileSystem, 'isTauriEnvironment').mockReturnValue(false);
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ address: { country: 'Testland' }, display_name: 'Test' }),
      });
      global.fetch = fetchMock as typeof fetch;

      jest.useFakeTimers();
      const resultPromise = getLocationFromCoordinates(12.3456, 98.7654);
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.country).toBe('Testland');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('lat=12.3456');
      expect(url).toContain('lon=98.7654');
      expect(url).not.toContain('email=');
      expect(init?.headers).toMatchObject({
        'User-Agent': expect.stringContaining('ExifHound/'),
      });
    });
  });
}); 