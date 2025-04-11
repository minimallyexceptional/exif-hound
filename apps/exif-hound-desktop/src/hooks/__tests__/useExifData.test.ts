/**
 * @jest-environment jsdom
 */

// We're using simple import syntax to avoid TypeScript/ESLint issues with mocking
import { renderHook } from '@testing-library/react';

// Mock all dependencies
jest.mock('exif-middleware', () => ({
  extractExifData: jest.fn()
}), { virtual: true });

jest.mock('../../utils/diagnostics', () => ({
  fixCoordinates: jest.fn((lat, lng) => [lat, lng])
}));

jest.mock('../../utils/geocoding', () => ({
  getLocationFromCoordinates: jest.fn()
}));

// Get references to mocked functions
const mockExtractExifData = jest.requireMock('exif-middleware').extractExifData;
const mockFixCoordinates = jest.requireMock('../../utils/diagnostics').fixCoordinates;
const mockGetLocationFromCoordinates = jest.requireMock('../../utils/geocoding').getLocationFromCoordinates;

// After all mocks are set up, import the component under test
import { useExifData } from '../useExifData';

describe('useExifData hook', () => {
  // Create sample file for testing
  const createMockFile = () => {
    return new File(['mock image content'], 'test-image.jpg', { type: 'image/jpeg' });
  };
  
  // Mock ArrayBuffer result
  const mockArrayBuffer = new ArrayBuffer(10);
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to prevent cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Setup common mock implementations
    mockExtractExifData.mockResolvedValue({
      make: 'Canon',
      model: 'EOS 5D Mark IV',
      exposureTime: '1/250',
      fNumber: 'f/2.8',
      iso: '100',
      focalLength: '24',
      dateTaken: new Date('2023-01-15T10:30:00Z'),
      latitude: 37.7749,
      longitude: -122.4194,
      dimensions: { width: 6000, height: 4000 },
    });
    
    mockGetLocationFromCoordinates.mockResolvedValue({
      loading: false,
      country: 'USA',
      state: 'CA',
      city: 'San Francisco',
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should process a file and extract EXIF data', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    const { result } = renderHook(() => useExifData());
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(mockFile.arrayBuffer).toHaveBeenCalled();
    expect(mockExtractExifData).toHaveBeenCalledWith(mockArrayBuffer);
    
    // Check that returned data has the expected format
    expect(exifData.make).toBe('Canon');
    expect(exifData.model).toBe('EOS 5D Mark IV');
    expect(exifData.exposureTime).toBe('1/250');
    expect(exifData.fNumber).toBe('f/2.8');
    expect(exifData.iso).toBe('100');
    expect(exifData.focalLength).toBe(24); // Note: converted to number
    expect(exifData.latitude).toBe(37.7749);
    expect(exifData.longitude).toBe(-122.4194);
    expect(exifData.imageWidth).toBe(6000);
    expect(exifData.imageHeight).toBe(4000);
    expect(exifData.error).toBeNull();
  });
  
  it('should apply coordinate fixes', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    const { result } = renderHook(() => useExifData());
    
    // Execute
    await result.current.processExifData(mockFile);
    
    // Assert
    expect(mockFixCoordinates).toHaveBeenCalledWith(37.7749, -122.4194);
  });
  
  it('should fetch location data when coordinates are present', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    const { result } = renderHook(() => useExifData({ fetchLocation: true }));
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(mockGetLocationFromCoordinates).toHaveBeenCalledWith(37.7749, -122.4194);
    expect(exifData.location).toEqual({
      loading: false,
      country: 'USA',
      state: 'CA',
      city: 'San Francisco',
    });
  });
  
  it('should not fetch location data when fetchLocation is false', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    const { result } = renderHook(() => useExifData({ fetchLocation: false }));
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(mockGetLocationFromCoordinates).not.toHaveBeenCalled();
    expect(exifData.location).toBeNull();
  });
  
  it('should handle missing GPS data', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    // Mock EXIF data without GPS coordinates
    mockExtractExifData.mockResolvedValue({
      make: 'Canon',
      model: 'EOS 5D Mark IV',
      // no latitude/longitude
    });
    
    const { result } = renderHook(() => useExifData());
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(mockGetLocationFromCoordinates).not.toHaveBeenCalled();
    expect(exifData.latitude).toBeNull();
    expect(exifData.longitude).toBeNull();
    expect(exifData.location).toBeNull();
  });
  
  it('should handle errors while extracting EXIF data', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    // Mock extraction error
    mockExtractExifData.mockRejectedValue(new Error('Extraction failed'));
    
    const onErrorMock = jest.fn();
    const { result } = renderHook(() => useExifData({ onError: onErrorMock }));
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(onErrorMock).toHaveBeenCalled();
    expect(exifData.error).toBe('Failed to read EXIF data from image');
  });
  
  it('should handle errors while fetching location data', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    // Mock location fetch error
    mockGetLocationFromCoordinates.mockRejectedValue(new Error('Location fetch failed'));
    
    const { result } = renderHook(() => useExifData());
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(exifData.location).toEqual({
      loading: false,
      error: 'Failed to fetch location data'
    });
  });
  
  it('should call onSuccess callback with the processed data', async () => {
    // Setup
    const mockFile = createMockFile();
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
    
    const onSuccessMock = jest.fn();
    const { result } = renderHook(() => useExifData({ onSuccess: onSuccessMock }));
    
    // Execute
    const exifData = await result.current.processExifData(mockFile);
    
    // Assert
    expect(onSuccessMock).toHaveBeenCalledWith(exifData);
  });
}); 