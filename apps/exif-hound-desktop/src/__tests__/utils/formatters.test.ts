import { formatFileSize, formatDate } from '../../utils/formatters';

describe('formatters utility', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500.0 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1500)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1500000)).toBe('1.4 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1500000000)).toBe('1.4 GB');
    });
  });

  describe('formatDate', () => {
    it('should return "Not available" for undefined input', () => {
      expect(formatDate(undefined)).toBe('Not available');
    });

    it('should format Date object correctly', () => {
      const testDate = new Date(2023, 0, 15, 10, 30); // Jan 15, 2023, 10:30 AM
      const result = formatDate(testDate);
      // Using regex to match because exact format might vary by environment
      expect(result).toMatch(/Jan 15, 2023/);
    });

    it('should format date string correctly', () => {
      const result = formatDate('2023-01-15T10:30:00');
      expect(result).toMatch(/Jan 15, 2023/);
    });

    it('should format timestamp correctly', () => {
      const timestamp = new Date(2023, 0, 15, 10, 30).getTime();
      const result = formatDate(timestamp);
      expect(result).toMatch(/Jan 15, 2023/);
    });

    it('should return "Not available" for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('Not available');
    });
  });
}); 