import { formatLocation, formatShortLocation, LocationData } from '../../utils/geocoding';

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
}); 