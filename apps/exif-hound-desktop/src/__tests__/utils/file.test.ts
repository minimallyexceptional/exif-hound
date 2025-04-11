import { generateUniqueId, createObjectURL, isImageFile, formatFileSize } from '../../utils/file';

describe('file utility', () => {
  describe('generateUniqueId', () => {
    it('should generate a string', () => {
      const id = generateUniqueId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique ids', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('createObjectURL', () => {
    // Mock URL.createObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    
    beforeAll(() => {
      URL.createObjectURL = jest.fn((file) => `mock-url-for-${(file as File).name}`);
    });
    
    afterAll(() => {
      URL.createObjectURL = originalCreateObjectURL;
    });
    
    it('should create object URL for a file', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const url = createObjectURL(file);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(url).toBe('mock-url-for-test.jpg');
    });
  });

  describe('isImageFile', () => {
    it('should return true for image files', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      
      expect(isImageFile(jpegFile)).toBe(true);
      expect(isImageFile(pngFile)).toBe(true);
    });
    
    it('should return false for non-image files', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      
      expect(isImageFile(pdfFile)).toBe(false);
      expect(isImageFile(textFile)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
    
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
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
}); 