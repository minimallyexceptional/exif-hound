import { renderHook } from '@testing-library/react';
import { useDeviceHierarchy } from '../useDeviceHierarchy';
import { ImageData } from '../../../../../types';

describe('useDeviceHierarchy hook', () => {
  // Helper function to create mock image data
  const createMockImage = (
    id: string, 
    name: string, 
    make?: string, 
    model?: string
  ): ImageData => ({
    id,
    url: `test-url-${id}`,
    file: {
      name,
      type: 'image/jpeg',
      size: 1024,
      lastModified: Date.now()
    },
    exif: {
      make,
      model
    }
  });

  it('should create correct tree structure from image data', () => {
    const images = [
      createMockImage('1', 'photo1.jpg', 'Canon', 'EOS 5D'),
      createMockImage('2', 'photo2.jpg', 'Canon', 'EOS 5D'),
      createMockImage('3', 'photo3.jpg', 'Nikon', 'D850')
    ];

    const { result } = renderHook(() => useDeviceHierarchy(images));

    expect(result.current.name).toBe('Devices');
    expect(result.current.children).toHaveLength(2); // Two device groups

    // Check Canon group
    const canonGroup = result.current.children?.find(c => c.name === 'Canon EOS 5D');
    expect(canonGroup).toBeDefined();
    expect(canonGroup?.children).toHaveLength(2);
    expect(canonGroup?.children?.[0].name).toBe('photo1.jpg');
    expect(canonGroup?.children?.[1].name).toBe('photo2.jpg');

    // Check Nikon group
    const nikonGroup = result.current.children?.find(c => c.name === 'Nikon D850');
    expect(nikonGroup).toBeDefined();
    expect(nikonGroup?.children).toHaveLength(1);
    expect(nikonGroup?.children?.[0].name).toBe('photo3.jpg');
  });

  it('should handle unknown devices when make or model is missing', () => {
    const images = [
      createMockImage('1', 'photo1.jpg', 'Canon', 'EOS 5D'),
      createMockImage('2', 'photo2.jpg'), // No make/model
      createMockImage('3', 'photo3.jpg', 'Nikon') // No model
    ];

    const { result } = renderHook(() => useDeviceHierarchy(images));

    // Check that there's an "Unknown Device" group
    const unknownGroup = result.current.children?.find(c => c.name === 'Unknown Device');
    expect(unknownGroup).toBeDefined();
    expect(unknownGroup?.children?.length).toBe(2); // Both no make/model and just make should be here
  });

  it('should handle empty image list', () => {
    const { result } = renderHook(() => useDeviceHierarchy([]));

    expect(result.current.name).toBe('Devices');
    expect(result.current.children).toHaveLength(0);
  });

  it('should include correct image references in leaf nodes', () => {
    const images = [
      createMockImage('1', 'photo1.jpg', 'Canon', 'EOS 5D')
    ];

    const { result } = renderHook(() => useDeviceHierarchy(images));

    const imageNode = result.current.children?.[0].children?.[0];
    expect(imageNode?.image).toBe(images[0]);
  });
}); 