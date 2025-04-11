import { processImageFile, formatExifDate, prepareExifForDisplay } from '../../utils/exif';

// Mock the external dependencies
jest.mock('exif-middleware', () => ({
  extractExifData: jest.fn().mockResolvedValue({
    make: 'Canon',
    model: 'EOS 5D Mark IV',
    iso: '100',
    exposureTime: '1/250',
  }),
  formatExifMetadata: jest.fn().mockReturnValue({
    Make: 'Canon',
    Model: 'EOS 5D Mark IV',
    ISO: '100',
    'Exposure Time': '1/250 sec',
  }),
}));

jest.mock('shared-utils', () => ({
  formatFileSize: jest.fn().mockReturnValue('5.2 MB'),
  formatDate: jest.fn().mockReturnValue('Jan 15, 2023, 10:30 AM'),
  generateId: jest.fn().mockReturnValue('abc123'),
}));

describe('exif utility', () => {
  describe('processImageFile', () => {
    it('should process an image file and extract EXIF data', async () => {
      // Create a mock File object
      const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock the arrayBuffer method
      file.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));
      
      const result = await processImageFile(file);
      
      // Verify the result contains the expected properties
      expect(result).toHaveProperty('fileName', 'test.jpg');
      expect(result).toHaveProperty('fileSize', '5.2 MB');
      expect(result).toHaveProperty('fileType', 'image/jpeg');
      expect(result).toHaveProperty('fileId', 'abc123');
      expect(result).toHaveProperty('uploadDate');
      expect(result).toHaveProperty('make', 'Canon');
      expect(result).toHaveProperty('model', 'EOS 5D Mark IV');
    });
    
    it('should handle errors during processing gracefully', async () => {
      // Create a mock File object
      const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock the arrayBuffer method to throw an error
      file.arrayBuffer = jest.fn().mockRejectedValue(new Error('Mock error'));
      
      // Mock console.error to prevent the error message from appearing in test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await processImageFile(file);
      
      // Verify the result contains the error property
      expect(result).toHaveProperty('error', 'Failed to extract EXIF data');
      expect(result).toHaveProperty('fileName', 'test.jpg');
      expect(result).toHaveProperty('fileSize', '5.2 MB');
      expect(result).toHaveProperty('fileType', 'image/jpeg');
      expect(result).toHaveProperty('fileId', 'abc123');
      expect(result).toHaveProperty('uploadDate');
      
      // Verify that console.error was called with the expected message
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing image file:',
        expect.any(Error)
      );
      
      // Restore the original console.error
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('formatExifDate', () => {
    it('should format a date using the shared utility', () => {
      const date = new Date(2023, 0, 15, 10, 30);
      const result = formatExifDate(date);
      
      // It should use the mocked formatDate function
      expect(result).toBe('Jan 15, 2023, 10:30 AM');
    });
  });
  
  describe('prepareExifForDisplay', () => {
    it('should format metadata for display using the shared utility', () => {
      const metadata = {
        make: 'Canon',
        model: 'EOS 5D Mark IV',
        iso: '100',
        exposureTime: '1/250',
      };
      
      const result = prepareExifForDisplay(metadata);
      
      // It should use the mocked formatExifMetadata function
      expect(result).toEqual({
        Make: 'Canon',
        Model: 'EOS 5D Mark IV',
        ISO: '100',
        'Exposure Time': '1/250 sec',
      });
    });
  });
}); 