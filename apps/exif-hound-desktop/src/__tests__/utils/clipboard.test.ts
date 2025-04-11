import { copyToClipboard } from '../../utils/clipboard';

describe('clipboard utility', () => {
  describe('copyToClipboard', () => {
    // Store the original clipboard API
    const originalClipboard = { ...navigator.clipboard };
    let mockWriteText: jest.Mock;

    beforeEach(() => {
      // Mock the clipboard API
      mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText
        },
        configurable: true
      });
      
      // Clear mock calls between tests
      jest.clearAllMocks();
    });

    afterAll(() => {
      // Restore the original clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true
      });
    });

    it('should copy text to clipboard successfully', async () => {
      const result = await copyToClipboard('Test text');
      
      expect(mockWriteText).toHaveBeenCalledWith('Test text');
      expect(result).toBe(true);
    });

    it('should return false when clipboard copy fails', async () => {
      // Mock clipboard API to throw an error
      mockWriteText.mockRejectedValueOnce(new Error('Copy failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await copyToClipboard('Test text');
      
      expect(mockWriteText).toHaveBeenCalledWith('Test text');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
}); 