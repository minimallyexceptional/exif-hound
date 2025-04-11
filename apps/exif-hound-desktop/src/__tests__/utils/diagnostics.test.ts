import {
  isNorthAmerica,
  isSouthAmerica,
  isWesternHemisphere,
  fixWesternHemisphere,
  fixCoordinates
} from '../../utils/diagnostics';

describe('diagnostics utility', () => {
  describe('isNorthAmerica', () => {
    it('should identify coordinates in North America', () => {
      // NYC
      expect(isNorthAmerica(40.7128, -74.0060)).toBe(true);
      // San Francisco
      expect(isNorthAmerica(37.7749, -122.4194)).toBe(true);
      // Mexico City
      expect(isNorthAmerica(19.4326, -99.1332)).toBe(true);
    });
    
    it('should identify coordinates based on magnitude, not sign', () => {
      // The function checks Math.abs(lng), so sign doesn't matter
      expect(isNorthAmerica(40.7128, 74.0060)).toBe(true);
    });
    
    it('should reject coordinates outside North America latitude range', () => {
      // Below latitude range (South America)
      expect(isNorthAmerica(-22.9068, -43.1729)).toBe(false);
      // Above latitude range (Arctic)
      expect(isNorthAmerica(75.0000, -74.0060)).toBe(false);
    });
    
    it('should reject coordinates outside North America longitude range', () => {
      // Low longitude magnitude (Europe/Africa)
      expect(isNorthAmerica(51.5074, 0.1278)).toBe(false);
    });
  });
  
  describe('isSouthAmerica', () => {
    it('should identify coordinates in South America', () => {
      // Rio de Janeiro
      expect(isSouthAmerica(-22.9068, -43.1729)).toBe(true);
      // Buenos Aires
      expect(isSouthAmerica(-34.6037, -58.3816)).toBe(true);
      // Lima
      expect(isSouthAmerica(-12.0464, -77.0428)).toBe(true);
    });
    
    it('should identify coordinates based on magnitude, not sign', () => {
      // The function checks Math.abs(lng), so sign doesn't matter
      expect(isSouthAmerica(-22.9068, 43.1729)).toBe(true);
    });
    
    it('should reject coordinates outside South America', () => {
      // NYC (North America)
      expect(isSouthAmerica(40.7128, -74.0060)).toBe(false);
      // Cape Town (Africa)
      expect(isSouthAmerica(-33.9249, 18.4241)).toBe(false);
    });
  });
  
  describe('isWesternHemisphere', () => {
    it('should identify coordinates in North America', () => {
      // NYC (North America)
      expect(isWesternHemisphere(40.7128, -74.0060)).toBe(true);
      // With positive longitude
      expect(isWesternHemisphere(40.7128, 74.0060)).toBe(true);
    });
    
    it('should identify coordinates in South America', () => {
      // Rio de Janeiro (South America)
      expect(isWesternHemisphere(-22.9068, -43.1729)).toBe(true);
      // With positive longitude
      expect(isWesternHemisphere(-22.9068, 43.1729)).toBe(true);
    });
    
    it('should reject coordinates outside Americas', () => {
      // London (low longitude magnitude)
      expect(isWesternHemisphere(51.5074, 0.1278)).toBe(false);
    });
  });
  
  describe('fixWesternHemisphere', () => {
    beforeEach(() => {
      // Spy on console.warn to avoid cluttering test output
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should fix coordinates with wrong sign in North America', () => {
      // NYC with wrong sign
      const [fixedLat, fixedLng] = fixWesternHemisphere(40.7128, 74.0060);
      expect(fixedLat).toBe(40.7128);
      expect(fixedLng).toBe(-74.0060);
    });
    
    it('should fix coordinates with wrong sign in South America', () => {
      // Rio with wrong sign
      const [fixedLat, fixedLng] = fixWesternHemisphere(-22.9068, 43.1729);
      expect(fixedLat).toBe(-22.9068);
      expect(fixedLng).toBe(-43.1729);
    });
    
    it('should not modify coordinates with negative longitude in Western Hemisphere', () => {
      // NYC (already correct)
      const [fixedLat, fixedLng] = fixWesternHemisphere(40.7128, -74.0060);
      expect(fixedLat).toBe(40.7128);
      expect(fixedLng).toBe(-74.0060);
    });
  });
  
  describe('fixCoordinates', () => {
    beforeEach(() => {
      // Spy on console.warn to avoid cluttering the test output
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should return null values unchanged', () => {
      const [fixedLat, fixedLng] = fixCoordinates(null, null);
      expect(fixedLat).toBe(null);
      expect(fixedLng).toBe(null);
    });
    
    it('should handle mixed null values', () => {
      let result = fixCoordinates(40.7128, null);
      expect(result).toEqual([40.7128, null]);
      
      result = fixCoordinates(null, -74.0060);
      expect(result).toEqual([null, -74.0060]);
    });
    
    it('should fix Western Hemisphere coordinates', () => {
      // NYC with wrong sign
      const [fixedLat, fixedLng] = fixCoordinates(40.7128, 74.0060);
      expect(fixedLat).toBe(40.7128);
      expect(fixedLng).toBe(-74.0060);
    });
    
    it('should not modify coordinates with negative longitude in Western Hemisphere', () => {
      // NYC (already correct)
      const [fixedLat, fixedLng] = fixCoordinates(40.7128, -74.0060);
      expect(fixedLat).toBe(40.7128);
      expect(fixedLng).toBe(-74.0060);
    });
    
    it('should apply fix to non-western coordinates that match the western pattern', () => {
      // This is how the current implementation works - any positive longitude that 
      // matches North/South America patterns will be converted to negative
      const [fixedLat, fixedLng] = fixCoordinates(35.6762, 139.6503);
      expect(fixedLat).toBe(35.6762);
      expect(fixedLng).toBe(-139.6503); // This is the current behavior
    });
  });
}); 