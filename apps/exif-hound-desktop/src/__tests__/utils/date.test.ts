 import { 
  formatDateTime,
  formatShortDateTime, 
  formatDateOnly,
  formatRelativeTime
} from '../../utils/date';

describe('date utility', () => {
  describe('formatDateTime', () => {
    it('should return "Not available" for null input', () => {
      expect(formatDateTime(null)).toBe('Not available');
    });

    it('should format EXIF style date strings correctly', () => {
      const result = formatDateTime('2023:01:15 10:30:00');
      // Check if contains date parts
      expect(result).toMatch(/2023/);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/15/);
    });

    it('should return the original string for invalid dates', () => {
      const invalidDate = 'not-a-date';
      expect(formatDateTime(invalidDate)).toBe(invalidDate);
    });
  });

  describe('formatShortDateTime', () => {
    it('should return "Not available" for null input', () => {
      expect(formatShortDateTime(null)).toBe('Not available');
    });

    it('should format EXIF style date strings in a compact format', () => {
      const result = formatShortDateTime('2023:01:15 10:30:00');
      // Check if contains date parts but not weekday
      expect(result).toMatch(/2023/);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/15/);
      // This format shouldn't have weekday names
      expect(result).not.toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    });

    it('should return the original string for invalid dates', () => {
      const invalidDate = 'not-a-date';
      expect(formatShortDateTime(invalidDate)).toBe(invalidDate);
    });
  });

  describe('formatDateOnly', () => {
    it('should return "Not available" for null input', () => {
      expect(formatDateOnly(null)).toBe('Not available');
    });

    it('should format date strings without time component', () => {
      const result = formatDateOnly('2023:01:15 10:30:00');
      // Should contain the date but not the time
      expect(result).toMatch(/2023/);
      expect(result).toMatch(/January/); // Note: 'long' month format
      expect(result).toMatch(/15/);
      expect(result).not.toMatch(/10:30/);
    });

    it('should return the original string for invalid dates', () => {
      const invalidDate = 'not-a-date';
      expect(formatDateOnly(invalidDate)).toBe(invalidDate);
    });
  });

  describe('formatRelativeTime', () => {
    // Mock current time for consistent testing
    const originalNow = Date.now;
    const mockNow = new Date('2023-01-15T12:00:00Z').getTime();
    
    beforeAll(() => {
      // Mock Date.now
      global.Date.now = jest.fn(() => mockNow);
    });
    
    afterAll(() => {
      // Restore original Date.now
      global.Date.now = originalNow;
    });
    
    it('should display "Just now" for very recent timestamps', () => {
      const timestamp = mockNow - 30 * 1000; // 30 seconds ago
      expect(formatRelativeTime(timestamp)).toBe('Just now');
    });
    
    it('should display minutes for recent timestamps', () => {
      const timestamp = mockNow - 5 * 60 * 1000; // 5 minutes ago
      expect(formatRelativeTime(timestamp)).toBe('5 minutes ago');
      
      const oneMinuteAgo = mockNow - 60 * 1000; // 1 minute ago
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    });
    
    it('should display hours for older timestamps', () => {
      const timestamp = mockNow - 3 * 60 * 60 * 1000; // 3 hours ago
      expect(formatRelativeTime(timestamp)).toBe('3 hours ago');
      
      const oneHourAgo = mockNow - 60 * 60 * 1000; // 1 hour ago
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });
    
    it('should display days for day-old timestamps', () => {
      const timestamp = mockNow - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      expect(formatRelativeTime(timestamp)).toBe('2 days ago');
      
      const oneDayAgo = mockNow - 24 * 60 * 60 * 1000; // 1 day ago
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });
    
    it('should format actual date for timestamps older than 30 days', () => {
      const timestamp = mockNow - 40 * 24 * 60 * 60 * 1000; // 40 days ago
      const result = formatRelativeTime(timestamp);
      // Should match date format rather than relative time
      expect(result).not.toContain('days ago');
    });
  });
}); 